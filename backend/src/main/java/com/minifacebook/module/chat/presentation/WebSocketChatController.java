package com.minifacebook.module.chat.presentation;

import com.minifacebook.module.chat.application.dto.MessageSendRequest;
import com.minifacebook.module.chat.application.dto.ReactionRequest;
import com.minifacebook.module.chat.application.dto.TypingRequest;
import com.minifacebook.module.chat.application.service.MessageService;
import com.minifacebook.module.chat.application.service.TypingService;
import jakarta.validation.Valid;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

/**
 * Controller xử lý tin nhắn gửi qua WebSocket STOMP (Sprint 4.3, 4.4).
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketChatController {

  private final MessageService messageService;
  private final TypingService typingService;

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

  /**
   * Nhận sự kiện "đang gõ" / "dừng gõ" qua WebSocket (Sprint 4.4 - Typing Indicator).
   */
  @MessageMapping("/chat.typing")
  public void typing(@Payload @Valid TypingRequest request, Principal principal) {
    if (principal == null) {
      return;
    }
    typingService.handleTyping(principal.getName(), request.getConversationId(), request.isTyping());
  }

  /**
   * Nhận sự kiện thả/gỡ cảm xúc cho tin nhắn qua WebSocket (Sprint 4.4 - Message Reactions).
   */
  @MessageMapping("/chat.react")
  public void react(@Payload @Valid ReactionRequest request, Principal principal) {
    if (principal == null) {
      return;
    }
    messageService.reactToMessage(principal.getName(), request.getMessageId(), request.getEmoji());
  }
}
