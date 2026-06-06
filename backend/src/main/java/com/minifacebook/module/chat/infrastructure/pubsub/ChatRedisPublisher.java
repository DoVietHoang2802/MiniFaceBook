package com.minifacebook.module.chat.infrastructure.pubsub;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.minifacebook.module.chat.application.dto.ChatPubSubEvent;
import com.minifacebook.module.chat.application.dto.MessageReactionEvent;
import com.minifacebook.module.chat.application.dto.MessageResponse;
import com.minifacebook.module.chat.application.dto.MessageStatusEvent;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

/**
 * Publisher gửi các sự kiện Chat vào Redis Pub/Sub (Sprint 4.3).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ChatRedisPublisher {

  private final StringRedisTemplate redisTemplate;
  private final ObjectMapper objectMapper;

  /**
   * Publish sự kiện dạng raw ChatPubSubEvent.
   */
  public void publish(String conversationId, ChatPubSubEvent event) {
    try {
      String json = objectMapper.writeValueAsString(event);
      String topic = "chat.room." + conversationId;
      redisTemplate.convertAndSend(topic, json);
      log.debug("Published event [{}] to topic [{}]", event.getType(), topic);
    } catch (Exception e) {
      log.error("Lỗi khi publish chat event lên Redis", e);
    }
  }

  /**
   * Publish sự kiện tin nhắn mới.
   */
  public void publishNewMessage(String conversationId, List<String> participantIds, MessageResponse response) {
    try {
      String payload = objectMapper.writeValueAsString(response);
      ChatPubSubEvent event = ChatPubSubEvent.builder()
          .type("NEW_MESSAGE")
          .participantIds(participantIds)
          .payloadJson(payload)
          .build();
      publish(conversationId, event);
    } catch (Exception e) {
      log.error("Lỗi khi serialize MessageResponse", e);
    }
  }

  /**
   * Publish sự kiện thay đổi trạng thái (DELIVERED hoặc SEEN).
   */
  public void publishStatus(String conversationId, String statusType, List<String> participantIds, MessageStatusEvent statusEvent) {
    try {
      String payload = objectMapper.writeValueAsString(statusEvent);
      ChatPubSubEvent event = ChatPubSubEvent.builder()
          .type(statusType) // "DELIVERED" | "SEEN"
          .participantIds(participantIds)
          .payloadJson(payload)
          .build();
      publish(conversationId, event);
    } catch (Exception e) {
      log.error("Lỗi khi serialize MessageStatusEvent", e);
    }
  }

  /**
   * Publish sự kiện cập nhật reaction của tin nhắn (Sprint 4.4).
   */
  public void publishReaction(String conversationId, List<String> participantIds, MessageReactionEvent reactionEvent) {
    try {
      String payload = objectMapper.writeValueAsString(reactionEvent);
      ChatPubSubEvent event = ChatPubSubEvent.builder()
          .type("REACTION")
          .participantIds(participantIds)
          .payloadJson(payload)
          .build();
      publish(conversationId, event);
    } catch (Exception e) {
      log.error("Lỗi khi serialize MessageReactionEvent", e);
    }
  }
}
