package com.minifacebook.module.admin.infrastructure.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.minifacebook.module.auth.infrastructure.persistence.repository.MongoUserRepository;
import com.minifacebook.module.chat.application.service.PresenceService;
import com.minifacebook.module.post.infrastructure.persistence.document.PostDocument;
import com.minifacebook.module.post.infrastructure.persistence.repository.MongoCommentRepository;
import com.minifacebook.module.post.infrastructure.persistence.repository.MongoPostRepository;
import com.minifacebook.shared.event.NotificationEvent;
import com.minifacebook.shared.exception.AppException;
import com.minifacebook.shared.exception.ErrorCode;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

  @Mock private MongoUserRepository userRepository;
  @Mock private MongoPostRepository postRepository;
  @Mock private MongoCommentRepository commentRepository;
  @Mock private PresenceService presenceService;
  @Mock private ApplicationEventPublisher eventPublisher;
  @Mock private SimpMessagingTemplate messagingTemplate;

  @InjectMocks private AdminService adminService;

  @Test
  void deletePostsByAdmin_SoftDeletesEverySelectedPostAndNotifiesAuthors() {
    PostDocument firstPost = PostDocument.builder().id("post-1").authorId("author-1").build();
    PostDocument secondPost = PostDocument.builder().id("post-2").authorId("author-2").build();
    when(postRepository.findAllById(List.of("post-1", "post-2")))
        .thenReturn(List.of(firstPost, secondPost));
    when(userRepository.findAll()).thenReturn(List.of());
    when(presenceService.getOnlineUsers(any())).thenReturn(Set.of());

    adminService.deletePostsByAdmin(List.of("post-1", "post-2"), "Spam");

    assertTrue(firstPost.isDeleted());
    assertTrue(secondPost.isDeleted());
    verify(postRepository).saveAll(List.of(firstPost, secondPost));
    verify(eventPublisher, times(2)).publishEvent(any(NotificationEvent.class));
    verify(messagingTemplate, times(3)).convertAndSend(anyString(), any(Object.class));
  }

  @Test
  void deletePostsByAdmin_RejectsWholeBatchWhenPostIsAlreadyDeleted() {
    PostDocument activePost = PostDocument.builder().id("post-1").authorId("author-1").build();
    PostDocument deletedPost = PostDocument.builder()
        .id("post-2").authorId("author-2").deleted(true).build();
    when(postRepository.findAllById(List.of("post-1", "post-2")))
        .thenReturn(List.of(activePost, deletedPost));

    AppException exception = assertThrows(AppException.class,
        () -> adminService.deletePostsByAdmin(List.of("post-1", "post-2"), null));

    assertEquals(ErrorCode.POST_NOT_FOUND, exception.getErrorCode());
    assertFalse(activePost.isDeleted());
    verify(postRepository, never()).saveAll(any());
    verify(eventPublisher, never()).publishEvent(any());
  }
}
