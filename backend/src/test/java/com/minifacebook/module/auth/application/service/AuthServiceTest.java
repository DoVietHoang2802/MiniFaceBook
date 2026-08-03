package com.minifacebook.module.auth.application.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.minifacebook.module.auth.application.dto.UpdateProfileRequest;
import com.minifacebook.module.auth.application.dto.ForgotPasswordRequest;
import com.minifacebook.module.auth.application.dto.GoogleOnboardingData;
import com.minifacebook.module.auth.application.dto.GoogleProfileCompletionRequest;
import com.minifacebook.module.auth.application.dto.LoginRequest;
import com.minifacebook.module.auth.application.dto.UserResponse;
import com.minifacebook.module.auth.application.mapper.AuthMapper;
import com.minifacebook.module.auth.domain.model.AuthProvider;
import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.model.ProfileFieldVisibility;
import com.minifacebook.module.auth.domain.repository.RefreshTokenRepository;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.auth.domain.service.EmailService;
import com.minifacebook.module.friendship.domain.repository.FriendshipRepository;
import com.minifacebook.module.auth.domain.service.TokenService;
import com.minifacebook.shared.domain.service.MediaService;
import com.minifacebook.shared.exception.AppException;
import com.minifacebook.shared.exception.ErrorCode;
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
import java.util.Set;
import java.util.concurrent.TimeUnit;
import org.mockito.ArgumentCaptor;

