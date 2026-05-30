package com.minifacebook.module.friendship.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO trả về cho mỗi kết quả tìm kiếm người dùng. Kèm trạng thái quan hệ ({@link RelationshipStatus})
 * để Frontend hiển thị đúng nút hành động mà không cần gọi thêm API.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSearchResponse {
  private String userId;
  private String name;
  private String email;
  private String avatar;
  private String bio;

  /** Quan hệ giữa user hiện tại và user này. */
  private RelationshipStatus relationshipStatus;

  /**
   * Id của bản ghi friendship (nếu có quan hệ PENDING/FRIEND). Frontend dùng để gọi accept/reject/
   * cancel. Null nếu relationshipStatus = NONE.
   */
  private String friendshipId;
}
