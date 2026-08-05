package com.minifacebook.module.auth.infrastructure.email;

import com.minifacebook.module.auth.domain.service.EmailService;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Adapter triển khai gửi email sử dụng nhà cung cấp dịch vụ Resend qua REST API.
 * Đặt tại phân lớp Infrastructure của Auth module.
 */
@Service
@Profile("prod")
@Slf4j
public class ResendEmailAdapter implements EmailService {

  @Value("${app.resend.api-key}")
  private String apiKey;

  @Value("${app.resend.from-email}")
  private String fromEmail;

  @Value("${app.resend.from-name:MiniFaceBook}")
  private String fromName;

  @Value("${app.oauth.google.frontend-url}")
  private String frontendUrl;

  private final RestTemplate restTemplate = new RestTemplate();

  @Override
  public void sendVerificationEmail(String toEmail, String verificationToken) {
    String url = "https://api.resend.com/emails";

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    headers.set("Authorization", "Bearer " + apiKey);

    String verificationLink = frontendUrl + "/verify?token="
        + URLEncoder.encode(verificationToken, StandardCharsets.UTF_8);
    String htmlContent = emailLayout(
        "Xác thực email",
        "Chào mừng bạn đến với MiniFaceBook",
        "Hãy xác thực địa chỉ email để kích hoạt tài khoản và bắt đầu kết nối.",
        "Xác thực email",
        verificationLink,
        "Nếu bạn không tạo tài khoản này, bạn có thể bỏ qua email.");

    Map<String, Object> body = Map.of(
        "from", sender(),
        "to", new String[]{toEmail},
        "subject", "Xác thực email của bạn | MiniFaceBook",
        "html", htmlContent,
        "text", "Chào mừng bạn đến với MiniFaceBook. Xác thực email tại: "
            + verificationLink + "\n\nNếu bạn không tạo tài khoản này, hãy bỏ qua email."
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

    String htmlContent = emailLayout(
        "Đặt lại mật khẩu",
        "Mã xác thực của bạn",
        "Dùng mã bên dưới để tiếp tục đặt lại mật khẩu. Mã có hiệu lực trong 5 phút.",
        otp,
        null,
        "Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.");

    Map<String, Object> body = Map.of(
        "from", sender(),
        "to", new String[]{toEmail},
        "subject", "Mã đặt lại mật khẩu | MiniFaceBook",
        "html", htmlContent,
        "text", "Mã đặt lại mật khẩu MiniFaceBook của bạn là " + otp
            + ". Mã có hiệu lực trong 5 phút."
    );

    HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

    try {
      ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
      log.info("Reset OTP email sent to {} successfully. Response status: {}", toEmail, response.getStatusCode());
    } catch (Exception e) {
      log.error("Failed to send reset OTP email to {} via Resend REST API", toEmail, e);
    }
  }

  private String sender() {
    return fromName + " <" + fromEmail + ">";
  }

  private String emailLayout(
      String eyebrow, String title, String message, String action, String actionLink, String footer) {
    String actionContent = actionLink == null
        ? "<div style=\"margin:28px 0;padding:16px;border-radius:10px;background:#f5f3ff;"
            + "color:#5b21b6;font-size:28px;font-weight:700;letter-spacing:7px;text-align:center;\">"
            + action + "</div>"
        : "<div style=\"margin:28px 0;text-align:center;\"><a href=\"" + actionLink
            + "\" style=\"display:inline-block;border-radius:10px;background:#6d28d9;color:#ffffff;"
            + "padding:13px 24px;font-weight:700;text-decoration:none;\">" + action + "</a></div>";
    return "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" "
        + "style=\"background:#f8fafc;padding:32px 16px;font-family:Arial,sans-serif;color:#1e293b;\"><tr><td "
        + "align=\"center\"><table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" "
        + "style=\"max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;\">"
        + "<tr><td style=\"padding:24px 32px;background:#5b21b6;color:#ffffff;font-size:20px;font-weight:700;\">"
        + "MiniFaceBook</td></tr><tr><td style=\"padding:32px;\"><p style=\"margin:0 0 10px;color:#7c3aed;"
        + "font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;\">" + eyebrow
        + "</p><h1 style=\"margin:0 0 16px;font-size:24px;line-height:1.3;\">" + title + "</h1><p "
        + "style=\"margin:0;color:#475569;font-size:15px;line-height:1.6;\">" + message + "</p>" + actionContent
        + "<p style=\"margin:0;color:#64748b;font-size:13px;line-height:1.5;\">" + footer + "</p></td></tr>"
        + "</table></td></tr></table>";
  }
}

