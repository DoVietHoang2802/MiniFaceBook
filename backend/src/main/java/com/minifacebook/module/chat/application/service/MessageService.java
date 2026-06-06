package com.minifacebook.module.chat.application.service;

import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.chat.application.dto.MessageReactionEvent;
import com.minifacebook.module.chat.application.dto.MessageResponse;
import com.minifacebook.module.chat.application.dto.MessageSendRequest;
import com.minifacebook.module.chat.application.dto.MessageStatusEvent;
import com.minifacebook.module.chat.application.dto.ParticipantResponse;
import com.minifacebook.module.chat.domain.entity.Conversation;
import com.minifacebook.module.chat.domain.entity.LastMessageSummary;
import com.minifacebook.module.chat.domain.entity.Message;
import com.minifacebook.module.chat.domain.entity.MessageType;
import com.minifacebook.module.chat.domain.entity.ReplyPreview;
import com.minifacebook.module.chat.domain.repository.ConversationRepository;
import com.minifacebook.module.chat.domain.repository.MessageRepository;
import com.minifacebook.module.chat.infrastructure.pubsub.ChatRedisPublisher;
import com.minifacebook.shared.domain.service.MediaService;
import com.minifacebook.shared.exception.AppException;
import com.minifacebook.shared.exception.ErrorCode;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Service xử lý nghiệp vụ quản lý tin nhắn (Sprint 4.2 & 4.3).
 */
@Service
@RequiredArgsConstructor
public class MessageService {

  private final MessageRepository messageRepository;
  private final ConversationRepository conversationRepository;
  private final UserRepository userRepository;
  private final StringRedisTemplate redisTemplate;
  private final ChatRedisPublisher chatRedisPublisher;
  private final MediaService mediaService;

  /** Bộ cảm xúc hợp lệ cho tin nhắn (Sprint 4.4 - Message Reactions). */
  private static final Set<String> ALLOWED_EMOJIS = Set.of("❤️", "👍", "😂", "😮", "😢", "😡");

  private User getUserByEmail(String email) {
    return userRepository
        .findByEmail(email)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
  }

  /**
   * Gửi tin nhắn mới (Sprint 4.3).
   * Thực hiện: validate, save DB, update denormalized Conversation summary, increment unreadCount Redis có TTL, publish Redis Pub/Sub.
   */
  @Transactional
  public MessageResponse sendMessage(String senderEmail, MessageSendRequest request) {
    User sender = getUserByEmail(senderEmail);
    String senderId = sender.getId();
    String conversationId = request.getConversationId();

    Conversation conv = conversationRepository.findById(conversationId)
        .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

    if (!conv.getParticipantIds().contains(senderId)) {
      throw new AppException(ErrorCode.NOT_A_PARTICIPANT);
    }

    // Dựng snapshot tin nhắn được trả lời (Sprint 4.4 - Reply)
    ReplyPreview replyPreview = null;
    if (request.getReplyToMessageId() != null && !request.getReplyToMessageId().isBlank()) {
      Message replied = messageRepository.findById(request.getReplyToMessageId())
          .orElseThrow(() -> new AppException(ErrorCode.MESSAGE_NOT_FOUND));
      // Tin được trả lời phải thuộc cùng conversation (chống trả lời chéo)
      if (!replied.getConversationId().equals(conversationId)) {
        throw new AppException(ErrorCode.MESSAGE_NOT_FOUND);
      }
      String repliedSenderName = userRepository.findById(replied.getSenderId())
          .map(User::getName)
          .orElse("Người dùng");
      replyPreview = ReplyPreview.builder()
          .messageId(replied.getId())
          .senderId(replied.getSenderId())
          .senderName(repliedSenderName)
          .contentPreview(buildShortPreview(replied))
          .build();
    }

    // Tạo & lưu Message entity
    Message message = Message.builder()
        .conversationId(conversationId)
        .senderId(senderId)
        .content(request.getContent())
        .type(request.getType())
        .mediaUrl(request.getMediaUrl())
        .createdAt(Instant.now())
        .replyTo(replyPreview)
        .build();

    message = messageRepository.save(message);

    // Xây dựng content preview cho LastMessageSummary (Sanitize XSS & Truncate 100 chars)
    String contentPreview = "";
    if (request.getType() == MessageType.TEXT) {
      String rawContent = request.getContent() != null ? request.getContent() : "";
      // Strip HTML tags
      String sanitized = rawContent.replaceAll("<[^>]*>", "");
      // Truncate to 100 chars (97 + "...")
      if (sanitized.length() > 100) {
        contentPreview = sanitized.substring(0, 97) + "...";
      } else {
        contentPreview = sanitized;
      }
    } else if (request.getType() == MessageType.IMAGE) {
      contentPreview = "📷 Đã gửi một ảnh";
    } else if (request.getType() == MessageType.FILE) {
      contentPreview = "📎 Đã gửi một file";
    }

    LastMessageSummary lastMessageSummary = LastMessageSummary.builder()
        .senderId(senderId)
        .contentPreview(contentPreview)
        .type(request.getType())
        .sentAt(message.getCreatedAt())
        .build();

    // Cập nhật thông tin LastMessage vào Conversation để chống lỗi N+1 khi load list
    conv.setLastMessageSummary(lastMessageSummary);
    conv.setLastMessageAt(message.getCreatedAt());
    conversationRepository.save(conv);

    // Tăng unread count cho đối phương trong Redis (Đặt TTL 7 ngày để tránh memory leak)
    String recipientId = conv.getParticipantIds().stream()
        .filter(id -> !id.equals(senderId))
        .findFirst()
        .orElse(null);

    if (recipientId != null) {
      String redisKey = "unread:" + conversationId + ":" + recipientId;
      redisTemplate.opsForValue().increment(redisKey);
      redisTemplate.expire(redisKey, 7, TimeUnit.DAYS);
    }

    // Map sang DTO Response (Chỉ load đúng 2 participants để tránh N+1)
    Map<String, ParticipantResponse> participantMap = userRepository.findAllByIds(conv.getParticipantIds()).stream()
        .map(u -> ParticipantResponse.builder()
            .id(u.getId())
            .name(u.getName())
            .avatar(u.getAvatar())
            .build())
        .collect(Collectors.toMap(ParticipantResponse::getId, Function.identity()));

    MessageResponse response = MessageResponse.builder()
        .id(message.getId())
        .conversationId(conversationId)
        .sender(participantMap.get(senderId))
        .content(message.getContent())
        .type(message.getType())
        .mediaUrl(message.getMediaUrl())
        .deliveredAt(message.getDeliveredAt())
        .seenAt(message.getSeenAt())
        .createdAt(message.getCreatedAt())
        .reactions(message.getReactions())
        .replyTo(message.getReplyTo())
        .build();

    // Phát sự kiện lên Redis Pub/Sub để đồng bộ giữa các instance server
    chatRedisPublisher.publishNewMessage(conversationId, conv.getParticipantIds(), response);

    return response;
  }

