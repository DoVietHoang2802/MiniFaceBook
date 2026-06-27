package com.minifacebook.module.post.presentation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.minifacebook.BaseIntegrationTest;
import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.auth.infrastructure.persistence.repository.MongoUserRepository;
import com.minifacebook.module.post.application.dto.CommentResponse;
import com.minifacebook.module.post.application.dto.PostResponse;
import com.minifacebook.module.post.application.dto.ReactionRequest;
import com.minifacebook.module.post.domain.entity.Comment;
import com.minifacebook.module.post.domain.entity.Post;
import com.minifacebook.module.post.domain.repository.CommentRepository;
import com.minifacebook.module.post.domain.repository.PostRepository;
import com.minifacebook.module.post.infrastructure.persistence.repository.MongoCommentRepository;
import com.minifacebook.module.post.infrastructure.persistence.repository.MongoPostRepository;
import com.minifacebook.module.post.domain.entity.ReactionType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
public class PostIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MongoUserRepository mongoUserRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private MongoPostRepository mongoPostRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private MongoCommentRepository mongoCommentRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private final String email = "post_integration@example.com";
    private User testUser;

    @BeforeEach
    void setUp() {
        mongoCommentRepository.deleteAll();
        mongoPostRepository.deleteAll();
        mongoUserRepository.findByEmail(email).ifPresent(mongoUserRepository::delete);

        testUser = User.builder()
                .email(email)
                .name("Post Test User")
                .verified(true)
                .build();
        testUser = userRepository.save(testUser);
    }

    @Test
    void testPostCommentAndSoftDeleteFlow() throws Exception {
        // 1. Create a Post
        MvcResult createResult = mockMvc.perform(multipart("/posts")
                        .param("content", "This is an integration test post")
                        .with(jwt().jwt(builder -> builder.subject(email))))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = createResult.getResponse().getContentAsString();
        var apiResponse = objectMapper.readTree(responseBody);
        assertEquals(200, apiResponse.get("status").asInt());
        
        PostResponse postResponse = objectMapper.treeToValue(apiResponse.get("data"), PostResponse.class);
        assertNotNull(postResponse);
        assertEquals("This is an integration test post", postResponse.getContent());
        assertNotNull(postResponse.getId());

        String postId = postResponse.getId();

        // 2. React to Post
        ReactionRequest reactionRequest = new ReactionRequest();
        reactionRequest.setType(ReactionType.LIKE);

        mockMvc.perform(post("/posts/" + postId + "/react")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reactionRequest))
                        .with(jwt().jwt(builder -> builder.subject(email))))
                .andExpect(status().isOk());

        // 3. Add a Comment
        MvcResult commentResult = mockMvc.perform(multipart("/posts/" + postId + "/comments")
                        .param("content", "This is a test comment")
                        .with(jwt().jwt(builder -> builder.subject(email))))
                .andExpect(status().isOk())
                .andReturn();

        var commentApiResponse = objectMapper.readTree(commentResult.getResponse().getContentAsString());
        assertEquals(200, commentApiResponse.get("status").asInt());
        CommentResponse commentResponse = objectMapper.treeToValue(commentApiResponse.get("data"), CommentResponse.class);
        assertNotNull(commentResponse);
        assertEquals("This is a test comment", commentResponse.getContent());
        String commentId = commentResponse.getId();

        // Verify entities exist in database
        Optional<Post> postFromDb = postRepository.findById(postId);
        assertTrue(postFromDb.isPresent());
        assertFalse(postFromDb.get().isDeleted());

        Optional<Comment> commentFromDb = commentRepository.findById(commentId);
        assertTrue(commentFromDb.isPresent());
        assertFalse(commentFromDb.get().isDeleted());

        // 4. Soft Delete Comment
        mockMvc.perform(delete("/posts/comments/" + commentId)
                        .with(jwt().jwt(builder -> builder.subject(email))))
                .andExpect(status().isOk());

        // Verify comment is soft deleted in DB
        Optional<Comment> deletedCommentFromDb = commentRepository.findById(commentId);
        assertTrue(deletedCommentFromDb.isPresent());
        assertTrue(deletedCommentFromDb.get().isDeleted());
        assertNotNull(deletedCommentFromDb.get().getDeletedAt());

        // 5. Soft Delete Post
        mockMvc.perform(delete("/posts/" + postId)
                        .with(jwt().jwt(builder -> builder.subject(email))))
                .andExpect(status().isOk());

        // Verify post is soft deleted in DB
        Optional<Post> deletedPostFromDb = postRepository.findById(postId);
        assertTrue(deletedPostFromDb.isPresent());
        assertTrue(deletedPostFromDb.get().isDeleted());
        assertNotNull(deletedPostFromDb.get().getDeletedAt());
    }
}
