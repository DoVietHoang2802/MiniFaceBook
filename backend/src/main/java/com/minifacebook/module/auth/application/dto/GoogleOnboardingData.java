package com.minifacebook.module.auth.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleOnboardingData {
  private String googleSubject;
  private String email;
  private String suggestedName;
}
