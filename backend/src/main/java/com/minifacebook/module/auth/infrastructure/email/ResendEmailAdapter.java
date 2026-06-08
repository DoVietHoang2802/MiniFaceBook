package com.minifacebook.module.auth.infrastructure.email;

import com.minifacebook.module.auth.domain.service.EmailService;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

/**
 * Adapter triển khai gửi email sử dụng nhà cung cấp dịch vụ Resend qua REST API.
 * Đặt tại phân lớp Infrastructure của Auth module.
 */
// @Service
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
    log.info("=========================================================================");
    log.info("[DEVELOPMENT ONLY] Verification Link for {}:", toEmail);
    log.info("👉 {}", verificationLink);
    log.info("=========================================================================");

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

  @Override
  public void sendResetOtpEmail(String toEmail, String otp) {
    String url = "https://api.resend.com/emails";

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    headers.set("Authorization", "Bearer " + apiKey);

    log.info("=========================================================================");
    log.info("[DEVELOPMENT ONLY] Reset Password OTP for {}:", toEmail);
    log.info("👉 Code: {}", otp);
    log.info("=========================================================================");

    String htmlContent = "<h3>Reset Password Verification</h3>"
        + "<p>You requested to reset your password. Please use the verification code below to proceed:</p>"
        + "<h2 style=\"background-color: #f2f2f2; padding: 10px; display: inline-block; letter-spacing: 5px; color: #2563EB;\">" + otp + "</h2>"
        + "<p>This code is valid for 5 minutes. If you did not request this, please ignore this email.</p>";

    Map<String, Object> body = Map.of(
        "from", "MiniFaceBook <security@resend.dev>",
        "to", new String[]{toEmail},
        "subject", "Reset your password - MiniFaceBook",
        "html", htmlContent
    );

    HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

    try {
      ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
      log.info("Reset OTP email sent to {} successfully. Response status: {}", toEmail, response.getStatusCode());
    } catch (Exception e) {
      log.error("Failed to send reset OTP email to {} via Resend REST API", toEmail, e);
    }
  }
}

