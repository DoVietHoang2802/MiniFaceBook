package com.minifacebook.module.friendship.application.service;

import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.friendship.application.dto.FriendSuggestionResponse;
import com.minifacebook.module.friendship.application.dto.FriendshipResponse;
import com.minifacebook.module.friendship.application.dto.RelationshipStatus;
import com.minifacebook.module.friendship.application.dto.UserSearchResponse;
import com.minifacebook.module.friendship.domain.entity.Friendship;
import com.minifacebook.module.friendship.domain.entity.FriendshipStatus;
import com.minifacebook.module.friendship.domain.repository.FriendshipRepository;
import com.minifacebook.shared.event.NotificationEvent;
import com.minifacebook.shared.exception.AppException;
import com.minifacebook.shared.exception.ErrorCode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import java.util.concurrent.TimeUnit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Use Case điều phối nghiệp vụ kết bạn.
 *
 * <p><b>Sprint 3.1:</b> gửi/hủy/chấp nhận/từ chối lời mời.
 *
 * <p><b>Sprint 3.2:</b> lấy danh sách bạn bè, lời mời (đến/đã gửi), hủy kết bạn, chặn/bỏ chặn người
 * dùng. Các API danh sách dùng batch-load (`findAllByIds`) để tránh N+1 query.
 *
 * <p><b>Sprint 3.3:</b> tìm kiếm người dùng theo tên kèm trạng thái quan hệ (enrich), loại trừ
 * chính mình và người đã chặn mình.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FriendshipService {

  private final FriendshipRepository friendshipRepository;
  private final UserRepository userRepository;
  private final ApplicationEventPublisher eventPublisher;
  private final StringRedisTemplate redisTemplate;
  private final ObjectMapper objectMapper;

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
          publishFriendRequest(saved, requester.getId(), addressee.getId());
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
    publishFriendRequest(saved, requester.getId(), addressee.getId());
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

    // Thông báo cho người GỬI lời mời rằng đã được chấp nhận (recipient = requester, actor = addressee).
    eventPublisher.publishEvent(
        NotificationEvent.builder()
            .recipientId(saved.getRequesterId())
            .actorId(addressee.getId())
            .type("FRIEND_ACCEPTED")
            .entityId(saved.getId())
            .content("đã chấp nhận lời mời kết bạn của bạn")
            .build());

    evictFriendCaches(saved.getRequesterId(), saved.getAddresseeId());

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

  // ===== Sprint 3.2: List & Management =====

  /** Lấy danh sách bạn bè (đã ACCEPTED) của user hiện tại. Batch-load user info chống N+1. */
  @Transactional(readOnly = true)
  public List<FriendshipResponse> getFriends(String email) {
    String cacheKey = "user:friends:email:" + email;
    try {
      String cachedJson = redisTemplate.opsForValue().get(cacheKey);
      if (cachedJson != null) {
        log.debug("Cache hit for friend list of: {}", email);
        return objectMapper.readValue(cachedJson, new TypeReference<List<FriendshipResponse>>() {});
      }
    } catch (Exception e) {
      log.warn("Failed to read friend list cache for: {}", email, e);
    }

    User me = getUserByEmail(email);
    List<Friendship> friendships = friendshipRepository.findAcceptedByUserId(me.getId());
    List<FriendshipResponse> response = mapWithOtherUser(friendships, me.getId());

    try {
      String json = objectMapper.writeValueAsString(response);
      redisTemplate.opsForValue().set(cacheKey, json, 6, TimeUnit.HOURS);
      log.debug("Cached friend list for: {}", email);
    } catch (Exception e) {
      log.error("Failed to cache friend list for: {}", email, e);
    }

    return response;
  }

  /** Lấy danh sách lời mời ĐANG CHỜ user hiện tại duyệt (user là addressee). */
  @Transactional(readOnly = true)
  public List<FriendshipResponse> getPendingRequests(String email) {
    User me = getUserByEmail(email);
    List<Friendship> friendships =
        friendshipRepository.findByAddresseeIdAndStatus(me.getId(), FriendshipStatus.PENDING);
    return mapWithOtherUser(friendships, me.getId());
  }

  /** Lấy danh sách lời mời user hiện tại ĐÃ GỬI đi (user là requester, còn PENDING). */
  @Transactional(readOnly = true)
  public List<FriendshipResponse> getSentRequests(String email) {
    User me = getUserByEmail(email);
    List<Friendship> friendships =
        friendshipRepository.findByRequesterIdAndStatus(me.getId(), FriendshipStatus.PENDING);
    return mapWithOtherUser(friendships, me.getId());
  }

  /** Hủy kết bạn (Unfriend). Chỉ áp dụng cho quan hệ đã ACCEPTED, một trong hai bên đều gỡ được. */
  @Transactional
  public void unfriend(String email, String friendId) {
    User me = getUserByEmail(email);
    Friendship friendship =
        friendshipRepository
            .findBetweenUsers(me.getId(), friendId)
            .orElseThrow(() -> new AppException(ErrorCode.FRIENDSHIP_NOT_FOUND));

    if (friendship.getStatus() != FriendshipStatus.ACCEPTED) {
      throw new AppException(ErrorCode.FRIENDSHIP_NOT_FOUND);
    }

    friendshipRepository.delete(friendship);
    evictFriendCaches(friendship.getRequesterId(), friendship.getAddresseeId());
  }

  /**
   * Chặn một người dùng. Quy ước: {@code requesterId} = người chặn, {@code addresseeId} = người bị
   * chặn, {@code status = BLOCKED}. Nếu đã tồn tại quan hệ (bất kỳ chiều) thì ghi đè thành BLOCKED
   * với người chặn là user hiện tại.
   */
  @Transactional
  public void blockUser(String email, String targetUserId) {
    User me = getUserByEmail(email);
    User target =
        userRepository
            .findById(targetUserId)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

    if (me.getId().equals(target.getId())) {
      throw new AppException(ErrorCode.CANNOT_FRIEND_SELF);
    }

    Friendship friendship =
        friendshipRepository
            .findBetweenUsers(me.getId(), target.getId())
            .orElse(Friendship.builder().build());

    String prevRequesterId = friendship.getRequesterId();
    String prevAddresseeId = friendship.getAddresseeId();

    friendship.setRequesterId(me.getId()); // người chặn
    friendship.setAddresseeId(target.getId()); // người bị chặn
    friendship.setStatus(FriendshipStatus.BLOCKED);
    friendshipRepository.save(friendship);

    evictFriendCaches(me.getId(), target.getId());
    if (prevRequesterId != null && prevAddresseeId != null) {
      evictFriendCaches(prevRequesterId, prevAddresseeId);
    }
  }

  /** Bỏ chặn. Chỉ người đã chặn (requester của bản ghi BLOCKED) mới được phép gỡ. */
  @Transactional
  public void unblockUser(String email, String targetUserId) {
    User me = getUserByEmail(email);
    Friendship friendship =
        friendshipRepository
            .findBetweenUsers(me.getId(), targetUserId)
            .orElseThrow(() -> new AppException(ErrorCode.FRIENDSHIP_NOT_FOUND));

    if (friendship.getStatus() != FriendshipStatus.BLOCKED) {
      throw new AppException(ErrorCode.FRIENDSHIP_NOT_FOUND);
    }
    // Chỉ người chặn (requester) mới được gỡ chặn.
    if (!friendship.getRequesterId().equals(me.getId())) {
      throw new AppException(ErrorCode.NOT_REQUEST_SENDER);
    }

    friendshipRepository.delete(friendship);
    evictFriendCaches(friendship.getRequesterId(), friendship.getAddresseeId());
  }

  // ===== Sprint 3.3: User Search & Discovery =====

  /**
   * Tìm kiếm người dùng theo tên, kèm trạng thái quan hệ với user hiện tại. Loại trừ chính mình và
   * những người đã chặn user hiện tại (privacy). Có phân trang.
   *
   * <p><b>Ghi chú kỹ thuật:</b> Việc loại trừ (self + người chặn mình) được thực hiện ở tầng service
   * sau khi truy vấn theo tên, vì cần đối chiếu quan hệ friendship. Với quy mô demo (~100 users),
   * cách này đơn giản và chính xác. {@code totalElements} phản ánh tổng kết quả khớp tên (trước lọc)
   * — đủ dùng cho UX phân trang ở quy mô này.
   */
  @Transactional(readOnly = true)
  public Page<UserSearchResponse> searchUsers(String email, String keyword, Pageable pageable) {
    User me = getUserByEmail(email);
    Page<User> result = userRepository.searchByName(keyword, pageable);

    List<UserSearchResponse> enriched =
        result.getContent().stream()
            .filter(user -> !user.getId().equals(me.getId())) // loại chính mình
            .map(
                user -> {
                  Friendship relation =
                      friendshipRepository
                          .findBetweenUsers(me.getId(), user.getId())
                          .orElse(null);
                  return buildSearchResponse(user, me.getId(), relation);
                })
            .filter(java.util.Objects::nonNull) // người chặn mình → null → ẩn đi (privacy)
            .toList();

    return new org.springframework.data.domain.PageImpl<>(
        enriched, pageable, result.getTotalElements());
  }

  /**
   * Xác định trạng thái quan hệ và build DTO kết quả search. Trả về {@code null} nếu cần ẩn user này
   * khỏi kết quả (trường hợp người kia đã chặn user hiện tại - bảo vệ quyền riêng tư).
   */
  private UserSearchResponse buildSearchResponse(
      User user, String currentUserId, Friendship relation) {
    RelationshipStatus status = RelationshipStatus.NONE;
    String friendshipId = null;

    if (relation != null) {
      friendshipId = relation.getId();
      switch (relation.getStatus()) {
        case ACCEPTED -> status = RelationshipStatus.FRIEND;
        case BLOCKED -> {
          if (relation.getRequesterId().equals(currentUserId)) {
            status = RelationshipStatus.BLOCKED; // mình chặn người kia
          } else {
            return null; // người kia chặn mình → ẩn khỏi kết quả (privacy)
          }
        }
        case PENDING -> status =
            relation.getRequesterId().equals(currentUserId)
                ? RelationshipStatus.PENDING_SENT
                : RelationshipStatus.PENDING_RECEIVED;
        default -> status = RelationshipStatus.NONE;
      }
    }

    return UserSearchResponse.builder()
        .userId(user.getId())
        .name(user.getName())
        .email(user.getEmail())
        .avatar(user.getAvatar())
        .bio(user.getBio())
        .relationshipStatus(status)
        .friendshipId(friendshipId)
        .build();
  }

  // ===== Sprint 3.4: Friend Suggestions (Mutual Friends) =====

  /**
   * Gợi ý kết bạn dựa trên thuật toán <b>Mutual Friends</b> (bạn của bạn). Người có càng nhiều bạn
   * chung với user hiện tại càng được ưu tiên.
   *
   * <p><b>Thuật toán:</b>
   *
   * <ol>
   *   <li>Lấy danh sách bạn trực tiếp của tôi (myFriends).
   *   <li>Lấy bạn của tất cả myFriends trong 1 truy vấn batch (chống N+1).
   *   <li>Đếm số lần mỗi candidate xuất hiện = số bạn chung (mutual count).
   *   <li>Loại trừ: chính mình, bạn trực tiếp, và những người đã có quan hệ bất kỳ (PENDING/BLOCKED).
   *   <li>Sắp xếp theo mutual count giảm dần, giới hạn {@code limit}.
   * </ol>
   *
   * <p>Phù hợp quy mô demo (~100 users) - tính toán in-memory, không cần Graph DB.
   */
  @Transactional(readOnly = true)
  public List<FriendSuggestionResponse> getSuggestions(String email, int limit) {
    User me = getUserByEmail(email);
    String myId = me.getId();

    // 1. Bạn trực tiếp của tôi
    List<Friendship> myFriendships = friendshipRepository.findAcceptedByUserId(myId);
    Set<String> myFriendIds =
        myFriendships.stream().map(f -> otherUserId(f, myId)).collect(Collectors.toSet());

    if (myFriendIds.isEmpty()) {
      return List.of(); // Chưa có bạn nào → không thể gợi ý theo mutual
    }

    // 2. Bạn của tất cả bạn tôi (batch 1 query)
    List<Friendship> friendsOfFriends =
        friendshipRepository.findAcceptedByUserIds(new ArrayList<>(myFriendIds));

    // 3. Đếm mutual count cho từng candidate
    Map<String, Integer> mutualCount = new HashMap<>();
    for (Friendship f : friendsOfFriends) {
      // Với mỗi cạnh, 2 đầu đều có thể là candidate (người không phải bạn tôi).
      countCandidate(f.getRequesterId(), myId, myFriendIds, mutualCount);
      countCandidate(f.getAddresseeId(), myId, myFriendIds, mutualCount);
    }

    if (mutualCount.isEmpty()) {
      return List.of();
    }

    // 4. Loại trừ những người đã có quan hệ bất kỳ với tôi (PENDING/BLOCKED/REJECTED còn tồn tại).
    //    (Bạn ACCEPTED đã bị loại ở bước countCandidate qua myFriendIds.)
    Set<String> excluded = new HashSet<>();
    for (String candidateId : mutualCount.keySet()) {
      friendshipRepository
          .findBetweenUsers(myId, candidateId)
          .ifPresent(rel -> excluded.add(candidateId));
    }
    excluded.forEach(mutualCount::remove);

    if (mutualCount.isEmpty()) {
      return List.of();
    }

    // 5. Sắp xếp theo mutual giảm dần + giới hạn
    List<String> topIds =
        mutualCount.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .limit(limit)
            .map(Map.Entry::getKey)
            .toList();

    // Batch-load thông tin user
    Map<String, User> userMap =
        userRepository.findAllByIds(topIds).stream()
            .collect(Collectors.toMap(User::getId, Function.identity()));

    return topIds.stream()
        .map(userMap::get)
        .filter(java.util.Objects::nonNull)
        .map(
            u ->
                FriendSuggestionResponse.builder()
                    .userId(u.getId())
                    .name(u.getName())
                    .email(u.getEmail())
                    .avatar(u.getAvatar())
                    .bio(u.getBio())
                    .mutualFriendsCount(mutualCount.getOrDefault(u.getId(), 0))
                    .build())
        .sorted(Comparator.comparingInt(FriendSuggestionResponse::getMutualFriendsCount).reversed())
        .toList();
  }

  /** Tăng mutual count cho candidate nếu hợp lệ (không phải mình, không phải bạn trực tiếp). */
  private void countCandidate(
      String candidateId, String myId, Set<String> myFriendIds, Map<String, Integer> mutualCount) {
    if (candidateId.equals(myId) || myFriendIds.contains(candidateId)) {
      return; // bỏ qua chính mình và bạn trực tiếp
    }
    mutualCount.put(candidateId, mutualCount.getOrDefault(candidateId, 0) + 1);
  }

  // ===== Helpers =====

  /** Phát event thông báo lời mời kết bạn tới người nhận (addressee). */
  private void publishFriendRequest(Friendship friendship, String requesterId, String addresseeId) {
    eventPublisher.publishEvent(
        NotificationEvent.builder()
            .recipientId(addresseeId)
            .actorId(requesterId)
            .type("FRIEND_REQUEST")
            .entityId(friendship.getId())
            .content("đã gửi cho bạn một lời mời kết bạn")
            .build());
  }

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
    // currentUserId không xác định ở context này → suy ra sentByMe theo requesterId so với otherUser.
    // Nếu otherUser là addressee thì người gửi chính là user hiện tại.
    boolean sentByMe = friendship.getAddresseeId().equals(otherUser.getId());
    return buildResponse(friendship, otherUser, sentByMe);
  }

  /**
   * Map danh sách friendship sang response, batch-load thông tin "người kia" trong MỘT truy vấn
   * (chống N+1). {@code currentUserId} dùng để xác định ai là đối phương và set cờ {@code sentByMe}.
   */
  private List<FriendshipResponse> mapWithOtherUser(
      List<Friendship> friendships, String currentUserId) {
    if (friendships.isEmpty()) {
      return List.of();
    }

    // Thu thập id của "người kia" trong mỗi quan hệ.
    List<String> otherUserIds =
        friendships.stream()
            .map(f -> otherUserId(f, currentUserId))
            .distinct()
            .toList();

    // Batch-load 1 query duy nhất.
    Map<String, User> userMap =
        userRepository.findAllByIds(otherUserIds).stream()
            .collect(Collectors.toMap(User::getId, Function.identity()));

    return friendships.stream()
        .map(
            f -> {
              String otherId = otherUserId(f, currentUserId);
              User otherUser = userMap.get(otherId);
              if (otherUser == null) {
                return null; // user đã bị xóa - bỏ qua
              }
              boolean sentByMe = f.getRequesterId().equals(currentUserId);
              return buildResponse(f, otherUser, sentByMe);
            })
        .filter(java.util.Objects::nonNull)
        .toList();
  }

  /** Xác định id của đối phương trong một quan hệ so với user hiện tại. */
  private String otherUserId(Friendship friendship, String currentUserId) {
    return friendship.getRequesterId().equals(currentUserId)
        ? friendship.getAddresseeId()
        : friendship.getRequesterId();
  }

  private FriendshipResponse buildResponse(
      Friendship friendship, User otherUser, boolean sentByMe) {
    return FriendshipResponse.builder()
        .friendshipId(friendship.getId())
        .status(friendship.getStatus())
        .userId(otherUser.getId())
        .email(otherUser.getEmail())
        .avatar(otherUser.getAvatar())
        .bio(otherUser.getBio())
        .sentByMe(sentByMe)
        .createdAt(friendship.getCreatedAt())
        .build();
  }

  private void evictFriendCaches(String user1Id, String user2Id) {
    try {
      userRepository.findById(user1Id).ifPresent(u -> {
        redisTemplate.delete("user:friends:email:" + u.getEmail());
        log.debug("Evicted friend cache for: {}", u.getEmail());
      });
      userRepository.findById(user2Id).ifPresent(u -> {
        redisTemplate.delete("user:friends:email:" + u.getEmail());
        log.debug("Evicted friend cache for: {}", u.getEmail());
      });
    } catch (Exception e) {
      log.error("Failed to evict friend caches for {} and {}", user1Id, user2Id, e);
    }
  }
}