  /**
   * Gửi tin nhắn ảnh (Sprint 4.4 - Media in Chat).
   * Upload ảnh qua MediaService (đã có Tika magic-bytes scan + sandbox fallback), rồi tái dùng
   * toàn bộ luồng sendMessage với type=IMAGE.
   */
  @Transactional
  public MessageResponse sendImageMessage(String senderEmail, String conversationId, MultipartFile file, String replyToMessageId) {
    String imageUrl = mediaService.uploadAvatar(file);
    MessageSendRequest request = MessageSendRequest.builder()
        .conversationId(conversationId)
        .type(MessageType.IMAGE)
        .mediaUrl(imageUrl)
        .replyToMessageId(replyToMessageId)
        .build();
    return sendMessage(senderEmail, request);
  }

  /**
   * Lấy danh sách tin nhắn của cuộc hội thoại có phân trang.
   * Tối ưu hóa N+1 bằng cách cache thông tin của đúng 2 người tham gia.
   */
  @Transactional(readOnly = true)
  public Page<MessageResponse> getMessages(String conversationId, String email, Pageable pageable) {
    User currentUser = getUserByEmail(email);
    String currentUserId = currentUser.getId();

    Conversation conv = conversationRepository.findById(conversationId)
        .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

    if (!conv.getParticipantIds().contains(currentUserId)) {
      throw new AppException(ErrorCode.NOT_A_PARTICIPANT);
    }

    Page<Message> messages = messageRepository.findByConversationId(conversationId, pageable);

    if (messages.isEmpty()) {
      return Page.empty(pageable);
    }

    // N+1 Optimization: Chỉ truy vấn thông tin của 2 thành viên cuộc hội thoại đúng 1 lần
    Map<String, ParticipantResponse> participantMap = userRepository.findAllByIds(conv.getParticipantIds()).stream()
        .map(u -> ParticipantResponse.builder()
            .id(u.getId())
            .name(u.getName())
            .avatar(u.getAvatar())
            .build())
        .collect(Collectors.toMap(ParticipantResponse::getId, Function.identity()));

    List<MessageResponse> responses = messages.getContent().stream()
        .map(msg -> MessageResponse.builder()
            .id(msg.getId())
            .conversationId(msg.getConversationId())
            .sender(participantMap.get(msg.getSenderId()))
            .content(msg.getContent())
            .type(msg.getType())
            .mediaUrl(msg.getMediaUrl())
            .deliveredAt(msg.getDeliveredAt())
            .seenAt(msg.getSeenAt())
            .createdAt(msg.getCreatedAt())
            .reactions(msg.getReactions())
            .replyTo(msg.getReplyTo())
            .build())
        .toList();

    return new PageImpl<>(responses, pageable, messages.getTotalElements());
  }

