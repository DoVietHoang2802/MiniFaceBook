package com.minifacebook.module.auth.presentation;

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
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Controller xử lý các API liên quan đến xác thực tài khoản. */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Các API xác thực hệ thống (Đăng ký, Đăng nhập, Refresh Token, Xác thực email)")
public class AuthController {

  private final AuthService authService;

  /** Đăng ký tài khoản người dùng mới. */
  @PostMapping("/register")
  @Operation(
      summary = "Đăng ký tài khoản",
      description = "Tạo mới tài khoản người dùng và gửi email xác thực qua Resend.")
  public ResponseEntity<ApiResponse<UserResponse>> register(
      @Valid @RequestBody RegisterRequest request) {
    UserResponse response = authService.register(request);

    ApiResponse<UserResponse> apiResponse =
        ApiResponse.<UserResponse>builder()
            .status(HttpStatus.CREATED.value())
            .message("User registered successfully. Please check your email to verify your account.")
            .data(response)
            .build();

    return ResponseEntity.status(HttpStatus.CREATED).body(apiResponse);
  }

  /** Đăng nhập hệ thống và cấp HttpOnly Cookie. */
  @PostMapping("/login")
  @Operation(
      summary = "Đăng nhập",
      description = "Đăng nhập và nhận Access Token + Refresh Token ở HttpOnly Cookies.")
  public ResponseEntity<ApiResponse<UserResponse>> login(
      @Valid @RequestBody LoginRequest request, HttpServletResponse response) {
    LoginResult loginResult = authService.login(request);

    setTokenCookies(response, loginResult.getAccessToken(), loginResult.getRefreshToken());

    ApiResponse<UserResponse> apiResponse =
        ApiResponse.<UserResponse>builder()
            .status(HttpStatus.OK.value())
            .message("Login successful")
            .data(loginResult.getUser())
            .build();

    return ResponseEntity.ok(apiResponse);
  }

  /** Xác thực tài khoản người dùng thông qua mã token gửi qua email. */
  @GetMapping("/verify")
  @Operation(
      summary = "Xác thực email tài khoản",
      description = "Kích hoạt tài khoản người dùng sử dụng mã token từ email.")
  public ResponseEntity<ApiResponse<String>> verify(@RequestParam String token) {
    authService.verify(token);

    ApiResponse<String> apiResponse =
        ApiResponse.<String>builder()
            .status(HttpStatus.OK.value())
            .message("Email verified successfully! You can now log in.")
            .data("Account verified.")
            .build();

    return ResponseEntity.ok(apiResponse);
  }

  /** Xoay vòng Refresh Token để nhận Access Token và Refresh Token mới. */
  @PostMapping("/refresh")
  @Operation(
      summary = "Làm mới Token",
      description = "Xoay vòng Refresh Token nhận từ HttpOnly Cookie để cấp cặp token mới.")
  public ResponseEntity<ApiResponse<UserResponse>> refresh(
      @CookieValue(value = "refreshToken", required = false) String refreshToken,
      HttpServletResponse response) {

    if (refreshToken == null || refreshToken.isBlank()) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
          .body(ApiResponse.<UserResponse>builder()
              .status(HttpStatus.UNAUTHORIZED.value())
              .message("Missing Refresh Token Cookie")
              .build());
    }

    LoginResult loginResult = authService.refresh(refreshToken);

    setTokenCookies(response, loginResult.getAccessToken(), loginResult.getRefreshToken());

    ApiResponse<UserResponse> apiResponse =
        ApiResponse.<UserResponse>builder()
            .status(HttpStatus.OK.value())
            .message("Token refreshed successfully")
            .data(loginResult.getUser())
            .build();

    return ResponseEntity.ok(apiResponse);
  }

  /** Đăng xuất khỏi hệ thống và xoá sạch Cookies. */
  @PostMapping("/logout")
  @Operation(
      summary = "Đăng xuất",
      description = "Xoá bỏ các HttpOnly Cookies chứa Access Token và Refresh Token.")
  public ResponseEntity<ApiResponse<String>> logout(
      @CookieValue(name = "accessToken", required = false) String accessToken,
      @CookieValue(name = "refreshToken", required = false) String refreshToken,
      HttpServletResponse response) {
    authService.logout(accessToken, refreshToken);
    clearTokenCookies(response);

    ApiResponse<String> apiResponse =
        ApiResponse.<String>builder()
            .status(HttpStatus.OK.value())
            .message("Logout successful")
            .data("Cookies cleared.")
            .build();

    return ResponseEntity.ok(apiResponse);
  }

  /** Lấy thông tin tài khoản người dùng đang đăng nhập hiện tại. */
  @GetMapping("/me")
  @Operation(
      summary = "Lấy thông tin cá nhân hiện tại",
      description = "Trả về thông tin của tài khoản người dùng tương ứng với Access Token đang lưu trong Cookie.")
  public ResponseEntity<ApiResponse<UserResponse>> getMe() {
    String email = org.springframework.security.core.context.SecurityContextHolder.getContext()
        .getAuthentication().getName();
    UserResponse userResponse = authService.getCurrentUser(email);

    ApiResponse<UserResponse> apiResponse =
        ApiResponse.<UserResponse>builder()
            .status(HttpStatus.OK.value())
            .message("Get user profile successfully")
            .data(userResponse)
            .build();

    return ResponseEntity.ok(apiResponse);
  }

  private void setTokenCookies(HttpServletResponse response, String accessToken, String refreshToken) {
    ResponseCookie accessCookie = ResponseCookie.from("accessToken", accessToken)
        .httpOnly(true)
        .secure(false) // Trong dev để false, prod để true
        .path("/api")
        .maxAge(3600) // 1 giờ
        .sameSite("Strict")
        .build();

    ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken)
        .httpOnly(true)
        .secure(false)
        .path("/api")
        .maxAge(604800) // 7 ngày
        .sameSite("Strict")
        .build();

    response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
    response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
  }

  private void clearTokenCookies(HttpServletResponse response) {
    ResponseCookie accessCookie = ResponseCookie.from("accessToken", "")
        .httpOnly(true)
        .secure(false)
        .path("/api")
        .maxAge(0)
        .sameSite("Strict")
        .build();

    ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", "")
        .httpOnly(true)
        .secure(false)
        .path("/api")
        .maxAge(0)
        .sameSite("Strict")
        .build();

    response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
    response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
  }
}
