package com.minifacebook.module.auth.application.service;

import com.minifacebook.module.auth.application.dto.LoginRequest;
import com.minifacebook.module.auth.application.dto.LoginResult;
import com.minifacebook.module.auth.application.dto.RegisterRequest;
import com.minifacebook.module.auth.application.dto.ForgotPasswordRequest;
import com.minifacebook.module.auth.application.dto.VerifyOtpRequest;
import com.minifacebook.module.auth.application.dto.ResetPasswordRequest;
import com.minifacebook.module.auth.application.dto.UpdateProfileRequest;
import com.minifacebook.module.auth.application.dto.UserResponse;
import com.minifacebook.module.auth.application.mapper.AuthMapper;
import com.minifacebook.module.auth.domain.model.RefreshToken;
import com.minifacebook.module.auth.domain.model.Role;
import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.RefreshTokenRepository;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.auth.domain.service.EmailService;
import com.minifacebook.module.auth.domain.service.TokenService;
import com.minifacebook.shared.domain.service.MediaService;
import com.minifacebook.shared.exception.AppException;
import com.minifacebook.shared.exception.ErrorCode;
import com.minifacebook.shared.security.TokenBlacklistPort;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.security.SecureRandom;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/** Service xử lý các nghiệp vụ xác thực tài khoản (Đăng ký, Đăng nhập, Xác thực, Refresh). */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

  private static final String OTP_KEY_PREFIX = "otp:reset:";
  private static final String RESET_TOKEN_KEY_PREFIX = "reset:token:";
  private final SecureRandom secureRandom = new SecureRandom();

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final TokenService tokenService;
  private final AuthMapper authMapper;
  private final EmailService emailService;
  private final RefreshTokenRepository refreshTokenRepository;
  private final MediaService mediaService;
  private final TokenBlacklistPort tokenBlacklistService;
  private final StringRedisTemplate redisTemplate;
  private final ObjectMapper objectMapper;


  /** Đăng ký người dùng mới và gửi email kích hoạt qua Resend. */
  public UserResponse register(RegisterRequest request) {
    if (userRepository.existsByEmail(request.getEmail())) {
      log.warn("Registration failed: Email {} already exists", request.getEmail());
      throw new AppException(ErrorCode.USER_EXISTED);
    }

    User user = authMapper.toUser(request);
    user.setPassword(passwordEncoder.encode(request.getPassword()));
    user.setRoles(Set.of(Role.USER));
    user.setVerified(false);
    user.setVerificationToken(UUID.randomUUID().toString());

    User savedUser = userRepository.save(user);
    log.info("User registered successfully with ID: {}. Sending verification email...", savedUser.getId());

    // Gửi email xác thực bất đồng bộ/đồng bộ qua Resend
    emailService.sendVerificationEmail(savedUser.getEmail(), savedUser.getVerificationToken());

    return authMapper.toUserResponse(savedUser);
  }

  /** Đăng nhập hệ thống và phát sinh Token đồng thời đăng ký Refresh Token. */
  public LoginResult login(LoginRequest request) {
    User user =
        userRepository
            .findByEmail(request.getEmail())
            .orElseThrow(
                () -> {
                  log.warn("Login failed: User with email {} not found", request.getEmail());
                  return new AppException(ErrorCode.USER_NOT_EXISTED);
                });

    if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
      log.warn("Login failed: Incorrect password for user {}", request.getEmail());
      // Dùng INVALID_CREDENTIALS, không dùng UNAUTHENTICATED, để tránh hiển thị thông báo sai cho user
      throw new AppException(ErrorCode.INVALID_CREDENTIALS);
    }

    // Yêu cầu tài khoản phải được xác minh email trước khi đăng nhập
    if (!user.isVerified()) {
      log.warn("Login failed: Email {} is not verified yet", request.getEmail());
      throw new AppException(ErrorCode.USER_NOT_VERIFIED);
    }

    String accessToken = tokenService.generateAccessToken(user.getEmail());
    String refreshToken = tokenService.generateRefreshToken(user.getEmail());

    // Xoá tất cả refresh token cũ của người dùng này để tránh rác
    refreshTokenRepository.deleteByEmail(user.getEmail());

    // Lưu Refresh Token mới
    RefreshToken refreshTokenEntity = RefreshToken.builder()
        .token(refreshToken)
        .email(user.getEmail())
        .expiryDate(Instant.now().plusSeconds(604800)) // Hạn dùng 7 ngày
        .revoked(false)
        .build();
    refreshTokenRepository.save(refreshTokenEntity);

    log.info("User {} logged in successfully", user.getEmail());

    return LoginResult.builder()
        .accessToken(accessToken)
        .refreshToken(refreshToken)
        .user(authMapper.toUserResponse(user))
        .build();
  }

  /** Xác thực tài khoản người dùng qua Token nhận được từ email. */
  public void verify(String token) {
    User user = userRepository.findByVerificationToken(token)
        .orElseThrow(() -> new AppException(ErrorCode.INVALID_VERIFICATION_TOKEN));

    user.setVerified(true);
    user.setVerificationToken(null);
    userRepository.save(user);

    log.info("User email verified successfully: {}", user.getEmail());
  }

  /** Refresh Token Rotation: Xoay vòng và cấp phát cặp token mới. */
  public LoginResult refresh(String refreshTokenStr) {
    RefreshToken tokenEntity = refreshTokenRepository.findByToken(refreshTokenStr)
        .orElseThrow(() -> new AppException(ErrorCode.REFRESH_TOKEN_EXPIRED));

    // Phát hiện tấn công phát lại (Replay Attack): Nếu token đã bị thu hồi trước đó
    if (tokenEntity.isRevoked()) {
      refreshTokenRepository.deleteByEmail(tokenEntity.getEmail());
      log.error("Detect Replay Attack! Revoked all Refresh Tokens of email: {}", tokenEntity.getEmail());
      throw new AppException(ErrorCode.UNAUTHENTICATED);
    }

    // Kiểm tra hạn dùng
    if (tokenEntity.getExpiryDate().isBefore(Instant.now())) {
      throw new AppException(ErrorCode.REFRESH_TOKEN_EXPIRED);
    }

    // Đánh dấu thu hồi token cũ
    tokenEntity.setRevoked(true);
    refreshTokenRepository.save(tokenEntity);

    // Tìm người dùng sở hữu token
    User user = userRepository.findByEmail(tokenEntity.getEmail())
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

    // Sinh cặp token mới
    String newAccessToken = tokenService.generateAccessToken(user.getEmail());
    String newRefreshToken = tokenService.generateRefreshToken(user.getEmail());

    // Lưu Refresh Token mới
    RefreshToken newRefreshTokenEntity = RefreshToken.builder()
        .token(newRefreshToken)
        .email(user.getEmail())
        .expiryDate(Instant.now().plusSeconds(604800))
        .revoked(false)
        .build();
    refreshTokenRepository.save(newRefreshTokenEntity);

    log.info("Token rotated successfully for user {}", user.getEmail());

    return LoginResult.builder()
        .accessToken(newAccessToken)
        .refreshToken(newRefreshToken)
        .user(authMapper.toUserResponse(user))
        .build();
  }

  /** Đăng xuất: Vô hiệu hóa Refresh Token trong Database + blacklist Access Token trong Redis. */
  public void logout(String accessToken, String refreshTokenStr) {
    // 1. Blacklist Access Token trong Redis (tức thì, TTL tự hết hạn)
    if (accessToken != null && !accessToken.isBlank()) {
      tokenBlacklistService.blacklist(accessToken);
    }

    // 2. Revoke Refresh Token trong MongoDB (giữ nguyên logic cũ)
    if (refreshTokenStr != null && !refreshTokenStr.isBlank()) {
      refreshTokenRepository.findByToken(refreshTokenStr).ifPresent(tokenEntity -> {
        tokenEntity.setRevoked(true);
        refreshTokenRepository.save(tokenEntity);
        log.info("Refresh Token revoked successfully on logout for email: {}", tokenEntity.getEmail());
      });
    }
  }

  /** Lấy thông tin tài khoản người dùng hiện tại đang đăng nhập. */
  public UserResponse getCurrentUser(String email) {
    String cacheKey = "user:profile:email:" + email;
    try {
      String cachedJson = redisTemplate.opsForValue().get(cacheKey);
      if (cachedJson != null) {
        log.debug("Cache hit for user profile of: {}", email);
        return objectMapper.readValue(cachedJson, UserResponse.class);
      }
    } catch (Exception e) {
      log.warn("Failed to read user profile cache for: {}", email, e);
    }

    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    UserResponse response = authMapper.toUserResponse(user);

    try {
      String json = objectMapper.writeValueAsString(response);
      redisTemplate.opsForValue().set(cacheKey, json, 24, TimeUnit.HOURS);
      log.debug("Cached user profile for: {}", email);
    } catch (Exception e) {
      log.error("Failed to cache user profile for: {}", email, e);
    }

    return response;
  }

  /** Lấy thông tin tài khoản người dùng theo ID. */
  public UserResponse getUserById(String id) {
    String cacheKey = "user:profile:id:" + id;
    try {
      String cachedJson = redisTemplate.opsForValue().get(cacheKey);
      if (cachedJson != null) {
        log.debug("Cache hit for user profile of ID: {}", id);
        return objectMapper.readValue(cachedJson, UserResponse.class);
      }
    } catch (Exception e) {
      log.warn("Failed to read user profile cache for ID: {}", id, e);
    }

    User user = userRepository.findById(id)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    UserResponse response = authMapper.toUserResponse(user);

    try {
      String json = objectMapper.writeValueAsString(response);
      redisTemplate.opsForValue().set(cacheKey, json, 24, TimeUnit.HOURS);
      log.debug("Cached user profile for ID: {}", id);
    } catch (Exception e) {
      log.error("Failed to cache user profile for ID: {}", id, e);
    }

    return response;
  }

  /** Cập nhật thông tin Trang cá nhân (avatar, bio). */
  public UserResponse updateProfile(String email, UpdateProfileRequest request) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

    if (request.getAvatar() != null) {
      user.setAvatar(request.getAvatar());
    }
    if (request.getBio() != null) {
      user.setBio(request.getBio());
    }

    User savedUser = userRepository.save(user);
    log.info("User profile updated successfully for: {}", email);

    try {
      redisTemplate.delete("user:profile:email:" + email);
      log.debug("Evicted profile cache for: {}", email);
    } catch (Exception e) {
      log.error("Failed to evict profile cache for: {}", email, e);
    }

    return authMapper.toUserResponse(savedUser);
  }

  /** Tải lên hình ảnh đại diện qua Cloudinary và cập nhật thông tin cá nhân. */
  public UserResponse uploadAvatar(String email, MultipartFile file) {
    String avatarUrl = mediaService.uploadAvatar(file);

    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

    user.setAvatar(avatarUrl);
    User savedUser = userRepository.save(user);
    log.info("Avatar uploaded and updated successfully for user: {}", email);

    try {
      redisTemplate.delete("user:profile:email:" + email);
      log.debug("Evicted profile cache for: {}", email);
    } catch (Exception e) {
      log.error("Failed to evict profile cache for: {}", email, e);
    }

    return authMapper.toUserResponse(savedUser);
  }

  /** Yêu cầu đặt lại mật khẩu: Sinh mã OTP 6 số, lưu vào Redis và gửi qua email. */
  public void forgotPassword(ForgotPasswordRequest request) {
    String email = request.getEmail();
    if (!userRepository.existsByEmail(email)) {
      // Trả về âm thầm để chống dò quét email
      log.info("Password reset requested for non-existing email: {}", email);
      return;
    }

    // Sinh mã OTP 6 số
    int otpNum = 100000 + secureRandom.nextInt(900000);
    String otp = String.valueOf(otpNum);

    // Lưu OTP vào Redis với TTL 5 phút
    String redisKey = OTP_KEY_PREFIX + email;
    redisTemplate.opsForValue().set(redisKey, otp, 5, TimeUnit.MINUTES);
    log.info("Generated OTP {} for email {} and saved to Redis", otp, email);

    // Gửi email OTP
    emailService.sendResetOtpEmail(email, otp);
  }

  /** Xác thực OTP 6 số từ email, sinh resetToken lưu vào Redis và trả về cho Client. */
  public String verifyForgotPasswordOtp(VerifyOtpRequest request) {
    String email = request.getEmail();
    String otp = request.getOtp();

    String redisKey = OTP_KEY_PREFIX + email;
    String cachedOtp = redisTemplate.opsForValue().get(redisKey);

    if (cachedOtp == null || !cachedOtp.equals(otp)) {
      log.warn("Invalid or expired OTP entered for email: {}", email);
      throw new AppException(ErrorCode.INVALID_OTP);
    }

    // OTP chính xác, xóa OTP ngay lập tức
    redisTemplate.delete(redisKey);

    // Sinh resetToken tạm thời có thời hạn 2 phút
    String resetToken = UUID.randomUUID().toString();
    String tokenKey = RESET_TOKEN_KEY_PREFIX + resetToken;
    redisTemplate.opsForValue().set(tokenKey, email, 2, TimeUnit.MINUTES);

    log.info("OTP verified successfully for email {}. Temporary resetToken generated: {}", email, resetToken);
    return resetToken;
  }

  /** Đặt lại mật khẩu mới sử dụng resetToken hợp lệ trong Redis. */
  public void resetPassword(ResetPasswordRequest request) {
    String resetToken = request.getResetToken();
    String tokenKey = RESET_TOKEN_KEY_PREFIX + resetToken;
    String email = redisTemplate.opsForValue().get(tokenKey);

    if (email == null) {
      log.warn("Invalid or expired resetToken submitted: {}", resetToken);
      throw new AppException(ErrorCode.INVALID_RESET_TOKEN);
    }

    // Token hợp lệ, xóa token ngay để tránh dùng lại
    redisTemplate.delete(tokenKey);

    // Tìm người dùng và cập nhật mật khẩu
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

    user.setPassword(passwordEncoder.encode(request.getNewPassword()));
    userRepository.save(user);

    // Thu hồi toàn bộ Refresh Token của user (Đăng xuất khỏi mọi thiết bị khác)
    refreshTokenRepository.deleteByEmail(email);

    log.info("Password reset and sessions revoked successfully for user: {}", email);
  }
}


