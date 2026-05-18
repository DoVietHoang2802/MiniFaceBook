package com.minifacebook.module.auth.presentation;

import com.minifacebook.module.auth.application.dto.AuthResponse;
import com.minifacebook.module.auth.application.dto.LoginRequest;
import com.minifacebook.module.auth.application.dto.LoginResult;
import com.minifacebook.module.auth.application.dto.RegisterRequest;
import com.minifacebook.module.auth.application.dto.UserResponse;
import com.minifacebook.module.auth.application.service.AuthService;
import com.minifacebook.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Controller xử lý các API liên quan đến xác thực tài khoản. */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Các API xác thực hệ thống (Đăng ký, Đăng nhập, Refresh Token)")
public class AuthController {

  private final AuthService authService;

  /** Đăng ký tài khoản người dùng mới. */
  @PostMapping("/register")
  @Operation(
      summary = "Đăng ký tài khoản",
      description = "Tạo mới tài khoản người dùng và lưu trữ dữ liệu.")
  public ResponseEntity<ApiResponse<UserResponse>> register(
      @Valid @RequestBody RegisterRequest request) {
    UserResponse response = authService.register(request);

    ApiResponse<UserResponse> apiResponse =
        ApiResponse.<UserResponse>builder()
            .status(HttpStatus.CREATED.value())
            .message("User registered successfully")
            .data(response)
            .build();

    return ResponseEntity.status(HttpStatus.CREATED).body(apiResponse);
  }

  /** Đăng nhập hệ thống. */
  @PostMapping("/login")
  @Operation(
      summary = "Đăng nhập",
      description = "Đăng nhập và nhận Access Token ở body, Refresh Token ở HttpOnly Cookie.")
  public ResponseEntity<ApiResponse<AuthResponse>> login(
      @Valid @RequestBody LoginRequest request, HttpServletResponse response) {
    LoginResult loginResult = authService.login(request);

    // Tạo HttpOnly Cookie chứa Refresh Token
    ResponseCookie cookie =
        ResponseCookie.from("refreshToken", loginResult.getRefreshToken())
            .httpOnly(true)
            .secure(true) // Chỉ cho phép truyền qua HTTPS (localhost vẫn hỗ trợ)
            .path("/api") // Phạm vi Context Path
            .maxAge(604800) // Thời hạn 7 ngày (trùng cấu hình yml)
            .sameSite("Strict") // Chống tấn công CSRF
            .build();

    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

    AuthResponse authResponse =
        AuthResponse.builder()
            .accessToken(loginResult.getAccessToken())
            .user(loginResult.getUser())
            .build();

    ApiResponse<AuthResponse> apiResponse =
        ApiResponse.<AuthResponse>builder()
            .status(HttpStatus.OK.value())
            .message("Login successful")
            .data(authResponse)
            .build();

    return ResponseEntity.ok(apiResponse);
  }
}
