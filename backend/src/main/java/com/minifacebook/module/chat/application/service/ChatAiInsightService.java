package com.minifacebook.module.chat.application.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.minifacebook.module.chat.application.config.AiProperties;
import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.chat.application.dto.AiInsightResponse;
import com.minifacebook.module.chat.application.dto.AiInsightTask;
import com.minifacebook.module.chat.application.dto.AiMessageContext;
import com.minifacebook.module.chat.application.port.ChatAiClient;
import com.minifacebook.module.chat.domain.entity.Conversation;
import com.minifacebook.module.chat.domain.repository.ConversationRepository;
import com.minifacebook.module.chat.domain.repository.MessageRepository;
import com.minifacebook.shared.exception.AppException;
import com.minifacebook.shared.exception.ErrorCode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ChatAiInsightService {

  private static final String SNAPSHOT_KEY_PREFIX = "ai:unread-snapshot:";
  private static final String DAILY_USAGE_KEY_PREFIX = "ai:daily-usage:";
  private static final String COOLDOWN_KEY_PREFIX = "ai:cooldown:";
  private static final int MAX_MESSAGE_CHARACTERS = 500;
  private static final int MAX_TRANSCRIPT_CHARACTERS = 12_000;

  private final ConversationRepository conversationRepository;
  private final MessageRepository messageRepository;
  private final UserRepository userRepository;
  private final StringRedisTemplate redisTemplate;
  private final ObjectMapper objectMapper;
  private final AiProperties aiProperties;
  private final ChatAiClient chatAiClient;

  public AiInsightResponse generateInsight(String email, String conversationId, AiInsightTask task) {
    User currentUser = userRepository.findByEmail(email)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    Conversation conversation = conversationRepository.findById(conversationId)
        .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));
    if (!conversation.getParticipantIds().contains(currentUser.getId())) {
      throw new AppException(ErrorCode.NOT_A_PARTICIPANT);
    }

    List<AiMessageContext> context = loadUnreadContext(conversationId, currentUser.getId());
    if (context.isEmpty()) {
      throw new AppException(ErrorCode.AI_NO_UNREAD_MESSAGES);
    }

    String transcript = buildTranscript(context, currentUser.getId());
    int usage = reserveUsage(currentUser.getId(), conversationId, task);
    try {
      String insight = chatAiClient.generate(task, transcript);
      return AiInsightResponse.builder()
          .task(task)
          .insight(insight)
          .sourceMessageCount(context.size())
          .remainingDailyUses(Math.max(0, aiProperties.getDailyLimit() - usage))
          .build();
    } catch (AppException exception) {
      releaseUsage(currentUser.getId());
      redisTemplate.delete(cooldownKey(currentUser.getId(), conversationId, task));
      throw exception;
    }
  }

  private List<AiMessageContext> loadUnreadContext(String conversationId, String userId) {
    String snapshot = redisTemplate.opsForValue().get(snapshotKey(conversationId, userId));
    if (snapshot != null) {
      try {
        List<AiMessageContext> cached = objectMapper.readValue(
            snapshot, new TypeReference<List<AiMessageContext>>() {});
        if (!cached.isEmpty()) {
          return cached;
        }
      } catch (Exception exception) {
        log.warn("Discarding unread AI context snapshot for conversation {}", conversationId);
        redisTemplate.delete(snapshotKey(conversationId, userId));
      }
    }

    return messageRepository.findRecentUnreadTextMessages(
            conversationId, userId, aiProperties.getMessageLimit())
        .stream()
        .map(message -> new AiMessageContext(
            message.getSenderId(), message.getContent(), message.getCreatedAt()))
        .toList();
  }

  private String buildTranscript(List<AiMessageContext> context, String currentUserId) {
    StringBuilder transcript = new StringBuilder();
    for (AiMessageContext message : context.stream()
        .sorted(Comparator.comparing(
            AiMessageContext::createdAt, Comparator.nullsLast(Comparator.naturalOrder())))
        .toList()) {
      String text = message.content() == null ? "" : message.content().trim();
      if (text.isBlank()) {
        continue;
      }
      String clipped = text.length() > MAX_MESSAGE_CHARACTERS
          ? text.substring(0, MAX_MESSAGE_CHARACTERS) + "..."
          : text;
      String speaker = currentUserId.equals(message.senderId()) ? "Bạn" : "Người kia";
      if (transcript.length() + speaker.length() + clipped.length() + 3 > MAX_TRANSCRIPT_CHARACTERS) {
        break;
      }
      transcript.append(speaker).append(": ").append(clipped).append('\n');
    }
    if (transcript.isEmpty()) {
      throw new AppException(ErrorCode.AI_NO_UNREAD_MESSAGES);
    }
    return transcript.toString();
  }

  private int reserveUsage(String userId, String conversationId, AiInsightTask task) {
    String cooldownKey = cooldownKey(userId, conversationId, task);
    Boolean accepted = redisTemplate.opsForValue().setIfAbsent(
        cooldownKey, "1", Duration.ofSeconds(aiProperties.getCooldownSeconds()));
    if (!Boolean.TRUE.equals(accepted)) {
      throw new AppException(ErrorCode.AI_COOLDOWN_ACTIVE);
    }

    String usageKey = usageKey(userId);
    Long usage = redisTemplate.opsForValue().increment(usageKey);
    if (usage == null) {
      redisTemplate.delete(cooldownKey);
      throw new AppException(ErrorCode.AI_UNAVAILABLE);
    }
    if (usage == 1) {
      ZonedDateTime tomorrow = LocalDate.now(ZoneOffset.UTC).plusDays(1).atStartOfDay(ZoneOffset.UTC);
      redisTemplate.expireAt(usageKey, tomorrow.toInstant());
    }
    if (usage > aiProperties.getDailyLimit()) {
      redisTemplate.opsForValue().decrement(usageKey);
      redisTemplate.delete(cooldownKey);
      throw new AppException(ErrorCode.AI_DAILY_LIMIT_EXCEEDED);
    }
    return usage.intValue();
  }

  private void releaseUsage(String userId) {
    String key = usageKey(userId);
    Long usage = redisTemplate.opsForValue().decrement(key);
    if (usage != null && usage <= 0) {
      redisTemplate.delete(key);
    }
  }

  private String snapshotKey(String conversationId, String userId) {
    return SNAPSHOT_KEY_PREFIX + conversationId + ":" + userId;
  }

  private String usageKey(String userId) {
    return DAILY_USAGE_KEY_PREFIX + LocalDate.now(ZoneOffset.UTC) + ":" + userId;
  }

  private String cooldownKey(String userId, String conversationId, AiInsightTask task) {
    return COOLDOWN_KEY_PREFIX + userId + ":" + conversationId + ":" + task.name();
  }
}
