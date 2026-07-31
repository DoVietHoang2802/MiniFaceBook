package com.minifacebook.module.post.application.service;

import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.post.domain.entity.Comment;
import com.minifacebook.module.post.domain.entity.Post;
import com.minifacebook.module.post.domain.repository.CommentRepository;
import com.minifacebook.module.post.domain.repository.PostRepository;
import com.minifacebook.module.post.domain.repository.ReactionRepository;
import com.minifacebook.module.post.application.dto.PostSuggestionResponse;
import com.minifacebook.module.post.application.dto.CreatePostRequest;
import com.minifacebook.shared.domain.service.MediaService;
import com.minifacebook.shared.exception.AppException;
import com.minifacebook.shared.exception.ErrorCode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PostServiceTest {

    @Mock
    private PostRepository postRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CommentRepository commentRepository;
    @Mock
    private ReactionRepository reactionRepository;
    @Mock
    private MediaService mediaService;

    @InjectMocks
    private PostService postService;

    @Test
    void deletePost_Success() {
        // Arrange
        String email = "owner@test.com";
        String postId = "post123";
        String userId = "user123";

        User owner = User.builder().id(userId).email(email).build();
        Post post = Post.builder().id(postId).authorId(userId).deleted(false).build();
        Comment comment1 = Comment.builder().id("c1").postId(postId).deleted(false).build();
        Comment comment2 = Comment.builder().id("c2").postId(postId).deleted(false).build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(owner));
        when(postRepository.findById(postId)).thenReturn(Optional.of(post));
        when(commentRepository.findByPostId(postId)).thenReturn(List.of(comment1, comment2));

        // Act
        postService.deletePost(email, postId);

        // Assert
        assertTrue(post.isDeleted());
        assertNotNull(post.getDeletedAt());
        verify(postRepository, times(1)).save(post);

        assertTrue(comment1.isDeleted());
        assertTrue(comment2.isDeleted());
        assertNotNull(comment1.getDeletedAt());
        assertNotNull(comment2.getDeletedAt());
        verify(commentRepository, times(1)).saveAll(any());
    }

    @Test
    void deletePost_Forbidden() {
        // Arrange
        String email = "attacker@test.com";
        String postId = "post123";
        
        User attacker = User.builder().id("user456").email(email).build();
        Post post = Post.builder().id(postId).authorId("user123").deleted(false).build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(attacker));
        when(postRepository.findById(postId)).thenReturn(Optional.of(post));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            postService.deletePost(email, postId);
        });
        assertEquals(ErrorCode.POST_UNAUTHORIZED.getMessage(), exception.getMessage());
        assertFalse(post.isDeleted());
        verify(postRepository, never()).save(any());
        verify(commentRepository, never()).saveAll(any());
    }

    @Test
    void deletePost_NotFound() {
        // Arrange
        String email = "owner@test.com";
        String postId = "post123";

        User owner = User.builder().id("user123").email(email).build();
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(owner));
        when(postRepository.findById(postId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            postService.deletePost(email, postId);
        });
        verify(postRepository, never()).save(any());
    }

    @Test
    void getSearchSuggestions_NormalizesQueryAndReturnsPublicProjection() {
        User viewer = User.builder().id("viewer-id").email("viewer@test.com").build();
        User author = User.builder().id("author-id").name("Post Author").build();
        Post post = Post.builder()
                .id("post-id")
                .authorId("author-id")
                .content("  Nội dung bài viết về cà phê  ")
                .build();

        when(userRepository.findByEmail("viewer@test.com")).thenReturn(Optional.of(viewer));
        when(userRepository.findById("author-id")).thenReturn(Optional.of(author));
        when(postRepository.searchByContent(eq("cà phê"), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(post)));

        List<PostSuggestionResponse> suggestions = postService.getSearchSuggestions(
                "viewer@test.com", "  cà   phê ");

        assertEquals(1, suggestions.size());
        assertEquals("post-id", suggestions.getFirst().getId());
        assertEquals("Post Author", suggestions.getFirst().getAuthorName());
        assertEquals("Nội dung bài viết về cà phê", suggestions.getFirst().getExcerpt());
        verify(postRepository).searchByContent(eq("cà phê"), any(PageRequest.class));
    }

    @Test
    void searchPosts_RejectsBlankOrTooShortQuery() {
        User viewer = User.builder().id("viewer-id").email("viewer@test.com").build();
        when(userRepository.findByEmail("viewer@test.com")).thenReturn(Optional.of(viewer));

        AppException exception = assertThrows(AppException.class,
                () -> postService.searchPosts("viewer@test.com", " ", PageRequest.of(0, 10)));

        assertEquals(ErrorCode.INVALID_SEARCH_QUERY, exception.getErrorCode());
        verify(postRepository, never()).searchByContent(any(), any());
    }

    @Test
    void createPost_RejectsMoreThanTenImagesBeforeUpload() {
        User owner = User.builder().id("owner-id").email("owner@test.com").build();
        CreatePostRequest request = new CreatePostRequest();
        request.setImages(java.util.Collections.nCopies(11,
                new MockMultipartFile("images", "photo.webp", "image/webp", new byte[] {1})));
        when(userRepository.findByEmail("owner@test.com")).thenReturn(Optional.of(owner));

        AppException exception = assertThrows(AppException.class,
                () -> postService.createPost("owner@test.com", request));

        assertEquals(ErrorCode.MAX_POST_IMAGES_EXCEEDED, exception.getErrorCode());
        verify(mediaService, never()).uploadPostImage(any());
        verify(postRepository, never()).save(any());
    }

    @Test
    void createPost_RejectsImagesExceedingAggregateBudgetBeforeUpload() {
        User owner = User.builder().id("owner-id").email("owner@test.com").build();
        org.springframework.web.multipart.MultipartFile first = mock(org.springframework.web.multipart.MultipartFile.class);
        org.springframework.web.multipart.MultipartFile second = mock(org.springframework.web.multipart.MultipartFile.class);
        org.springframework.web.multipart.MultipartFile third = mock(org.springframework.web.multipart.MultipartFile.class);
        org.springframework.web.multipart.MultipartFile fourth = mock(org.springframework.web.multipart.MultipartFile.class);
        when(first.isEmpty()).thenReturn(false);
        when(second.isEmpty()).thenReturn(false);
        when(third.isEmpty()).thenReturn(false);
        when(fourth.isEmpty()).thenReturn(false);
        when(first.getSize()).thenReturn(10L * 1024 * 1024);
        when(second.getSize()).thenReturn(10L * 1024 * 1024);
        when(third.getSize()).thenReturn(10L * 1024 * 1024);
        when(fourth.getSize()).thenReturn(1L);
        CreatePostRequest request = new CreatePostRequest();
        request.setImages(List.of(first, second, third, fourth));
        when(userRepository.findByEmail("owner@test.com")).thenReturn(Optional.of(owner));

        AppException exception = assertThrows(AppException.class,
                () -> postService.createPost("owner@test.com", request));

        assertEquals(ErrorCode.MAX_POST_IMAGES_TOTAL_SIZE_EXCEEDED, exception.getErrorCode());
        verify(mediaService, never()).uploadPostImage(any());
    }
}
