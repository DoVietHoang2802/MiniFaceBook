package com.minifacebook.module.post.application.service;

import com.minifacebook.module.post.application.dto.PostCountEvent;
import com.minifacebook.module.post.domain.entity.Post;
import com.minifacebook.module.post.domain.entity.ReactionType;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Broadcast số đếm tương tác của bài viết tới mọi client đang xem bài đó (Phase 5 - Realtime Feed).
 *
 * <p>Đẩy tới topic công khai {@code /topic/post.<postId>} (broadcast, khác {@code /user/queue/...}
 * của chat/notification vốn gửi 1-1). Bất kỳ ai đang mở bài (FE subscribe topic đó) sẽ nhận được số
 * mới — đóng bài thì FE tự unsubscribe nên không tốn kết nối thừa.
 *
 * <p>Dùng trực tiếp {@link SimpMessagingTemplate} (in-memory broker, 1 server) — nhất quán với
 * NotificationService. Khi scale 2+ server chỉ cần đổi broker relay, không sửa code này.
 */
@Service
@Slf4j
@RequiredArgsConstructor
@SuppressWarnings("null")
public class PostRealtimeBroadcaster {

  private final SimpMessagingTemplate messagingTemplate;
  private final PostEventBroadcaster postEventBroadcaster;

  /** Tính lại số đếm từ Post rồi broadcast tới topic của bài. */
  public void broadcastCounts(Post post) {
    Map<ReactionType, Integer> counts =
        post.getReactionsCount() != null ? post.getReactionsCount() : new HashMap<>();

    int reactTotal = counts.values().stream().mapToInt(Integer::intValue).sum();

    Map<String, Integer> reactionsByName = new HashMap<>();
    counts.forEach((type, count) -> reactionsByName.put(type.name(), count));

    PostCountEvent event =
        PostCountEvent.builder()
            .postId(post.getId())
            .reactCount(reactTotal)
            .commentCount(post.getCommentCount())
            .reactionsCount(reactionsByName)
            .build();

    // WebSocket broadcast (tương thích ngược, sẽ xóa sau khi frontend migrate)
    messagingTemplate.convertAndSend("/topic/post." + post.getId(), event);
    log.debug("Broadcast counts via WebSocket: post={} react={} comment={}", post.getId(), reactTotal, post.getCommentCount());

    // SSE broadcast (mới)
    postEventBroadcaster.broadcast(event);
  }
}
