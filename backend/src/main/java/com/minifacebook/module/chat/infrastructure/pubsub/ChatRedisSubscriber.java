package com.minifacebook.module.chat.infrastructure.pubsub;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.chat.application.dto.ChatPubSubEvent;
import com.minifacebook.module.chat.application.dto.MessageReactionEvent;
import com.minifacebook.module.chat.application.dto.MessageResponse;
import com.minifacebook.module.chat.application.dto.MessageStatusEvent;
import com.minifacebook.module.chat.application.dto.MessageUpdateEvent;
import com.minifacebook.module.chat.application.dto.TypingEvent;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * Subscriber nhận sự kiện chat từ Redis Pub/Sub và đẩy về client qua WebSocket (Sprint 4.3).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ChatRedisSubscriber implements MessageListener {

  private final SimpMessagingTemplate messagingTemplate;
  private final ObjectMapper objectMapper;
  private final UserRepository userRepository;

  @Override
  public void onMessage(Message message, byte[] pattern) {
    try {
      String body = new String(message.getBody(), StandardCharsets.UTF_8);
      ChatPubSubEvent event = objectMapper.readValue(body, ChatPubSubEvent.class);
      log.debug("Received chat event via Redis Pub/Sub: [{}]", event.getType());

      if ("NEW_MESSAGE".equals(event.getType())) {
        MessageResponse response = objectMapper.readValue(event.getPayloadJson(), MessageResponse.class);
        Map<String, Object> wsPayload = Map.of("type", "NEW_MESSAGE", "data", response);

        for (String participantId : event.getParticipantIds()) {
          userRepository.findById(participantId).ifPresent(user -> {
            messagingTemplate.convertAndSendToUser(
                user.getEmail(),
                "/queue/messages",
                wsPayload
            );
          });
        }
      } else if ("DELIVERED".equals(event.getType()) || "SEEN".equals(event.getType())) {
        MessageStatusEvent statusEvent = objectMapper.readValue(event.getPayloadJson(), MessageStatusEvent.class);
        for (String participantId : event.getParticipantIds()) {
          userRepository.findById(participantId).ifPresent(user -> {
            messagingTemplate.convertAndSendToUser(
                user.getEmail(),
                "/queue/status",
                statusEvent
            );
          });
        }
      } else if ("TYPING".equals(event.getType())) {
        TypingEvent typingEvent = objectMapper.readValue(event.getPayloadJson(), TypingEvent.class);
        for (String participantId : event.getParticipantIds()) {
          userRepository.findById(participantId).ifPresent(user -> {
            messagingTemplate.convertAndSendToUser(
                user.getEmail(),
                "/queue/typing",
                typingEvent
            );
          });
        }
      } else if ("REACTION".equals(event.getType())) {
        MessageReactionEvent reactionEvent = objectMapper.readValue(event.getPayloadJson(), MessageReactionEvent.class);
        for (String participantId : event.getParticipantIds()) {
          userRepository.findById(participantId).ifPresent(user -> {
            messagingTemplate.convertAndSendToUser(
                user.getEmail(),
                "/queue/reactions",
                reactionEvent
            );
          });
        }
      } else if ("UPDATE".equals(event.getType())) {
        MessageUpdateEvent updateEvent = objectMapper.readValue(event.getPayloadJson(), MessageUpdateEvent.class);
        for (String participantId : event.getParticipantIds()) {
          userRepository.findById(participantId).ifPresent(user -> {
            messagingTemplate.convertAndSendToUser(
                user.getEmail(),
                "/queue/updates",
                updateEvent
            );
          });
        }
      } else if ("CHAT_UNREAD".equals(event.getType())) {
        // Tín hiệu thay đổi tổng unread → client tự gọi lại API lấy số chính xác.
        Map<String, Object> payload = Map.of("conversationId", event.getPayloadJson());
        for (String participantId : event.getParticipantIds()) {
          userRepository.findById(participantId).ifPresent(user -> {
            messagingTemplate.convertAndSendToUser(
                user.getEmail(),
                "/queue/chat-unread",
                payload
            );
          });
        }
      }
    } catch (Exception e) {
      log.error("Lỗi khi xử lý message từ Redis Pub/Sub", e);
    }
  }
}
