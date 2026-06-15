# Task: WebSocket Real-time Broadcast for Comment Reactions

**Status:** In Progress  
**Priority:** High  
**Estimated Time:** 2-3 hours  
**Related:** Comment Reactions feature, Phase 5

---

## 🎯 Objective

Implement real-time WebSocket broadcasting for comment reactions so that all users viewing a comment thread see reaction updates instantly (like Facebook).

---

## 📋 Tasks

### Backend (Java/Spring Boot)

1. **Create `CommentReactionEvent` DTO**
   - File: `backend/src/main/java/com/minifacebook/module/post/application/dto/CommentReactionEvent.java`
   - Fields: `commentId`, `reactionCounts` (Map<String, Integer>), `userReaction` (String | null)
   - Annotations: `@Data`, `@Builder`, `@AllArgsConstructor`, `@NoArgsConstructor`

2. **Create `CommentRealtimeBroadcaster` Service**
   - File: `backend/src/main/java/com/minifacebook/module/post/application/service/CommentRealtimeBroadcaster.java`
   - Inject `SimpMessagingTemplate`
   - Method: `broadcastReactionUpdate(String commentId, Map<String, Integer> reactionCounts, String userReaction)`
   - Send to topic: `/topic/comment.{commentId}`
   - Log debug message

3. **Inject `CommentRealtimeBroadcaster` into `CommentService`**
   - Add field: `private final CommentRealtimeBroadcaster commentRealtimeBroadcaster;`
   - Update `@RequiredArgsConstructor` constructor

4. **Call broadcast in `CommentService.reactToComment()`**
   - After saving reaction (line ~100-104)
   - Compute reactionCounts: query `commentReactionRepository.findByCommentId(commentId)` → group by type
   - Get user's current reaction (if any) after toggle
   - Call: `commentRealtimeBroadcaster.broadcastReactionUpdate(commentId, counts, userReaction)`
   - Place BEFORE notification event (or after, doesn't matter)

5. **Verify existing WebSocket config**
   - Ensure `WebSocketConfig.java` already configured (it is)
   - Topics `/topic/comment.*` should work (no extra config needed)

### Frontend (React/TypeScript)

6. **Update `CommentSection.tsx` to subscribe WebSocket**
   - Import `webSocketService` from `../../chat/services/webSocketService`
   - Define `CommentReactionEvent` type (or reuse from types if exists)
   - In `CommentSection` component, add `useEffect`:
     ```typescript
     useEffect(() => {
       if (!commentId) return;

       const unsubscribe = webSocketService.subscribe<CommentReactionEvent>(
         `/topic/comment.${commentId}`,
         (event) => {
           // Update reactionCounts state
           setReactionCounts(event.reactionCounts);
           // Update myReaction state
           setMyReaction(event.userReaction);
         }
       );

       return () => unsubscribe();
     }, [commentId]);
     ```
   - Ensure `reactionCounts` and `myReaction` are in component state

7. **Handle optimistic UI updates properly**
   - Existing optimistic logic in `handleReact` should remain
   - WebSocket updates will sync from other users
   - Ensure no conflict between optimistic and realtime updates (last-write-wins)

8. **Test with 2 browser windows**
   - Open same post, both view comments
   - User A reacts → User B sees update instantly
   - User A toggles off → User B sees update

---

## ✅ Acceptance Criteria

- [ ] Backend: `CommentReactionEvent` DTO created
- [ ] Backend: `CommentRealtimeBroadcaster` service created and working
- [ ] Backend: `CommentService.reactToComment()` broadcasts after reaction change
- [ ] Backend: WebSocket topic `/topic/comment.{commentId}` sends event to all subscribers
- [ ] Frontend: `CommentSection` subscribes to its comment's topic on mount
- [ ] Frontend: Received events update `reactionCounts` and `myReaction` state
- [ ] Frontend: Optimistic UI still works (local update before server response)
- [ ] Manual test: 2 browsers show realtime sync for comment reactions

---

## 🔗 Related Files

- `backend/src/main/java/com/minifacebook/module/post/application/service/PostRealtimeBroadcaster.java` (reference pattern)
- `frontend/src/modules/post/components/PostCard.tsx` (line 35-48 shows WS subscription pattern)
- `frontend/src/modules/chat/services/webSocketService.ts` (WS client wrapper)

---

## 📝 Notes

- Follow same pattern as `PostRealtimeBroadcaster` for consistency
- Keep event payload minimal (just counts and user's own reaction)
- No need to send full comment data, only reaction counts
- Consider edge case: multiple reactions from same user? (should toggle, not duplicate)
- WebSocket subscription should auto-unsubscribe when comment section closes

---

## 🐛 Known Issues / Risks

- If many users viewing same comment, broadcast to all may cause spike (but acceptable for personal project)
- Need to ensure `commentId` in topic matches actual comment ID (no SQL injection, but IDs are UUIDs safe)
- Memory leak if subscriptions not cleaned up on unmount → must return unsubscribe function
