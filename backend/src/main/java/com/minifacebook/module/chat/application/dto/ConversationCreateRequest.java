package com.minifacebook.module.chat.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO yêu cầu tạo cuộc trò chuyện mới (Sprint 4.2).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationCreateRequest {
  @NotBlank(message = "ID người nhận không được để trống")
  private String recipientId;
}
