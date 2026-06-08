package com.minifacebook.shared.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

/**
 * Bảng mã lỗi tập trung của hệ thống.
 *
 * <p><b>Quy ước:</b> Tên hằng (NAME) viết bằng tiếng Anh làm định danh kỹ thuật cho lập trình viên.
 * Phần message viết bằng tiếng Việt vì đây là nội dung hiển thị trực tiếp cho người dùng cuối trên
 * giao diện (Frontend đọc trường {@code message} để render toast/thông báo).
 */
@Getter
public enum ErrorCode {
  UNCATEGORIZED_EXCEPTION(9999, "Đã có lỗi xảy ra, vui lòng thử lại sau", HttpStatus.INTERNAL_SERVER_ERROR),
  INVALID_KEY(1001, "Dữ liệu không hợp lệ", HttpStatus.BAD_REQUEST),
  USER_EXISTED(1002, "Tài khoản đã tồn tại", HttpStatus.BAD_REQUEST),
  USERNAME_INVALID(1003, "Tên người dùng phải có ít nhất {min} ký tự", HttpStatus.BAD_REQUEST),
  INVALID_PASSWORD(1004, "Mật khẩu phải có ít nhất {min} ký tự", HttpStatus.BAD_REQUEST),
  USER_NOT_EXISTED(1005, "Tài khoản không tồn tại", HttpStatus.NOT_FOUND),
  UNAUTHENTICATED(1006, "Bạn chưa đăng nhập hoặc phiên đã hết hạn", HttpStatus.UNAUTHORIZED),
  UNAUTHORIZED(1007, "Bạn không có quyền thực hiện thao tác này", HttpStatus.FORBIDDEN),
  INVALID_DOB(1008, "Bạn phải đủ ít nhất {min} tuổi", HttpStatus.BAD_REQUEST),
  TOO_MANY_REQUESTS(
      1009, "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút", HttpStatus.TOO_MANY_REQUESTS),
  EMAIL_INVALID(1010, "Địa chỉ email không hợp lệ", HttpStatus.BAD_REQUEST),
  EMAIL_REQUIRED(1011, "Vui lòng nhập email", HttpStatus.BAD_REQUEST),
  PASSWORD_REQUIRED(1012, "Vui lòng nhập mật khẩu", HttpStatus.BAD_REQUEST),
  NAME_REQUIRED(1020, "Vui lòng nhập họ và tên", HttpStatus.BAD_REQUEST),
  NAME_INVALID(1021, "Họ và tên phải có ít nhất {min} ký tự", HttpStatus.BAD_REQUEST),
  USER_NOT_VERIFIED(1013, "Tài khoản chưa được xác thực email", HttpStatus.FORBIDDEN),
  INVALID_VERIFICATION_TOKEN(1014, "Mã xác thực không hợp lệ hoặc đã hết hạn", HttpStatus.BAD_REQUEST),
  REFRESH_TOKEN_EXPIRED(1015, "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại", HttpStatus.UNAUTHORIZED),
  MAX_UPLOAD_SIZE_EXCEEDED(1016, "Kích thước tệp vượt quá giới hạn cho phép (Tối đa 5MB)", HttpStatus.BAD_REQUEST),
  INVALID_FILE_TYPE(1017, "Định dạng tệp không hợp lệ. Chỉ chấp nhận ảnh JPG, PNG, WEBP và GIF.", HttpStatus.BAD_REQUEST),
  UPLOAD_FAILED(1018, "Tải tệp lên thất bại", HttpStatus.INTERNAL_SERVER_ERROR),
  FILE_REQUIRED(1019, "Vui lòng chọn tệp để tải lên", HttpStatus.BAD_REQUEST),

