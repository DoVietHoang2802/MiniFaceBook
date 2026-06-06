package com.minifacebook.module.chat.application.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.chat.application.dto.ConversationCreateRequest;
import com.minifacebook.module.chat.application.dto.ConversationResponse;
import com.minifacebook.module.chat.domain.entity.Conversation;
import com.minifacebook.module.chat.domain.repository.ConversationRepository;
import com.minifacebook.module.chat.domain.repository.MessageRepository;
import com.minifacebook.module.friendship.domain.entity.Friendship;
import com.minifacebook.module.friendship.domain.entity.FriendshipStatus;
import com.minifacebook.module.friendship.domain.repository.FriendshipRepository;
import com.minifacebook.shared.exception.AppException;
import com.minifacebook.shared.exception.ErrorCode;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import com.minifacebook.module.chat.infrastructure.pubsub.ChatRedisPublisher;

/**
 * Unit Test cho ConversationService (Sprint 4.2 & 4.3).
 */
@ExtendWith(MockitoExtension.class)
public class ConversationServiceTest {

  @Mock private ConversationRepository conversationRepository;
  @Mock private MessageRepository messageRepository;
  @Mock private UserRepository userRepository;
  @Mock private FriendshipRepository friendshipRepository;
  @Mock private StringRedisTemplate redisTemplate;
  @Mock private ValueOperations<String, String> valueOperations;
  @Mock private ChatRedisPublisher chatRedisPublisher;

  @InjectMocks private ConversationService conversationService;

  private User me;
  private User friend;

  @BeforeEach
  void setUp() {
    me = User.builder().id("1").email("me@test.com").name("Me").avatar("avatar1").build();
    friend = User.builder().id("2").email("friend@test.com").name("Friend").avatar("avatar2").build();
  }

  @Test
  void getOrCreateConversation_ShouldReturnConversation_WhenFriendshipAccepted() {
    ConversationCreateRequest req = new ConversationCreateRequest(friend.getId());

    when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));
    when(userRepository.findById(friend.getId())).thenReturn(Optional.of(friend));
    
    Friendship friendship = Friendship.builder()
        .requesterId(me.getId())
        .addresseeId(friend.getId())
        .status(FriendshipStatus.ACCEPTED)
        .build();
    when(friendshipRepository.findBetweenUsers(me.getId(), friend.getId())).thenReturn(Optional.of(friendship));

    List<String> sortedIds = List.of(me.getId(), friend.getId());
    Conversation conversation = Conversation.builder()
        .id("conv1")
        .participantIds(sortedIds)
        .build();

    when(conversationRepository.findByParticipantIds(sortedIds)).thenReturn(Optional.of(conversation));

    ConversationResponse res = conversationService.getOrCreateConversation(me.getEmail(), req);

    assertNotNull(res);
    assertEquals("conv1", res.getId());
    assertEquals(2, res.getParticipants().size());
  }

  @Test
  void getOrCreateConversation_ShouldThrowException_WhenChatSelf() {
    ConversationCreateRequest req = new ConversationCreateRequest(me.getId());

    when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));

    AppException ex = assertThrows(AppException.class, () -> 
        conversationService.getOrCreateConversation(me.getEmail(), req));

    assertEquals(ErrorCode.CANNOT_CHAT_SELF, ex.getErrorCode());
  }

  @Test
  void getOrCreateConversation_ShouldThrowException_WhenNotFriends() {
    ConversationCreateRequest req = new ConversationCreateRequest(friend.getId());

    when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));
    when(userRepository.findById(friend.getId())).thenReturn(Optional.of(friend));
    
    when(friendshipRepository.findBetweenUsers(me.getId(), friend.getId())).thenReturn(Optional.empty());

    AppException ex = assertThrows(AppException.class, () -> 
        conversationService.getOrCreateConversation(me.getEmail(), req));

    assertEquals(ErrorCode.NOT_FRIENDS, ex.getErrorCode());
  }
}
