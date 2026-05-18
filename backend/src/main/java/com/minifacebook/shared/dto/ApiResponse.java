package com.minifacebook.shared.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL) // Chỉ hiện các field không null
public class ApiResponse<T> {

  @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();

  private int status;
  private String message;
  private T data;

  // Static helper để tạo response thành công nhanh
  public static <T> ApiResponse<T> success(T data) {
    return ApiResponse.<T>builder().status(200).message("Success").data(data).build();
  }

  // Static helper để tạo response thành công với message tùy chỉnh
  public static <T> ApiResponse<T> success(String message, T data) {
    return ApiResponse.<T>builder().status(200).message(message).data(data).build();
  }
}
