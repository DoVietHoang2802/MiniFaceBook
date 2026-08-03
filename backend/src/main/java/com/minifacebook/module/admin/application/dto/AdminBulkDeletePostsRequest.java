package com.minifacebook.module.admin.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Data;

@Data
public class AdminBulkDeletePostsRequest {

  @NotEmpty(message = "INVALID_KEY")
  @Size(max = 50, message = "INVALID_KEY")
  private List<@NotBlank(message = "INVALID_KEY") String> postIds;

  @Size(max = 500, message = "INVALID_KEY")
  private String reason;
}
