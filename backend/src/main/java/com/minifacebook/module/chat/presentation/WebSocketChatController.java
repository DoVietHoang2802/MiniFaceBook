package com.minifacebook.module.chat.presentation;

import com.minifacebook.module.chat.application.dto.MessageSendRequest;
import com.minifacebook.module.chat.application.service.MessageService;
import jakarta.validation.Valid;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

/**
 * Controller xử lý tin nhắn gửi qua WebSocket STOMP (Sprint 4.3).
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketChatController {

  private final MessageService messageService;

  @MessageMapping("/chat.send")
  public void sendMessage(@Payload @Valid MessageSendRequest request, Principal principal) {
    if (principal == null) {
      log.warn("Nhận tin nhắn chat từ session chưa authenticate");
      return;
    }
    String email = principal.getName();
    log.debug("User [{}] gửi tin nhắn qua WebSocket tới conversation [{}]", email, request.getConversationId());
    messageService.sendMessage(email, request);
  }
}
