package com.minifacebook.module.admin.application.dto;

import com.minifacebook.module.auth.domain.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Set;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserResponse {
    private String id;
    private String name;
    private String email;
    private String avatar;
    private Set<Role> roles;
    private boolean verified;
    private boolean banned;
    private boolean isOnline;
    private LocalDateTime createdAt;
}
