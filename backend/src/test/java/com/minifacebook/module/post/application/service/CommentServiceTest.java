package com.minifacebook.module.post.application.service;

import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.post.domain.entity.Comment;
import com.minifacebook.module.post.domain.entity.Post;
import com.minifacebook.module.post.domain.repository.CommentRepository;
import com.minifacebook.module.post.domain.repository.PostRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CommentServiceTest {

    @Mock
    private CommentRepository commentRepository;
    @Mock
    private PostRepository postRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PostRealtimeBroadcaster postRealtimeBroadcaster;
    @Mock
    private CommentEventBroadcaster commentEventBroadcaster;

    @InjectMocks
    private CommentService commentService;

    @Test
    void deleteComment_Success_ByCommentOwner() {
        // Arrange
        String email = "commenter@test.com";
        String commentId = "c123";
        String postId = "p123";

        User commenter = User.builder().id("userCommenter").email(email).build();
        Comment comment = Comment.builder().id(commentId).postId(postId).authorId("userCommenter").deleted(false).build();
        Post post = Post.builder().id(postId).authorId("userPostOwner").commentCount(5).deleted(false).build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(commenter));
        when(commentRepository.findById(commentId)).thenReturn(Optional.of(comment));
        when(postRepository.findById(postId)).thenReturn(Optional.of(post));

        // Act
        commentService.deleteComment(email, commentId);

        // Assert
        assertTrue(comment.isDeleted());
        assertNotNull(comment.getDeletedAt());
        verify(commentRepository, times(1)).save(comment);

        assertEquals(4, post.getCommentCount());
        verify(postRepository, times(1)).save(post);
        verify(postRealtimeBroadcaster, times(1)).broadcastCounts(post);
    }

    @Test
    void deleteComment_Success_ByPostOwner() {
        // Arrange
        String email = "postowner@test.com";
        String commentId = "c123";
        String postId = "p123";

        User postOwner = User.builder().id("userPostOwner").email(email).build();
        Comment comment = Comment.builder().id(commentId).postId(postId).authorId("userCommenter").deleted(false).build();
        Post post = Post.builder().id(postId).authorId("userPostOwner").commentCount(5).deleted(false).build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(postOwner));
        when(commentRepository.findById(commentId)).thenReturn(Optional.of(comment));
        when(postRepository.findById(postId)).thenReturn(Optional.of(post));

        // Act
        commentService.deleteComment(email, commentId);

        // Assert
        assertTrue(comment.isDeleted());
        verify(commentRepository, times(1)).save(comment);

        assertEquals(4, post.getCommentCount());
        verify(postRepository, times(1)).save(post);
        verify(postRealtimeBroadcaster, times(1)).broadcastCounts(post);
    }

    @Test
    void deleteComment_Forbidden() {
        // Arrange
        String email = "attacker@test.com";
        String commentId = "c123";
        String postId = "p123";

        User attacker = User.builder().id("userAttacker").email(email).build();
        Comment comment = Comment.builder().id(commentId).postId(postId).authorId("userCommenter").deleted(false).build();
        Post post = Post.builder().id(postId).authorId("userPostOwner").commentCount(5).deleted(false).build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(attacker));
        when(commentRepository.findById(commentId)).thenReturn(Optional.of(comment));
        when(postRepository.findById(postId)).thenReturn(Optional.of(post));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            commentService.deleteComment(email, commentId);
        });
        assertEquals("You do not have permission to delete this comment", exception.getMessage());
        assertFalse(comment.isDeleted());
        verify(commentRepository, never()).save(any());
        verify(postRepository, never()).save(any());
    }
}
