package com.minifacebook.module.chat.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request chỉnh sửa nội dung tin nhắn (Sprint 4.5).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EditMessageRequest {

  @NotBlank(message = "Nội dung không được để trống")
  private String content;
}
