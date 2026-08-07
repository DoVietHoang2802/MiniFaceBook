package com.minifacebook.module.chat.application.port;

import com.minifacebook.module.chat.application.dto.AiInsightTask;

public interface ChatAiClient {

  String generate(AiInsightTask task, String transcript);
}
