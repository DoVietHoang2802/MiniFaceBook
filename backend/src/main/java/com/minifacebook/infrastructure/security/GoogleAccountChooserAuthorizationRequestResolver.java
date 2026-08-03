package com.minifacebook.infrastructure.security;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

/** Adds an account chooser prompt without ending the user's separate Google browser session. */
@RequiredArgsConstructor
public class GoogleAccountChooserAuthorizationRequestResolver
    implements OAuth2AuthorizationRequestResolver {

  private final ClientRegistrationRepository clientRegistrationRepository;

  private DefaultOAuth2AuthorizationRequestResolver delegate() {
    DefaultOAuth2AuthorizationRequestResolver resolver =
        new DefaultOAuth2AuthorizationRequestResolver(
            clientRegistrationRepository, "/oauth2/authorization");
    resolver.setAuthorizationRequestCustomizer(builder ->
        builder.additionalParameters(parameters -> parameters.put("prompt", "select_account")));
    return resolver;
  }

  @Override
  public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
    return delegate().resolve(request);
  }

  @Override
  public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
    return delegate().resolve(request, clientRegistrationId);
  }
}
