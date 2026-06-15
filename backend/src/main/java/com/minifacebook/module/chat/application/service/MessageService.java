package com.minifacebook.module.chat.application.service;

import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.chat.application.dto.MessageReactionEvent;
import com.minifacebook.module.chat.application.dto.MessageResponse;
import com.minifacebook.module.chat.application.dto.MessageSendRequest;
import com.minifacebook.module.chat.application.dto.MessageStatusEvent;
import com.minifacebook.module.chat.application.dto.MessageUpdateEvent;
import com.minifacebook.module.chat.application.dto.ParticipantResponse;
import com.minifacebook.module.chat.application.port.ChatEventPublisher;
import com.minifacebook.module.chat.domain.entity.Conversation;
import com.minifacebook.module.chat.domain.entity.LastMessageSummary;
import com.minifacebook.module.chat.domain.entity.Message;
import com.minifacebook.module.chat.domain.entity.MessageType;
import com.minifacebook.module.chat.domain.entity.ReplyPreview;
import com.minifacebook.module.chat.domain.repository.ConversationRepository;
import com.minifacebook.module.chat.domain.repository.MessageRepository;
import com.minifacebook.shared.domain.service.MediaService;
import com.minifacebook.shared.exception.AppException;
import com.minifacebook.shared.exception.ErrorCode;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
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

@Service
@RequiredArgsConstructor
public class MessageService {

  private final MessageRepository messageRepository;
  private final ConversationRepository conversationRepository;
  private final UserRepository userRepository;
  private final StringRedisTemplate redisTemplate;
  private final ChatEventPublisher chatRedisPublisher;
  private final MediaService mediaService;

  private static final Set<String> ALLOWED_EMOJIS = Set.of("❤️", "👍", "😂", "😮", "😢", "😡");

  private User getUserByEmail(String email) {
    return userRepository
        .findByEmail(email)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
  }

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

    ReplyPreview replyPreview = null;
    if (request.getReplyToMessageId() != null && !request.getReplyToMessageId().isBlank()) {
      Message replied = messageRepository.findById(request.getReplyToMessageId())
          .orElseThrow(() -> new AppException(ErrorCode.MESSAGE_NOT_FOUND));
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

    String contentPreview = "";
    String rawContent = request.getContent() != null ? request.getContent() : "";
    String sanitized = rawContent.replaceAll("<[^>]*>", "").trim();
    if (request.getType() == MessageType.TEXT) {
      if (sanitized.length() > 100) {
        contentPreview = sanitized.substring(0, 97) + "...";
      } else {
        contentPreview = sanitized;
      }
    } else if (request.getType() == MessageType.IMAGE) {
      contentPreview = sanitized.isBlank() ? "📷 Đã gửi một ảnh" : ("📷 " + sanitized);
    } else if (request.getType() == MessageType.FILE) {
      contentPreview = sanitized.isBlank() ? "📎 Đã gửi một file" : ("📎 " + sanitized);
    }

    LastMessageSummary lastMessageSummary = LastMessageSummary.builder()
        .senderId(senderId)
        .contentPreview(contentPreview)
        .type(request.getType())
        .sentAt(message.getCreatedAt())
        .build();

    conv.setLastMessageSummary(lastMessageSummary);
    conv.setLastMessageAt(message.getCreatedAt());
    conversationRepository.save(conv);

    String recipientId = conv.getParticipantIds().stream()
        .filter(id -> !id.equals(senderId))
        .findFirst()
        .orElse(null);

    if (recipientId != null) {
      String redisKey = "unread:" + conversationId + ":" + recipientId;
      redisTemplate.opsForValue().increment(redisKey);
      redisTemplate.expire(redisKey, 7, TimeUnit.DAYS);
      chatRedisPublisher.publishChatUnread(conversationId, List.of(recipientId));
    }

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
        .editedAt(message.getEditedAt())
        .deleted(message.isDeleted())
        .build();

    chatRedisPublisher.publishNewMessage(conversationId, conv.getParticipantIds(), response);

    return response;
  }

  @Transactional
  public MessageResponse sendImageMessage(String senderEmail, String conversationId, MultipartFile file, String content, String replyToMessageId) {
    String imageUrl = mediaService.uploadAvatar(file);
    MessageSendRequest request = MessageSendRequest.builder()
        .conversationId(conversationId)
        .content(content)
        .type(MessageType.IMAGE)
        .mediaUrl(imageUrl)
        .replyToMessageId(replyToMessageId)
        .build();
    return sendMessage(senderEmail, request);
  }

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

    Map<String, ParticipantResponse> participantMap = userRepository.findAllByIds(conv.getParticipantIds()).stream()
        .map(u -> ParticipantResponse.builder()
            .id(u.getId())
            .name(u.getName())
            .avatar(u.getAvatar())
            .build())
        .collect(Collectors.toMap(ParticipantResponse::getId, Function.identity()));

