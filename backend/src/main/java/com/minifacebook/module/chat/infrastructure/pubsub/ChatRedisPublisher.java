package com.minifacebook.module.chat.infrastructure.pubsub;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.minifacebook.module.chat.application.dto.ChatPubSubEvent;
import com.minifacebook.module.chat.application.dto.MessageReactionEvent;
import com.minifacebook.module.chat.application.dto.MessageResponse;
import com.minifacebook.module.chat.application.dto.MessageStatusEvent;
import com.minifacebook.module.chat.application.dto.MessageUpdateEvent;
import com.minifacebook.module.chat.application.port.ChatEventPublisher;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

/**
 * Publisher gửi các sự kiện Chat vào Redis Pub/Sub (Sprint 4.3).
 *
 * <p>Adapter hiện thực hóa port {@link ChatEventPublisher} của tầng application.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ChatRedisPublisher implements ChatEventPublisher {

  private final StringRedisTemplate redisTemplate;
  private final ObjectMapper objectMapper;

  /**
   * Publish sự kiện dạng raw ChatPubSubEvent.
   */
  @Override
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
  @Override
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
  @Override
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
  @Override
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

  /**
   * Publish sự kiện cập nhật tin nhắn (sửa / thu hồi) (Sprint 4.5).
   */
  @Override
  public void publishUpdate(String conversationId, List<String> participantIds, MessageUpdateEvent updateEvent) {
    try {
      String payload = objectMapper.writeValueAsString(updateEvent);
      ChatPubSubEvent event = ChatPubSubEvent.builder()
          .type("UPDATE")
          .participantIds(participantIds)
          .payloadJson(payload)
          .build();
      publish(conversationId, event);
    } catch (Exception e) {
      log.error("Lỗi khi serialize MessageUpdateEvent", e);
    }
  }

  /**
   * Báo hiệu thay đổi tổng unread tới các user (chấm đỏ nút Chats sidebar). Payload nhẹ: chỉ kèm
   * conversationId; client chỉ dùng làm tín hiệu để gọi lại API tổng unread.
   */
  @Override
  public void publishChatUnread(String conversationId, List<String> userIds) {
    ChatPubSubEvent event = ChatPubSubEvent.builder()
        .type("CHAT_UNREAD")
        .participantIds(userIds)
        .payloadJson(conversationId)
        .build();
    publish(conversationId, event);
  }
}
