package com.minifacebook.module.chat.presentation;

import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.chat.application.service.PresenceService;
import com.minifacebook.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Controller quản lý trạng thái Online/Offline của người dùng. */
@RestController
@RequestMapping("/presence")
@RequiredArgsConstructor
@Tag(name = "Presence", description = "Quản lý trạng thái Online/Offline")
public class PresenceController {

  private final PresenceService presenceService;
  private final UserRepository userRepository;

  @PostMapping("/heartbeat")
  @Operation(
      summary = "Heartbeat",
      description = "Client gọi mỗi 25 giây để duy trì trạng thái Online. TTL Redis sẽ được reset.")
  public ApiResponse<Void> heartbeat(@AuthenticationPrincipal Jwt jwt) {
    String email = jwt.getSubject();
    userRepository
        .findByEmail(email)
        .ifPresent(user -> presenceService.heartbeat(user.getId()));
    return ApiResponse.success("Heartbeat nhận thành công", null);
  }

  @PostMapping("/check")
  @Operation(
      summary = "Kiểm tra trạng thái Online",
      description = "Kiểm tra danh sách userId có đang online không. Trả về Set các userId đang online.")
  public ApiResponse<Set<String>> checkOnlineStatus(
      @AuthenticationPrincipal Jwt jwt, @RequestBody List<String> userIds) {
    Set<String> onlineUsers = presenceService.getOnlineUsers(userIds);
    return ApiResponse.success("Lấy trạng thái online thành công", onlineUsers);
  }
}
