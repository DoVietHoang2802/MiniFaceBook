# 💬 PHASE 4: REALTIME CHAT - THIẾT KẾ CHI TIẾT

> **Design Document** cho Sprint 4.2, 4.3 - Chat Infrastructure & Messaging Logic

---

## 🎯 MỤC TIÊU

Xây dựng hệ thống chat 1-1 realtime **giống Facebook Messenger** với đầy đủ:
- ✓ **SENT** (tin nhắn đã gửi)
- ✓✓ **DELIVERED** (người nhận đã nhận được)
- 👁️ **SEEN** (người nhận đã xem)

---

## 📐 KIẾN TRÚC DATABASE

### 1. Conversation Entity (1-1 Chat)

```java
// Domain Entity - POJO thuần túy
package com.minifacebook.module.chat.domain.entity;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Conversation {
    private String id;
    
    // Exactly 2 participants for 1-1 chat
    private List<String> participantIds;
    
    // Denormalized summary (không embed full message)
    private LastMessageSummary lastMessageSummary;
    private Instant lastMessageAt;
    
    private Instant createdAt;
}
```

```java
// Value Object - embedded trong Conversation
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LastMessageSummary {
    private String senderId;
    private String contentPreview;  // Max 100 chars
    private MessageType type;
    private Instant sentAt;
}
```

**Business Rules:**
- `participantIds.size() == 2` (validation)
- Participants phải là bạn bè (Friendship status = ACCEPTED)
- Không tạo conversation với chính mình
- 1 cặp user chỉ có 1 conversation duy nhất (idempotent create)

**UnreadCount Strategy:**
```java
// KHÔNG lưu field unreadCount trong Conversation
// Lý do: Dễ bị desync, race condition

// Option 1: Tính on-the-fly (accurate nhưng chậm)
int unreadCount = messageRepository.countByConversationIdAndSeenAtIsNullAndSenderIdNot(
    conversationId, currentUserId
);

// Option 2: Cache Redis (fast, eventually consistent)
String key = "unread:" + conversationId + ":" + userId;
redis.get(key); // TTL 60s, invalidate khi markAsSeen
```

---

### 2. Message Entity

```java
package com.minifacebook.module.chat.domain.entity;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {
    private String id;
    private String conversationId;
    private String senderId;
    
    private String content;
    private MessageType type;  // TEXT, IMAGE, FILE
    private String mediaUrl;   // Cloudinary URL (nullable)
    
    // Status tracking (nullable Instant)
    private Instant deliveredAt;  // ✓✓
    private Instant seenAt;       // 👁️
    
    private Instant createdAt;    // ✓ SENT
}
```

```java
public enum MessageType {
    TEXT,
    IMAGE,
    FILE
}
```

**Status Logic:**

| Status | Điều kiện | Icon | Màn hình người gửi |
|:-------|:----------|:-----|:-------------------|
| **SENT** | `createdAt != null` | ✓ | Tin nhắn đã được server lưu DB |
| **DELIVERED** | `deliveredAt != null` | ✓✓ | Người nhận đã nhận qua WebSocket (online) |
| **SEEN** | `seenAt != null` | 👁️ | Người nhận đã mở conversation và xem tin |

---

## 🔄 MESSAGE STATUS FLOW (giống Facebook)

### Flow 1: Gửi tin nhắn (SENT → DELIVERED)

```
[User A gửi tin nhắn]
    ↓
1. Frontend: Optimistic UI hiển thị tin với status PENDING (⏱️)
    ↓
2. WebSocket: STOMP send to /app/chat.send
    {
      conversationId: "abc123",
      content: "Hello",
      type: "TEXT"
    }
    ↓
3. Backend: MessageController.sendMessage()
    - Validate: user là participant của conversation
    - Save message → MongoDB (createdAt = now)
    - Update conversation.lastMessageSummary
    ↓
4. Backend: Redis Pub/Sub publish
    Channel: chat.room.abc123
    Payload: {
      type: "NEW_MESSAGE",
      data: MessageResponse (có id, createdAt)
    }
    ↓
5. Backend: All servers subscribe → Emit to WebSocket
    - Sender: /user/{userA}/queue/messages → update status ⏱️ → ✓
    - Recipient (if online): /user/{userB}/queue/messages → hiển thị tin mới
    ↓
6. Recipient Client (if online): Auto-receive
    - Display message
    - Call REST: PUT /messages/{id}/delivered
    ↓
7. Backend: Update message.deliveredAt = now
    ↓
8. Backend: Emit WebSocket to Sender
    /user/{userA}/queue/status
    { messageId, status: "DELIVERED" }
    ↓
9. Sender UI: ✓ → ✓✓
```

