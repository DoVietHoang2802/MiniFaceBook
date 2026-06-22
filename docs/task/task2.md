# Task 2: SSE Migration for Post Feed Updates & Notifications - Design Document

## 1. Overview

### Goal
Migrate Post Feed Updates and Notifications from WebSocket to Server-Sent Events (SSE) to improve scalability and simplify architecture. Additionally, add SSE realtime updates for new comments to enhance user experience.

### Scope
- **Backend**: Java 21, Spring Boot 3.3, MongoDB, Redis Pub/Sub
- **Frontend**: React 19, TypeScript, TanStack Query, Tailwind CSS v4, shadcn/ui

### Existing Infrastructure
- **SSE**: `PostEventBroadcaster`, `NotificationEventBroadcaster`, `SseEventController`, `SseNotificationController`
- **WebSocket**: `CommentRealtimeBroadcaster` for comment reactions, chat
- **Frontend**: `SseService` wrapper for EventSource with token injection

---

## 2. Architecture

### 2.1 SSE vs WebSocket Strategy

| Feature | Protocol | Rationale |
|---------|----------|-----------|
| Post count updates | SSE | One-way push, auto-reconnect, CDN-friendly |
| Notifications | SSE | One-way push, simple |
| New comments | **SSE** (new) | One-way push, consistent with other feed/notification updates |
| Comment reactions | WebSocket | Bidirectional (users can react), already implemented |
| Chat | WebSocket | Full-duplex required |

**Key principle**: Use SSE for server-to-client push where client doesn't need to send data back over same channel. Use WebSocket only for bidirectional interactions.

### 2.2 Comment Realtime SSE Architecture

```
┌─────────────┐      ┌────────────────────┐      ┌─────────────┐
│   Client A  │─────▶│   SseCommentController │─────▶ Redis Pub/Sub │
│ (EventSource)│      │  (GET /events/comment) │      │ (comment:events) │
└─────────────┘      └────────────────────┘      └─────────────┘
         │                      │                          │
         │                      │                          │
         ▼                      ▼                          ▼
┌─────────────┐      ┌────────────────────┐      ┌─────────────┐
│   Client B  │◀─────│ CommentEventBroadcaster │◀─────│ CommentService │
│ (EventSource)│      │                      │      │   (broadcast) │
└─────────────┘      └────────────────────┘      └─────────────┘
```

**Flow**:
1. User A creates comment → POST `/posts/{postId}/comments`
2. `CommentService.addComment()`:
   - Saves comment to MongoDB
   - Maps to `CommentResponse` DTO
   - Calls `commentEventBroadcaster.broadcast(response)`
3. `CommentEventBroadcaster.broadcast()`:
   - Emits event to local `Sinks.Many<CommentResponse>` (subscribers on same server)
   - Publishes JSON to Redis channel `"comment:events"`
4. All server instances receive Redis message → their local `Sinks` emit to connected SSE clients
5. SSE clients (`CommentSection`) receive event and update TanStack Query cache → UI re-renders

---

## 3. Components

### 3.1 Backend

#### 3.1.1 `CommentEventBroadcaster`
**File**: `backend/src/main/java/com/minifacebook/module/post/application/service/CommentEventBroadcaster.java`

**Responsibilities**:
- Maintain local in-memory event sink for SSE subscribers on this server instance
- Subscribe to Redis channel `"comment:events"` for cross-server propagation
- Broadcast comment events to all subscribers
- Filter events by `postIds` to allow clients to subscribe only to relevant posts

