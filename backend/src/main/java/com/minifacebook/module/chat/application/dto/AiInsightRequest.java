package com.minifacebook.module.chat.application.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class AiInsightRequest {

  @NotNull(message = "INVALID_KEY")
  private AiInsightTask task;
}
