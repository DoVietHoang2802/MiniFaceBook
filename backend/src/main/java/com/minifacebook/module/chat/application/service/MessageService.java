package com.minifacebook.module.chat.application.service;

import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.chat.application.dto.MessageResponse;
import com.minifacebook.module.chat.application.dto.MessageStatusEvent;
import com.minifacebook.module.chat.application.dto.ParticipantResponse;
import com.minifacebook.module.chat.domain.entity.Conversation;
import com.minifacebook.module.chat.domain.entity.Message;
import com.minifacebook.module.chat.domain.repository.ConversationRepository;
import com.minifacebook.module.chat.domain.repository.MessageRepository;
import com.minifacebook.shared.exception.AppException;
import com.minifacebook.shared.exception.ErrorCode;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service xử lý nghiệp vụ quản lý tin nhắn (Sprint 4.2).
 */
@Service
@RequiredArgsConstructor
public class MessageService {

  private final MessageRepository messageRepository;
  private final ConversationRepository conversationRepository;
  private final UserRepository userRepository;
  private final SimpMessagingTemplate messagingTemplate;

  private User getUserByEmail(String email) {
    return userRepository
        .findByEmail(email)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
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

      messagingTemplate.convertAndSendToUser(
          message.getSenderId(),
          "/queue/status",
          statusEvent
      );
    }
  }
}
