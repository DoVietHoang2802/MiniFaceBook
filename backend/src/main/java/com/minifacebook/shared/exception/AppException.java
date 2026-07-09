package com.minifacebook.shared.exception;

import lombok.Getter;

/**
 * Lớp ngoại lệ tùy chỉnh của hệ thống để xử lý các lỗi nghiệp vụ (business logic errors)
 * với mã lỗi ErrorCode định nghĩa trước.
 */
@Getter
public class AppException extends RuntimeException {

  private final ErrorCode errorCode;

  public AppException(ErrorCode errorCode) {
    super(errorCode.getMessage());
    this.errorCode = errorCode;
  }
}
