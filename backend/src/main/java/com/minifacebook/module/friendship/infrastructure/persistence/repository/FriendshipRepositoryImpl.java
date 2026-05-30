package com.minifacebook.module.friendship.infrastructure.persistence.repository;

import com.minifacebook.module.friendship.domain.entity.Friendship;
import com.minifacebook.module.friendship.domain.entity.FriendshipStatus;
import com.minifacebook.module.friendship.domain.repository.FriendshipRepository;
import com.minifacebook.module.friendship.infrastructure.mapper.FriendshipMapper;
import com.minifacebook.module.friendship.infrastructure.persistence.document.FriendshipDocument;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Adapter hiện thực hóa FriendshipRepository (Port) bằng MongoDB. Chịu trách nhiệm mapping giữa
 * Domain Entity và Document.
 */
@Component
@RequiredArgsConstructor
public class FriendshipRepositoryImpl implements FriendshipRepository {

  private final MongoFriendshipRepository mongoRepository;
  private final FriendshipMapper mapper;

  @Override
  public Friendship save(Friendship friendship) {
    FriendshipDocument doc = mapper.toDocument(friendship);
    FriendshipDocument saved = mongoRepository.save(doc);
    return mapper.toDomain(saved);
  }

  @Override
  public Optional<Friendship> findById(String id) {
    return mongoRepository.findById(id).map(mapper::toDomain);
  }

  @Override
  public Optional<Friendship> findBetweenUsers(String userIdA, String userIdB) {
    return mongoRepository
        .findByRequesterIdAndAddresseeId(userIdA, userIdB)
        .or(() -> mongoRepository.findByRequesterIdAndAddresseeId(userIdB, userIdA))
        .map(mapper::toDomain);
  }

  @Override
  public List<Friendship> findByAddresseeIdAndStatus(String addresseeId, FriendshipStatus status) {
    return mongoRepository.findByAddresseeIdAndStatus(addresseeId, status).stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public List<Friendship> findByRequesterIdAndStatus(String requesterId, FriendshipStatus status) {
    return mongoRepository.findByRequesterIdAndStatus(requesterId, status).stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public List<Friendship> findAcceptedByUserId(String userId) {
    return mongoRepository.findAllByUserIdAndStatus(userId, FriendshipStatus.ACCEPTED).stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public List<Friendship> findAcceptedByUserIds(List<String> userIds) {
    return mongoRepository.findAllByUserIdsAndStatus(userIds, FriendshipStatus.ACCEPTED).stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public void delete(Friendship friendship) {
    if (friendship.getId() != null) {
      mongoRepository.deleteById(friendship.getId());
    }
  }
}
