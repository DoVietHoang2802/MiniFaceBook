package com.minifacebook.shared.domain.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * Interface nghiệp vụ tải lên và quản lý tệp tin (Media) dùng chung toàn hệ thống.
 * Đặt tại tầng Shared Domain, độc lập hoàn toàn với bên thứ ba hoặc các module nghiệp vụ cụ thể.
 */
public interface MediaService {

  /**
   * Upload ảnh đại diện/hình ảnh lên dịch vụ lưu trữ đám mây.
   *
   * @param file Tệp tin Multipart từ request
   * @return URL bảo mật của tệp tin sau khi upload thành công
   */
  String uploadAvatar(MultipartFile file);
}
