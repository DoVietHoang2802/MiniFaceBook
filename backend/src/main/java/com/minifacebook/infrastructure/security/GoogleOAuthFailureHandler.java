package com.minifacebook.infrastructure.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;

/** Returns a safe frontend error instead of exposing OAuth provider details. */
@Component
@RequiredArgsConstructor
public class GoogleOAuthFailureHandler extends SimpleUrlAuthenticationFailureHandler {
  private final GoogleOAuthProperties properties;

  @Override
  public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
      AuthenticationException exception) throws IOException {
    var session = request.getSession(false);
    if (session != null) session.invalidate();
    getRedirectStrategy().sendRedirect(request, response,
        properties.getFrontendUrl() + "/login?oauth_error=failed");
  }
}
