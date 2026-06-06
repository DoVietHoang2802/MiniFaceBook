package com.minifacebook.module.chat.presentation;

import com.minifacebook.module.chat.application.dto.EditMessageRequest;
import com.minifacebook.module.chat.application.service.MessageService;
import com.minifacebook.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST API Controller quản lý các tin nhắn đơn lẻ (Sprint 4.2, 4.5).
 */
@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
@Tag(name = "Tin nhắn", description = "Các API quản lý tin nhắn đơn lẻ")
public class MessageController {

  private final MessageService messageService;

  @PutMapping("/{id}/delivered")
  @Operation(summary = "Xác nhận đã nhận tin nhắn", description = "Đánh dấu tin nhắn là đã nhận (DELIVERED) bởi người nhận")
  public ApiResponse<Void> markAsDelivered(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable("id") String messageId) {
    messageService.markAsDelivered(messageId, jwt.getSubject());
    return ApiResponse.success("Đã xác nhận nhận tin nhắn thành công", null);
  }

  @PutMapping("/{id}")
  @Operation(summary = "Chỉnh sửa tin nhắn", description = "Sửa nội dung tin nhắn văn bản (chỉ người gửi, trong 15 phút) - Sprint 4.5")
  public ApiResponse<Void> editMessage(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable("id") String messageId,
      @RequestBody @Valid EditMessageRequest request) {
    messageService.editMessage(jwt.getSubject(), messageId, request.getContent());
    return ApiResponse.success("Đã chỉnh sửa tin nhắn thành công", null);
  }

  @DeleteMapping("/{id}")
  @Operation(summary = "Xóa tin nhắn", description = "Xóa cho riêng tôi (scope=me) hoặc thu hồi cho mọi người (scope=everyone, chỉ người gửi, trong 15 phút) - Sprint 4.5")
  public ApiResponse<Void> deleteMessage(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable("id") String messageId,
      @RequestParam(value = "scope", defaultValue = "me") String scope) {
    messageService.deleteMessage(jwt.getSubject(), messageId, scope);
    return ApiResponse.success("Đã xóa tin nhắn thành công", null);
  }
}
