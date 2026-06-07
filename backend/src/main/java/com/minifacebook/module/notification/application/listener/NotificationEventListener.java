package com.minifacebook.module.notification.application.listener;

import com.minifacebook.module.notification.application.service.NotificationService;
import com.minifacebook.module.notification.domain.entity.NotificationType;
import com.minifacebook.shared.event.NotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Lắng nghe {@link NotificationEvent} từ các module nghiệp vụ (Post/Friendship) và tạo thông báo
 * (Phase 5.1).
 *
 * <p><b>Vì sao {@code @TransactionalEventListener(AFTER_COMMIT)}:</b> chỉ tạo thông báo SAU KHI
 * giao dịch nguồn commit thành công — tránh thông báo "ma" khi nghiệp vụ rollback (vd: gửi lời mời
 * lỗi nhưng đã bắn thông báo).
 *
 * <p><b>Vì sao {@code @Async}:</b> xử lý ở luồng riêng để không làm chậm request gốc (gửi lời
 * mời/like trả về ngay, việc tạo thông báo chạy nền).
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class NotificationEventListener {

  private final NotificationService notificationService;

  @Async
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
  public void onNotificationEvent(NotificationEvent event) {
    try {
      NotificationType type = NotificationType.valueOf(event.getType());
      notificationService.createNotification(
          event.getRecipientId(),
          event.getActorId(),
          type,
          event.getEntityId(),
          event.getContent());
    } catch (IllegalArgumentException ex) {
      // type không khớp enum → bỏ qua, không làm crash luồng nghiệp vụ.
      log.warn("Bỏ qua NotificationEvent với type không hợp lệ: {}", event.getType());
    } catch (Exception ex) {
      log.error("Lỗi khi xử lý NotificationEvent: {}", ex.getMessage(), ex);
    }
  }
}