  /**
   * Đánh dấu tin nhắn đã được nhận (DELIVERED) bởi người nhận.
   */
  @Transactional
  public void markAsDelivered(String messageId, String email) {
    User currentUser = getUserByEmail(email);
    String currentUserId = currentUser.getId();

    Message message = messageRepository.findById(messageId)
        .orElseThrow(() -> new AppException(ErrorCode.MESSAGE_NOT_FOUND));

    Conversation conv = conversationRepository.findById(message.getConversationId())
        .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

    // Verify current user is the recipient of the message
    if (!conv.getParticipantIds().contains(currentUserId) || message.getSenderId().equals(currentUserId)) {
      return; // Không xử lý nếu không phải người nhận tin nhắn
    }

    // Chỉ cập nhật nếu chưa được update deliveredAt
    if (message.getDeliveredAt() == null) {
      Instant now = Instant.now();
      message.setDeliveredAt(now);
      messageRepository.save(message);

      // Gửi WebSocket event tới người gửi thông báo tin nhắn đã đến (DELIVERED)
      MessageStatusEvent statusEvent = MessageStatusEvent.builder()
          .conversationId(message.getConversationId())
          .messageId(message.getId())
          .status("DELIVERED")
          .timestamp(now)
          .userId(currentUserId)
          .build();

      // Gửi qua Redis Pub/Sub để hỗ trợ phân tán multi-instance
      chatRedisPublisher.publishStatus(
          message.getConversationId(),
          "DELIVERED",
          List.of(message.getSenderId()),
          statusEvent
      );
    }
  }

  /**
   * Thả / gỡ cảm xúc cho một tin nhắn (Sprint 4.4 - Message Reactions).
   *
   * <p>Toggle logic:
   *
   * <ul>
   *   <li>Chưa react → thêm emoji
   *   <li>React lại đúng emoji đang có → gỡ bỏ (toggle off)
   *   <li>React emoji khác → thay thế
   * </ul>
   *
   * <p>Phát event tới tất cả participant (kèm bản đồ reactions đầy đủ) để đồng bộ realtime.
   */
  @Transactional
  public void reactToMessage(String email, String messageId, String emoji) {
    if (!ALLOWED_EMOJIS.contains(emoji)) {
      throw new AppException(ErrorCode.INVALID_REACTION);
    }

    User user = getUserByEmail(email);
    String userId = user.getId();

    Message message = messageRepository.findById(messageId)
        .orElseThrow(() -> new AppException(ErrorCode.MESSAGE_NOT_FOUND));

    Conversation conv = conversationRepository.findById(message.getConversationId())
        .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

    if (!conv.getParticipantIds().contains(userId)) {
      throw new AppException(ErrorCode.NOT_A_PARTICIPANT);
    }

    Map<String, String> reactions = message.getReactions();
    if (reactions == null) {
      reactions = new HashMap<>();
    }

    // Toggle: react lại cùng emoji thì gỡ, ngược lại thêm/thay
    if (emoji.equals(reactions.get(userId))) {
      reactions.remove(userId);
    } else {
      reactions.put(userId, emoji);
    }

    message.setReactions(reactions);
    messageRepository.save(message);

    // Phát event tới tất cả participant (cả người react để đồng bộ đa thiết bị)
    MessageReactionEvent reactionEvent = MessageReactionEvent.builder()
        .conversationId(message.getConversationId())
        .messageId(message.getId())
        .reactions(reactions)
        .build();

    chatRedisPublisher.publishReaction(
        message.getConversationId(),
        conv.getParticipantIds(),
        reactionEvent
    );
  }

  /**
   * Build content preview ngắn (≤80 ký tự) cho ReplyPreview snapshot (Sprint 4.4).
   * Sanitize HTML tags và truncate; thay placeholder cho ảnh/file.
   */
  private String buildShortPreview(Message msg) {
    if (msg.getType() == MessageType.IMAGE) return "📷 Ảnh";
    if (msg.getType() == MessageType.FILE) return "📎 Tệp đính kèm";
    String raw = msg.getContent() != null ? msg.getContent() : "";
    String sanitized = raw.replaceAll("<[^>]*>", "");
    if (sanitized.length() > 80) {
      return sanitized.substring(0, 77) + "...";
    }
    return sanitized;
  }
}