import static org.junit.jupiter.api.Assertions.*;
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
    @Mock private FriendshipRepository friendshipRepository;

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

    @Test
    void updateProfile_WithDetails_UpdatesAndEvictsCache() {
        // Arrange
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .bio("New Bio")
                .city("HCM")
                .hometown("TB")
                .work("Dev")
                .relationship("dating")
                .build();
        User user = User.builder().id("123").email(email).bio("Old Bio").build();
        
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        
        UserResponse response = UserResponse.builder()
                .email(email)
                .bio("New Bio")
                .city("HCM")
                .hometown("TB")
                .work("Dev")
                .relationship("dating")
                .build();
        when(authMapper.toUserResponse(any(User.class))).thenReturn(response);

        // Act
        UserResponse actualResponse = authService.updateProfile(email, request);

        // Assert
        assertNotNull(actualResponse);
        assertEquals("New Bio", actualResponse.getBio());
        assertEquals("HCM", actualResponse.getCity());
        assertEquals("TB", actualResponse.getHometown());
        assertEquals("Dev", actualResponse.getWork());
        assertEquals("dating", actualResponse.getRelationship());
        verify(redisTemplate, times(1)).delete(cacheKey);
        verify(redisTemplate, times(1)).delete("user:profile:id:123");
    }

    @Test
    void getUserById_HidesPrivateAccountDataAndFriendsOnlyDetailsFromNonFriend() {
        User owner = User.builder()
                .id("owner-id")
                .email("owner@test.com")
                .city("Hà Nội")
                .hometown("Đồng Nai")
                .work("Developer")
                .relationship("Hẹn hò")
                .cityVisibility(ProfileFieldVisibility.FRIENDS)
                .hometownVisibility(ProfileFieldVisibility.FRIENDS)
                .workVisibility(ProfileFieldVisibility.FRIENDS)
                .relationshipVisibility(ProfileFieldVisibility.FRIENDS)
                .build();
        User viewer = User.builder().id("viewer-id").email("viewer@test.com").build();
        UserResponse mapped = UserResponse.builder()
                .id("owner-id")
                .email("owner@test.com")
                .city("Hà Nội")
                .hometown("Đồng Nai")
                .work("Developer")
                .relationship("Hẹn hò")
                .roles(java.util.Set.of())
                .createdAt(java.time.Instant.now())
                .build();

        when(userRepository.findById("owner-id")).thenReturn(Optional.of(owner));
        when(userRepository.findByEmail("viewer@test.com")).thenReturn(Optional.of(viewer));
        when(authMapper.toUserResponse(owner)).thenReturn(mapped);
        when(friendshipRepository.findBetweenUsers("viewer-id", "owner-id")).thenReturn(Optional.empty());

        UserResponse response = authService.getUserById("owner-id", "viewer@test.com");

        assertNull(response.getEmail());
        assertNull(response.getRoles());
        assertNull(response.getCreatedAt());
        assertNull(response.getCity());
        assertNull(response.getHometown());
        assertNull(response.getWork());
        assertNull(response.getRelationship());
    }

    @Test
    void resolveGoogleLogin_ReturningGoogleUserIssuesCookieSession() {
        User googleUser = User.builder().id("google-user").email(email)
                .googleSubject("google-subject").authProvider(AuthProvider.GOOGLE)
                .roles(Set.of(com.minifacebook.module.auth.domain.model.Role.USER)).verified(true).build();
        when(userRepository.findByGoogleSubject("google-subject")).thenReturn(Optional.of(googleUser));
        when(tokenService.generateAccessToken(email, googleUser.getRoles())).thenReturn("access-token");
        when(tokenService.generateRefreshToken(email, googleUser.getRoles())).thenReturn("refresh-token");
        when(authMapper.toUserResponse(googleUser)).thenReturn(UserResponse.builder().email(email).build());

        var result = authService.resolveGoogleLogin("google-subject", email, "Google User");

        assertFalse(result.requiresProfileCompletion());
        assertEquals("access-token", result.accessToken());
        assertEquals("refresh-token", result.refreshToken());
        verify(userRepository, never()).findByEmail(anyString());
        verify(refreshTokenRepository).deleteByEmail(email);
        verify(refreshTokenRepository).save(any());
    }

    @Test
    void resolveGoogleLogin_VerifiedPasswordAccountLinksGoogleIdentity() {
        User passwordUser = User.builder().id("password-user").email(email).password("bcrypt")
                .authProvider(AuthProvider.PASSWORD).roles(Set.of(com.minifacebook.module.auth.domain.model.Role.USER))
                .verified(true).build();
        when(userRepository.findByGoogleSubject("google-subject")).thenReturn(Optional.empty());
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(passwordUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(tokenService.generateAccessToken(email, passwordUser.getRoles())).thenReturn("access-token");
        when(tokenService.generateRefreshToken(email, passwordUser.getRoles())).thenReturn("refresh-token");
        when(authMapper.toUserResponse(passwordUser)).thenReturn(UserResponse.builder().email(email).build());

        var result = authService.resolveGoogleLogin("google-subject", " USER@TEST.COM ", "Google User");

        assertFalse(result.requiresProfileCompletion());
        assertEquals("google-subject", passwordUser.getGoogleSubject());
        assertEquals(AuthProvider.PASSWORD_AND_GOOGLE, passwordUser.getAuthProvider());
        verify(userRepository).save(passwordUser);
    }

    @Test
    void resolveGoogleLogin_BannedLinkedGoogleAccountIsRejectedBeforeIssuingTokens() {
        User bannedGoogleUser = User.builder().email(email).googleSubject("google-subject")
                .authProvider(AuthProvider.GOOGLE).banned(true).build();
        when(userRepository.findByGoogleSubject("google-subject")).thenReturn(Optional.of(bannedGoogleUser));

        AppException exception = assertThrows(AppException.class,
                () -> authService.resolveGoogleLogin("google-subject", email, "Google User"));

        assertEquals(ErrorCode.USER_BANNED, exception.getErrorCode());
        verify(tokenService, never()).generateAccessToken(anyString(), any());
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void resolveGoogleLogin_UnverifiedEmailAccountCannotBeAutoLinked() {
        User unverifiedUser = User.builder().email(email).password("bcrypt")
                .authProvider(AuthProvider.PASSWORD).verified(false).build();
        when(userRepository.findByGoogleSubject("google-subject")).thenReturn(Optional.empty());
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(unverifiedUser));

        AppException exception = assertThrows(AppException.class,
                () -> authService.resolveGoogleLogin("google-subject", email, "Google User"));

        assertEquals(ErrorCode.UNAUTHENTICATED, exception.getErrorCode());
        assertNull(unverifiedUser.getGoogleSubject());
        verify(userRepository, never()).save(any());
    }

    @Test
    void resolveGoogleLogin_NewUserCreatesExpiringOnboardingTransaction() throws Exception {
        when(userRepository.findByGoogleSubject("google-subject")).thenReturn(Optional.empty());
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(objectMapper.writeValueAsString(any(GoogleOnboardingData.class))).thenReturn("onboarding-json");

        var result = authService.resolveGoogleLogin("google-subject", email, "Google User");

        assertTrue(result.requiresProfileCompletion());
        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);
        verify(valueOperations).set(keyCaptor.capture(), eq("onboarding-json"), eq(10L), eq(TimeUnit.MINUTES));
        assertTrue(keyCaptor.getValue().startsWith("oauth2:google:profile:"));
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void completeGoogleProfile_ConsumesOnboardingTokenAndCreatesVerifiedGoogleAccount() throws Exception {
        GoogleOnboardingData data = GoogleOnboardingData.builder()
                .googleSubject("google-subject").email(email).suggestedName("Google User").build();
        GoogleProfileCompletionRequest request = new GoogleProfileCompletionRequest();
        request.setName("  Google   User  ");
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.getAndDelete("oauth2:google:profile:onboarding-token")).thenReturn("onboarding-json");
        when(objectMapper.readValue("onboarding-json", GoogleOnboardingData.class)).thenReturn(data);
        when(userRepository.existsByEmail(email)).thenReturn(false);
        when(userRepository.findByGoogleSubject("google-subject")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(tokenService.generateAccessToken(eq(email), any())).thenReturn("access-token");
        when(tokenService.generateRefreshToken(eq(email), any())).thenReturn("refresh-token");
        when(authMapper.toUserResponse(any(User.class))).thenReturn(UserResponse.builder().email(email).build());

        var result = authService.completeGoogleProfile("onboarding-token", request);

        assertEquals("access-token", result.getAccessToken());
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertEquals("Google User", savedUser.getName());
        assertEquals(AuthProvider.GOOGLE, savedUser.getAuthProvider());
        assertTrue(savedUser.isVerified());
        assertEquals("google-subject", savedUser.getGoogleSubject());
    }

    @Test
    void completeGoogleProfile_MissingOrReplayedTokenIsRejected() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.getAndDelete("oauth2:google:profile:expired-token")).thenReturn(null);
        GoogleProfileCompletionRequest request = new GoogleProfileCompletionRequest();
        request.setName("Google User");

        AppException exception = assertThrows(AppException.class,
                () -> authService.completeGoogleProfile("expired-token", request));

        assertEquals(ErrorCode.UNAUTHENTICATED, exception.getErrorCode());
        verify(userRepository, never()).save(any());
    }

    @Test
    void googleOnlyAccountCannotUsePasswordLoginOrForgotPassword() {
        User googleUser = User.builder().email(email).password(null).authProvider(AuthProvider.GOOGLE)
                .verified(true).roles(Set.of(com.minifacebook.module.auth.domain.model.Role.USER)).build();
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(googleUser));

        AppException exception = assertThrows(AppException.class,
                () -> authService.login(LoginRequest.builder().email(email).password("password").build()));

        assertEquals(ErrorCode.INVALID_CREDENTIALS, exception.getErrorCode());
        authService.forgotPassword(ForgotPasswordRequest.builder().email(email).build());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
        verify(redisTemplate, never()).opsForValue();
        verify(emailService, never()).sendResetOtpEmail(anyString(), anyString());
    }
}
