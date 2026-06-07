package com.minifacebook.module.chat.application.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.chat.application.dto.ChatPubSubEvent;
import com.minifacebook.module.chat.application.dto.TypingEvent;
import com.minifacebook.module.chat.domain.entity.Conversation;
import com.minifacebook.module.chat.domain.repository.ConversationRepository;
import com.minifacebook.module.chat.application.port.ChatEventPublisher;
import com.minifacebook.shared.exception.AppException;
import com.minifacebook.shared.exception.ErrorCode;
import java.time.Duration;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

/**
 * Service xử lý sự kiện "đang gõ" (Typing Indicator - Sprint 4.4).
 *
 * <p>Cơ chế (đồng bộ với pattern Presence ở Sprint 4.1):
 *
 * <ul>
 *   <li>User gõ → {@code SET typing:{convId}:{userId} "1" EX 4} + publish TYPING event tới đối phương
 *   <li>Client gửi ping định kỳ (throttle ~2s) khi vẫn còn gõ → refresh TTL
 *   <li>User dừng gõ / gửi tin → DELETE key + publish STOP event
 *   <li>User đóng tab / mất mạng đột ngột → key tự hết hạn sau 4s → không bị kẹt "đang nhập" vĩnh viễn
 * </ul>
 *
 * <p>Double-safety: ngoài Redis TTL phía server, client cũng tự ẩn indicator sau timeout.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TypingService {

  private static final String TYPING_KEY_PREFIX = "typing:";
  private static final Duration TYPING_TTL = Duration.ofSeconds(4);

  private final UserRepository userRepository;
  private final ConversationRepository conversationRepository;
  private final StringRedisTemplate redisTemplate;
  private final ChatEventPublisher chatRedisPublisher;
  private final ObjectMapper objectMapper;

  /**
   * Xử lý sự kiện typing/stop-typing từ client.
   *
   * @param senderEmail    email người gửi (lấy từ Principal WebSocket)
   * @param conversationId id cuộc hội thoại
   * @param typing         true = đang gõ, false = dừng gõ
   */
  public void handleTyping(String senderEmail, String conversationId, boolean typing) {
    User sender = userRepository
        .findByEmail(senderEmail)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    String senderId = sender.getId();

    Conversation conv = conversationRepository
        .findById(conversationId)
        .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

    // Chỉ participant mới được phát typing event
    if (!conv.getParticipantIds().contains(senderId)) {
      throw new AppException(ErrorCode.NOT_A_PARTICIPANT);
    }

    String key = TYPING_KEY_PREFIX + conversationId + ":" + senderId;

    if (typing) {
      // Set/refresh TTL — Redis tự dọn dẹp khi user ngừng ping
      redisTemplate.opsForValue().set(key, "1", TYPING_TTL);
    } else {
      redisTemplate.delete(key);
    }

    // Phát event tới (các) participant còn lại, không gửi lại cho chính người gõ
    List<String> recipientIds = conv.getParticipantIds().stream()
        .filter(id -> !id.equals(senderId))
        .toList();

    if (recipientIds.isEmpty()) {
      return;
    }

    TypingEvent typingEvent = TypingEvent.builder()
        .conversationId(conversationId)
        .userId(senderId)
        .userName(sender.getName())
        .typing(typing)
        .build();

    try {
      String payload = objectMapper.writeValueAsString(typingEvent);
      ChatPubSubEvent event = ChatPubSubEvent.builder()
          .type("TYPING")
          .participantIds(recipientIds)
          .payloadJson(payload)
          .build();
      chatRedisPublisher.publish(conversationId, event);
    } catch (Exception e) {
      log.error("Lỗi khi serialize TypingEvent", e);
    }
  }
}
