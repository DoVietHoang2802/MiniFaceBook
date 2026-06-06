package com.minifacebook.module.chat.application.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Event chuyển phát qua Redis Pub/Sub giữa các instance server (Sprint 4.3).
 *
 * <p>Cơ chế: Khi một tin nhắn mới được gửi hoặc có cập nhật trạng thái (delivered/seen),
 * instance nhận request sẽ gửi event này vào kênh Redis Pub/Sub tương ứng.
 * Tất cả instance server đăng ký kênh đó sẽ nhận và phân phối về client qua WebSocket.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatPubSubEvent {

  private String type; // "NEW_MESSAGE" | "DELIVERED" | "SEEN"
  private List<String> participantIds;
  private String payloadJson; // Serialized string của object thực tế (MessageResponse hoặc MessageStatusEvent)
}
