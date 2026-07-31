package com.minifacebook.module.auth.application.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GoogleProfileCompletionResponse {
  private String suggestedName;
}
