package com.minifacebook.infrastructure.security;

import com.minifacebook.shared.security.GoogleOAuthLoginPort;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class GoogleOAuthSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
  private final GoogleOAuthLoginPort googleOAuthLoginPort;
  private final GoogleOAuthProperties properties;

  @Override
  public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
      Authentication authentication) throws IOException {
    if (!(authentication.getPrincipal() instanceof OidcUser user)
        || !Boolean.TRUE.equals(user.getEmailVerified())) {
      getRedirectStrategy().sendRedirect(request, response, properties.getFrontendUrl() + "/login?oauth_error=failed");
      return;
    }
    var result = googleOAuthLoginPort.resolveGoogleLogin(user.getSubject(), user.getEmail(), user.getFullName());
    if (result.requiresProfileCompletion()) {
      ResponseCookie onboarding = ResponseCookie.from("googleProfileCompletion", result.onboardingToken())
          .httpOnly(true).secure(properties.isSecureCookies()).sameSite("Lax").path("/api").maxAge(600).build();
      response.addHeader(HttpHeaders.SET_COOKIE, onboarding.toString());
      invalidateOAuthSession(request);
      getRedirectStrategy().sendRedirect(request, response, properties.getFrontendUrl() + "/oauth/complete-profile");
      return;
    }
    writeSessionCookies(response, result.accessToken(), result.refreshToken());
    invalidateOAuthSession(request);
    getRedirectStrategy().sendRedirect(request, response, properties.getFrontendUrl() + "/oauth/callback");
  }

  private void invalidateOAuthSession(HttpServletRequest request) {
    var session = request.getSession(false);
    if (session != null) session.invalidate();
  }

  private void writeSessionCookies(HttpServletResponse response, String accessToken, String refreshToken) {
    response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from("accessToken", accessToken)
        .httpOnly(true).secure(properties.isSecureCookies()).sameSite("Strict").path("/api").maxAge(3600).build().toString());
    response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from("refreshToken", refreshToken)
        .httpOnly(true).secure(properties.isSecureCookies()).sameSite("Strict").path("/api").maxAge(604800).build().toString());
  }
}
