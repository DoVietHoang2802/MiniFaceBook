package com.minifacebook.module.notification.presentation;

import com.minifacebook.module.notification.application.dto.NotificationResponse;
import com.minifacebook.module.notification.application.service.NotificationService;
import com.minifacebook.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** REST endpoints cho Notification Center (Phase 5.1). */
@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@Tag(name = "Thông báo", description = "Notification center: like, comment, lời mời kết bạn")
public class NotificationController {

  private final NotificationService notificationService;

  @GetMapping
  @Operation(summary = "Danh sách thông báo", description = "Lấy thông báo của user, mới nhất trước, phân trang")
  public ApiResponse<Page<NotificationResponse>> getNotifications(
      @AuthenticationPrincipal Jwt jwt,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "15") int size) {
    Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    Page<NotificationResponse> result = notificationService.getNotifications(jwt.getSubject(), pageable);
    return ApiResponse.success("Lấy danh sách thông báo thành công", result);
  }

  @GetMapping("/unread-count")
  @Operation(summary = "Số thông báo chưa đọc", description = "Đếm thông báo chưa đọc cho badge chuông")
  public ApiResponse<Long> getUnreadCount(@AuthenticationPrincipal Jwt jwt) {
    long count = notificationService.getUnreadCount(jwt.getSubject());
    return ApiResponse.success("Lấy số thông báo chưa đọc thành công", count);
  }

  @PutMapping("/{notificationId}/read")
  @Operation(summary = "Đánh dấu đã đọc", description = "Đánh dấu một thông báo là đã đọc")
  public ApiResponse<Void> markAsRead(
      @AuthenticationPrincipal Jwt jwt, @PathVariable String notificationId) {
    notificationService.markAsRead(jwt.getSubject(), notificationId);
    return ApiResponse.success("Đã đánh dấu thông báo là đã đọc", null);
  }

  @PutMapping("/read-all")
  @Operation(summary = "Đánh dấu tất cả đã đọc", description = "Đánh dấu toàn bộ thông báo là đã đọc")
  public ApiResponse<Void> markAllAsRead(@AuthenticationPrincipal Jwt jwt) {
    notificationService.markAllAsRead(jwt.getSubject());
    return ApiResponse.success("Đã đánh dấu tất cả thông báo là đã đọc", null);
  }
}
