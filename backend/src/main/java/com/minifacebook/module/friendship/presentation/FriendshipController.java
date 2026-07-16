package com.minifacebook.module.friendship.presentation;

import com.minifacebook.module.friendship.application.dto.FriendSuggestionResponse;
import com.minifacebook.module.friendship.application.dto.FriendshipResponse;
import com.minifacebook.module.friendship.application.dto.UserSearchResponse;
import com.minifacebook.module.friendship.application.service.FriendshipService;
import com.minifacebook.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

  // ===== Sprint 3.2: List & Management =====

  @GetMapping
  @Operation(summary = "Danh sách bạn bè", description = "Lấy danh sách tất cả bạn bè đã kết nối của user hiện tại")
  public ApiResponse<List<FriendshipResponse>> getFriends(@AuthenticationPrincipal Jwt jwt) {
    List<FriendshipResponse> friends = friendshipService.getFriends(jwt.getSubject());
    return ApiResponse.success("Lấy danh sách bạn bè thành công", friends);
  }

  @GetMapping("/user/{userId}")
  @Operation(
      summary = "Danh sách bạn bè của một user cụ thể",
      description = "Lấy danh sách tất cả bạn bè đã kết nối của một user bất kỳ theo userId")
  public ApiResponse<List<FriendshipResponse>> getFriendsOfUser(
      @PathVariable String userId) {
    List<FriendshipResponse> friends = friendshipService.getFriendsByUserId(userId);
    return ApiResponse.success("Lấy danh sách bạn bè thành công", friends);
  }

  @GetMapping("/requests/pending")
  @Operation(
      summary = "Lời mời đang chờ duyệt",
      description = "Lấy danh sách lời mời kết bạn người khác gửi đến, đang chờ user duyệt")
  public ApiResponse<List<FriendshipResponse>> getPendingRequests(
      @AuthenticationPrincipal Jwt jwt) {
    List<FriendshipResponse> requests = friendshipService.getPendingRequests(jwt.getSubject());
    return ApiResponse.success("Lấy danh sách lời mời đang chờ thành công", requests);
  }

  @GetMapping("/requests/sent")
  @Operation(
      summary = "Lời mời đã gửi",
      description = "Lấy danh sách lời mời kết bạn mà user đã gửi đi và đang chờ phản hồi")
  public ApiResponse<List<FriendshipResponse>> getSentRequests(@AuthenticationPrincipal Jwt jwt) {
    List<FriendshipResponse> requests = friendshipService.getSentRequests(jwt.getSubject());
    return ApiResponse.success("Lấy danh sách lời mời đã gửi thành công", requests);
  }

  @DeleteMapping("/{friendId}")
  @Operation(summary = "Hủy kết bạn", description = "Hủy mối quan hệ bạn bè với một người dùng")
  public ApiResponse<Void> unfriend(
      @AuthenticationPrincipal Jwt jwt, @PathVariable String friendId) {
    friendshipService.unfriend(jwt.getSubject(), friendId);
    return ApiResponse.success("Đã hủy kết bạn thành công", null);
  }

  @PostMapping("/block/{userId}")
  @Operation(summary = "Chặn người dùng", description = "Chặn một người dùng. Chỉ người chặn mới có thể bỏ chặn.")
  public ApiResponse<Void> blockUser(
      @AuthenticationPrincipal Jwt jwt, @PathVariable String userId) {
    friendshipService.blockUser(jwt.getSubject(), userId);
    return ApiResponse.success("Đã chặn người dùng thành công", null);
  }

  @DeleteMapping("/block/{userId}")
  @Operation(summary = "Bỏ chặn người dùng", description = "Bỏ chặn một người dùng đã chặn trước đó")
  public ApiResponse<Void> unblockUser(
      @AuthenticationPrincipal Jwt jwt, @PathVariable String userId) {
    friendshipService.unblockUser(jwt.getSubject(), userId);
    return ApiResponse.success("Đã bỏ chặn người dùng thành công", null);
  }

  // ===== Sprint 3.3: User Search =====

  @GetMapping("/search")
  @Operation(
      summary = "Tìm kiếm người dùng",
      description =
          "Tìm người dùng theo tên (không phân biệt hoa thường). Kết quả kèm trạng thái quan hệ "
              + "(NONE/PENDING_SENT/PENDING_RECEIVED/FRIEND/BLOCKED), loại trừ chính mình và người đã chặn bạn.")
  public ApiResponse<Page<UserSearchResponse>> searchUsers(
      @AuthenticationPrincipal Jwt jwt,
      @RequestParam("q") String keyword,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size) {
    Pageable pageable = PageRequest.of(page, size);
    Page<UserSearchResponse> result =
        friendshipService.searchUsers(jwt.getSubject(), keyword, pageable);
    return ApiResponse.success("Tìm kiếm người dùng thành công", result);
  }

  @GetMapping("/suggestions")
  @Operation(
      summary = "Gợi ý kết bạn",
      description =
          "Gợi ý kết bạn theo thuật toán Mutual Friends (bạn của bạn). Người có nhiều bạn chung "
              + "được ưu tiên. Loại trừ bạn hiện tại và người đã có quan hệ.")
  public ApiResponse<List<FriendSuggestionResponse>> getSuggestions(
      @AuthenticationPrincipal Jwt jwt, @RequestParam(defaultValue = "10") int limit) {
    List<FriendSuggestionResponse> result =
        friendshipService.getSuggestions(jwt.getSubject(), limit);
    return ApiResponse.success("Lấy gợi ý kết bạn thành công", result);
  }
}
