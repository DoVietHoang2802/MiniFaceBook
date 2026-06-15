# Task: SSE Migration for Post Feed Updates & Notifications

**Status:** Pending  
**Priority:** Medium  
**Estimated Time:** 2-3 days  
**Related:** Phase 5, Realtime architecture

---

## 🎯 Objective

Migrate Post Feed Updates and Notifications from WebSocket to Server-Sent Events (SSE) to reduce complexity, improve scalability, and use the right tool for one-way push scenarios.

---

## 📋 Tasks

### Why SSE?

- **One-way push** (server → client only) → SSE perfect fit
- **Simpler** than WebSocket (no STOMP protocol overhead)
- **Auto-reconnect** built-in in browser
- **CDN/proxy friendly** (HTTP-based)
- **Better debugging** (curl, Postman)
- WebSocket kept for Chat and Comment Reactions (need full-duplex)

---

### Backend Implementation

#### 1. Create SSE Event DTOs (if not exist)
- `PostCountEvent` already exists in `post.types.ts` → need Java counterpart `PostCountEvent.java` (check if exists)
- `NotificationResponse` already exists → reuse

#### 2. Create `PostEventBroadcaster` Service
- File: `backend/src/main/java/com/minifacebook/module/post/application/service/PostEventBroadcaster.java`
- Use `Sinks.Many<PostCountEvent>` (Spring WebFlux) OR `SseEmitter` for SSE
- Method: `broadcast(PostCountEvent event)` → sink.tryEmitNext(event)
- Method: `Flux<PostCountEvent> getFluxForUser(Optional<List<String>> postIds)` → filter by postIds if provided

#### 3. Create `NotificationEventBroadcaster` Service
- File: `backend/src/main/java/com/minifacebook/module/notification/application/service/NotificationEventBroadcaster.java`
- Use `Sinks.Many<NotificationResponse>`
- Method: `broadcast(NotificationResponse event)`
- Method: `Flux<NotificationResponse> getFluxForUser(String userId)` → filter by recipientId

#### 4. Update `PostRealtimeBroadcaster.broadcastCounts()`
- Keep existing WebSocket broadcast for compatibility (dual-write)
- Add: `postEventBroadcaster.broadcast(event);`
- Remove WebSocket broadcast later (after frontend migrated)

#### 5. Update `NotificationService.createNotification()`
- Keep existing WebSocket `convertAndSendToUser()` for compatibility
- Add: `notificationEventBroadcaster.broadcast(payload);`
- Remove WebSocket later

#### 6. Create SSE Controller Endpoints
- File: `backend/src/main/java/com/minifacebook/module/post/presentation/SseEventController.java`
- Endpoint: `GET /api/events/post` → produces `MediaType.TEXT_EVENT_STREAM_VALUE`
- Query param: `postIds` (optional, comma-separated) to filter specific posts
- Auth: `@AuthenticationPrincipal User user`
- Return: `Flux<PostCountEvent>` from `postEventBroadcaster.getFluxForUser(...)`

- File: `backend/src/main/java/com/minifacebook/module/notification/presentation/SseNotificationController.java`
- Endpoint: `GET /api/events/notifications` → produces `MediaType.TEXT_EVENT_STREAM_VALUE`
- Auth: `@AuthenticationPrincipal User user`
- Return: `Flux<NotificationResponse> filtered by userId`

#### 7. Multi-Server Support (Redis Pub/Sub)
- If running multiple server instances, need Redis to broadcast events across servers
- In `PostEventBroadcaster` and `NotificationEventBroadcaster`:
  - Subscribe to Redis channel `post:events` and `notification:events`
  - On Redis message → emit to local sink
  - On `broadcast()` → publish to Redis channel
- Requires `StringRedisTemplate` bean

#### 8. Spring Security Config
- Ensure `/api/events/**` endpoints require authentication
- Add CORS headers if frontend on different port (5173)

---

### Frontend Implementation

#### 9. Install SSE Polyfill
```bash
npm install event-source-polyfill
# or yarn add event-source-polyfill
```

#### 10. Create `sseService.ts`
- File: `frontend/src/modules/core/services/sseService.ts`
- Wrapper around `EventSource` with:
  - `subscribe<T>(url: string, callback: (data: T) => void): () => void`
  - Auto-reconnect handling (browser does this, but we log errors)
  - Connection tracking (Map<url, EventSource>)
  - `unsubscribe()` cleanup

#### 11. Create `usePostUpdates` Hook (Optimization)
- File: `frontend/src/modules/post/hooks/usePostUpdates.ts`
- Single SSE connection for all post updates (not one per post)
- Subscribe to `/api/events/post?postIds=...` once
- Maintain Map<postId, PostCountEvent> in state
- Provide `getUpdateForPost(postId)` function
- Auto-subscribe new post IDs when PostCard mounts

#### 12. Update `PostCard.tsx`
- Replace `webSocketService.subscribe<PostCountEvent>(`/topic/post.${post.id}`)` with SSE
- Use `usePostUpdates` hook:
  ```typescript
  const { getUpdateForPost } = usePostUpdates();
  const update = getUpdateForPost(post.id);

  useEffect(() => {
    if (update) {
      setLocalPost(prev => ({ ...prev, ...update }));
    }
  }, [update]);
  ```
