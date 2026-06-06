package com.minifacebook.module.chat.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO đại diện cho thông tin thành viên tham gia cuộc trò chuyện (Sprint 4.2).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipantResponse {
  private String id;
  private String name;
  private String avatar;
}
