package com.minifacebook.module.auth.infrastructure.email;

import com.minifacebook.module.auth.domain.service.EmailService;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Adapter triển khai gửi email sử dụng nhà cung cấp dịch vụ Resend qua REST API.
 * Đặt tại phân lớp Infrastructure của Auth module.
 */
@Service
@Slf4j
public class ResendEmailAdapter implements EmailService {

  @Value("${app.resend.api-key}")
  private String apiKey;

  private final RestTemplate restTemplate = new RestTemplate();

  @Override
  public void sendVerificationEmail(String toEmail, String verificationToken) {
    String url = "https://api.resend.com/emails";

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    headers.set("Authorization", "Bearer " + apiKey);

    String verificationLink = "http://localhost:8080/api/auth/verify?token=" + verificationToken;
    String htmlContent = "<h3>Welcome to MiniFaceBook!</h3>"
        + "<p>Please verify your email address by clicking the link below:</p>"
        + "<p><a href=\"" + verificationLink + "\" style=\""
        + "background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;"
        + "\">Verify Account</a></p>"
        + "<p>If you did not request this, please ignore this email.</p>";

    Map<String, Object> body = Map.of(
        "from", "MiniFaceBook <onboarding@resend.dev>",
        "to", new String[]{toEmail},
        "subject", "Verify your email - MiniFaceBook",
        "html", htmlContent
    );

    HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

    try {
      ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
      log.info("Email verification sent to {} successfully. Response status: {}", toEmail, response.getStatusCode());
    } catch (Exception e) {
      log.error("Failed to send verification email to {} via Resend REST API", toEmail, e);
    }
  }
}
