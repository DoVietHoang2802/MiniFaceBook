package com.minifacebook.module.admin.presentation;

import com.minifacebook.module.admin.application.dto.AdminBroadcastRequest;
import com.minifacebook.module.admin.application.dto.AdminPostResponse;
import com.minifacebook.module.admin.application.dto.AdminStatsResponse;
import com.minifacebook.module.admin.application.dto.AdminUserResponse;
import com.minifacebook.module.admin.infrastructure.service.AdminService;
import com.minifacebook.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminStatsResponse>> getStats() {
        AdminStatsResponse stats = adminService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.<AdminStatsResponse>builder()
                .status(200)
                .message("Lấy chỉ số thống kê hệ thống thành công")
                .data(stats)
                .build());
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<AdminUserResponse>>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<AdminUserResponse> users = adminService.getAllUsers(search, page, size);
        return ResponseEntity.ok(ApiResponse.<Page<AdminUserResponse>>builder()
                .status(200)
                .message("Lấy danh sách người dùng thành công")
                .data(users)
                .build());
    }

    @PutMapping("/users/{id}/ban")
    public ResponseEntity<ApiResponse<AdminUserResponse>> toggleBanUser(@PathVariable String id) {
        AdminUserResponse updatedUser = adminService.toggleBanUser(id);
        return ResponseEntity.ok(ApiResponse.<AdminUserResponse>builder()
                .status(200)
                .message(updatedUser.isBanned() ? "Đã khóa tài khoản thành công" : "Đã mở khóa tài khoản thành công")
                .data(updatedUser)
                .build());
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<ApiResponse<AdminUserResponse>> changeUserRole(
            @PathVariable String id,
            @RequestParam String role
    ) {
        AdminUserResponse updatedUser = adminService.changeUserRole(id, role);
        return ResponseEntity.ok(ApiResponse.<AdminUserResponse>builder()
                .status(200)
                .message("Đã cập nhật vai trò tài khoản thành công")
                .data(updatedUser)
                .build());
    }

    @GetMapping("/posts")
    public ResponseEntity<ApiResponse<Page<AdminPostResponse>>> getPosts(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<AdminPostResponse> posts = adminService.getAllPosts(search, page, size);
        return ResponseEntity.ok(ApiResponse.<Page<AdminPostResponse>>builder()
                .status(200)
                .message("Lấy danh sách kiểm duyệt bài viết thành công")
                .data(posts)
                .build());
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @PathVariable String id,
            @RequestParam(required = false) String reason
    ) {
        adminService.deletePostByAdmin(id, reason);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .status(200)
                .message("Đã xóa bài viết vi phạm thành công")
                .build());
    }

    @PostMapping("/broadcast")
    public ResponseEntity<ApiResponse<Void>> broadcastNotification(
            @Valid @RequestBody AdminBroadcastRequest request
    ) {
        adminService.broadcastSystemNotification(request);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .status(200)
                .message("Đã phát thông báo toàn hệ thống thành công")
                .build());
    }
}