---

### Flow 2: Đọc tin nhắn (DELIVERED → SEEN)

```
[User B mở conversation với User A]
    ↓
1. Frontend: Trigger khi:
    - Click vào conversation trong list
    - Focus chat window
    - Scroll to bottom (xem tin nhắn mới nhất)
    ↓
2. Frontend: Call REST API
    PUT /conversations/{conversationId}/seen
    ↓
3. Backend: ConversationService.markAllAsSeen()
    - Validate: user là participant
    - Query: SELECT * FROM messages 
      WHERE conversationId = X 
        AND senderId != currentUserId
        AND seenAt IS NULL
    - Batch update: SET seenAt = now
    ↓
4. Backend: Emit WebSocket to Sender (User A)
    /user/{userA}/queue/status
    {
      conversationId,
      status: "SEEN",
      seenAt: "2026-06-05T10:30:00Z",
      seenBy: "userB_id"
    }
    ↓
5. Sender UI (User A):
    - Conversation list: update last message status ✓✓ → 👁️
    - Chat window (if open): update all messages ✓✓ → 👁️
```

---

## 🔌 API ENDPOINTS (Sprint 4.2)

### 1. GET /conversations
**Lấy danh sách conversations của user hiện tại**

**Response:**
```json
{
  "status": 200,
  "message": "Lấy danh sách chat thành công",
  "data": {
    "content": [
      {
        "id": "conv123",
        "participants": [
          {
            "id": "user1",
            "name": "Hoang",
            "avatar": "https://..."
          },
          {
            "id": "user2",
            "name": "Alice",
            "avatar": "https://..."
          }
        ],
        "lastMessage": {
          "senderId": "user2",
          "contentPreview": "Hello, how are you?",
          "type": "TEXT",
          "sentAt": "2026-06-05T10:00:00Z"
        },
        "unreadCount": 3,
        "lastMessageAt": "2026-06-05T10:00:00Z"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 1,
    "totalPages": 1
  }
}
```

**Query:**
```java
// Sort theo lastMessageAt DESC (conversation có tin nhắn mới nhất lên đầu)
Page<Conversation> conversations = conversationRepository
    .findByParticipantId(currentUserId, 
        PageRequest.of(page, size, Sort.by("lastMessageAt").descending())
    );

// Tính unreadCount cho từng conversation
conversations.forEach(conv -> {
    int unread = messageRepository.countUnreadMessages(
        conv.getId(), 
        currentUserId
    );
    conv.setUnreadCount(unread);  // transient field
});
```

---

### 2. POST /conversations
**Tạo hoặc lấy conversation với user khác**

**Request:**
```json
{
  "recipientId": "user2_id"
}
```

**Validation:**
1. `recipientId != currentUserId` (không chat với chính mình)
2. Recipient phải là bạn bè (Friendship status = ACCEPTED)
3. Check existing conversation (idempotent)

**Response:** Conversation object (201 Created hoặc 200 OK nếu đã tồn tại)

---

### 3. GET /conversations/{id}/messages
**Lấy danh sách messages của conversation**

**Query params:** `?page=0&size=50`

**Response:**
```json
{
  "status": 200,
  "data": {
    "content": [
      {
        "id": "msg123",
        "conversationId": "conv123",
        "sender": {
          "id": "user1",
          "name": "Hoang",
          "avatar": "https://..."
        },
        "content": "Hello!",
        "type": "TEXT",
        "mediaUrl": null,
        "deliveredAt": "2026-06-05T10:00:05Z",
        "seenAt": "2026-06-05T10:01:00Z",
        "createdAt": "2026-06-05T10:00:00Z"
      }
    ],
    "page": 0,
    "size": 50,
    "totalElements": 125
  }
}
```

