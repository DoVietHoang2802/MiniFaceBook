package com.minifacebook.module.friendship.domain.repository;

import com.minifacebook.module.friendship.domain.entity.Friendship;
import com.minifacebook.module.friendship.domain.entity.FriendshipStatus;
import java.util.List;
import java.util.Optional;

/**
 * Cổng lưu trữ (Port) của thực thể Friendship. Định nghĩa tại tầng Domain, hiện thực hóa tại tầng
 * Infrastructure - tuân thủ Dependency Rule của Clean Architecture.
 */
public interface FriendshipRepository {

  Friendship save(Friendship friendship);

  Optional<Friendship> findById(String id);

  /** Tìm mối quan hệ giữa 2 user bất kể ai là người gửi/nhận (xét cả 2 chiều). */
  Optional<Friendship> findBetweenUsers(String userIdA, String userIdB);

  /** Lấy danh sách friendship theo trạng thái mà user là người nhận (addressee). */
  List<Friendship> findByAddresseeIdAndStatus(String addresseeId, FriendshipStatus status);

  /** Lấy danh sách friendship theo trạng thái mà user là người gửi (requester). */
  List<Friendship> findByRequesterIdAndStatus(String requesterId, FriendshipStatus status);

  /** Lấy tất cả friendship đã ACCEPTED mà user tham gia (cả 2 chiều). */
  List<Friendship> findAcceptedByUserId(String userId);

  /**
   * Lấy tất cả friendship ACCEPTED của NHIỀU user trong một truy vấn (batch). Phục vụ thuật toán
   * Mutual Friends - chống N+1.
   */
  List<Friendship> findAcceptedByUserIds(List<String> userIds);

  void delete(Friendship friendship);
}
