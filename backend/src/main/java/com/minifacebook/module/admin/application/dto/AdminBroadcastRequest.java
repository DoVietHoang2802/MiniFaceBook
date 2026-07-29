package com.minifacebook.module.admin.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminBroadcastRequest {
    @NotBlank(message = "Vui lòng nhập tiêu đề thông báo")
    private String title;

    @NotBlank(message = "Vui lòng nhập nội dung thông báo")
    private String content;
}
