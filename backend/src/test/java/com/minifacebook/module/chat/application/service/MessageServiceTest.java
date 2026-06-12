package com.minifacebook.module.chat.application.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.chat.application.dto.MessageResponse;
import com.minifacebook.module.chat.application.dto.MessageSendRequest;
import com.minifacebook.module.chat.application.port.ChatEventPublisher;
import com.minifacebook.module.chat.domain.entity.Conversation;
import com.minifacebook.module.chat.domain.entity.Message;
import com.minifacebook.module.chat.domain.entity.MessageType;
import com.minifacebook.module.chat.domain.repository.ConversationRepository;
import com.minifacebook.module.chat.domain.repository.MessageRepository;
import com.minifacebook.shared.domain.service.MediaService;
import com.minifacebook.shared.exception.AppException;
import com.minifacebook.shared.exception.ErrorCode;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

/**
 * Unit Test cho MessageService (Sprint 4.2 -> 4.5).
 */
@ExtendWith(MockitoExtension.class)
public class MessageServiceTest {

  @Mock private MessageRepository messageRepository;
  @Mock private ConversationRepository conversationRepository;
  @Mock private UserRepository userRepository;
  @Mock private StringRedisTemplate redisTemplate;
  @Mock private ChatEventPublisher chatRedisPublisher;
  @Mock private MediaService mediaService;

  @InjectMocks private MessageService messageService;

  private User me;
  private User friend;
  private Conversation conv;

  @BeforeEach
  void setUp() {
    me = User.builder().id("1").email("me@test.com").name("Me").avatar("avatar1").build();
    friend = User.builder().id("2").email("friend@test.com").name("Friend").avatar("avatar2").build();
    conv = Conversation.builder()
        .id("conv1")
        .participantIds(List.of(me.getId(), friend.getId()))
        .build();
  }

