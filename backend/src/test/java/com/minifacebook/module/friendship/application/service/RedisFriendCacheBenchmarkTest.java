package com.minifacebook.module.friendship.application.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.minifacebook.BaseIntegrationTest;
import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.auth.infrastructure.persistence.repository.MongoUserRepository;
import com.minifacebook.module.friendship.domain.entity.Friendship;
import com.minifacebook.module.friendship.domain.entity.FriendshipStatus;
import com.minifacebook.module.friendship.domain.repository.FriendshipRepository;
import com.minifacebook.module.friendship.infrastructure.persistence.repository.MongoFriendshipRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;

/**
 * Reproducible local A/B benchmark for the friends-list cache. Run manually with
 * {@code mvn -DrunRedisBenchmark=true -Dtest=RedisFriendCacheBenchmarkTest test}.
 */
@Tag("benchmark")
class RedisFriendCacheBenchmarkTest extends BaseIntegrationTest {

  private static final int FRIEND_COUNT = 50;
  private static final int ITERATIONS = 100;
  private static final String EMAIL = "redis-benchmark-owner@test.com";
  private static final String CACHE_KEY = "user:friends:email:" + EMAIL;

  @Autowired private FriendshipService friendshipService;
  @Autowired private FriendshipRepository friendshipRepository;
  @Autowired private UserRepository userRepository;
  @Autowired private MongoUserRepository mongoUserRepository;
  @Autowired private MongoFriendshipRepository mongoFriendshipRepository;
  @Autowired private StringRedisTemplate redisTemplate;

  @BeforeEach
  void setUp() {
    Assumptions.assumeTrue(Boolean.getBoolean("runRedisBenchmark"));
    mongoFriendshipRepository.deleteAll();
    mongoUserRepository.deleteAll();
    redisTemplate.delete(CACHE_KEY);

    User owner = userRepository.save(
        User.builder().email(EMAIL).name("Benchmark Owner").verified(true).build());
    for (int index = 0; index < FRIEND_COUNT; index++) {
      User friend = userRepository.save(User.builder()
          .email("redis-benchmark-friend-" + index + "@test.com")
          .name("Benchmark Friend " + index)
          .verified(true)
          .build());
      friendshipRepository.save(Friendship.builder()
          .requesterId(owner.getId())
          .addresseeId(friend.getId())
          .status(FriendshipStatus.ACCEPTED)
          .createdAt(Instant.now())
          .build());
    }
  }

  @Test
  void compareMongoCacheMissAndRedisWarmHit() {
    friendshipService.getFriends(EMAIL); // JIT and mapper warm-up; result populates Redis.

    List<Long> mongoPath = new ArrayList<>();
    for (int index = 0; index < ITERATIONS; index++) {
      redisTemplate.delete(CACHE_KEY);
      long startedAt = System.nanoTime();
      assertEquals(FRIEND_COUNT, friendshipService.getFriends(EMAIL).size());
      mongoPath.add(System.nanoTime() - startedAt);
    }

    friendshipService.getFriends(EMAIL); // Ensure a warm Redis value before measuring hits.
    List<Long> redisHit = new ArrayList<>();
    for (int index = 0; index < ITERATIONS; index++) {
      long startedAt = System.nanoTime();
      assertEquals(FRIEND_COUNT, friendshipService.getFriends(EMAIL).size());
      redisHit.add(System.nanoTime() - startedAt);
    }

    printResult("MongoDB cache miss", mongoPath);
    printResult("Redis warm hit", redisHit);
    System.out.printf(Locale.ROOT,
        "REDIS_BENCHMARK improvement_mean=%.1f%% improvement_p95=%.1f%%%n",
        improvement(mean(mongoPath), mean(redisHit)),
        improvement(percentile(mongoPath, 0.95), percentile(redisHit, 0.95)));
  }

  private void printResult(String label, List<Long> samples) {
    System.out.printf(Locale.ROOT,
        "REDIS_BENCHMARK %s n=%d mean=%.3fms p50=%.3fms p95=%.3fms%n",
        label,
        samples.size(),
        toMilliseconds(mean(samples)),
        toMilliseconds(percentile(samples, 0.50)),
        toMilliseconds(percentile(samples, 0.95)));
  }

  private double mean(List<Long> samples) {
    return samples.stream().mapToLong(Long::longValue).average().orElseThrow();
  }

  private long percentile(List<Long> samples, double percentile) {
    List<Long> sorted = new ArrayList<>(samples);
    Collections.sort(sorted);
    return sorted.get((int) Math.ceil(percentile * sorted.size()) - 1);
  }

  private double improvement(double withoutCache, double withCache) {
    return (1 - (withCache / withoutCache)) * 100;
  }

  private double toMilliseconds(double nanoseconds) {
    return nanoseconds / 1_000_000;
  }
}
