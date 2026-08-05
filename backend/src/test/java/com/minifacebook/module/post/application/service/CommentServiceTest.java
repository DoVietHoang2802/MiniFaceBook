package com.minifacebook.module.post.application.service;

import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.post.application.dto.CommentRequest;
import com.minifacebook.module.post.domain.entity.Comment;
import com.minifacebook.module.post.domain.entity.Post;
import com.minifacebook.module.post.domain.repository.CommentReactionRepository;
import com.minifacebook.module.post.domain.repository.CommentRepository;
import com.minifacebook.module.post.domain.repository.PostRepository;
import com.minifacebook.shared.domain.service.MediaService;
import com.minifacebook.shared.exception.ErrorCode;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CommentServiceTest {

    private static ValidatorFactory validatorFactory;
    private static Validator validator;

    @Mock
    private CommentRepository commentRepository;
    @Mock
    private PostRepository postRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CommentReactionRepository commentReactionRepository;
    @Mock
    private MediaService mediaService;
    @Mock
    private ApplicationEventPublisher eventPublisher;
    @Mock
    private PostRealtimeBroadcaster postRealtimeBroadcaster;
    @Mock
    private CommentRealtimeBroadcaster commentRealtimeBroadcaster;
    @Mock
    private CommentEventBroadcaster commentEventBroadcaster;

    @InjectMocks
    private CommentService commentService;

    @BeforeAll
    static void createValidator() {
        validatorFactory = Validation.buildDefaultValidatorFactory();
        validator = validatorFactory.getValidator();
    }

    @AfterAll
    static void closeValidator() {
        validatorFactory.close();
    }

    @Test
    void commentRequest_AllowsImageOnlyComment() {
        CommentRequest request = new CommentRequest();
        request.setImage(new MockMultipartFile("image", "comment.png", "image/png", new byte[] {1}));

        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void commentRequest_RejectsCommentWithoutTextOrImage() {
        Set<?> violations = validator.validate(new CommentRequest());

        assertFalse(violations.isEmpty());
    }

    @Test
    void addComment_UploadsAttachmentUsingPostImagePolicy() {
        String email = "commenter@test.com";
        String postId = "p123";
        User commenter = User.builder().id("userCommenter").email(email).build();
        Post post = Post.builder().id(postId).authorId("userPostOwner").commentCount(0).deleted(false).build();
        CommentRequest request = new CommentRequest();
        MockMultipartFile image = new MockMultipartFile("image", "comment.png", "image/png", new byte[] {1});
        request.setImage(image);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(commenter));
        when(postRepository.findById(postId)).thenReturn(Optional.of(post));
        when(mediaService.uploadPostImage(image)).thenReturn("https://cdn.example/comment.png");
        when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> {
            Comment comment = invocation.getArgument(0);
            comment.setId("c123");
            return comment;
        });

        var response = commentService.addComment(email, postId, request);

        assertEquals("https://cdn.example/comment.png", response.getImageUrl());
        verify(mediaService).uploadPostImage(image);
        verify(mediaService, never()).uploadAvatar(any());
    }

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
        assertEquals(ErrorCode.POST_UNAUTHORIZED.getMessage(), exception.getMessage());
        assertFalse(comment.isDeleted());
        verify(commentRepository, never()).save(any());
        verify(postRepository, never()).save(any());
    }
}