**Query:**
```java
// Sort theo createdAt ASC (tin nhắn cũ → mới, để scroll up load more)
Page<Message> messages = messageRepository
    .findByConversationId(conversationId,
        PageRequest.of(page, size, Sort.by("createdAt").ascending())
    );
```

---

### 4. PUT /conversations/{id}/seen
**Đánh dấu tất cả messages chưa xem là đã xem**

**Request:** Không có body

**Backend Logic:**
```java
@Transactional
public void markAllAsSeen(String conversationId, String currentUserId) {
    // Validate participant
    Conversation conv = conversationRepository.findById(conversationId)
        .orElseThrow(() -> new NotFoundException("Conversation not found"));
        
    if (!conv.getParticipantIds().contains(currentUserId)) {
        throw new ForbiddenException("Not a participant");
    }
    
    // Batch update
    Instant now = Instant.now();
    messageRepository.markAsSeenBySenderNotAndSeenAtNull(
        conversationId, 
        currentUserId, 
        now
    );
    
    // Emit WebSocket to sender
    String senderId = conv.getParticipantIds().stream()
        .filter(id -> !id.equals(currentUserId))
        .findFirst()
        .orElse(null);
        
    if (senderId != null) {
        messagingTemplate.convertAndSendToUser(
            senderId,
            "/queue/status",
            MessageStatusEvent.builder()
                .conversationId(conversationId)
                .status("SEEN")
                .seenAt(now)
                .seenBy(currentUserId)
                .build()
        );
    }
}
```

---

### 5. PUT /messages/{id}/delivered
**Cập nhật trạng thái DELIVERED cho 1 message**

**Request:** Không có body

**Response:** 200 OK

**Use case:** Client tự động gọi khi nhận message qua WebSocket

---

## 🌐 WEBSOCKET EVENTS

### Event 1: NEW_MESSAGE
**Channel:** `/user/{userId}/queue/messages`

**Payload:**
```json
{
  "type": "NEW_MESSAGE",
  "data": {
    "id": "msg123",
    "conversationId": "conv123",
    "sender": { "id": "user1", "name": "Hoang", "avatar": "..." },
    "content": "Hello!",
    "type": "TEXT",
    "createdAt": "2026-06-05T10:00:00Z"
  }
}
```

**Client Handler:**
```typescript
stompClient.subscribe(`/user/queue/messages`, (frame) => {
  const event = JSON.parse(frame.body);
  
  if (event.type === 'NEW_MESSAGE') {
    const message = event.data;
    
    // Add to conversation
    addMessageToConversation(message.conversationId, message);
    
    // Auto mark as delivered
    if (isTabFocused && isConversationOpen(message.conversationId)) {
      await chatService.markAsDelivered(message.id);
    }
  }
});
```

---

### Event 2: MESSAGE_STATUS
**Channel:** `/user/{userId}/queue/status`

**Payload:**
```json
{
  "messageId": "msg123",
  "status": "DELIVERED",  // or "SEEN"
  "timestamp": "2026-06-05T10:00:05Z"
}
```

**Client Handler:**
```typescript
stompClient.subscribe(`/user/queue/status`, (frame) => {
  const event = JSON.parse(frame.body);
  
  // Update message status in UI
  updateMessageStatus(event.messageId, event.status, event.timestamp);
});
```

---

## 📊 UNREAD COUNT STRATEGY

### Option 1: Query on-the-fly (Accurate, chậm hơn)
```java
public int getUnreadCount(String conversationId, String userId) {
    return messageRepository.countByConversationIdAndSenderIdNotAndSeenAtNull(
        conversationId,
        userId
    );
}
```

**Pros:** Luôn chính xác 100%  
**Cons:** Phải query DB mỗi lần load conversation list → chậm nếu có nhiều conversations

---

