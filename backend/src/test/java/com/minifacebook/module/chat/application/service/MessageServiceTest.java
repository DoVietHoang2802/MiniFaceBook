package com.minifacebook.module.chat.application.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.chat.application.dto.MessageResponse;
import com.minifacebook.module.chat.domain.entity.Conversation;
import com.minifacebook.module.chat.domain.entity.Message;
import com.minifacebook.module.chat.domain.entity.MessageType;
import com.minifacebook.module.chat.domain.repository.ConversationRepository;
import com.minifacebook.module.chat.domain.repository.MessageRepository;
import com.minifacebook.module.chat.infrastructure.pubsub.ChatRedisPublisher;
import com.minifacebook.shared.exception.AppException;
import com.minifacebook.shared.exception.ErrorCode;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
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
 * Unit Test cho MessageService (Sprint 4.2 & 4.3).
 */
@ExtendWith(MockitoExtension.class)
public class MessageServiceTest {

  @Mock private MessageRepository messageRepository;
  @Mock private ConversationRepository conversationRepository;
  @Mock private UserRepository userRepository;
  @Mock private StringRedisTemplate redisTemplate;
  @Mock private ChatRedisPublisher chatRedisPublisher;

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

    AppException ex = assertThrows(AppException.class, () -> 
        messageService.getMessages(otherConv.getId(), me.getEmail(), pageable));

    assertEquals(ErrorCode.NOT_A_PARTICIPANT, ex.getErrorCode());
  }

  @Test
  void sendMessage_ShouldSaveMessageAndPublishEvent_WhenValid() {
    com.minifacebook.module.chat.application.dto.MessageSendRequest req = 
        com.minifacebook.module.chat.application.dto.MessageSendRequest.builder()
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
    verify(chatRedisPublisher).publishStatus(
        any(String.class),
        any(String.class),
        any(),
        any()
    );
  }
}
