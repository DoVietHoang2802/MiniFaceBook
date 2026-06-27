package com.minifacebook.module.friendship.application.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.friendship.application.dto.FriendshipResponse;
import com.minifacebook.module.friendship.domain.entity.Friendship;
import com.minifacebook.module.friendship.domain.entity.FriendshipStatus;
import com.minifacebook.module.friendship.domain.repository.FriendshipRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@SuppressWarnings("unchecked")
@ExtendWith(MockitoExtension.class)
public class FriendshipServiceTest {

    @Mock private FriendshipRepository friendshipRepository;
    @Mock private UserRepository userRepository;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ObjectMapper objectMapper;
    @Mock private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private FriendshipService friendshipService;

    private final String email = "user@test.com";
    private final String cacheKey = "user:friends:email:" + email;

    @BeforeEach
    void setUp() {
        // Since many tests use opsForValue, leniency or stubbing where needed is fine
    }

    @Test
    void getFriends_CacheHit() throws Exception {
        // Arrange
        String cachedJson = "[{\"friendshipId\":\"f123\"}]";
        List<FriendshipResponse> expectedResponse = List.of(
            FriendshipResponse.builder().friendshipId("f123").email("friend@test.com").build()
        );

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(cacheKey)).thenReturn(cachedJson);
        when(objectMapper.readValue(eq(cachedJson), any(TypeReference.class))).thenReturn(expectedResponse);

        // Act
        List<FriendshipResponse> actualResponse = friendshipService.getFriends(email);

        // Assert
        assertNotNull(actualResponse);
        assertEquals(1, actualResponse.size());
        assertEquals("f123", actualResponse.getFirst().getFriendshipId());

        verify(friendshipRepository, never()).findAcceptedByUserId(anyString());
        verify(userRepository, never()).findByEmail(anyString());
    }

    @Test
    void getFriends_CacheMiss() throws Exception {
        // Arrange
        String userId = "user123";
        String friendId = "friend123";
        User me = User.builder().id(userId).email(email).build();
        User friend = User.builder().id(friendId).email("friend@test.com").name("Friend Name").build();
        Friendship friendship = Friendship.builder().id("f123").requesterId(userId).addresseeId(friendId).status(FriendshipStatus.ACCEPTED).build();

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(cacheKey)).thenReturn(null);
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(me));
        when(friendshipRepository.findAcceptedByUserId(userId)).thenReturn(List.of(friendship));
        when(userRepository.findAllByIds(List.of(friendId))).thenReturn(List.of(friend));
        when(objectMapper.writeValueAsString(any())).thenReturn("[]");

        // Act
        List<FriendshipResponse> actualResponse = friendshipService.getFriends(email);

        // Assert
        assertNotNull(actualResponse);
        assertEquals(1, actualResponse.size());
        assertEquals("f123", actualResponse.getFirst().getFriendshipId());

        verify(valueOperations, times(1)).set(eq(cacheKey), anyString(), eq(6L), eq(TimeUnit.HOURS));
    }

    @Test
    void unfriend_EvictsCaches() {
        // Arrange
        String friendId = "friend123";
        User me = User.builder().id("user123").email(email).build();
        User friend = User.builder().id(friendId).email("friend@test.com").build();
        Friendship friendship = Friendship.builder()
                .id("f123")
                .requesterId("user123")
                .addresseeId(friendId)
                .status(FriendshipStatus.ACCEPTED)
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(me));
        when(friendshipRepository.findBetweenUsers("user123", friendId)).thenReturn(Optional.of(friendship));
        when(userRepository.findById("user123")).thenReturn(Optional.of(me));
        when(userRepository.findById(friendId)).thenReturn(Optional.of(friend));

        // Act
        friendshipService.unfriend(email, friendId);

        // Assert
        verify(friendshipRepository, times(1)).delete(friendship);
        verify(redisTemplate, times(1)).delete("user:friends:email:" + email);
        verify(redisTemplate, times(1)).delete("user:friends:email:friend@test.com");
    }
}