    // ===== FRIENDSHIP (Phase 3) =====
  CANNOT_FRIEND_SELF(2001, "Bạn không thể tự gửi lời mời kết bạn cho chính mình", HttpStatus.BAD_REQUEST),
  FRIEND_REQUEST_EXISTED(2002, "Đã tồn tại một lời mời kết bạn giữa hai người", HttpStatus.BAD_REQUEST),
  ALREADY_FRIENDS(2003, "Hai bạn đã là bạn bè của nhau", HttpStatus.BAD_REQUEST),
  FRIEND_REQUEST_NOT_FOUND(2004, "Không tìm thấy lời mời kết bạn", HttpStatus.NOT_FOUND),
  FRIENDSHIP_NOT_FOUND(2005, "Không tìm thấy mối quan hệ bạn bè", HttpStatus.NOT_FOUND),
  NOT_REQUEST_RECIPIENT(2006, "Bạn không phải là người nhận lời mời này", HttpStatus.FORBIDDEN),
  NOT_REQUEST_SENDER(2007, "Bạn không phải là người gửi lời mời này", HttpStatus.FORBIDDEN),
  INVALID_REQUEST_STATUS(2008, "Lời mời kết bạn này không còn ở trạng thái chờ", HttpStatus.BAD_REQUEST),
  USER_BLOCKED(2009, "Không thể thực hiện do có chặn giữa hai người dùng", HttpStatus.FORBIDDEN),

  // ===== CHAT (Phase 4 - Sprint 4.2) =====
  CONVERSATION_NOT_FOUND(3001, "Không tìm thấy cuộc hội thoại", HttpStatus.NOT_FOUND),
  NOT_A_PARTICIPANT(3002, "Bạn không phải là thành viên của cuộc hội thoại này", HttpStatus.FORBIDDEN),
  CANNOT_CHAT_SELF(3003, "Bạn không thể tự trò chuyện với chính mình", HttpStatus.BAD_REQUEST),
  NOT_FRIENDS(3004, "Hai người phải là bạn bè mới có thể nhắn tin", HttpStatus.BAD_REQUEST),
  MESSAGE_NOT_FOUND(3005, "Không tìm thấy tin nhắn", HttpStatus.NOT_FOUND),
  INVALID_REACTION(3006, "Cảm xúc không hợp lệ", HttpStatus.BAD_REQUEST),
  NOT_MESSAGE_OWNER(3007, "Bạn không phải người gửi tin nhắn này", HttpStatus.FORBIDDEN),
  EDIT_TIME_EXPIRED(3008, "Đã quá thời gian cho phép chỉnh sửa (15 phút)", HttpStatus.BAD_REQUEST),
  DELETE_TIME_EXPIRED(3009, "Đã quá thời gian cho phép thu hồi (15 phút)", HttpStatus.BAD_REQUEST),
  CANNOT_EDIT_NON_TEXT(3010, "Chỉ có thể chỉnh sửa tin nhắn văn bản", HttpStatus.BAD_REQUEST),

  // ===== NOTIFICATION (Phase 5.1) =====
  NOTIFICATION_NOT_FOUND(4001, "Không tìm thấy thông báo", HttpStatus.NOT_FOUND),

  // ===== FORGOT PASSWORD (Phase 5.3 OTP) =====
  INVALID_OTP(1022, "Mã xác thực OTP không chính xác hoặc đã hết hạn", HttpStatus.BAD_REQUEST),
  INVALID_RESET_TOKEN(1023, "Mã xác thực đổi mật khẩu không hợp lệ hoặc đã hết hạn", HttpStatus.BAD_REQUEST),
  PASSWORD_TOO_SHORT(1024, "Mật khẩu mới phải có ít nhất 6 ký tự", HttpStatus.BAD_REQUEST),
  RESET_TOKEN_REQUIRED(1025, "Thiếu mã xác thực đổi mật khẩu", HttpStatus.BAD_REQUEST),
  OTP_REQUIRED(1026, "Vui lòng nhập mã OTP", HttpStatus.BAD_REQUEST),
  OTP_INVALID_SIZE(1027, "Mã OTP phải có đúng 6 chữ số", HttpStatus.BAD_REQUEST),
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
