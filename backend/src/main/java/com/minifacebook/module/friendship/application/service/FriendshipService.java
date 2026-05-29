package com.minifacebook.module.friendship.application.service;

import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.friendship.application.dto.FriendshipResponse;
import com.minifacebook.module.friendship.domain.entity.Friendship;
import com.minifacebook.module.friendship.domain.entity.FriendshipStatus;
import com.minifacebook.module.friendship.domain.repository.FriendshipRepository;
import com.minifacebook.shared.exception.AppException;
import com.minifacebook.shared.exception.ErrorCode;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Use Case điều phối nghiệp vụ kết bạn (Sprint 3.1).
 *
 * <p>Xử lý: gửi lời mời, hủy lời mời, chấp nhận, từ chối. Đảm bảo các ràng buộc nghiệp vụ như không
 * tự kết bạn với chính mình và không tạo lời mời trùng lặp.
 */
@Service
@RequiredArgsConstructor
public class FriendshipService {

  private final FriendshipRepository friendshipRepository;
  private final UserRepository userRepository;

  /** Gửi lời mời kết bạn từ user hiện tại (theo email) tới addresseeId. */
  @Transactional
  public FriendshipResponse sendRequest(String requesterEmail, String addresseeId) {
    User requester = getUserByEmail(requesterEmail);
    User addressee =
        userRepository
            .findById(addresseeId)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

    if (requester.getId().equals(addressee.getId())) {
      throw new AppException(ErrorCode.CANNOT_FRIEND_SELF);
    }

    Optional<Friendship> existing =
        friendshipRepository.findBetweenUsers(requester.getId(), addressee.getId());

    if (existing.isPresent()) {
      Friendship friendship = existing.get();
      switch (friendship.getStatus()) {
        case ACCEPTED -> throw new AppException(ErrorCode.ALREADY_FRIENDS);
        case BLOCKED -> throw new AppException(ErrorCode.USER_BLOCKED);
        case PENDING -> throw new AppException(ErrorCode.FRIEND_REQUEST_EXISTED);
        case REJECTED -> {
          // Cho phép gửi lại nếu trước đó đã bị từ chối: tái sử dụng bản ghi theo chiều mới.
          friendship.setRequesterId(requester.getId());
          friendship.setAddresseeId(addressee.getId());
          friendship.setStatus(FriendshipStatus.PENDING);
          Friendship saved = friendshipRepository.save(friendship);
          return toResponse(saved, addressee);
        }
        default -> throw new AppException(ErrorCode.FRIEND_REQUEST_EXISTED);
      }
    }

    Friendship friendship =
        Friendship.builder()
            .requesterId(requester.getId())
            .addresseeId(addressee.getId())
            .status(FriendshipStatus.PENDING)
            .build();

    Friendship saved = friendshipRepository.save(friendship);
    return toResponse(saved, addressee);
  }

  /** Hủy lời mời đã gửi. Chỉ người gửi (requester) mới được phép hủy. */
  @Transactional
  public void cancelRequest(String requesterEmail, String friendshipId) {
    User requester = getUserByEmail(requesterEmail);
    Friendship friendship = getPendingFriendship(friendshipId);

    if (!friendship.getRequesterId().equals(requester.getId())) {
      throw new AppException(ErrorCode.NOT_REQUEST_SENDER);
    }

    friendshipRepository.delete(friendship);
  }

  /** Chấp nhận lời mời. Chỉ người nhận (addressee) mới được phép chấp nhận. */
  @Transactional
  public FriendshipResponse acceptRequest(String addresseeEmail, String friendshipId) {
    User addressee = getUserByEmail(addresseeEmail);
    Friendship friendship = getPendingFriendship(friendshipId);

    if (!friendship.getAddresseeId().equals(addressee.getId())) {
      throw new AppException(ErrorCode.NOT_REQUEST_RECIPIENT);
    }

    friendship.setStatus(FriendshipStatus.ACCEPTED);
    Friendship saved = friendshipRepository.save(friendship);

    User requester =
        userRepository
            .findById(saved.getRequesterId())
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    return toResponse(saved, requester);
  }

  /** Từ chối lời mời. Chỉ người nhận (addressee) mới được phép từ chối. */
  @Transactional
  public void rejectRequest(String addresseeEmail, String friendshipId) {
    User addressee = getUserByEmail(addresseeEmail);
    Friendship friendship = getPendingFriendship(friendshipId);

    if (!friendship.getAddresseeId().equals(addressee.getId())) {
      throw new AppException(ErrorCode.NOT_REQUEST_RECIPIENT);
    }

    friendship.setStatus(FriendshipStatus.REJECTED);
    friendshipRepository.save(friendship);
  }

  // ===== Helpers =====

  private User getUserByEmail(String email) {
    return userRepository
        .findByEmail(email)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
  }

  private Friendship getPendingFriendship(String friendshipId) {
    Friendship friendship =
        friendshipRepository
            .findById(friendshipId)
            .orElseThrow(() -> new AppException(ErrorCode.FRIEND_REQUEST_NOT_FOUND));

    if (friendship.getStatus() != FriendshipStatus.PENDING) {
      throw new AppException(ErrorCode.INVALID_REQUEST_STATUS);
    }
    return friendship;
  }

  private FriendshipResponse toResponse(Friendship friendship, User otherUser) {
    return FriendshipResponse.builder()
        .friendshipId(friendship.getId())
        .status(friendship.getStatus())
        .userId(otherUser.getId())
        .email(otherUser.getEmail())
        .avatar(otherUser.getAvatar())
        .bio(otherUser.getBio())
        .createdAt(friendship.getCreatedAt())
        .build();
  }
}