**Key Implementation**:
```java
@Service
@Slf4j
@Profile("!test")
public class CommentEventBroadcaster {
  private final ReactiveRedisTemplate<String, String> reactiveRedisTemplate;
  private final ObjectMapper objectMapper;
  private static final String CHANNEL = "comment:events";
  private final Sinks.Many<CommentResponse> sink =
      Sinks.many().multicast().onBackpressureBuffer();

  public CommentEventBroadcaster(ReactiveRedisTemplate<String, String> reactiveRedisTemplate,
                                 ObjectMapper objectMapper) {
    this.reactiveRedisTemplate = reactiveRedisTemplate;
    this.objectMapper = objectMapper;
    // Subscribe to Redis channel
    reactiveRedisTemplate.listenToChannel(CHANNEL)
        .map(ReactiveRedisMessage::getMessage)
        .doOnNext(json -> {
          try {
            CommentResponse event = objectMapper.readValue(json, CommentResponse.class);
            sink.tryEmitNext(event);
          } catch (IOException e) {
            log.error("Failed to deserialize comment event from Redis", e);
          }
        })
        .subscribe();
  }

  public void broadcast(CommentResponse comment) {
    // Emit to local subscribers
    sink.tryEmitNext(comment);
    // Publish to Redis for other servers
    try {
      String json = objectMapper.writeValueAsString(comment);
      reactiveRedisTemplate.convertAndSend(CHANNEL, json).subscribe();
    } catch (IOException e) {
      log.error("Failed to serialize comment event for Redis", e);
    }
  }

  public Flux<CommentResponse> getFluxForUser(Optional<List<String>> postIds) {
    Flux<CommentResponse> flux = sink.asFlux();
    if (postIds.isPresent() && !postIds.get().isEmpty()) {
      Set<String> idSet = new HashSet<>(postIds.get());
      return flux.filter(event -> idSet.contains(event.getPostId()));
    }
    return flux;
  }
}
```

**Notes**:
- Uses `CommentResponse` DTO (reuse existing DTO from `backend/src/main/java/com/minifacebook/module/post/application/dto/CommentResponse.java`)
- `Sinks.many().multicast().onBackpressureBuffer()`: multicasting to multiple subscribers, buffer when backpressure
- No history: new subscribers only receive events from subscription time onward

#### 3.1.2 `SseCommentController`
**File**: `backend/src/main/java/com/minifacebook/module/post/presentation/SseCommentController.java`

**Responsibilities**:
- Expose SSE endpoint `/events/comment`
- Extract JWT token from query param (via `SecurityConfig` bearer token resolver)
- Authenticate user via `@AuthenticationPrincipal`
- Filter events by `postIds` query parameter
- Return `Flux<CommentResponse>` with appropriate SSE headers

**Implementation**:
```java
@RestController
@RequiredArgsConstructor
public class SseCommentController {
  private final CommentEventBroadcaster commentEventBroadcaster;

  @GetMapping(value = "/events/comment", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public ResponseEntity<Flux<CommentResponse>> getCommentEvents(
      @RequestParam(required = false, name = "postIds") List<String> postIds,
      @AuthenticationPrincipal org.springframework.security.oauth2.jwt.Jwt jwt) {
    Flux<CommentResponse> flux = commentEventBroadcaster.getFluxForUser(Optional.ofNullable(postIds));
    return ResponseEntity.ok()
        .header("X-Accel-Buffering", "no")  // Disable Nginx buffering
        .header("Cache-Control", "no-cache")
        .header("Connection", "keep-alive")
        .body(flux);
  }
}
```

**Security**: Endpoint requires authentication. `SecurityConfig.bearerTokenResolver()` already checks query param `access_token` first, then cookie, then Authorization header. This allows `EventSource` to work with `?access_token=...`.

#### 3.1.3 `CommentService` Modification
**File**: `backend/src/main/java/com/minifacebook/module/post/application/service/CommentService.java`

**Changes**:
- Add constructor parameter `CommentEventBroadcaster commentEventBroadcaster`
- In `addComment()` method, after saving comment and mapping to `CommentResponse`, call `broadcast()`

**Code diff**:
```java
@Service
@Slf4j
@RequiredArgsConstructor
public class CommentService {
  private final CommentRepository commentRepository;
  private final PostRepository postRepository;
  private final UserRepository userRepository;
  private final CommentMapper commentMapper;
  private final PostRealtimeBroadcaster postRealtimeBroadcaster;
  private final NotificationService notificationService;
  private final CommentEventBroadcaster commentEventBroadcaster;  // ADDED

  public CommentResponse addComment(String postId, CreateCommentRequest request, UserPrincipal principal) {
    // ... existing code ...

    // Save comment
    Comment comment = commentRepository.save(comment);
    commentIncrement.incrementAndGet();

    // Map response
    CommentResponse response = toCommentResponse(comment, Map.of(), false);

    // BROADCAST COMMENT EVENT (NEW)
    commentEventBroadcaster.broadcast(response);

    // Existing: broadcast post count updates and notifications
    postRealtimeBroadcaster.broadcastCounts(post);
    notificationService.createCommentNotification(post, comment, request.getParentCommentId());

    return response;
  }
}
```

