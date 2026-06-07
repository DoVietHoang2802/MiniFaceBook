package com.minifacebook.module.notification.domain.repository;

import com.minifacebook.module.notification.domain.entity.Notification;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Cổng lưu trữ (Port) cho thực thể Notification (Phase 5.1).
 *
 * <p>Định nghĩa ở tầng domain, hiện thực hóa ở tầng infrastructure (adapter MongoDB) — tuân thủ
 * Dependency Inversion của Clean Architecture.
 */
public interface NotificationRepository {

  Notification save(Notification notification);

  Optional<Notification> findById(String id);

  /** Lấy danh sách thông báo của người nhận, mới nhất trước, có phân trang. */
  Page<Notification> findByRecipientId(String recipientId, Pageable pageable);

  /** Đếm số thông báo CHƯA đọc của người nhận. */
  long countUnread(String recipientId);

  /** Đánh dấu tất cả thông báo của người nhận là đã đọc. Trả về số bản ghi đã cập nhật. */
  long markAllAsRead(String recipientId);
}
