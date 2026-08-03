package com.minifacebook.module.admin.infrastructure.service;

import com.minifacebook.module.admin.application.dto.AdminBroadcastRequest;
import com.minifacebook.module.admin.application.dto.AdminPostResponse;
import com.minifacebook.module.admin.application.dto.AdminStatsResponse;
import com.minifacebook.module.admin.application.dto.AdminUserResponse;
import com.minifacebook.module.auth.domain.model.Role;
import com.minifacebook.module.auth.infrastructure.persistence.document.UserDocument;
import com.minifacebook.module.auth.infrastructure.persistence.repository.MongoUserRepository;
import com.minifacebook.module.chat.application.service.PresenceService;
import com.minifacebook.module.post.infrastructure.persistence.document.PostDocument;
import com.minifacebook.module.post.infrastructure.persistence.repository.MongoCommentRepository;
import com.minifacebook.module.post.infrastructure.persistence.repository.MongoPostRepository;
import com.minifacebook.shared.event.NotificationEvent;
import com.minifacebook.shared.exception.AppException;
import com.minifacebook.shared.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final MongoUserRepository userRepository;
    private final MongoPostRepository postRepository;
    private final MongoCommentRepository commentRepository;
    private final PresenceService presenceService;
    private final ApplicationEventPublisher eventPublisher;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Lấy các chỉ số thống kê hệ thống (KPI Stats)
     */
    public AdminStatsResponse getDashboardStats() {
        long totalUsers = userRepository.count();
        long totalPosts = postRepository.count();
        long totalComments = commentRepository.count();
        
        List<String> allUserIds = userRepository.findAll().stream()
                .map(u -> u != null ? u.getId() : null)
                .filter(id -> id != null)
                .collect(Collectors.toList());
        long onlineUsers = presenceService.getOnlineUsers(allUserIds).size();

        return AdminStatsResponse.builder()
                .totalUsers(totalUsers)
                .totalPosts(totalPosts)
                .totalComments(totalComments)
                .onlineUsers(onlineUsers)
                .build();
    }

    /**
     * Lấy danh sách người dùng phân trang & tìm kiếm
     */
    public Page<AdminUserResponse> getAllUsers(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<UserDocument> users;

        if (search != null && !search.trim().isEmpty()) {
            users = userRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(search.trim(), search.trim(), pageable);
        } else {
            users = userRepository.findAll(pageable);
        }

        return users.map(user -> AdminUserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .avatar(user.getAvatar())
                .roles(user.getRoles())
                .verified(user.isVerified())
                .banned(user.isBanned())
                .isOnline(presenceService.isOnline(user.getId()))
                .createdAt(user.getCreatedAt())
                .build());
    }

    /**
     * Khóa hoặc Mở khóa tài khoản (Ban/Unban)
     */
    @Transactional
    public AdminUserResponse toggleBanUser(String userId) {
        UserDocument user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        boolean newBannedState = !user.isBanned();
        user.setBanned(newBannedState);
        userRepository.save(user);

        if (newBannedState) {
            presenceService.setOffline(userId);
            log.info("[ADMIN] User [{}] has been BANNED", userId);
        } else {
            log.info("[ADMIN] User [{}] has been UNBANNED", userId);
        }

        return AdminUserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .avatar(user.getAvatar())
                .roles(user.getRoles())
                .verified(user.isVerified())
                .banned(user.isBanned())
                .isOnline(presenceService.isOnline(user.getId()))
                .createdAt(user.getCreatedAt())
                .build();
    }

    /**
     * Thay đổi vai trò người dùng (USER <-> ADMIN)
     */
    @Transactional
    public AdminUserResponse changeUserRole(String userId, String targetRoleStr) {
        UserDocument user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Set<Role> roles = new HashSet<>();
        if ("ADMIN".equalsIgnoreCase(targetRoleStr)) {
            roles.add(Role.ADMIN);
            roles.add(Role.USER);
        } else {
            roles.add(Role.USER);
        }

        user.setRoles(roles);
        userRepository.save(user);
        log.info("[ADMIN] User [{}] role updated to [{}]", userId, targetRoleStr);

        return AdminUserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .avatar(user.getAvatar())
                .roles(user.getRoles())
                .verified(user.isVerified())
                .banned(user.isBanned())
                .isOnline(presenceService.isOnline(user.getId()))
                .createdAt(user.getCreatedAt())
                .build();
    }

    /**
     * Lấy danh sách bài viết phân trang & kiểm duyệt
     */
    public Page<AdminPostResponse> getAllPosts(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<PostDocument> posts;

        if (search != null && !search.trim().isEmpty()) {
            posts = postRepository.findByContentContainingIgnoreCaseAndDeletedFalse(search.trim(), pageable);
        } else {
            posts = postRepository.findByDeletedFalse(pageable);
        }

        return posts.map(post -> {
            UserDocument author = userRepository.findById(post.getAuthorId()).orElse(null);
            int totalLikes = post.getReactionsCount() != null
                    ? post.getReactionsCount().values().stream().filter(v -> v != null).mapToInt(v -> v).sum()
                    : 0;

            return AdminPostResponse.builder()
                    .id(post.getId())
                    .authorId(post.getAuthorId())
                    .authorName(author != null ? author.getName() : "Unknown User")
                    .authorAvatar(author != null ? author.getAvatar() : null)
                    .content(post.getContent())
                    .images(post.getImageUrls())
                    .likeCount(totalLikes)
                    .commentCount(post.getCommentCount())
                    .createdAt(post.getCreatedAt())
                    .build();
        });
    }

    /**
     * Admin xóa bài viết vi phạm
     */
    @Transactional
    public void deletePostByAdmin(String postId, String reason) {
        deletePostsByAdmin(List.of(postId), reason);
    }

    @Transactional
    public void deletePostsByAdmin(List<String> postIds, String reason) {
        if (postIds == null || postIds.isEmpty() || postIds.size() > 50) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        Set<String> uniquePostIds = new LinkedHashSet<>();
        for (String postId : postIds) {
            if (postId == null || postId.isBlank()) {
                throw new AppException(ErrorCode.INVALID_KEY);
            }
            uniquePostIds.add(postId);
        }

        List<PostDocument> posts = new java.util.ArrayList<>();
        postRepository.findAllById(List.copyOf(uniquePostIds)).forEach(posts::add);
        if (posts.size() != uniquePostIds.size() || posts.stream().anyMatch(PostDocument::isDeleted)) {
            throw new AppException(ErrorCode.POST_NOT_FOUND);
        }

        Instant now = Instant.now();
        posts.forEach(post -> {
            post.setDeleted(true);
            post.setDeletedAt(now);
        });
        postRepository.saveAll(posts);

        String deletionReason = reason == null || reason.isBlank()
                ? "Vi phạm tiêu chuẩn cộng đồng" : reason.trim();
        for (PostDocument post : posts) {
            NotificationEvent notification = NotificationEvent.builder()
                    .actorId("ADMIN")
                    .recipientId(post.getAuthorId())
                    .type("SYSTEM_MODERATION")
                    .entityId(post.getId())
                    .content("Bài viết của bạn đã bị Quản trị viên xóa. Lý do: " + deletionReason)
                    .build();
            eventPublisher.publishEvent(notification);
        }

        try {
            posts.forEach(post -> messagingTemplate.convertAndSend("/topic/posts/deleted", post.getId()));
            messagingTemplate.convertAndSend("/topic/admin/stats", getDashboardStats());
        } catch (Exception e) {
            log.error("Failed to broadcast post delete event via WebSocket STOMP", e);
        }

        log.info("[ADMIN] {} post(s) deleted by Admin. Reason: {}", posts.size(), deletionReason);
    }

    /**
     * Phát thông báo Realtime toàn hệ thống
     */
    public void broadcastSystemNotification(AdminBroadcastRequest request) {
        log.info("[ADMIN] Broadcasting system notification: [{}] - [{}]", request.getTitle(), request.getContent());

        // Lấy tất cả user trong hệ thống để lưu bản ghi thông báo vào Chuông 🔔
        userRepository.findAll().forEach(user -> {
            NotificationEvent event = NotificationEvent.builder()
                    .actorId("ADMIN")
                    .recipientId(user.getId())
                    .type("SYSTEM_ANNOUNCEMENT")
                    .entityId("BROADCAST")
                    .content(request.getTitle() + ": " + request.getContent())
                    .build();

            eventPublisher.publishEvent(event);
        });

        // Phát sóng WebSocket Realtime Broadcast Toast Popup 0ms cho tất cả người dùng đang Online
        try {
            messagingTemplate.convertAndSend("/topic/broadcast", request);
        } catch (Exception e) {
            log.error("Failed to broadcast system notification via WebSocket", e);
        }
    }
}
