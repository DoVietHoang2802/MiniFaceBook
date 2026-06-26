package com.minifacebook.module.auth.application.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.minifacebook.module.auth.application.dto.UpdateProfileRequest;
import com.minifacebook.module.auth.application.dto.UserResponse;
import com.minifacebook.module.auth.application.mapper.AuthMapper;
import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.RefreshTokenRepository;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.auth.domain.service.EmailService;
import com.minifacebook.module.auth.domain.service.TokenService;
import com.minifacebook.shared.domain.service.MediaService;
import com.minifacebook.shared.security.TokenBlacklistPort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private TokenService tokenService;
    @Mock private AuthMapper authMapper;
    @Mock private EmailService emailService;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private MediaService mediaService;
    @Mock private TokenBlacklistPort tokenBlacklistService;
    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ObjectMapper objectMapper;
    @Mock private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private AuthService authService;

    private final String email = "user@test.com";
    private final String cacheKey = "user:profile:email:" + email;

    @Test
    void getCurrentUser_CacheHit() throws Exception {
        // Arrange
        String cachedJson = "{\"email\":\"user@test.com\"}";
        UserResponse expectedResponse = UserResponse.builder().email(email).build();

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(cacheKey)).thenReturn(cachedJson);
        when(objectMapper.readValue(cachedJson, UserResponse.class)).thenReturn(expectedResponse);

        // Act
        UserResponse actualResponse = authService.getCurrentUser(email);

        // Assert
        assertNotNull(actualResponse);
        assertEquals(email, actualResponse.getEmail());
        verify(userRepository, never()).findByEmail(anyString());
    }

    @Test
    void getCurrentUser_CacheMiss() throws Exception {
        // Arrange
        User user = User.builder().id("123").email(email).build();
        UserResponse expectedResponse = UserResponse.builder().email(email).build();

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(cacheKey)).thenReturn(null);
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(authMapper.toUserResponse(user)).thenReturn(expectedResponse);
        when(objectMapper.writeValueAsString(expectedResponse)).thenReturn("json_string");

        // Act
        UserResponse actualResponse = authService.getCurrentUser(email);

        // Assert
        assertNotNull(actualResponse);
        assertEquals(email, actualResponse.getEmail());
        verify(valueOperations, times(1)).set(eq(cacheKey), eq("json_string"), eq(24L), eq(TimeUnit.HOURS));
    }

    @Test
    void updateProfile_EvictsCache() {
        // Arrange
        UpdateProfileRequest request = UpdateProfileRequest.builder().bio("New Bio").build();
        User user = User.builder().id("123").email(email).bio("Old Bio").build();
        User savedUser = User.builder().id("123").email(email).bio("New Bio").build();
        UserResponse response = UserResponse.builder().email(email).bio("New Bio").build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(savedUser);
        when(authMapper.toUserResponse(savedUser)).thenReturn(response);

        // Act
        UserResponse actualResponse = authService.updateProfile(email, request);

        // Assert
        assertNotNull(actualResponse);
        assertEquals("New Bio", actualResponse.getBio());
        verify(redisTemplate, times(1)).delete(cacheKey);
    }
}
