package com.minifacebook.module.chat.application.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

@ExtendWith(MockitoExtension.class)
class ChatAiInsightServiceTest {

  @Mock private ConversationRepository conversationRepository;
  @Mock private MessageRepository messageRepository;
  @Mock private UserRepository userRepository;
  @Mock private StringRedisTemplate redisTemplate;
  @Mock private ValueOperations<String, String> valueOperations;
  @Mock private ChatAiClient chatAiClient;

  private ChatAiInsightService chatAiInsightService;
  private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
  private final User user = User.builder().id("user-1").email("me@test.com").build();

  @BeforeEach
  void setUp() {
    AiProperties properties = new AiProperties();
    properties.setDailyLimit(10);
    properties.setMessageLimit(50);
    properties.setCooldownSeconds(60);
    chatAiInsightService = new ChatAiInsightService(
        conversationRepository,
        messageRepository,
        userRepository,
        redisTemplate,
        objectMapper,
        properties,
        chatAiClient);
    when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
    when(conversationRepository.findById("conversation-1")).thenReturn(Optional.of(
        Conversation.builder().id("conversation-1").participantIds(List.of("user-1", "user-2")).build()));
  }

  @Test
  void generateInsight_UsesUnreadSnapshotAndReturnsRemainingDailyUses() throws Exception {
    String snapshot = objectMapper.writeValueAsString(List.of(
        new AiMessageContext("user-2", "Tối nay mình gặp nhé", Instant.parse("2026-08-07T01:00:00Z"))));
    when(valueOperations.get("ai:unread-snapshot:conversation-1:user-1")).thenReturn(snapshot);
    when(valueOperations.setIfAbsent(
        "ai:cooldown:user-1:conversation-1:UNREAD_SUMMARY", "1", java.time.Duration.ofSeconds(60)))
        .thenReturn(true);
    when(valueOperations.increment(dailyUsageKey())).thenReturn(1L);
    when(chatAiClient.generate(AiInsightTask.UNREAD_SUMMARY, "Người kia: Tối nay mình gặp nhé\n"))
        .thenReturn("- Người kia muốn gặp tối nay.");

    AiInsightResponse result = chatAiInsightService.generateInsight(
        user.getEmail(), "conversation-1", AiInsightTask.UNREAD_SUMMARY);

    assertEquals("- Người kia muốn gặp tối nay.", result.getInsight());
    assertEquals(9, result.getRemainingDailyUses());
    assertEquals(1, result.getSourceMessageCount());
    verify(messageRepository, never()).findRecentUnreadTextMessages(
        "conversation-1", "user-1", 50);
  }

  @Test
  void generateInsight_RejectsRequestsPastDailyLimitBeforeCallingProvider() throws Exception {
    String snapshot = objectMapper.writeValueAsString(List.of(
        new AiMessageContext("user-2", "Mình ổn", Instant.parse("2026-08-07T01:00:00Z"))));
    when(valueOperations.get("ai:unread-snapshot:conversation-1:user-1")).thenReturn(snapshot);
    when(valueOperations.setIfAbsent(
        "ai:cooldown:user-1:conversation-1:EMOTION_ANALYSIS", "1", java.time.Duration.ofSeconds(60)))
        .thenReturn(true);
    when(valueOperations.increment(dailyUsageKey())).thenReturn(11L);

    AppException exception = assertThrows(AppException.class, () -> chatAiInsightService.generateInsight(
        user.getEmail(), "conversation-1", AiInsightTask.EMOTION_ANALYSIS));

    assertEquals(ErrorCode.AI_DAILY_LIMIT_EXCEEDED, exception.getErrorCode());
    verify(chatAiClient, never()).generate(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
  }

  private String dailyUsageKey() {
    return "ai:daily-usage:" + LocalDate.now(ZoneOffset.UTC) + ":user-1";
  }
}
