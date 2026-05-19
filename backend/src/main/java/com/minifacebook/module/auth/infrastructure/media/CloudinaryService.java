package com.minifacebook.module.auth.infrastructure.media;

import com.cloudinary.Cloudinary;
import com.minifacebook.module.auth.domain.service.MediaService;
import com.minifacebook.shared.exception.AppException;
import com.minifacebook.shared.exception.ErrorCode;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Triển khai dịch vụ lưu trữ Media sử dụng Cloudinary kết hợp kiểm soát Magic Bytes qua Apache Tika.
 * Đặt tại phân lớp Infrastructure của Auth module để tuân thủ kiến trúc Clean Architecture.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService implements MediaService {

  private final Cloudinary cloudinary;
  private final Tika tika = new Tika();

  private static final List<String> ALLOWED_MIME_TYPES = List.of(
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif"
  );

  @Override
  public String uploadAvatar(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new AppException(ErrorCode.FILE_REQUIRED);
    }

    // Kiểm tra kích thước file thủ công (phòng hờ Tomcat cấu hình bỏ qua)
    if (file.getSize() > 5 * 1024 * 1024) {
      throw new AppException(ErrorCode.MAX_UPLOAD_SIZE_EXCEEDED);
    }

    // Bảo mật Magic Bytes bằng Apache Tika
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

    // Tiến hành upload lên Cloudinary
    try {
      Map<?, ?> uploadResult = cloudinary.uploader().upload(
          file.getBytes(),
          Map.of(
              "folder", "miniface/avatars",
              "allowed_formats", List.of("jpg", "png", "webp", "gif")
          )
      );

      String secureUrl = (String) uploadResult.get("secure_url");
      log.info("File uploaded successfully to Cloudinary. Secure URL: {}", secureUrl);
      return secureUrl;
    } catch (IOException e) {
      log.error("Cloudinary upload failed", e);
      throw new AppException(ErrorCode.UPLOAD_FAILED);
    }
  }
}