  @Test
  void getMessages_ShouldReturnMessages_WhenUserIsParticipant() {
    Pageable pageable = PageRequest.of(0, 10);
    Message msg = Message.builder()
        .id("msg1")
        .conversationId(conv.getId())
        .senderId(friend.getId())
        .content("Hello")
        .type(MessageType.TEXT)
        .createdAt(Instant.now())
        .build();

    when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));
    when(conversationRepository.findById(conv.getId())).thenReturn(Optional.of(conv));
    when(messageRepository.findByConversationId(conv.getId(), pageable))
        .thenReturn(new PageImpl<>(List.of(msg)));
    when(userRepository.findAllByIds(conv.getParticipantIds())).thenReturn(List.of(me, friend));

    Page<MessageResponse> result = messageService.getMessages(conv.getId(), me.getEmail(), pageable);

    assertNotNull(result);
    assertEquals(1, result.getTotalElements());
    assertEquals("Hello", result.getContent().get(0).getContent());
  }

  @Test
  void getMessages_ShouldThrowException_WhenUserIsNotParticipant() {
    Pageable pageable = PageRequest.of(0, 10);
    Conversation otherConv = Conversation.builder()
        .id("conv2")
        .participantIds(List.of(friend.getId(), "3"))
        .build();

    when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));
    when(conversationRepository.findById(otherConv.getId())).thenReturn(Optional.of(otherConv));

    AppException ex = assertThrows(AppException.class,
        () -> messageService.getMessages(otherConv.getId(), me.getEmail(), pageable));

    assertEquals(ErrorCode.NOT_A_PARTICIPANT, ex.getErrorCode());
  }

  @Test
  void getMessages_ShouldFilterMessagesDeletedForCurrentUser() {
    Pageable pageable = PageRequest.of(0, 10);
    Message visible = Message.builder()
        .id("msg-visible")
        .conversationId(conv.getId())
        .senderId(friend.getId())
        .content("Visible")
        .type(MessageType.TEXT)
        .createdAt(Instant.now())
        .build();
    Message hidden = Message.builder()
        .id("msg-hidden")
        .conversationId(conv.getId())
        .senderId(friend.getId())
        .content("Hidden")
        .type(MessageType.TEXT)
        .createdAt(Instant.now())
        .deletedFor(new HashSet<>(Set.of(me.getId())))
        .build();

    when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));
    when(conversationRepository.findById(conv.getId())).thenReturn(Optional.of(conv));
    when(messageRepository.findByConversationId(conv.getId(), pageable))
        .thenReturn(new PageImpl<>(List.of(visible, hidden)));
    when(userRepository.findAllByIds(conv.getParticipantIds())).thenReturn(List.of(me, friend));

    Page<MessageResponse> result = messageService.getMessages(conv.getId(), me.getEmail(), pageable);

    assertEquals(1, result.getContent().size());
    assertEquals("msg-visible", result.getContent().get(0).getId());
  }

  @Test
  void sendMessage_ShouldSaveMessageAndPublishEvent_WhenValid() {
    MessageSendRequest req = MessageSendRequest.builder()
        .conversationId(conv.getId())
        .content("Hello friend")
        .type(MessageType.TEXT)
        .build();

    when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));
    when(conversationRepository.findById(conv.getId())).thenReturn(Optional.of(conv));

    Message savedMessage = Message.builder()
        .id("msg2")
        .conversationId(conv.getId())
        .senderId(me.getId())
        .content("Hello friend")
        .type(MessageType.TEXT)
        .createdAt(Instant.now())
        .build();
    when(messageRepository.save(any(Message.class))).thenReturn(savedMessage);
    when(userRepository.findAllByIds(conv.getParticipantIds())).thenReturn(List.of(me, friend));

    ValueOperations<String, String> ops = org.mockito.Mockito.mock(ValueOperations.class);
    when(redisTemplate.opsForValue()).thenReturn(ops);

    MessageResponse res = messageService.sendMessage(me.getEmail(), req);

    assertNotNull(res);
    assertEquals("msg2", res.getId());
    verify(messageRepository).save(any(Message.class));
    verify(conversationRepository).save(any(Conversation.class));
    verify(chatRedisPublisher).publishNewMessage(any(String.class), any(), any());
  }

  @Test
  void markAsDelivered_ShouldUpdateStatusAndEmitEvent_WhenValid() {
    Message msg = Message.builder()
        .id("msg1")
        .conversationId(conv.getId())
        .senderId(friend.getId())
        .content("Hello")
        .type(MessageType.TEXT)
        .build();

    when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));
    when(messageRepository.findById(msg.getId())).thenReturn(Optional.of(msg));
    when(conversationRepository.findById(conv.getId())).thenReturn(Optional.of(conv));
    when(messageRepository.save(any(Message.class))).thenReturn(msg);

    messageService.markAsDelivered(msg.getId(), me.getEmail());

    assertNotNull(msg.getDeliveredAt());
    verify(messageRepository).save(msg);
    verify(chatRedisPublisher).publishStatus(any(String.class), any(String.class), any(), any());
  }

  @Test
  void editMessage_ShouldUpdateContent_WhenOwnerAndWithin15Minutes() {
    Message message = Message.builder()
        .id("msg-edit")
        .conversationId(conv.getId())
        .senderId(me.getId())
        .content("Old")
        .type(MessageType.TEXT)
        .createdAt(Instant.now().minusSeconds(60))
        .build();

    when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));
    when(messageRepository.findById(message.getId())).thenReturn(Optional.of(message));
    when(messageRepository.save(any(Message.class))).thenReturn(message);
    when(conversationRepository.findById(conv.getId())).thenReturn(Optional.of(conv));

    messageService.editMessage(me.getEmail(), message.getId(), "<b>New</b>");

    assertEquals("New", message.getContent());
    assertNotNull(message.getEditedAt());
    verify(messageRepository).save(message);
    verify(chatRedisPublisher).publishUpdate(any(String.class), any(), any());
  }

  @Test
  void editMessage_ShouldThrow_WhenNotOwner() {
    Message message = Message.builder()
        .id("msg-edit")
        .conversationId(conv.getId())
        .senderId(friend.getId())
        .content("Old")
        .type(MessageType.TEXT)
        .createdAt(Instant.now())
        .build();

    when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));
    when(messageRepository.findById(message.getId())).thenReturn(Optional.of(message));

    AppException ex = assertThrows(AppException.class,
        () -> messageService.editMessage(me.getEmail(), message.getId(), "New"));

    assertEquals(ErrorCode.NOT_MESSAGE_OWNER, ex.getErrorCode());
  }

  @Test
  void editMessage_ShouldThrow_WhenMessageTypeIsNotText() {
    Message message = Message.builder()
        .id("msg-edit")
        .conversationId(conv.getId())
        .senderId(me.getId())
        .type(MessageType.IMAGE)
        .createdAt(Instant.now())
        .build();

    when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));
    when(messageRepository.findById(message.getId())).thenReturn(Optional.of(message));

    AppException ex = assertThrows(AppException.class,
        () -> messageService.editMessage(me.getEmail(), message.getId(), "New"));

    assertEquals(ErrorCode.CANNOT_EDIT_NON_TEXT, ex.getErrorCode());
  }

  @Test
  void editMessage_ShouldThrow_WhenExpired() {
    Message message = Message.builder()
        .id("msg-edit")
        .conversationId(conv.getId())
        .senderId(me.getId())
        .content("Old")
        .type(MessageType.TEXT)
        .createdAt(Instant.now().minusSeconds(16 * 60L))
        .build();

    when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));
    when(messageRepository.findById(message.getId())).thenReturn(Optional.of(message));

    AppException ex = assertThrows(AppException.class,
        () -> messageService.editMessage(me.getEmail(), message.getId(), "New"));

    assertEquals(ErrorCode.EDIT_TIME_EXPIRED, ex.getErrorCode());
  }

  @Test
  void deleteMessage_ShouldAddUserToDeletedFor_WhenScopeMe() {
    Message message = Message.builder()
        .id("msg-del")
        .conversationId(conv.getId())
        .senderId(friend.getId())
        .content("Hello")
        .type(MessageType.TEXT)
        .createdAt(Instant.now())
        .build();

    when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));
    when(messageRepository.findById(message.getId())).thenReturn(Optional.of(message));
    when(conversationRepository.findById(conv.getId())).thenReturn(Optional.of(conv));
    when(messageRepository.save(any(Message.class))).thenReturn(message);

    messageService.deleteMessage(me.getEmail(), message.getId(), "me");

    assertNotNull(message.getDeletedFor());
    assertTrue(message.getDeletedFor().contains(me.getId()));
    verify(messageRepository).save(message);
  }

  @Test
  void deleteMessage_ShouldSoftDeleteForEveryone_WhenOwnerAndWithin15Minutes() {
    Message message = Message.builder()
        .id("msg-del")
        .conversationId(conv.getId())
        .senderId(me.getId())
        .content("Hello")
        .mediaUrl("image.jpg")
        .type(MessageType.TEXT)
        .createdAt(Instant.now().minusSeconds(120))
        .build();

    when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));
    when(messageRepository.findById(message.getId())).thenReturn(Optional.of(message));
    when(conversationRepository.findById(conv.getId())).thenReturn(Optional.of(conv));
    when(messageRepository.save(any(Message.class))).thenReturn(message);

    messageService.deleteMessage(me.getEmail(), message.getId(), "everyone");

    assertTrue(message.isDeleted());
    assertEquals(null, message.getContent());
    assertEquals(null, message.getMediaUrl());
    verify(messageRepository).save(message);
    verify(chatRedisPublisher).publishUpdate(any(String.class), any(), any());
  }

  @Test
  void deleteMessage_ShouldThrow_WhenDeleteEveryoneByNonOwner() {
    Message message = Message.builder()
        .id("msg-del")
        .conversationId(conv.getId())
        .senderId(friend.getId())
        .content("Hello")
        .type(MessageType.TEXT)
        .createdAt(Instant.now())
        .build();

    when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));
    when(messageRepository.findById(message.getId())).thenReturn(Optional.of(message));
    when(conversationRepository.findById(conv.getId())).thenReturn(Optional.of(conv));

    AppException ex = assertThrows(AppException.class,
        () -> messageService.deleteMessage(me.getEmail(), message.getId(), "everyone"));

    assertEquals(ErrorCode.NOT_MESSAGE_OWNER, ex.getErrorCode());
  }

  @Test
  void deleteMessage_ShouldThrow_WhenDeleteEveryoneExpired() {
    Message message = Message.builder()
        .id("msg-del")
        .conversationId(conv.getId())
        .senderId(me.getId())
        .content("Hello")
        .type(MessageType.TEXT)
        .createdAt(Instant.now().minusSeconds(16 * 60L))
        .build();

    when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));
    when(messageRepository.findById(message.getId())).thenReturn(Optional.of(message));
    when(conversationRepository.findById(conv.getId())).thenReturn(Optional.of(conv));

    AppException ex = assertThrows(AppException.class,
        () -> messageService.deleteMessage(me.getEmail(), message.getId(), "everyone"));

    assertEquals(ErrorCode.DELETE_TIME_EXPIRED, ex.getErrorCode());
  }
}
