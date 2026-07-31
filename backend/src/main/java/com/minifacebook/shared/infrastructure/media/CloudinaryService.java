package com.minifacebook.shared.infrastructure.media;

import com.cloudinary.Cloudinary;
import com.minifacebook.shared.domain.service.MediaService;
import com.minifacebook.shared.exception.AppException;
import com.minifacebook.shared.exception.ErrorCode;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Triển khai dịch vụ lưu trữ Media sử dụng Cloudinary kết hợp kiểm soát Magic Bytes qua Apache Tika.
 * Đặt tại phân lớp Shared Infrastructure để tất cả các module (Auth, Post, Chat,...) có thể tái sử dụng sạch sẽ.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService implements MediaService {

  private final Cloudinary cloudinary;
  private final Tika tika = new Tika();

  @Value("${app.cloudinary.cloud-name}")
  private String cloudName;

  @Value("${app.cloudinary.api-key}")
  private String apiKey;

  @Value("${app.cloudinary.verify-on-startup:false}")
  private boolean verifyOnStartup;

  private static final List<String> ALLOWED_MIME_TYPES = List.of(
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif"
  );
  private static final long DEFAULT_IMAGE_MAX_BYTES = 5L * 1024 * 1024;
  private static final long POST_IMAGE_MAX_BYTES = 10L * 1024 * 1024;

  @PostConstruct
  void logCloudinaryConfiguration() {
    log.info("Cloudinary upload configured for cloud: {}", cloudName);
    if (!verifyOnStartup || "demo".equals(cloudName) || "1234567890".equals(apiKey)) {
      return;
    }
    try {
      cloudinary.api().ping(Map.of());
      log.info("Cloudinary credentials verified successfully for cloud: {}", cloudName);
    } catch (Exception exception) {
      log.error("Cloudinary credential verification failed for cloud {}: {}", cloudName,
          exception.getMessage());
    }
  }

  @Override
  public String uploadAvatar(MultipartFile file) {
    return uploadImage(file, "miniface/avatars", DEFAULT_IMAGE_MAX_BYTES);
  }

  @Override
  public String uploadCover(MultipartFile file) {
    return uploadImage(file, "miniface/covers", DEFAULT_IMAGE_MAX_BYTES);
  }

  @Override
  public String uploadPostImage(MultipartFile file) {
    return uploadImage(file, "miniface/posts", POST_IMAGE_MAX_BYTES);
  }

  private String uploadImage(MultipartFile file, String folder, long maxFileBytes) {
    if (file == null || file.isEmpty()) {
      throw new AppException(ErrorCode.FILE_REQUIRED);
    }

    if (file.getSize() > maxFileBytes) {
      throw new AppException(ErrorCode.MAX_UPLOAD_SIZE_EXCEEDED);
    }

    try {
      String detectedMimeType = tika.detect(file.getInputStream());
      log.info("Detected MIME type for uploaded file: {} (original content type: {})",
          detectedMimeType, file.getContentType());

      if (!ALLOWED_MIME_TYPES.contains(detectedMimeType.toLowerCase())) {
        log.error("Security alert! Attempt to upload illegal file type: {}", detectedMimeType);
        throw new AppException(ErrorCode.INVALID_FILE_TYPE);
      }
    } catch (IOException e) {
      log.error("Failed to read file input stream for Magic Bytes validation", e);
      throw new AppException(ErrorCode.UPLOAD_FAILED);
    }

    if ("demo".equals(cloudName) || "1234567890".equals(apiKey)) {
      log.error("Cloudinary credentials are not configured; refusing to create a placeholder upload.");
      throw new AppException(ErrorCode.UPLOAD_FAILED);
    }

    try {
      Map<?, ?> uploadResult = cloudinary.uploader().upload(
          file.getBytes(),
          Map.of(
              "folder", folder,
              "allowed_formats", List.of("jpg", "png", "webp", "gif")
          )
      );

      String secureUrl = (String) uploadResult.get("secure_url");
      log.info("File uploaded successfully to Cloudinary folder {}. Secure URL: {}", folder, secureUrl);
      return secureUrl;
    } catch (Exception e) {
      log.error("Cloudinary upload failed for cloud {}: {}", cloudName, e.getMessage(), e);
      throw new AppException(ErrorCode.UPLOAD_FAILED);
    }
  }
}
