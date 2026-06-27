package com.minifacebook.module.chat.presentation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.minifacebook.BaseIntegrationTest;
import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.auth.infrastructure.persistence.repository.MongoUserRepository;
import com.minifacebook.module.chat.application.dto.EditMessageRequest;
import com.minifacebook.module.chat.application.dto.MessageResponse;
import com.minifacebook.module.chat.application.dto.MessageSendRequest;
import com.minifacebook.module.chat.application.service.MessageService;
import com.minifacebook.module.chat.domain.entity.Conversation;
import com.minifacebook.module.chat.domain.entity.Message;
import com.minifacebook.module.chat.domain.entity.MessageType;
import com.minifacebook.module.chat.domain.repository.ConversationRepository;
import com.minifacebook.module.chat.domain.repository.MessageRepository;
import com.minifacebook.module.chat.infrastructure.persistence.repository.MongoConversationRepository;
import com.minifacebook.module.chat.infrastructure.persistence.repository.MongoMessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
public class MessageIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MongoUserRepository mongoUserRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private MongoConversationRepository mongoConversationRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private MongoMessageRepository mongoMessageRepository;

    @Autowired
    private MessageService messageService;

    @Autowired
    private ObjectMapper objectMapper;

    private final String emailSender = "sender_chat_integration@example.com";
    private final String emailRecipient = "recipient_chat_integration@example.com";

    private User sender;
    private User recipient;
    private Conversation conversation;

    @BeforeEach
    void setUp() {
        mongoMessageRepository.deleteAll();
        mongoConversationRepository.deleteAll();
        mongoUserRepository.findByEmail(emailSender).ifPresent(mongoUserRepository::delete);
        mongoUserRepository.findByEmail(emailRecipient).ifPresent(mongoUserRepository::delete);

        sender = User.builder()
                .email(emailSender)
                .name("Chat Sender")
                .verified(true)
                .build();
        recipient = User.builder()
                .email(emailRecipient)
                .name("Chat Recipient")
                .verified(true)
                .build();

        sender = userRepository.save(sender);
        recipient = userRepository.save(recipient);

        conversation = Conversation.builder()
                .participantIds(List.of(sender.getId(), recipient.getId()))
                .build();
        conversation = conversationRepository.save(conversation);
    }

    @Test
    void testMessageLifecycleAndSoftDeleteFlow() throws Exception {
        // 1. Send a message using MessageService
        MessageSendRequest sendRequest = MessageSendRequest.builder()
                .conversationId(conversation.getId())
                .content("Hello, this is a test message")
                .type(MessageType.TEXT)
                .build();

        MessageResponse sendResponse = messageService.sendMessage(emailSender, sendRequest);
        assertNotNull(sendResponse);
        assertEquals("Hello, this is a test message", sendResponse.getContent());
        String messageId = sendResponse.getId();

        // Verify message is in DB
        Optional<Message> messageFromDb = messageRepository.findById(messageId);
        assertTrue(messageFromDb.isPresent());
        assertFalse(messageFromDb.get().isDeleted());

        // 2. Mark as Delivered via MockMvc
        mockMvc.perform(put("/messages/" + messageId + "/delivered")
                        .with(jwt().jwt(builder -> builder.subject(emailRecipient))))
                .andExpect(status().isOk());

        // Verify marked as delivered in DB
        Optional<Message> deliveredMsg = messageRepository.findById(messageId);
        assertTrue(deliveredMsg.isPresent());
        assertNotNull(deliveredMsg.get().getDeliveredAt());

        // 3. Edit Message via MockMvc
        EditMessageRequest editRequest = EditMessageRequest.builder()
                .content("Hello, this message has been edited")
                .build();

        mockMvc.perform(put("/messages/" + messageId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(editRequest))
                        .with(jwt().jwt(builder -> builder.subject(emailSender))))
                .andExpect(status().isOk());

        // Verify content updated in DB
        Optional<Message> editedMsg = messageRepository.findById(messageId);
        assertTrue(editedMsg.isPresent());
        assertEquals("Hello, this message has been edited", editedMsg.get().getContent());
        assertNotNull(editedMsg.get().getEditedAt());

        // 4. Soft Delete Message (scope = everyone) via MockMvc
        mockMvc.perform(delete("/messages/" + messageId)
                        .param("scope", "everyone")
                        .with(jwt().jwt(builder -> builder.subject(emailSender))))
                .andExpect(status().isOk());

        // Verify message soft deleted in DB
        Optional<Message> deletedMsg = messageRepository.findById(messageId);
        assertTrue(deletedMsg.isPresent());
        assertTrue(deletedMsg.get().isDeleted());
        assertNull(deletedMsg.get().getContent());
        assertNull(deletedMsg.get().getMediaUrl());
    }
}
