package com.minifacebook.shared.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
  UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
  INVALID_KEY(1001, "Uncategorized error", HttpStatus.BAD_REQUEST),
  USER_EXISTED(1002, "User existed", HttpStatus.BAD_REQUEST),
  USERNAME_INVALID(1003, "Username must be at least {min} characters", HttpStatus.BAD_REQUEST),
  INVALID_PASSWORD(1004, "Password must be at least {min} characters", HttpStatus.BAD_REQUEST),
  USER_NOT_EXISTED(1005, "User not existed", HttpStatus.NOT_FOUND),
  UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),
  UNAUTHORIZED(1007, "You do not have permission", HttpStatus.FORBIDDEN),
  INVALID_DOB(1008, "Your age must be at least {min}", HttpStatus.BAD_REQUEST),
  TOO_MANY_REQUESTS(
      1009, "Too many requests, please try again later", HttpStatus.TOO_MANY_REQUESTS),
  EMAIL_INVALID(1010, "Email address is invalid", HttpStatus.BAD_REQUEST),
  EMAIL_REQUIRED(1011, "Email cannot be blank", HttpStatus.BAD_REQUEST),
  PASSWORD_REQUIRED(1012, "Password cannot be blank", HttpStatus.BAD_REQUEST),
  USER_NOT_VERIFIED(1013, "User email is not verified", HttpStatus.FORBIDDEN),
  INVALID_VERIFICATION_TOKEN(1014, "Invalid or expired verification token", HttpStatus.BAD_REQUEST),
  REFRESH_TOKEN_EXPIRED(1015, "Refresh token has expired or is invalid", HttpStatus.UNAUTHORIZED),
  MAX_UPLOAD_SIZE_EXCEEDED(1016, "File upload size exceeded limit (Max 5MB)", HttpStatus.BAD_REQUEST),
  INVALID_FILE_TYPE(1017, "Invalid file type. Only JPG, PNG, WEBP, and GIF images are allowed.", HttpStatus.BAD_REQUEST),
  UPLOAD_FAILED(1018, "File upload failed", HttpStatus.INTERNAL_SERVER_ERROR),
  FILE_REQUIRED(1019, "File is required", HttpStatus.BAD_REQUEST),
  ;

  ErrorCode(int code, String message, HttpStatusCode statusCode) {
    this.code = code;
    this.message = message;
    this.statusCode = statusCode;
  }

  private final int code;
  private final String message;
  private final HttpStatusCode statusCode;
}
