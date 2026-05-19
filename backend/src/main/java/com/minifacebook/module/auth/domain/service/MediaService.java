package com.minifacebook.module.auth.domain.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * Interface nghiệp vụ tải lên và quản lý tệp tin (Media).
 * Đặt tại Domain layer độc lập hoàn toàn với nhà cung cấp dịch vụ lưu trữ đám mây.
 */
public interface MediaService {

  /**
   * Upload ảnh đại diện người dùng lên dịch vụ lưu trữ đám mây.
   */
  String uploadAvatar(MultipartFile file);
}
