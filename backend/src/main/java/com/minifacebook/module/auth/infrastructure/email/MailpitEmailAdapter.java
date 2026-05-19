package com.minifacebook.module.auth.infrastructure.email;

import com.minifacebook.module.auth.domain.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Adapter triển khai gửi email sử dụng máy chủ Mailpit SMTP nội bộ.
 * Đặt tại phân lớp Infrastructure của Auth module.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class MailpitEmailAdapter implements EmailService {

  private final JavaMailSender mailSender;

  @Override
  public void sendVerificationEmail(String toEmail, String verificationToken) {
    String verificationLink = "http://localhost:8080/api/auth/verify?token=" + verificationToken;
    log.info("=========================================================================");
    log.info("[MAILPIT] Verification Link for {}:", toEmail);
    log.info("👉 {}", verificationLink);
    log.info("=========================================================================");

    try {
      MimeMessage mimeMessage = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

      String htmlContent = "<h3>Welcome to MiniFaceBook!</h3>"
          + "<p>Please verify your email address by clicking the link below:</p>"
          + "<p><a href=\"" + verificationLink + "\" style=\""
          + "background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;"
          + "\">Verify Account</a></p>"
          + "<p>If you did not request this, please ignore this email.</p>";

      helper.setText(htmlContent, true);
      helper.setTo(toEmail);
      helper.setSubject("Verify your email - MiniFaceBook");
      helper.setFrom("onboarding@minifacebook.com");

      mailSender.send(mimeMessage);
      log.info("Verification email sent to {} via Mailpit SMTP successfully.", toEmail);
    } catch (Exception e) {
      log.error("Failed to send verification email to {} via Mailpit SMTP: {}", toEmail, e.getMessage(), e);
    }
  }
}
