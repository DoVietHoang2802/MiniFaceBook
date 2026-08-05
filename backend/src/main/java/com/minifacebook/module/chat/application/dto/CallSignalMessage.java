package com.minifacebook.module.chat.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CallSignalMessage {
    private String callId;
    private String type; // "OFFER", "ANSWER", "ICE_CANDIDATE", "REJECT", "END"
    private String callerId;
    private String callerName;
    private String callerAvatar;
    private String calleeId;
    private Object sdp;
    private Object candidate;
    private Boolean isVideo;
}
