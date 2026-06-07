package com.minifacebook.module.chat.application.port;

import com.minifacebook.module.chat.application.dto.ChatPubSubEvent;
import com.minifacebook.module.chat.application.dto.MessageReactionEvent;
import com.minifacebook.module.chat.application.dto.MessageResponse;
import com.minifacebook.module.chat.application.dto.MessageStatusEvent;
import com.minifacebook.module.chat.application.dto.MessageUpdateEvent;
import java.util.List;

/**
 * Cổng (Port) phát sự kiện chat realtime — định nghĩa ở tầng application để các service phụ thuộc
 * vào trừu tượng, không phụ thuộc trực tiếp vào hiện thực hạ tầng (Redis Pub/Sub).
 *
 * <p><b>Vì sao:</b> tuân thủ Dependency Inversion của Clean Architecture — tầng Application chỉ
 * biết "phát sự kiện", không biết phát qua Redis hay cơ chế nào. Adapter {@code ChatRedisPublisher}
 * ở tầng infrastructure hiện thực hóa port này.
 */
public interface ChatEventPublisher {

  void publish(String conversationId, ChatPubSubEvent event);

  void publishNewMessage(String conversationId, List<String> participantIds, MessageResponse response);

  void publishStatus(
      String conversationId, String statusType, List<String> participantIds, MessageStatusEvent statusEvent);

  void publishReaction(
      String conversationId, List<String> participantIds, MessageReactionEvent reactionEvent);

  void publishUpdate(
      String conversationId, List<String> participantIds, MessageUpdateEvent updateEvent);

  /**
   * Báo hiệu thay đổi tổng tin chưa đọc (cho chấm đỏ badge nút Chats ở sidebar). Chỉ là tín hiệu;
   * client nhận sẽ gọi lại API tổng unread để lấy số chính xác.
   */
  void publishChatUnread(String conversationId, List<String> userIds);
}