    List<MessageResponse> responses = messages.getContent().stream()
        .filter(msg -> msg.getDeletedFor() == null || !msg.getDeletedFor().contains(currentUserId))
        .map(msg -> MessageResponse.builder()
            .id(msg.getId())
            .conversationId(msg.getConversationId())
            .sender(participantMap.get(msg.getSenderId()))
            .content(msg.isDeleted() ? null : msg.getContent())
            .type(msg.getType())
            .mediaUrl(msg.isDeleted() ? null : msg.getMediaUrl())
            .deliveredAt(msg.getDeliveredAt())
            .seenAt(msg.getSeenAt())
            .createdAt(msg.getCreatedAt())
            .reactions(msg.getReactions())
            .replyTo(msg.getReplyTo())
            .editedAt(msg.getEditedAt())
            .deleted(msg.isDeleted())
            .build())
        .toList();

    return new PageImpl<>(responses, pageable, messages.getTotalElements());
  }

  @Transactional
  public void markAsDelivered(String messageId, String email) {
    User currentUser = getUserByEmail(email);
    String currentUserId = currentUser.getId();

    Message message = messageRepository.findById(messageId)
        .orElseThrow(() -> new AppException(ErrorCode.MESSAGE_NOT_FOUND));

    Conversation conv = conversationRepository.findById(message.getConversationId())
        .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

    if (!conv.getParticipantIds().contains(currentUserId) || message.getSenderId().equals(currentUserId)) {
      return;
    }

    if (message.getDeliveredAt() == null) {
      Instant now = Instant.now();
      message.setDeliveredAt(now);
      messageRepository.save(message);

      MessageStatusEvent statusEvent = MessageStatusEvent.builder()
          .conversationId(message.getConversationId())
          .messageId(message.getId())
          .status("DELIVERED")
          .timestamp(now)
          .userId(currentUserId)
          .build();

      chatRedisPublisher.publishStatus(
          message.getConversationId(),
          "DELIVERED",
          List.of(message.getSenderId()),
          statusEvent
      );
    }
  }

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

    if (emoji.equals(reactions.get(userId))) {
      reactions.remove(userId);
    } else {
      reactions.put(userId, emoji);
    }

    message.setReactions(reactions);
    messageRepository.save(message);

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

  private static final Duration EDIT_DELETE_WINDOW = Duration.ofMinutes(15);

  @Transactional
  public void editMessage(String email, String messageId, String newContent) {
    User user = getUserByEmail(email);
    Message message = messageRepository.findById(messageId)
        .orElseThrow(() -> new AppException(ErrorCode.MESSAGE_NOT_FOUND));

    if (!message.getSenderId().equals(user.getId())) {
      throw new AppException(ErrorCode.NOT_MESSAGE_OWNER);
    }
    if (message.getType() != MessageType.TEXT) {
      throw new AppException(ErrorCode.CANNOT_EDIT_NON_TEXT);
    }
    if (message.isDeleted()) {
      throw new AppException(ErrorCode.MESSAGE_NOT_FOUND);
    }
    if (Duration.between(message.getCreatedAt(), Instant.now()).compareTo(EDIT_DELETE_WINDOW) > 0) {
      throw new AppException(ErrorCode.EDIT_TIME_EXPIRED);
    }

    String sanitized = newContent != null ? newContent.replaceAll("<[^>]*>", "") : "";
    Instant now = Instant.now();
    message.setContent(sanitized);
    message.setEditedAt(now);
    messageRepository.save(message);

    Conversation conv = conversationRepository.findById(message.getConversationId())
        .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

    MessageUpdateEvent event = MessageUpdateEvent.builder()
        .conversationId(message.getConversationId())
        .messageId(message.getId())
        .content(sanitized)
        .editedAt(now)
        .deleted(false)
        .build();
    chatRedisPublisher.publishUpdate(message.getConversationId(), conv.getParticipantIds(), event);
  }

  @Transactional
  public void deleteMessage(String email, String messageId, String scope) {
    User user = getUserByEmail(email);
    String userId = user.getId();

    Message message = messageRepository.findById(messageId)
        .orElseThrow(() -> new AppException(ErrorCode.MESSAGE_NOT_FOUND));

    Conversation conv = conversationRepository.findById(message.getConversationId())
        .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

    if (!conv.getParticipantIds().contains(userId)) {
      throw new AppException(ErrorCode.NOT_A_PARTICIPANT);
    }

    if ("everyone".equalsIgnoreCase(scope)) {
      if (!message.getSenderId().equals(userId)) {
        throw new AppException(ErrorCode.NOT_MESSAGE_OWNER);
      }
      if (Duration.between(message.getCreatedAt(), Instant.now()).compareTo(EDIT_DELETE_WINDOW) > 0) {
        throw new AppException(ErrorCode.DELETE_TIME_EXPIRED);
      }
      message.setDeleted(true);
      message.setContent(null);
      message.setMediaUrl(null);
      messageRepository.save(message);

      MessageUpdateEvent event = MessageUpdateEvent.builder()
          .conversationId(message.getConversationId())
          .messageId(message.getId())
          .content(null)
          .editedAt(null)
          .deleted(true)
          .build();
      chatRedisPublisher.publishUpdate(message.getConversationId(), conv.getParticipantIds(), event);
    } else {
      Set<String> deletedFor = message.getDeletedFor();
      if (deletedFor == null) {
        deletedFor = new HashSet<>();
      }
      deletedFor.add(userId);
      message.setDeletedFor(deletedFor);
      messageRepository.save(message);
    }
  }

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
