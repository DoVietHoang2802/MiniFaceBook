package com.minifacebook.module.post.application.service;

import com.minifacebook.module.post.application.dto.CommentReactionEvent;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Broadcast reaction updates cho một bình luận tới tất cả clients đang xem (realtime).
 *
 * <p>Gửi tới topic công khai /topic/comment.<commentId>. Ai đang mở comment section
 * (FE subscribe topic đó) sẽ nhận được update khi có thay đổi reaction.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class CommentRealtimeBroadcaster {

  private final SimpMessagingTemplate messagingTemplate;

  /**
   * Broadcast reaction counts và user's own reaction tới topic của comment.
   *
   * @param commentId ID của bình luận
   * @param reactionCounts Map reaction type → count (từ DB)
   * @param userReaction Reaction hiện tại của user đã vừa thay đổi (có thể null nếu đã xóa)
   */
  public void broadcastReactionUpdate(
      String commentId,
      Map<String, Integer> reactionCounts,
      String userReaction) {

    CommentReactionEvent event =
        CommentReactionEvent.builder()
            .commentId(commentId)
            .reactionCounts(reactionCounts != null ? reactionCounts : new HashMap<>())
            .userReaction(userReaction)
            .build();

    messagingTemplate.convertAndSend("/topic/comment." + commentId, event);
    log.debug(
        "Broadcast comment reaction update: commentId={} counts={} userReaction={}",
        commentId,
        reactionCounts,
        userReaction);
  }
}
