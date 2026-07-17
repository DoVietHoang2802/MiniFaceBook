package com.minifacebook.shared.infrastructure.media;

import com.cloudinary.Cloudinary;
import com.minifacebook.shared.domain.service.MediaService;
import com.minifacebook.shared.exception.AppException;
import com.minifacebook.shared.exception.ErrorCode;
import java.io.IOException;
import java.util.List;
import java.util.Map;
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

  private static final List<String> ALLOWED_MIME_TYPES = List.of(
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif"
  );

  @Override
  public String uploadAvatar(MultipartFile file) {
    return uploadImage(file, "miniface/avatars", 400, 400);
  }

  @Override
  public String uploadCover(MultipartFile file) {
    return uploadImage(file, "miniface/covers", 1600, 500);
  }

  private String uploadImage(MultipartFile file, String folder, int sandboxW, int sandboxH) {
    if (file == null || file.isEmpty()) {
      throw new AppException(ErrorCode.FILE_REQUIRED);
    }

    if (file.getSize() > 5 * 1024 * 1024) {
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
      log.warn("[SANDBOX FALLBACK] Mock Cloudinary credentials detected. "
          + "Simulating successful upload with Picsum placeholder.");
      return "https://picsum.photos/seed/" + java.util.UUID.randomUUID()
          + "/" + sandboxW + "/" + sandboxH;
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
    } catch (IOException e) {
      log.error("Cloudinary upload failed", e);
      throw new AppException(ErrorCode.UPLOAD_FAILED);
    }
  }
}
