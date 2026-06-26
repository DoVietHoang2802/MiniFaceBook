package com.minifacebook;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import com.minifacebook.module.notification.application.service.NotificationEventBroadcaster;
import com.minifacebook.module.post.application.service.PostEventBroadcaster;
import com.minifacebook.module.post.application.service.CommentEventBroadcaster;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {

    @MockBean
    protected NotificationEventBroadcaster notificationEventBroadcaster;

    @MockBean
    protected PostEventBroadcaster postEventBroadcaster;

    @MockBean
    protected CommentEventBroadcaster commentEventBroadcaster;
}
