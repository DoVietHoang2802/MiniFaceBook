package com.minifacebook.module.notification.application.service;

import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.notification.application.dto.NotificationResponse;
import com.minifacebook.module.notification.domain.entity.Notification;
import com.minifacebook.module.notification.domain.entity.NotificationType;
import com.minifacebook.module.notification.domain.repository.NotificationRepository;
import com.minifacebook.shared.exception.AppException;
import com.minifacebook.shared.exception.ErrorCode;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Use Case điều phối nghiệp vụ Thông báo (Phase 5.1 - Notification Center).
 *
 * <p><b>Vì sao tách riêng khỏi module nguồn:</b> các module Post/Friendship chỉ phát
 * {@code NotificationEvent}; service này lắng nghe (qua listener) rồi xử lý — giữ decoupling, module
 * nguồn không biết gì về Notification.
 *
 * <p><b>Realtime:</b> đẩy thông báo tới đúng người nhận qua STOMP {@code /user/queue/notifications}
 * (tái dùng hạ tầng WebSocket của Chat). FE nghe để bật chuông + tăng badge.
 *
 * <p><b>Redis cache:</b> đếm số chưa đọc cache ở {@code notif:unread:<userId>} (TTL 1 ngày) để
 * tránh đếm DB mỗi lần load badge; invalidate khi có thông báo mới / đánh dấu đã đọc.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationService {

  private final NotificationRepository notificationRepository;
  private final UserRepository userRepository;
  private final SimpMessagingTemplate messagingTemplate;
  private final StringRedisTemplate redisTemplate;
  private final NotificationEventBroadcaster notificationEventBroadcaster;

  private static final String UNREAD_KEY_PREFIX = "notif:unread:";
  private static final Duration UNREAD_TTL = Duration.ofDays(1);

  /**
   * Tạo thông báo từ event nghiệp vụ (do listener gọi, chạy async).
   *
   * <p>Self-guard: nếu actor trùng recipient (tự like bài mình...) thì BỎ QUA — giống Facebook.
   */
  @Transactional
  public void createNotification(
      String recipientId, String actorId, NotificationType type, String entityId, String content) {
    // Self-guard: không thông báo cho hành động của chính mình.
    if (recipientId == null || recipientId.equals(actorId)) {
      return;
    }

    Notification notification =
        Notification.builder()
            .recipientId(recipientId)
            .actorId(actorId)
            .type(type)
            .entityId(entityId)
            .content(content)
            .isRead(false)
            .createdAt(Instant.now())
            .build();

    Notification saved = notificationRepository.save(notification);

    // Invalidate cache unread để lần đếm sau lấy số mới.
    redisTemplate.delete(UNREAD_KEY_PREFIX + recipientId);

    // Đẩy realtime tới người nhận (nếu đang online). Lấy email làm principal name cho STOMP.
    userRepository
        .findById(recipientId)
        .ifPresent(
            recipient -> {
              NotificationResponse payload = toResponse(saved, resolveActor(actorId));
              // WebSocket (legacy)
              messagingTemplate.convertAndSendToUser(
                  recipient.getEmail(), "/queue/notifications", payload);
              log.debug(
                  "Pushed realtime notification type={} to user={} (queue /user/queue/notifications)",
                  type,
                  recipient.getEmail());
              // SSE broadcast (mới)
              notificationEventBroadcaster.broadcast(payload);
            });

    log.debug("Created notification type={} for recipient={}", type, recipientId);
  }

  /** Lấy danh sách thông báo (notification center), enrich thông tin actor, phân trang. */
  @Transactional(readOnly = true)
  public Page<NotificationResponse> getNotifications(String email, Pageable pageable) {
    User me = getUserByEmail(email);
    Page<Notification> page = notificationRepository.findByRecipientId(me.getId(), pageable);

    if (page.isEmpty()) {
      return Page.empty(pageable);
    }

    // Batch-load actor (chống N+1).
    List<String> actorIds = page.getContent().stream().map(Notification::getActorId).distinct().toList();
    Map<String, User> actorMap =
        userRepository.findAllByIds(actorIds).stream()
            .collect(Collectors.toMap(User::getId, Function.identity()));

    return page.map(n -> toResponse(n, actorMap.get(n.getActorId())));
  }

  /**
   * Đếm số thông báo chưa đọc cho badge chuông. Đọc từ Redis cache trước; miss thì đếm DB rồi cache
   * lại.
   */
  @Transactional(readOnly = true)
  public long getUnreadCount(String email) {
    User me = getUserByEmail(email);
    String key = UNREAD_KEY_PREFIX + me.getId();

    String cached = redisTemplate.opsForValue().get(key);
    if (cached != null) {
      try {
        return Long.parseLong(cached);
      } catch (NumberFormatException ignored) {
        // cache hỏng → đếm lại
      }
    }

    long count = notificationRepository.countUnread(me.getId());
    redisTemplate.opsForValue().set(key, String.valueOf(count), UNREAD_TTL);
    return count;
  }

  /** Đánh dấu một thông báo là đã đọc. Chỉ chủ sở hữu mới được phép. */
  @Transactional
  public void markAsRead(String email, String notificationId) {
    User me = getUserByEmail(email);
    Notification notification =
        notificationRepository
            .findById(notificationId)
            .orElseThrow(() -> new AppException(ErrorCode.NOTIFICATION_NOT_FOUND));

    if (!notification.getRecipientId().equals(me.getId())) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    if (!notification.isRead()) {
      notification.setRead(true);
      notificationRepository.save(notification);
      redisTemplate.delete(UNREAD_KEY_PREFIX + me.getId());
    }
  }

  /** Đánh dấu tất cả thông báo của user là đã đọc (nút "Đánh dấu tất cả đã đọc"). */
  @Transactional
  public void markAllAsRead(String email) {
    User me = getUserByEmail(email);
    notificationRepository.markAllAsRead(me.getId());
    redisTemplate.delete(UNREAD_KEY_PREFIX + me.getId());
  }

  // ===== Helpers =====

  private User resolveActor(String actorId) {
    return userRepository.findById(actorId).orElse(null);
  }

  private NotificationResponse toResponse(Notification n, User actor) {
    return NotificationResponse.builder()
        .id(n.getId())
        .recipientId(n.getRecipientId())
        .actorId(n.getActorId())
        .actorName(actor != null ? actor.getName() : "Người dùng")
        .actorAvatar(actor != null ? actor.getAvatar() : null)
        .type(n.getType())
        .entityId(n.getEntityId())
        .content(n.getContent())
        .isRead(n.isRead())
        .createdAt(n.getCreatedAt())
        .build();
  }

  private User getUserByEmail(String email) {
    return userRepository
        .findByEmail(email)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
  }
}