- Or simpler: subscribe directly to SSE with `sseService.subscribe<PostCountEvent>(`/api/events/post?postIds=${post.id}`)`
- Remove WebSocket import

#### 13. Update `useNotifications.ts`
- Replace `webSocketService.subscribe<NotificationResponse>('/user/queue/notifications')`
- With: `sseService.subscribe<NotificationResponse>('/api/events/notifications')`
- Keep all existing logic (badge count, sound, prepend)
- Remove WebSocket import

#### 14. Keep WebSocket for Chat & Comment Reactions
- `webSocketService` still used in:
  - Chat messages (`ChatPage`, `ChatMessageList`)
  - Comment Reactions (newly added)
- No changes to those components

#### 15. Feature Flag (Optional)
- Add `USE_SSE = true` flag in config
- Fallback to WebSocket if SSE fails or flag=false
- Enables easy rollback

---

### Testing

#### 16. Backend Tests
- Unit test `PostEventBroadcaster` emits events to sink
- Unit test `NotificationEventBroadcaster` filters by userId
- Integration test: `SseEventController` returns `text/event-stream` content type
- Integration test: Authentication required (401 without JWT)
- Integration test: Event stream sends multiple events

#### 17. Frontend Tests
- Unit test `sseService.subscribe()` creates EventSource, calls callback, cleanup
- Unit test `usePostUpdates` manages Map of updates
- E2E test: Two browsers open same post → realtime count updates via SSE
- E2E test: Notification badge increments with SSE

#### 18. Load Testing (Optional)
- Simulate 1000 concurrent SSE connections
- Measure memory/CPU usage
- Test Redis pub/sub latency if multi-server

---

### Cleanup (After Validation)

#### 19. Remove Dual-Write WebSocket
- Remove `messagingTemplate.convertAndSend()` from `PostRealtimeBroadcaster`
- Remove `convertAndSendToUser()` from `NotificationService`
- Remove unused imports

#### 20. Remove Unused WebSocket Code
- Check if any code still uses `/topic/post.*` or `/user/queue/notifications`
- Remove if none

#### 21. Update Documentation
- Update `README.md` or architecture docs to reflect SSE usage
- Update deployment guides (WebSocket config no longer needed for feed/notif)

---

## ✅ Acceptance Criteria

- [ ] Backend: SSE endpoints return `text/event-stream`
- [ ] Backend: Authenticated users can subscribe to post updates
- [ ] Backend: Authenticated users can subscribe to notifications (filtered to their own)
- [ ] Backend: Events pushed in real-time (sub-second latency)
- [ ] Frontend: `sseService` works with polyfill
- [ ] Frontend: PostCard updates via SSE (no WebSocket)
- [ ] Frontend: Notification center updates via SSE (no WebSocket)
- [ ] Frontend: Chat and Comment Reactions still use WebSocket (unaffected)
- [ ] Manual test: 2 browsers see post count updates via SSE
- [ ] Manual test: 2 browsers see notification push via SSE
- [ ] No breaking changes to existing APIs
- [ ] WebSocket fallback ready if SSE fails (optional but recommended)

---

## 🔗 Related Files

- Existing WebSocket: `WebSocketConfig.java`, `PostRealtimeBroadcaster.java`, `NotificationService.java`
- Frontend WebSocket: `webSocketService.ts`, `PostCard.tsx`, `useNotifications.ts`

---

## 📝 Notes

- **Single connection optimization:** Use 1 SSE connection per user for all post updates (not one per post). Server should send events for all posts user is viewing, client filters.
- **Multi-server:** If deploying to >1 server, Redis pub/sub is REQUIRED. Each server must subscribe to Redis channels to receive events from other servers.
- **Backpressure:** SSE naturally handles slow clients (browser buffers). Consider limiting buffer size on server.
- **Connection limits:** Browsers limit ~6-8 HTTP connections per domain. SSE uses 1-2 connections (one for posts, one for notifications) → OK. Could even combine into one `/api/events` endpoint with event type field.
- **Error handling:** SSE `onerror` should trigger reconnect (browser auto). Log errors on server when client disconnects unexpectedly.

---

## 🐛 Known Issues / Risks

- **SSE not supported in IE** (but project uses modern browsers)
- **SSE connection limit per domain** (~6-8) → use connection pooling (1 connection per event type, not per post)
- **No binary support** (not needed here)
- **Multi-server complexity** → requires Redis setup
- **Server memory:** Each SSE connection holds `SseEmitter` or `Flux` subscription → monitor memory with many users

---

## 🔄 Rollback Plan

- Feature flag `USE_SSE` → toggle back to WebSocket instantly
- Keep dual-write for 1-2 weeks during transition
- If issues arise, flip flag, remove SSE code, keep WebSocket

---

## 📚 References

- Spring WebFlux SSE: https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#websocket
- EventSource MDN: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
- Spring `SseEmitter`: https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/mvc/method/annotation/SseEmitter.html
- Reactive `Sinks`: https://docs.spring.io/spring-framework/docs/current/reference/html/reactive.html#reactive-streams