### Option 2: Redis Cache (Fast, eventually consistent)
```java
// Increment khi có message mới
public void onNewMessage(Message message) {
    String recipientId = getRecipientId(message);
    String key = "unread:" + message.getConversationId() + ":" + recipientId;
    
    redisTemplate.opsForValue().increment(key);
    redisTemplate.expire(key, 1, TimeUnit.HOURS);
}

// Reset về 0 khi markAsSeen
public void onMarkAsSeen(String conversationId, String userId) {
    String key = "unread:" + conversationId + ":" + userId;
    redisTemplate.delete(key);
}

// Get với fallback
public int getUnreadCount(String conversationId, String userId) {
    String key = "unread:" + conversationId + ":" + userId;
    String cached = redisTemplate.opsForValue().get(key);
    
    if (cached != null) {
        return Integer.parseInt(cached);
    }
    
    // Fallback to DB query
    int count = messageRepository.countUnread(conversationId, userId);
    redisTemplate.opsForValue().set(key, String.valueOf(count), 1, TimeUnit.HOURS);
    return count;
}
```

**Pros:** Rất nhanh (~0.02ms), scale tốt  
**Cons:** Có thể bị lệch tạm thời (eventually consistent)

**Recommendation:** Dùng **Option 2 (Redis Cache)** cho production.

---

## 🧪 TEST CASES

### Scenario 1: User A gửi tin cho User B (B online)
1. A gửi "Hello" → Optimistic UI hiển thị ⏱️
2. Server lưu DB → Trả về message với id + createdAt
3. A's UI: ⏱️ → ✓
4. B nhận qua WebSocket → Hiển thị tin
5. B's client auto call `/messages/{id}/delivered`
6. A's UI: ✓ → ✓✓
7. B mở conversation → Call `/conversations/{id}/seen`
8. A's UI: ✓✓ → 👁️

**Expected:** Tất cả status transitions mượt mà, không bị missing.

---

### Scenario 2: User A gửi tin cho User B (B offline)
1. A gửi "Hello" → ✓ (SENT)
2. B offline → không có DELIVERED
3. B login lại sau 1 giờ
4. B load conversation list → thấy unread count = 1
5. B click vào conversation → Load messages
6. Messages của A vẫn ở trạng thái ✓ (SENT only)
7. B mở xong → Auto call `/conversations/{id}/seen`
8. A (if online) nhận WebSocket → UI ✓ → 👁️

**Expected:** Skip DELIVERED, nhảy thẳng SENT → SEEN.

---

### Scenario 3: Race condition - B seen trước khi A nhận DELIVERED event
**Prevention:** Backend luôn emit DELIVERED trước SEEN (order matters).

---

## 🎨 UI/UX REQUIREMENTS

### Conversation List
- Sort theo `lastMessageAt` DESC
- Hiển thị:
  - Avatar + tên người kia
  - Content preview (100 chars)
  - Unread badge (số)
  - Timestamp relative ("5 phút trước", "Hôm qua")
  - Status icon cho tin nhắn cuối (nếu là mình gửi): ✓ / ✓✓ / 👁️

### Chat Window
- Infinite scroll up (load more messages cũ)
- Optimistic UI (tin mới hiển thị ngay)
- Status icon bên phải mỗi tin (nếu là mình gửi)
- Group messages theo ngày
- Auto-scroll to bottom khi có tin mới (nếu đang ở bottom)

---

## 📝 CHECKLIST SPRINT 4.2

- [ ] Tạo Domain entities: Conversation, Message, LastMessageSummary, MessageType
- [ ] Tạo Repository interfaces trong domain layer
- [ ] Tạo MongoDB Documents + Mapper (MapStruct)
- [ ] Implement Repository adapters
- [ ] Tạo ConversationService với validation rules
- [ ] Tạo MessageService
- [ ] Implement 5 REST APIs
- [ ] Viết Migration (Mongock) tạo indexes
- [ ] ArchUnit test pass
- [ ] Unit tests cho business logic
- [ ] Swagger docs hoàn chỉnh

---

**Next:** Sprint 4.3 - WebSocket message controller + Redis Pub/Sub + Optimistic UI
