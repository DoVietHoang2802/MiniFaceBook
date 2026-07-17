package com.minifacebook.module.auth.presentation;

import com.minifacebook.module.auth.application.dto.UpdateProfileRequest;
import com.minifacebook.module.auth.application.dto.UserResponse;
import com.minifacebook.module.auth.application.dto.ChangePasswordRequest;
import com.minifacebook.module.auth.application.service.AuthService;
import com.minifacebook.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Controller xử lý các API quản lý thông tin người dùng (Profile & Media).
 */
@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
@Tag(name = "User", description = "Các API quản lý hồ sơ người dùng (Cập nhật thông tin, tải lên hình ảnh đại diện)")
public class UserController {

  private final AuthService authService;

  /** Cập nhật thông tin trang cá nhân (bio, avatar). */
  @PutMapping("/profile")
  @Operation(
      summary = "Cập nhật thông tin cá nhân",
      description = "Cho phép cập nhật các trường thông tin trong trang cá nhân của tài khoản đăng nhập hiện tại.")
  public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
      @Valid @RequestBody UpdateProfileRequest request) {
    String email = SecurityContextHolder.getContext().getAuthentication().getName();
    UserResponse response = authService.updateProfile(email, request);

    ApiResponse<UserResponse> apiResponse =
        ApiResponse.<UserResponse>builder()
            .status(HttpStatus.OK.value())
            .message("Profile updated successfully")
            .data(response)
            .build();

    return ResponseEntity.ok(apiResponse);
  }

  /** Đổi mật khẩu tài khoản. */
  @PutMapping("/change-password")
  @Operation(
      summary = "Đổi mật khẩu tài khoản",
      description = "Cho phép người dùng đã đăng nhập đổi mật khẩu.")
  public ResponseEntity<ApiResponse<Void>> changePassword(
      @Valid @RequestBody ChangePasswordRequest request) {
    String email = SecurityContextHolder.getContext().getAuthentication().getName();
    authService.changePassword(email, request);

    ApiResponse<Void> apiResponse =
        ApiResponse.<Void>builder()
            .status(HttpStatus.OK.value())
            .message("Password changed successfully")
            .build();

    return ResponseEntity.ok(apiResponse);
  }

  /** Tải lên hình ảnh đại diện của người dùng. */
  @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @Operation(
      summary = "Tải lên ảnh đại diện",
      description = "Tải ảnh lên hệ thống đám mây Cloudinary có kiểm duyệt Magic Bytes bảo mật.")
  public ResponseEntity<ApiResponse<UserResponse>> uploadAvatar(
      @RequestParam("file") MultipartFile file) {
    String email = SecurityContextHolder.getContext().getAuthentication().getName();
    UserResponse response = authService.uploadAvatar(email, file);

    ApiResponse<UserResponse> apiResponse =
        ApiResponse.<UserResponse>builder()
            .status(HttpStatus.OK.value())
            .message("Avatar uploaded successfully")
            .data(response)
            .build();

    return ResponseEntity.ok(apiResponse);
  }

  /** Tải lên ảnh bìa trang cá nhân. */
  @PostMapping(value = "/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @Operation(
      summary = "Tải lên ảnh bìa",
      description = "Tải ảnh bìa (cover photo) lên Cloudinary và cập nhật hồ sơ người dùng.")
  public ResponseEntity<ApiResponse<UserResponse>> uploadCover(
      @RequestParam("file") MultipartFile file) {
    String email = SecurityContextHolder.getContext().getAuthentication().getName();
    UserResponse response = authService.uploadCover(email, file);

    ApiResponse<UserResponse> apiResponse =
        ApiResponse.<UserResponse>builder()
            .status(HttpStatus.OK.value())
            .message("Cover uploaded successfully")
            .data(response)
            .build();

    return ResponseEntity.ok(apiResponse);
  }

  /** Lấy thông tin cá nhân của một người dùng theo ID. */
  @GetMapping("/{userId}")
  @Operation(
      summary = "Lấy thông tin cá nhân theo ID",
      description = "Trả về thông tin chi tiết hồ sơ người dùng tương ứng với ID chỉ định.")
  public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable String userId) {
    UserResponse response = authService.getUserById(userId);

    ApiResponse<UserResponse> apiResponse =
        ApiResponse.<UserResponse>builder()
            .status(HttpStatus.OK.value())
            .message("Get user profile successfully")
            .data(response)
            .build();

    return ResponseEntity.ok(apiResponse);
  }
}
