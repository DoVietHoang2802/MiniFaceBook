package com.minifacebook.module.chat.presentation;

import com.minifacebook.module.chat.application.dto.CallSignalMessage;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Controller
@RequiredArgsConstructor
@Slf4j
public class CallSignalingController {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    // Track active user calls (userId -> peerUserId) for automatic cleanup on disconnect/F5
    private static final Map<String, String> ACTIVE_USER_CALLS = new ConcurrentHashMap<>();

    @MessageMapping("/call.signal")
    public void handleCallSignal(@Payload CallSignalMessage message, Principal principal) {
        if (principal == null || message == null || message.getCalleeId() == null) {
            return;
        }

        String type = message.getType();
        String callerId = message.getCallerId();
        String calleeId = message.getCalleeId();

        log.debug("Relaying WebRTC call signal [{}] from [{}] to [{}]", type, callerId, calleeId);

        if ("OFFER".equals(type) || "ANSWER".equals(type)) {
            ACTIVE_USER_CALLS.put(callerId, calleeId);
            ACTIVE_USER_CALLS.put(calleeId, callerId);
        } else if ("END".equals(type) || "REJECT".equals(type) || "CANCEL".equals(type)) {
            ACTIVE_USER_CALLS.remove(callerId);
            ACTIVE_USER_CALLS.remove(calleeId);
        }

        // Transfer WebRTC signal to the target user topic /topic/call/{calleeId}
        messagingTemplate.convertAndSend("/topic/call/" + calleeId, message);
    }

    /**
     * Automatic cleanup when a user F5s, reloads page, or closes browser tab.
     * Instantly notifies the peer to close their call modal.
     */
    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        Principal principal = event.getUser();
        if (principal == null) return;

        String email = principal.getName();
        userRepository.findByEmail(email).ifPresent(user -> {
            String userId = user.getId();
            String peerUserId = ACTIVE_USER_CALLS.remove(userId);
            if (peerUserId != null) {
                ACTIVE_USER_CALLS.remove(peerUserId);
                log.info("[WebRTC] User [{}] disconnected during call. Sending END signal to peer [{}]", userId, peerUserId);
                
                CallSignalMessage endMsg = CallSignalMessage.builder()
                        .type("END")
                        .callerId(userId)
                        .calleeId(peerUserId)
                        .build();

                messagingTemplate.convertAndSend("/topic/call/" + peerUserId, endMsg);
            }
        });
    }
}
