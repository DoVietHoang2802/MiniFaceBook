package com.minifacebook.module.chat.application.service;

import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.chat.application.dto.ConversationCreateRequest;
import com.minifacebook.module.chat.application.dto.ConversationResponse;
import com.minifacebook.module.chat.application.dto.MessageStatusEvent;
import com.minifacebook.module.chat.application.dto.ParticipantResponse;
import com.minifacebook.module.chat.domain.entity.Conversation;
import com.minifacebook.module.chat.domain.repository.ConversationRepository;
import com.minifacebook.module.chat.domain.repository.MessageRepository;
import com.minifacebook.module.chat.application.port.ChatEventPublisher;
import com.minifacebook.module.friendship.domain.entity.Friendship;
import com.minifacebook.module.friendship.domain.entity.FriendshipStatus;
import com.minifacebook.module.friendship.domain.repository.FriendshipRepository;
import com.minifacebook.shared.exception.AppException;
import com.minifacebook.shared.exception.ErrorCode;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

/**
 * Service xử lý nghiệp vụ quản lý cuộc hội thoại (Sprint 4.2 & 4.3).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ConversationService {

  private final ConversationRepository conversationRepository;
  private final MessageRepository messageRepository;
  private final UserRepository userRepository;
  private final FriendshipRepository friendshipRepository;
  private final StringRedisTemplate redisTemplate;
  private final ChatEventPublisher chatRedisPublisher;

  private User getUserByEmail(String email) {
    return userRepository
        .findByEmail(email)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
  }

  /**
   * Tạo mới hoặc trả về cuộc trò chuyện 1-1 đã có giữa 2 user.
   */
  /**
   * Tạo mới hoặc trả về cuộc trò chuyện 1-1 đã có giữa 2 user.
   * Không dùng @Transactional để tránh WriteConflict khi concurrent requests.
   */
  public ConversationResponse getOrCreateConversation(String email, ConversationCreateRequest request) {
    User currentUser = getUserByEmail(email);
    String currentUserId = currentUser.getId();
    String recipientId = request.getRecipientId();

    log.info("Creating conversation: currentUser={} ({}), recipientId={}", email, currentUserId, recipientId);

    if (currentUserId.equals(recipientId)) {
      throw new AppException(ErrorCode.CANNOT_CHAT_SELF);
    }

    User recipient = userRepository.findById(recipientId)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

    // Xác thực mối quan hệ bạn bè (chỉ cho phép khi status = ACCEPTED)
    Friendship friendship = friendshipRepository.findBetweenUsers(currentUserId, recipientId)
        .orElseThrow(() -> {
          log.error("Friendship NOT FOUND between {} and {}", currentUserId, recipientId);
          return new AppException(ErrorCode.NOT_FRIENDS);
        });

    if (friendship.getStatus() == FriendshipStatus.BLOCKED) {
      throw new AppException(ErrorCode.USER_BLOCKED);
    }
    if (friendship.getStatus() != FriendshipStatus.ACCEPTED) {
      throw new AppException(ErrorCode.NOT_FRIENDS);
    }

    // Sắp xếp participantIds tăng dần để đảm bảo unique/idempotent
    List<String> sortedIds = Stream.of(currentUserId, recipientId).sorted().toList();

    // Luôn tìm existing trước khi tạo mới
    Optional<Conversation> existing = conversationRepository.findByParticipantIds(sortedIds);
    if (existing.isPresent()) {
      log.info("Existing conversation found: {}", existing.get().getId());
      return mapToResponse(existing.get(), currentUser, recipient);
    }

    // Tạo mới với xử lý race condition
    Conversation conversation = Conversation.builder()
        .participantIds(sortedIds)
        .createdAt(Instant.now())
        .lastMessageAt(Instant.now())
        .build();
    try {
      conversation = conversationRepository.save(conversation);
      log.info("New conversation created: {}", conversation.getId());
    } catch (org.springframework.dao.DuplicateKeyException e) {
      conversation = conversationRepository.findByParticipantIds(sortedIds)
          .orElseThrow(() -> e);
      log.info("Race condition handled, using existing: {}", conversation.getId());
    }

    return mapToResponse(conversation, currentUser, recipient);
  }

  /**
   * Lấy danh sách các cuộc trò chuyện của người dùng hiện tại (phân trang).
   * Tối ưu hóa N+1 bằng cách batch-load thông tin user.
   */
  public Page<ConversationResponse> getConversations(String email, Pageable pageable) {
    User currentUser = getUserByEmail(email);
    String currentUserId = currentUser.getId();

    Page<Conversation> conversations = conversationRepository.findByParticipantId(currentUserId, pageable);

    if (conversations.isEmpty()) {
      return Page.empty(pageable);
    }

    // Thu thập toàn bộ ID đối phương để truy vấn trong 1 câu DB (chống N+1)
    List<String> recipientIds = conversations.getContent().stream()
        .flatMap(c -> c.getParticipantIds().stream())
        .filter(id -> !id.equals(currentUserId))
        .distinct()
        .toList();

    Map<String, User> userMap = userRepository.findAllByIds(recipientIds).stream()
        .collect(Collectors.toMap(User::getId, Function.identity()));

    List<ConversationResponse> responses = conversations.getContent().stream()
        .map(conv -> {
          String recipientId = conv.getParticipantIds().stream()
              .filter(id -> !id.equals(currentUserId))
              .findFirst()
              .orElse(null);

          User recipient = recipientId != null ? userMap.get(recipientId) : null;
          if (recipient == null) {
            return null; // Bỏ qua nếu user kia không tồn tại
          }

          ConversationResponse response = mapToResponse(conv, currentUser, recipient);

          // Lấy unread count từ Redis, fallback xuống DB (Option 2)
          String redisKey = "unread:" + conv.getId() + ":" + currentUserId;
          String cachedVal = redisTemplate.opsForValue().get(redisKey);
          int unreadCount;
          if (cachedVal != null) {
            unreadCount = Integer.parseInt(cachedVal);
          } else {
            unreadCount = messageRepository.countUnreadMessages(conv.getId(), currentUserId);
            redisTemplate.opsForValue().set(redisKey, String.valueOf(unreadCount), 1, TimeUnit.HOURS);
          }
          response.setUnreadCount(unreadCount);

          return response;
        })
        .filter(java.util.Objects::nonNull)
        .toList();

    return new PageImpl<>(responses, pageable, conversations.getTotalElements());
  }

  /**
   * Đánh dấu toàn bộ tin nhắn chưa đọc trong cuộc hội thoại là đã xem.
   */
  public void markAllAsSeen(String conversationId, String email) {
    User currentUser = getUserByEmail(email);
    String currentUserId = currentUser.getId();

    Conversation conv = conversationRepository.findById(conversationId)
        .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

    if (!conv.getParticipantIds().contains(currentUserId)) {
      throw new AppException(ErrorCode.NOT_A_PARTICIPANT);
    }

    Instant now = Instant.now();
    messageRepository.markAsSeen(conversationId, currentUserId, now);

    // Xóa cache unread count trong Redis
    String redisKey = "unread:" + conversationId + ":" + currentUserId;
    redisTemplate.delete(redisKey);

    // Báo hiệu tổng unread của CHÍNH user giảm → cập nhật chấm đỏ nút Chats ở mọi tab (Phase 5.4).
    chatRedisPublisher.publishChatUnread(conversationId, List.of(currentUserId));

    // Gửi sự kiện WebSocket (SEEN) tới người gửi
    String otherUserId = conv.getParticipantIds().stream()
        .filter(id -> !id.equals(currentUserId))
        .findFirst()
        .orElse(null);

    if (otherUserId != null) {
      MessageStatusEvent event = MessageStatusEvent.builder()
          .conversationId(conversationId)
          .status("SEEN")
          .timestamp(now)
          .userId(currentUserId)
          .build();

      // Gửi qua Redis Pub/Sub thay vì send trực tiếp để hỗ trợ multi-instance
      chatRedisPublisher.publishStatus(
          conversationId,
          "SEEN",
          List.of(otherUserId),
          event
      );
    }
  }

  /**
   * Tổng số tin nhắn chưa đọc trên TẤT CẢ cuộc hội thoại của user (cho chấm đỏ nút Chats sidebar).
   * Quy mô demo: duyệt các hội thoại của user rồi cộng dồn unread (Redis cache, fallback DB).
   */
  public long getTotalUnread(String email) {
    User currentUser = getUserByEmail(email);
    String currentUserId = currentUser.getId();

    Page<Conversation> conversations =
        conversationRepository.findByParticipantId(
            currentUserId, org.springframework.data.domain.PageRequest.of(0, 500));

    long total = 0;
    for (Conversation conv : conversations.getContent()) {
      String redisKey = "unread:" + conv.getId() + ":" + currentUserId;
      String cachedVal = redisTemplate.opsForValue().get(redisKey);
      if (cachedVal != null) {
        total += Long.parseLong(cachedVal);
      } else {
        int count = messageRepository.countUnreadMessages(conv.getId(), currentUserId);
        redisTemplate.opsForValue().set(redisKey, String.valueOf(count), 1, TimeUnit.HOURS);
        total += count;
      }
    }
    return total;
  }

  private ConversationResponse mapToResponse(Conversation conversation, User currentUser, User recipient) {
    ParticipantResponse currentPart = ParticipantResponse.builder()
        .id(currentUser.getId())
        .name(currentUser.getName())
        .avatar(currentUser.getAvatar())
        .build();

    ParticipantResponse recipientPart = ParticipantResponse.builder()
        .id(recipient.getId())
        .name(recipient.getName())
        .avatar(recipient.getAvatar())
        .build();

    return ConversationResponse.builder()
        .id(conversation.getId())
        .participants(List.of(currentPart, recipientPart))
        .lastMessage(conversation.getLastMessageSummary())
        .lastMessageAt(conversation.getLastMessageAt())
        .createdAt(conversation.getCreatedAt())
        .build();
  }
}
