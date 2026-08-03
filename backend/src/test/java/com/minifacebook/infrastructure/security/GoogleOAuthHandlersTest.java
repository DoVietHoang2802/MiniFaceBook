package com.minifacebook.infrastructure.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.minifacebook.shared.security.GoogleOAuthLoginPort;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

class GoogleOAuthHandlersTest {

  @Test
  void successHandler_AuthenticatedGoogleUserSetsSessionCookiesAndRedirectsToCallback()
      throws Exception {
    GoogleOAuthLoginPort loginPort = mock(GoogleOAuthLoginPort.class);
    GoogleOAuthSuccessHandler handler = new GoogleOAuthSuccessHandler(loginPort, properties());
    Authentication authentication = authenticationForVerifiedUser();
    MockHttpServletRequest request = requestWithSession();
    MockHttpServletResponse response = new MockHttpServletResponse();
    when(loginPort.resolveGoogleLogin("subject", "user@test.com", "Google User"))
        .thenReturn(GoogleOAuthLoginPort.GoogleOAuthLoginResult.authenticated("access", "refresh"));

    handler.onAuthenticationSuccess(request, response, authentication);

    assertEquals("http://localhost:5173/oauth/callback", response.getRedirectedUrl());
    List<String> cookies = response.getHeaders(HttpHeaders.SET_COOKIE);
    assertEquals(2, cookies.size());
    assertTrue(cookies.stream().anyMatch(cookie -> cookie.contains("accessToken=access")
        && cookie.contains("HttpOnly") && cookie.contains("SameSite=Strict") && cookie.contains("Path=/api")));
    assertTrue(cookies.stream().anyMatch(cookie -> cookie.contains("refreshToken=refresh")
        && cookie.contains("HttpOnly") && cookie.contains("Max-Age=604800")));
    verify(loginPort).resolveGoogleLogin("subject", "user@test.com", "Google User");
  }

  @Test
  void successHandler_NewGoogleUserSetsOnboardingCookieAndRedirectsToCompletion()
      throws Exception {
    GoogleOAuthLoginPort loginPort = mock(GoogleOAuthLoginPort.class);
    GoogleOAuthSuccessHandler handler = new GoogleOAuthSuccessHandler(loginPort, properties());
    MockHttpServletResponse response = new MockHttpServletResponse();
    when(loginPort.resolveGoogleLogin(any(), any(), any())).thenReturn(
        GoogleOAuthLoginPort.GoogleOAuthLoginResult.profileCompletionRequired("onboarding-token"));

    handler.onAuthenticationSuccess(requestWithSession(), response, authenticationForVerifiedUser());

    assertEquals("http://localhost:5173/oauth/complete-profile", response.getRedirectedUrl());
    List<String> cookies = response.getHeaders(HttpHeaders.SET_COOKIE);
    assertEquals(1, cookies.size());
    assertTrue(cookies.get(0).contains("googleProfileCompletion=onboarding-token"));
    assertTrue(cookies.get(0).contains("HttpOnly") && cookies.get(0).contains("SameSite=Lax")
        && cookies.get(0).contains("Max-Age=600") && cookies.get(0).contains("Path=/api"));
  }

  @Test
  void successHandler_UnverifiedGoogleEmailRedirectsToSafeLoginErrorWithoutCallingService()
      throws Exception {
    GoogleOAuthLoginPort loginPort = mock(GoogleOAuthLoginPort.class);
    GoogleOAuthSuccessHandler handler = new GoogleOAuthSuccessHandler(loginPort, properties());
    Authentication authentication = mock(Authentication.class);
    OidcUser user = mock(OidcUser.class);
    when(authentication.getPrincipal()).thenReturn(user);
    when(user.getEmailVerified()).thenReturn(false);
    MockHttpServletResponse response = new MockHttpServletResponse();

    handler.onAuthenticationSuccess(requestWithSession(), response, authentication);

    assertEquals("http://localhost:5173/login?oauth_error=failed", response.getRedirectedUrl());
    assertTrue(response.getHeaders(HttpHeaders.SET_COOKIE).isEmpty());
    verify(loginPort, never()).resolveGoogleLogin(any(), any(), any());
  }

  @Test
  void failureHandler_InvalidatesSessionAndUsesSafeFrontendRedirect() throws Exception {
    GoogleOAuthFailureHandler handler = new GoogleOAuthFailureHandler(properties());
    MockHttpServletResponse response = new MockHttpServletResponse();

    handler.onAuthenticationFailure(requestWithSession(), response,
        new AuthenticationServiceException("provider failure"));

    assertEquals("http://localhost:5173/login?oauth_error=failed", response.getRedirectedUrl());
  }

  private Authentication authenticationForVerifiedUser() {
    Authentication authentication = mock(Authentication.class);
    OidcUser user = mock(OidcUser.class);
    when(authentication.getPrincipal()).thenReturn(user);
    when(user.getEmailVerified()).thenReturn(true);
    when(user.getSubject()).thenReturn("subject");
    when(user.getEmail()).thenReturn("user@test.com");
    when(user.getFullName()).thenReturn("Google User");
    return authentication;
  }

  private MockHttpServletRequest requestWithSession() {
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.setSession(new MockHttpSession());
    return request;
  }

  private GoogleOAuthProperties properties() {
    GoogleOAuthProperties properties = new GoogleOAuthProperties();
    properties.setFrontendUrl("http://localhost:5173");
    properties.setSecureCookies(false);
    return properties;
  }
}
