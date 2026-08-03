package com.minifacebook.infrastructure.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;

class GoogleAccountChooserAuthorizationRequestResolverTest {

  @Test
  void resolve_AddsGoogleAccountChooserPrompt() {
    ClientRegistration registration = ClientRegistration.withRegistrationId("google")
        .clientId("client-id")
        .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
        .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
        .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
        .tokenUri("https://oauth2.googleapis.com/token")
        .build();
    GoogleAccountChooserAuthorizationRequestResolver resolver =
        new GoogleAccountChooserAuthorizationRequestResolver(
            new InMemoryClientRegistrationRepository(registration));
    MockHttpServletRequest request = new MockHttpServletRequest("GET", "/oauth2/authorization/google");
    request.setServletPath("/oauth2/authorization/google");

    var authorizationRequest = resolver.resolve(request);

    assertNotNull(authorizationRequest);
    assertEquals("select_account", authorizationRequest.getAdditionalParameters().get("prompt"));
  }
}
