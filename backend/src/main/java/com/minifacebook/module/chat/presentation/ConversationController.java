package com.minifacebook.module.chat.presentation;

import com.minifacebook.module.chat.application.dto.ConversationCreateRequest;
import com.minifacebook.module.chat.application.dto.ConversationResponse;
import com.minifacebook.module.chat.application.dto.MessageResponse;
import com.minifacebook.module.chat.application.service.ConversationService;
import com.minifacebook.module.chat.application.service.MessageService;
import com.minifacebook.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/conversations")
@RequiredArgsConstructor
@Tag(name = "Trò chuyện", description = "Các API quản lý cuộc trò chuyện và tin nhắn")
public class ConversationController {

  private final ConversationService conversationService;
  private final MessageService messageService;

  @GetMapping
  @Operation(summary = "Lấy danh sách chat", description = "Lấy danh sách các cuộc trò chuyện của user hiện tại, sắp xếp theo tin nhắn mới nhất")
  public ApiResponse<Page<ConversationResponse>> getConversations(
      @AuthenticationPrincipal Jwt jwt,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("lastMessageAt").descending());
    Page<ConversationResponse> response = conversationService.getConversations(jwt.getSubject(), pageable);
    return ApiResponse.success("Lấy danh sách chat thành công", response);
  }

  @GetMapping("/unread/total")
  @Operation(summary = "Tổng tin chưa đọc", description = "Tổng số tin nhắn chưa đọc trên mọi hội thoại - cho chấm đỏ nút Chats ở sidebar")
  public ApiResponse<Long> getTotalUnread(@AuthenticationPrincipal Jwt jwt) {
    long total = conversationService.getTotalUnread(jwt.getSubject());
    return ApiResponse.success("Lấy tổng tin chưa đọc thành công", total);
  }

  @PostMapping
  @Operation(summary = "Tạo hoặc lấy cuộc trò chuyện", description = "Tạo mới hoặc lấy cuộc trò chuyện 1-1 đã có với bạn bè")
  public ApiResponse<ConversationResponse> getOrCreateConversation(
      @AuthenticationPrincipal Jwt jwt,
      @RequestBody @Valid ConversationCreateRequest request) {
    ConversationResponse response = conversationService.getOrCreateConversation(jwt.getSubject(), request);
    return ApiResponse.success("Lấy thông tin hội thoại thành công", response);
  }

  @GetMapping("/{id}/messages")
  @Operation(summary = "Lấy danh sách tin nhắn", description = "Lấy tin nhắn phân trang, mới nhất trước (page 0 = mới nhất) phục vụ infinite scroll")
  public ApiResponse<Page<MessageResponse>> getMessages(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable("id") String conversationId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "15") int size) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
    Page<MessageResponse> response = messageService.getMessages(conversationId, jwt.getSubject(), pageable);
    return ApiResponse.success("Lấy danh sách tin nhắn thành công", response);
  }

  @PutMapping("/{id}/seen")
  @Operation(summary = "Đánh dấu đã xem", description = "Đánh dấu toàn bộ tin nhắn chưa đọc trong cuộc hội thoại là đã xem")
  public ApiResponse<Void> markAllAsSeen(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable("id") String conversationId) {
    conversationService.markAllAsSeen(conversationId, jwt.getSubject());
    return ApiResponse.success("Đã đánh dấu đã xem thành công", null);
  }

  @PostMapping(value = "/{id}/messages/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @Operation(summary = "Gửi ảnh", description = "Upload và gửi tin nhắn ảnh trong cuộc hội thoại (Sprint 4.4)")
  public ApiResponse<MessageResponse> sendImage(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable("id") String conversationId,
      @RequestParam("file") MultipartFile file,
      @RequestParam(value = "content", required = false) String content,
      @RequestParam(value = "replyToMessageId", required = false) String replyToMessageId) {
    MessageResponse response = messageService.sendImageMessage(jwt.getSubject(), conversationId, file, content, replyToMessageId);
    return ApiResponse.success("Gửi ảnh thành công", response);
  }
}
