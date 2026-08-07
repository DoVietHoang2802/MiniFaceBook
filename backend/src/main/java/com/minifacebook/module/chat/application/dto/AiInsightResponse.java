package com.minifacebook.module.chat.application.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AiInsightResponse {
  private final AiInsightTask task;
  private final String insight;
  private final int sourceMessageCount;
  private final int remainingDailyUses;
}
