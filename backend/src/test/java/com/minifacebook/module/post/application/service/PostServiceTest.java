package com.minifacebook.module.post.application.service;

import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.post.domain.entity.Comment;
import com.minifacebook.module.post.domain.entity.Post;
import com.minifacebook.module.post.domain.repository.CommentRepository;
import com.minifacebook.module.post.domain.repository.PostRepository;
import com.minifacebook.shared.exception.ErrorCode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

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
}
