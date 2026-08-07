package com.minifacebook.module.chat.application.dto;

import java.time.Instant;

/** Text-only message context retained briefly for a user-triggered AI insight. */
public record AiMessageContext(String senderId, String content, Instant createdAt) {}
