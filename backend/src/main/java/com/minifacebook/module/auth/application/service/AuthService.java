package com.minifacebook.module.auth.application.service;

import com.minifacebook.module.auth.application.dto.LoginRequest;
import com.minifacebook.module.auth.application.dto.LoginResult;
import com.minifacebook.module.auth.application.dto.RegisterRequest;
import com.minifacebook.module.auth.application.dto.UserResponse;
import com.minifacebook.module.auth.application.mapper.AuthMapper;
import com.minifacebook.module.auth.domain.model.Role;
import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.auth.domain.service.TokenService;
import com.minifacebook.shared.exception.AppException;
import com.minifacebook.shared.exception.ErrorCode;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/** Service xử lý các nghiệp vụ xác thực tài khoản (Đăng ký, Đăng nhập). */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final TokenService tokenService;
  private final AuthMapper authMapper;

  /** Đăng ký người dùng mới. */
  public UserResponse register(RegisterRequest request) {
    if (userRepository.existsByEmail(request.getEmail())) {
      log.warn("Registration failed: Email {} already exists", request.getEmail());
      throw new AppException(ErrorCode.USER_EXISTED);
    }

    User user = authMapper.toUser(request);
    user.setPassword(passwordEncoder.encode(request.getPassword()));
    user.setRoles(Set.of(Role.USER));

    User savedUser = userRepository.save(user);
    log.info("User registered successfully with ID: {}", savedUser.getId());

    return authMapper.toUserResponse(savedUser);
  }

  /** Đăng nhập hệ thống và phát sinh Token. */
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
      throw new AppException(ErrorCode.UNAUTHENTICATED);
    }

    String accessToken = tokenService.generateAccessToken(user.getEmail());
    String refreshToken = tokenService.generateRefreshToken(user.getEmail());

    log.info("User {} logged in successfully", user.getEmail());

    return LoginResult.builder()
        .accessToken(accessToken)
        .refreshToken(refreshToken)
        .user(authMapper.toUserResponse(user))
        .build();
  }
}
