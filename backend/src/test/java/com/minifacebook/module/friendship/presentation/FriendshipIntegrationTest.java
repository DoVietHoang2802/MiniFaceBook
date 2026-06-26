package com.minifacebook.module.friendship.presentation;

import com.minifacebook.BaseIntegrationTest;
import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.auth.infrastructure.persistence.repository.MongoUserRepository;
import com.minifacebook.module.friendship.application.dto.FriendshipResponse;
import com.minifacebook.module.friendship.application.service.FriendshipService;
import com.minifacebook.module.friendship.infrastructure.persistence.repository.MongoFriendshipRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class FriendshipIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private FriendshipService friendshipService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MongoUserRepository mongoUserRepository;

    @Autowired
    private MongoFriendshipRepository mongoFriendshipRepository;

    @Autowired
    private StringRedisTemplate redisTemplate;

    private User userA;
    private User userB;

    private final String emailA = "usera_integration@test.com";
    private final String emailB = "userb_integration@test.com";
    private final String cacheKeyA = "user:friends:email:" + emailA;
    private final String cacheKeyB = "user:friends:email:" + emailB;

    @BeforeEach
    void setUp() {
        mongoFriendshipRepository.deleteAll();
        mongoUserRepository.findByEmail(emailA).ifPresent(mongoUserRepository::delete);
        mongoUserRepository.findByEmail(emailB).ifPresent(mongoUserRepository::delete);

        redisTemplate.delete(cacheKeyA);
        redisTemplate.delete(cacheKeyB);

        userA = User.builder()
                .email(emailA)
                .name("User A")
                .verified(true)
                .build();
        userB = User.builder()
                .email(emailB)
                .name("User B")
                .verified(true)
                .build();

        userA = userRepository.save(userA);
        userB = userRepository.save(userB);
    }

    @Test
    void testFriendshipFlowWithCachingAndEviction() {
        // 1. Send Friend Request
        FriendshipResponse requestResponse = friendshipService.sendRequest(emailA, userB.getId());
        assertNotNull(requestResponse);
        
        // 2. Accept Friend Request (Should evict caches)
        FriendshipResponse acceptResponse = friendshipService.acceptRequest(emailB, requestResponse.getFriendshipId());
        assertNotNull(acceptResponse);

        // 3. Fetch Friends (Should cache the list)
        assertFalse(redisTemplate.hasKey(cacheKeyA));
        List<FriendshipResponse> friendsA = friendshipService.getFriends(emailA);
        assertEquals(1, friendsA.size());
        assertTrue(redisTemplate.hasKey(cacheKeyA));

        assertFalse(redisTemplate.hasKey(cacheKeyB));
        List<FriendshipResponse> friendsB = friendshipService.getFriends(emailB);
        assertEquals(1, friendsB.size());
        assertTrue(redisTemplate.hasKey(cacheKeyB));

        // 4. Unfriend (Should evict caches for BOTH users)
        friendshipService.unfriend(emailA, userB.getId());

        // Verify caches are gone
        assertFalse(redisTemplate.hasKey(cacheKeyA));
        assertFalse(redisTemplate.hasKey(cacheKeyB));
    }
}
