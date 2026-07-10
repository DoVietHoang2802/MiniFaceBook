package com.minifacebook.module.auth.presentation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.minifacebook.BaseIntegrationTest;
import com.minifacebook.module.auth.application.dto.RegisterRequest;
import com.minifacebook.module.auth.application.dto.UpdateProfileRequest;
import com.minifacebook.module.auth.application.dto.UserResponse;
import com.minifacebook.module.auth.application.service.AuthService;
import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.auth.infrastructure.persistence.repository.MongoUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import com.minifacebook.module.auth.application.dto.ChangePasswordRequest;
import com.minifacebook.shared.exception.AppException;
import com.minifacebook.shared.exception.ErrorCode;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

public class AuthIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MongoUserRepository mongoUserRepository;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    private final String email = "integration_test@example.com";
    private final String cacheKey = "user:profile:email:" + email;

    @BeforeEach
    void cleanUp() {
        mongoUserRepository.findByEmail(email).ifPresent(u -> mongoUserRepository.delete(u));
        redisTemplate.delete(cacheKey);
    }

    @Test
    void testRegisterVerifyProfileAndCachingFlow() throws Exception {
        // 1. Register User
        RegisterRequest registerRequest = RegisterRequest.builder()
                .email(email)
                .password("SecurePassword123")
                .name("Integration User")
                .build();
        UserResponse registeredUser = authService.register(registerRequest);
        assertNotNull(registeredUser);
        assertEquals(email, registeredUser.getEmail());

        // 2. Fetch User from DB and Verify Account
        Optional<User> userOpt = userRepository.findByEmail(email);
        assertTrue(userOpt.isPresent());
        User user = userOpt.get();
        assertFalse(user.isVerified());
        assertNotNull(user.getVerificationToken());

        authService.verify(user.getVerificationToken());

        // 3. Retrieve User Profile (Should result in Cache Miss then Cache Hit)
        // Check cache is empty initially
        assertFalse(redisTemplate.hasKey(cacheKey));

        // Call getCurrentUser which caches the profile
        UserResponse response1 = authService.getCurrentUser(email);
        assertNotNull(response1);
        assertEquals("Integration User", response1.getName());

        // Check cache now has the profile
        assertTrue(redisTemplate.hasKey(cacheKey));
        String cachedValue = redisTemplate.opsForValue().get(cacheKey);
        assertNotNull(cachedValue);
        
        UserResponse cachedProfile = objectMapper.readValue(cachedValue, UserResponse.class);
        assertEquals("Integration User", cachedProfile.getName());

        // 4. Update Profile (Should evict Cache)
        UpdateProfileRequest updateRequest = UpdateProfileRequest.builder()
                .bio("Integration Bio")
                .build();
        UserResponse updatedProfile = authService.updateProfile(email, updateRequest);
        assertEquals("Integration Bio", updatedProfile.getBio());

        // Verify cache key was deleted
        assertFalse(redisTemplate.hasKey(cacheKey));

        // 5. Fetch again to check new profile is cached with updated bio
        UserResponse response2 = authService.getCurrentUser(email);
        assertEquals("Integration Bio", response2.getBio());
        assertTrue(redisTemplate.hasKey(cacheKey));
    }

    @Test
    void testChangePasswordFlow() {
        // Register & Verify
        RegisterRequest registerRequest = RegisterRequest.builder()
                .email(email)
                .password("SecurePassword123")
                .name("Integration User")
                .build();
        authService.register(registerRequest);
        User user = userRepository.findByEmail(email).orElseThrow();
        authService.verify(user.getVerificationToken());

        // 1. Change password with incorrect old password -> should fail
        ChangePasswordRequest wrongOldRequest = ChangePasswordRequest.builder()
                .oldPassword("WrongPassword123")
                .newPassword("NewPassword123")
                .build();
        AppException exception = assertThrows(AppException.class, () -> {
            authService.changePassword(email, wrongOldRequest);
        });
        assertEquals(ErrorCode.INVALID_CREDENTIALS, exception.getErrorCode());

        // 2. Change password successfully
        ChangePasswordRequest correctRequest = ChangePasswordRequest.builder()
                .oldPassword("SecurePassword123")
                .newPassword("NewPassword123")
                .build();
        assertDoesNotThrow(() -> authService.changePassword(email, correctRequest));

        // 3. Verify user password was changed (can change it again with NewPassword123)
        ChangePasswordRequest changeAgainRequest = ChangePasswordRequest.builder()
                .oldPassword("NewPassword123")
                .newPassword("AnotherPassword123")
                .build();
        assertDoesNotThrow(() -> authService.changePassword(email, changeAgainRequest));
    }
}