**Order**: Broadcast comment event before notification (order doesn't matter much but consistent with causality).

#### 3.1.4 Redis Configuration
No changes needed. `ReactiveRedisConfig` already provides `ReactiveRedisTemplate<String, String>`.

---

### 3.2 Frontend

#### 3.2.1 `CommentSection` SSE Subscription
**File**: `frontend/src/modules/post/components/CommentSection.tsx`

**Existing**:
- WebSocket subscription for comment reactions (using `useReactions` hook)
- TanStack Query for comments (`useComments` hook)

**Add**:
```typescript
import { sseService } from '../../core/services/sseService';
import { useQueryClient } from '@tanstack/react-query';
import { CommentResponse } from '../../post.types';

// Inside CommentSection component
const queryClient = useQueryClient();
const receivedCommentIds = useRef<Set<string>>(new Set());

useEffect(() => {
  // Clear tracking when postId changes
  receivedCommentIds.current.clear();

  const unsubscribe = sseService.subscribe<CommentResponse>(
    `/api/events/comment?postIds=${postId}`,
    (newComment) => {
      // Deduplication: ignore if already added (from optimistic or previous SSE)
      if (receivedCommentIds.current.has(newComment.id)) {
        return;
      }
      receivedCommentIds.current.add(newComment.id);

      // Update TanStack Query cache
      queryClient.setQueryData(['comments', postId], (old: any) => {
        if (!old?.data?.content) return old;

        // Double-check duplicate (race condition with refetch)
        if (old.data.content.some((c: CommentResponse) => c.id === newComment.id)) {
          receivedCommentIds.current.delete(newComment.id);
          return old;
        }

        // Prepend new comment (newest first)
        return {
          ...old,
          data: {
            ...old.data,
            content: [newComment, ...old.data.content],
            totalElements: old.data.totalElements + 1,
          },
        };
      });
    }
  );

  return () => unsubscribe();
}, [postId, queryClient]);
```

**Placement**: Add this `useEffect` after the existing WebSocket reaction subscription effect. Both can coexist.

**Deduplication strategy**:
- Track comment IDs added via SSE in a `Set`
- Check before updating cache to avoid duplicates from multiple SSE events (unlikely but possible)
- On cache invalidation/refetch, the entire list is replaced, so the Set becomes stale but harmless. When postId changes or component unmounts, clear Set.

**Interaction with optimistic updates**:
- Existing mutation uses `onMutate` to add optimistic comment with temporary ID `temp-${Date.now()}`
- Optimistic comment has different ID than real comment from SSE
- After mutation `onSettled` invalidates query → refetch from server
- Refetch returns all comments including the new one (with real ID)
- The refetch replaces cache, removing optimistic comment and adding real comment
- The SSE event may also add the real comment → but the `receivedCommentIds` check prevents duplicate because the real ID will already be in the Set after SSE handler runs once. However, if refetch completes first, the real comment is in cache, then SSE arrives, the check `old.data.content.some(c => c.id === newComment.id)` will catch and skip.

**Race handling**: The double-check (Set + cache scan) ensures no duplicates regardless of order.

---

## 4. Data Flow

### 4.1 Sequence Diagram

```
User A                         Backend (Server 1)                   Redis                        Backend (Server 2)
  │                                   │                                 │                                 │
  │ POST /posts/X/comments            │                                 │                                 │
  │──────────────────────────────────▶│                                 │                                 │
  │                                   │ CommentService.addComment()     │                                 │
  │                                   │─────────────────────────────────▶│                                 │
  │                                   │                                 │ commentEventBroadcaster.broadcast()
  │                                   │                                 ├─────────────────────────────────▶
  │                                   │                                 │                                 │ Sinks.emit()
  │                                   │                                 │                                 │─────────────────▶ SSE clients
  │                                   │                                 │                                 │
  │                                   │◀─────────────────────────────────┤                                 │
  │                                   │ Redis message (JSON)            │                                 │
  │                                   │                                 │                                 │
  │ SSE /events/comment?postIds=X     │                                 │                                 │
  │◀──────────────────────────────────│                                 │                                 │
  │                                   │                                 │                                 │
  │                                   │ Sinks.asFlux() → emit CommentResponse
  │                                   │─────────────────────────────────▶│                                 │
  │                                   │                                 │                                 │
  │                                   │                                 │                                 │ SSE /events/comment?postIds=X
  │                                   │                                 │◀──────────────────────────────────│
  │                                   │                                 │                                 │
```

### 4.2 Event Payload

**CommentResponse** (existing DTO):
```json
{
  "id": "comment-uuid",
  "content": "Hello world",
  "postId": "post-uuid",
  "author": {
    "id": "user-uuid",
    "name": "John Doe",
    "avatar": "url"
  },
  "parentCommentId": null,
  "reactionsCount": {
    "👍": 5,
    "❤️": 3
  },
  "myReaction": null,
  "createdAt": "2025-06-22T04:30:00Z",
  "updatedAt": null
}
```

---

## 5. Error Handling

### 5.1 Backend

- **Redis deserialization error**: Log warning, skip event, continue listening.
- **Redis connection loss**: Spring Data Redis auto-reconnects. Sink may not receive events during downtime; acceptable.
- **Broadcast serialization error**: Log error, continue (post count/notification still work).
- **SSE client disconnect**: Client's `EventSource.onerror` fires, backend's Flux completes when client disconnects. No resource leak (Spring cleans up).

### 5.2 Frontend

- **SSE connection error**: `SseService.onerror` logs; `EventSource` automatically attempts reconnect (browser built-in).
- **JSON parse error**: `SseService.onmessage` catches, logs, skips.
- **Cache update errors**: Wrap `setQueryData` in try-catch within handler (already safe, no side effects).
- **Fallback**: If SSE fails completely, user can still see comments by creating new ones (optimistic) or refreshing page (REST fetch). No degraded mode needed.

---

## 6. Testing

### 6.1 Unit Tests (Backend)

**`CommentEventBroadcasterTest`**:
- Verify `broadcast()` emits to local sink
- Verify `broadcast()` publishes to Redis (`reactiveRedisTemplate.convertAndSend` called)
- Verify `getFluxForUser()` filters by `postIds`

**`SseCommentControllerTest`**:
- Verify endpoint returns 200 with `text/event-stream` content type
- Verify headers: `X-Accel-Buffering: no`, `Cache-Control: no-cache`, `Connection: keep-alive`
- Verify authenticated access required
- Verify filtering by `postIds` query param

### 6.2 Integration Tests

- Start backend + Redis
- Create two SSE clients (different `postIds` filters)
- Call `CommentService.addComment()` for post X
- Verify client with `postIds=X` receives event, client with `postIds=Y` does not

### 6.3 E2E Tests (Frontend)

1. **Two-user realtime**:
   - Login as User A and User B in separate browsers
   - Both navigate to same post X
   - User A adds comment
   - Verify User B sees comment appear without refresh

2. **Filtering**:
   - User B watching post X, User C watching post Y
   - User A comments on X → B sees, C does not

3. **Optimistic + SSE dedup**:
   - User A comments → sees optimistic comment immediately
   - SSE event arrives → cache updates correctly (no duplicate)
   - After refetch → cache contains real comment only

4. **Unsubscribe**:
   - User navigates away from post → SSE subscription closed
   - No more events received

---

## 7. Performance & Scalability

- **Connection count**: Each client opens 1 SSE connection for comments (plus existing 2 for post events + notifications). Total ~3 connections/user. Acceptable.
- **Event size**: ~1KB per comment. At 10 comments/sec peak, ~10KB/sec per user stream.
- **Redis Pub/Sub**: Single channel `comment:events`. All servers subscribed. Redis handles fan-out efficiently.
- **Memory**: `Sinks.Many().multicast().onBackpressureBuffer()` buffers events only when downstream backpressures (slow subscriber). For comments (low frequency), buffer rarely grows.
- **Cross-server**: Works with N backend instances; each maintains its own sink and Redis subscription.

---

## 8. Security

- SSE endpoint protected by Spring Security (`.anyRequest().authenticated()`)
- JWT passed via query param `access_token` (supported by `JwtDecoder` custom bearer token resolver)
- Token validation occurs before controller method invoked
- Event payload only contains data user could already see via REST API (no privilege escalation)
- Author information included but only public fields (id, name, avatar)

---

## 9. Rollback Plan

If critical issues arise:
1. Remove `commentEventBroadcaster.broadcast()` call from `CommentService`
2. Delete `CommentEventBroadcaster` bean (or exclude from component scan)
3. Delete `SseCommentController` or change mapping to disabled
4. Remove SSE subscription effect from `CommentSection`

Existing features (REST API, WebSocket reactions, post count SSE, notifications) remain unaffected.

---

## 10. Success Criteria

**Functional**:
- ✅ New comments appear in real-time on all clients viewing the post
- ✅ No duplicate comments in UI
- ✅ Only comments for subscribed posts are received
- ✅ WebSocket reactions continue to work
- ✅ Authentication works with JWT query param

**Non-functional**:
- ✅ SSE connection stable, auto-reconnects
- ✅ No memory leaks (subscriptions cleaned up on unmount)
- ✅ Cross-server propagation works

**User Experience**:
- ✅ User perceives instant update (sub-100ms latency)
- ✅ No manual refresh required

---

## 11. Implementation Checklist

### Backend
- [x] Create `CommentEventBroadcaster.java`
- [x] Modify `CommentService.java` (add dependency, call `broadcast()`)
- [x] Create `SseCommentController.java`
- [x] Verify `CommentResponse` is properly serializable (already used in REST)
- [x] Rebuild and start backend

### Frontend
- [x] Modify `CommentSection.tsx` (import `sseService`, add SSE effect)
- [x] Verify `CommentResponse` type matches (import from shared types)
- [x] Test in browser with two windows

### Testing
- [x] curl test: `curl -i "http://localhost:8080/api/events/comment?postIds=<postId>&access_token=<token>"`
- [x] E2E manual test
- [x] Check logs for errors

### Deployment
- [ ] Ensure Redis is running and accessible
- [ ] Update environment config if needed (Redis host/port)
- [ ] Monitor SSE connections in production

---

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| SSE connection limit per browser (6 per domain) | Users may hit limit if many SSE features | Use single shared EventSource per endpoint; currently only 3 SSE endpoints total (post, notification, comment) - safe |
| Redis Pub/Sub message loss if server down temporarily | Some users miss comment events | Acceptable: comments still loaded via REST on next scroll/refresh |
| Memory leak in `CommentSection` if unsubscribe fails | Accumulate connections, stale data | Ensure cleanup function in `useEffect` returns unsubscribe; test unmount |
| Duplicate comments due to race between SSE and refetch | UI shows duplicate | Deduplication logic in SSE handler + cache invalidation |
| High comment volume saturates SSE bandwidth | Slow updates, dropped events | Comments are low volume; monitor; if needed, batch events or throttle |

---

## 13. Alternatives Considered

### Option A: Use WebSocket for new comments (instead of SSE)
- **Pros**: Single protocol for all realtime, reuse existing `CommentRealtimeBroadcaster`
- **Cons**: Mixing purposes (chat+reactions+comments) on same channel makes authorization more complex; WebSocket connections heavier than SSE; inconsistent with post/notification design
- **Decision**: Rejected to maintain consistency and separation of concerns.

### Option B: No filtering on server (broadcast all comments to all subscribers)
- **Pros**: Simpler broadcaster code
- **Cons**: Wastes bandwidth, client must filter, security implication (user receives comments for posts they may not have access to)
- **Decision**: Rejected. Filtering on server by `postIds` is necessary.

### Option C: Use separate Redis channels per post (e.g., `comment:events:post:{postId}`)
- **Pros**: More granular pub/sub, users only subscribe to channels they need; could scale better
- **Cons**: More Redis channels, complexity in subscription management; filtering on single channel is simpler and sufficient for current scale
- **Decision**: Rejected for now; single channel with filtering is adequate. Can revisit if scale demands.

---

## 14. References

- Existing SSE broadcasters: `PostEventBroadcaster.java`, `NotificationEventBroadcaster.java`
- Existing SSE controllers: `SseEventController.java`, `SseNotificationController.java`
- Existing WebSocket broadcaster: `CommentRealtimeBroadcaster.java`
- Frontend `SseService`: `frontend/src/modules/core/services/sseService.ts`
- Spring Security config: `SecurityConfig.java` (bearer token resolver for query param)

---

## 15. Open Questions (Resolved)

**Q**: Should we send full `CommentResponse` or minimal `CommentCreatedEvent`?
**A**: Full `CommentResponse` (same as REST) - simpler, frontend already expects this shape.

**Q**: How to handle pagination? New comment may not appear in current page if user scrolled down.
**A**: We prepend to beginning. If user is far down, they may not notice; but it's correct behavior (newest first). User can scroll to top to see new comment. Could also scroll to top automatically, but out of scope.

**Q**: Should we invalidate TanStack Query after SSE update to keep cache fresh?
**A**: No, we update cache directly. Invalidation (refetch) already happens after optimistic mutation via `onSettled`. That ensures server state is eventually consistent.

**Q**: What about comment edits and deletions?
**A**: Out of scope for this task. Can add later if needed. For now, new comment only.

---

**Design completed**: 2025-06-22
**Author**: Claude Sonnet 4.6 (Anthropic)
**Status**: Completed


II. Các Điểm Cần Lưu Ý & Rủi Ro Tiềm Ẩn (Risks & Recommendations)
1. Giới hạn kết nối của Browser (HTTP/1.1 Connection Limit)
Vấn đề: Dưới giao thức HTTP/1.1, các trình duyệt (Chrome, Firefox...) giới hạn tối đa 6 kết nối đồng thời trên mỗi domain. Theo thiết kế hiện tại, mỗi tab mở ra sẽ duy trì khoảng 3 kết nối SSE (1 cho post, 1 cho notification, 1 cho comment). Điều này đồng nghĩa với việc:
Nếu người dùng mở từ 2 tab trở lên, họ sẽ dùng hết 6 kết nối. Tab thứ 3 sẽ bị treo (hang) hoàn toàn hoặc các API REST thông thường sẽ không thể gửi đi được nữa.
Giải pháp khuyến nghị:
Bắt buộc cấu hình HTTP/2 hoặc HTTP/3 ở môi trường Deploy/Production (thông qua Nginx hoặc Cloudflare). HTTP/2 sử dụng cơ chế multiplexing nên không bị giới hạn 6 kết nối này.
Nếu không dùng HTTP/2, bạn nên cân nhắc gộp các SSE endpoint thành một kênh chung duy nhất (ví dụ: /events/stream) và phân loại sự kiện bằng trường type (như NEW_COMMENT, NOTIF, POST_UPDATE) để tiết kiệm kết nối.
2. Bảo mật khi truyền Access Token qua Query Parameter (?access_token=...)
Vấn đề: Đối tượng EventSource mặc định của JS không hỗ trợ truyền Custom Headers (như Authorization: Bearer ...), vì vậy thiết kế sử dụng query param là giải pháp hiển nhiên. Tuy nhiên, việc đính kèm JWT trên URL ẩn chứa rủi ro bảo mật vì các Reverse Proxy (Nginx, Gateway) hoặc hệ thống log server mặc định sẽ lưu lại toàn bộ URL (bao gồm cả token) dưới dạng plain text.
Giải pháp khuyến nghị:
Đảm bảo rằng cấu hình logging của Server/Nginx ở production đã được tắt hoặc filter bỏ tham số access_token trên URL.
Hoặc tận dụng cơ chế đọc Token từ Cookie (trong SecurityConfig của bạn đã hỗ trợ đọc cookie accessToken), do EventSource có hỗ trợ cấu hình { withCredentials: true } để tự động đính kèm cookie.
3. Kiểm tra quyền sở hữu bài viết (Authorization Leakage)
Vấn đề: Trong SseCommentController, phương thức getCommentEvents chỉ kiểm tra xem User có đăng nhập hợp lệ hay không (@AuthenticationPrincipal). Nếu một người dùng biết được ID của một bài viết thuộc chế độ riêng tư (Private) hoặc bài viết trong group kín mà họ không có quyền xem, họ vẫn có thể subscribe vào /events/comment?postIds=<private_post_id> để nghe trộm các bình luận mới.
Giải pháp khuyến nghị:
Ở phương thức getFluxForUser hoặc trong Controller, trước khi trả về Flux sự kiện, cần bổ sung một bước kiểm tra quyền xem bài viết của User đối với danh sách postIds được yêu cầu.