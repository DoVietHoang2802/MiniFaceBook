package com.minifacebook.module.friendship.infrastructure.persistence.repository;

import com.minifacebook.module.friendship.domain.entity.FriendshipStatus;
import com.minifacebook.module.friendship.infrastructure.persistence.document.FriendshipDocument;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

/** Spring Data MongoDB repository cho FriendshipDocument. */
@Repository
public interface MongoFriendshipRepository extends MongoRepository<FriendshipDocument, String> {

  Optional<FriendshipDocument> findByRequesterIdAndAddresseeId(
      String requesterId, String addresseeId);

  List<FriendshipDocument> findByAddresseeIdAndStatus(String addresseeId, FriendshipStatus status);

  List<FriendshipDocument> findByRequesterIdAndStatus(String requesterId, FriendshipStatus status);

  /** Tìm tất cả friendship mà user tham gia (ở 1 trong 2 vai trò) với 1 trạng thái cụ thể. */
  @Query(
      "{ $and: [ { status: ?1 }, { $or: [ { requesterId: ?0 }, { addresseeId: ?0 } ] } ] }")
  List<FriendshipDocument> findAllByUserIdAndStatus(String userId, FriendshipStatus status);
}
