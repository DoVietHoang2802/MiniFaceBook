package com.minifacebook.shared.security;

/**
 * Port (Interface) định nghĩa hợp đồng thu hồi Access Token (cross-cutting concern).
 *
 * <p>Đặt ở {@code shared.security} vì port này được dùng bởi cả:
 *
 * <ul>
 *   <li>Module Auth (Application layer) — gọi {@code blacklist()} khi user logout.
 *   <li>Global Infrastructure (Filter chain) — gọi {@code isBlacklisted()} mỗi request.
 * </ul>
 *
 * <p>Implementation cụ thể đặt ở {@code infrastructure.security.TokenBlacklistService} dùng Redis
 * TTL. Tuân thủ Dependency Inversion Principle (DIP) — code nghiệp vụ không phụ thuộc Redis.
 */
public interface TokenBlacklistPort {

  /**
   * Thêm Access Token vào blacklist. Token sẽ bị từ chối cho đến khi hết hạn.
   *
   * @param accessToken JWT Access Token cần thu hồi
   */
  void blacklist(String accessToken);

  /**
   * Kiểm tra Access Token có trong blacklist không.
   *
   * @param accessToken JWT Access Token cần kiểm tra
   * @return true nếu token đã bị thu hồi
   */
  boolean isBlacklisted(String accessToken);
}
