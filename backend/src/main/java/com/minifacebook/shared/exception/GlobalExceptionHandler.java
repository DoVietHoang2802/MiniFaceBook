package com.minifacebook.shared.exception;

import com.minifacebook.shared.dto.ApiResponse;
import java.util.Map;
import java.util.Objects;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

  private static final String MIN_ATTRIBUTE = "min";

  // Bắt mọi lỗi chưa được định nghĩa
  @ExceptionHandler(value = Exception.class)
  ResponseEntity<ApiResponse<?>> handlingRuntimeException(RuntimeException exception) {
    log.error("Exception: ", exception);
    ApiResponse<?> apiResponse = new ApiResponse<>();

    apiResponse.setStatus(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode());
    apiResponse.setMessage(ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage());

    return ResponseEntity.status(ErrorCode.UNCATEGORIZED_EXCEPTION.getStatusCode())
        .body(apiResponse);
  }

  // Bắt lỗi do chúng ta chủ động ném ra (AppException)
  @ExceptionHandler(value = AppException.class)
  ResponseEntity<ApiResponse<?>> handlingAppException(AppException exception) {
    ErrorCode errorCode = exception.getErrorCode();
    ApiResponse<?> apiResponse = new ApiResponse<>();

    apiResponse.setStatus(errorCode.getCode());
    apiResponse.setMessage(errorCode.getMessage());

    return ResponseEntity.status(errorCode.getStatusCode()).body(apiResponse);
  }

  // Bắt lỗi khi người dùng không có quyền truy cập (Security)
  @ExceptionHandler(value = AccessDeniedException.class)
  ResponseEntity<ApiResponse<?>> handlingAccessDeniedException(AccessDeniedException exception) {
    ErrorCode errorCode = ErrorCode.UNAUTHORIZED;

    return ResponseEntity.status(errorCode.getStatusCode())
        .body(
            ApiResponse.builder()
                .status(errorCode.getCode())
                .message(errorCode.getMessage())
                .build());
  }

  // Bắt lỗi Validation dữ liệu (ví dụ: @NotNull, @Size...)
  @ExceptionHandler(value = MethodArgumentNotValidException.class)
  ResponseEntity<ApiResponse<?>> handlingValidation(MethodArgumentNotValidException exception) {
    String enumKey = Objects.requireNonNull(exception.getFieldError()).getDefaultMessage();

    ErrorCode errorCode = ErrorCode.INVALID_KEY;
    Map<String, Object> attributes = null;
    try {
      errorCode = ErrorCode.valueOf(enumKey);

      var constraintViolation =
          exception
              .getBindingResult()
              .getAllErrors()
              .getFirst()
              .unwrap(jakarta.validation.ConstraintViolation.class);

      attributes = constraintViolation.getConstraintDescriptor().getAttributes();

      log.info(attributes.toString());

    } catch (IllegalArgumentException e) {
      // Log error if enumKey doesn't match ErrorCode
    }

    ApiResponse<?> apiResponse = new ApiResponse<>();

    apiResponse.setStatus(errorCode.getCode());
    apiResponse.setMessage(
        Objects.nonNull(attributes)
            ? mapAttribute(errorCode.getMessage(), attributes)
            : errorCode.getMessage());

    return ResponseEntity.status(errorCode.getStatusCode()).body(apiResponse);
  }

  private String mapAttribute(String message, Map<String, Object> attributes) {
    String minValue = String.valueOf(attributes.get(MIN_ATTRIBUTE));

    return message.replace("{" + MIN_ATTRIBUTE + "}", minValue);
  }
}
