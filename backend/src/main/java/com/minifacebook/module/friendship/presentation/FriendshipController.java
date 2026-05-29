package com.minifacebook.module.friendship.presentation;

import com.minifacebook.module.friendship.application.dto.FriendshipResponse;
import com.minifacebook.module.friendship.application.service.FriendshipService;
import com.minifacebook.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** REST endpoints quản lý lời mời kết bạn (Sprint 3.1). */
@RestController
@RequestMapping("/friends")
@RequiredArgsConstructor
@Tag(name = "Bạn bè", description = "Các API quản lý lời mời và mối quan hệ kết bạn")
public class FriendshipController {

  private final FriendshipService friendshipService;

  @PostMapping("/request/{userId}")
  @Operation(summary = "Gửi lời mời kết bạn", description = "Gửi lời mời kết bạn đến một người dùng khác")
  public ApiResponse<FriendshipResponse> sendRequest(
      @AuthenticationPrincipal Jwt jwt, @PathVariable String userId) {
    FriendshipResponse response = friendshipService.sendRequest(jwt.getSubject(), userId);
    return ApiResponse.success("Đã gửi lời mời kết bạn thành công", response);
  }

  @DeleteMapping("/request/{friendshipId}")
  @Operation(summary = "Hủy lời mời kết bạn", description = "Hủy một lời mời kết bạn mà bạn đã gửi")
  public ApiResponse<Void> cancelRequest(
      @AuthenticationPrincipal Jwt jwt, @PathVariable String friendshipId) {
    friendshipService.cancelRequest(jwt.getSubject(), friendshipId);
    return ApiResponse.success("Đã hủy lời mời kết bạn thành công", null);
  }

  @PutMapping("/request/{friendshipId}/accept")
  @Operation(summary = "Chấp nhận lời mời kết bạn", description = "Chấp nhận một lời mời kết bạn đang chờ")
  public ApiResponse<FriendshipResponse> acceptRequest(
      @AuthenticationPrincipal Jwt jwt, @PathVariable String friendshipId) {
    FriendshipResponse response = friendshipService.acceptRequest(jwt.getSubject(), friendshipId);
    return ApiResponse.success("Đã chấp nhận lời mời kết bạn thành công", response);
  }

  @PutMapping("/request/{friendshipId}/reject")
  @Operation(summary = "Từ chối lời mời kết bạn", description = "Từ chối một lời mời kết bạn đang chờ")
  public ApiResponse<Void> rejectRequest(
      @AuthenticationPrincipal Jwt jwt, @PathVariable String friendshipId) {
    friendshipService.rejectRequest(jwt.getSubject(), friendshipId);
    return ApiResponse.success("Đã từ chối lời mời kết bạn thành công", null);
  }
}
