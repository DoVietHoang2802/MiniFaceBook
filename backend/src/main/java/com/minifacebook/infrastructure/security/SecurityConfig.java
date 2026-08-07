package com.minifacebook.infrastructure.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.minifacebook.infrastructure.filter.RateLimitingFilter;
import com.minifacebook.infrastructure.filter.TokenBlacklistFilter;
import com.minifacebook.shared.dto.ApiResponse;
import com.minifacebook.shared.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
@SuppressWarnings("null")
public class SecurityConfig {

  private final RateLimitingFilter rateLimitingFilter;
  private final TokenBlacklistFilter tokenBlacklistFilter;
  private final JwtDecoder jwtDecoder;
  private final GoogleOAuthProperties googleOAuthProperties;
  private final GoogleOAuthSuccessHandler googleOAuthSuccessHandler;
  private final GoogleOAuthFailureHandler googleOAuthFailureHandler;

  @Value("${app.cors.allowed-origins}")
  private List<String> allowedOrigins;

  private final String[] PUBLIC_POST_ENDPOINTS = {
    "/auth/login", "/auth/register", "/auth/refresh", "/auth/logout", "/auth/introspect",
    "/auth/forgot-password", "/auth/forgot-password/verify", "/auth/reset-password",
    "/auth/oauth/google/complete-profile"
  };

  private final String[] PUBLIC_GET_ENDPOINTS = {
    "/auth/verify"
  };

  private final String[] SWAGGER_ENDPOINTS = {
    "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html", "/docs/**", "/api-docs/**"
  };

  private final String[] WEBSOCKET_ENDPOINTS = {
    "/ws/**", "/ws"
  };

  /** Public health for Docker / CI / cloud probes (chỉ health được expose trong yml). */
  private final String[] ACTUATOR_PUBLIC_ENDPOINTS = {
    "/actuator/health", "/actuator/health/**"
  };

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity httpSecurity) throws Exception {
    httpSecurity.cors(cors -> cors.configurationSource(corsConfigurationSource()));

    httpSecurity.authorizeHttpRequests(
        request ->
            request
                .requestMatchers(HttpMethod.POST, PUBLIC_POST_ENDPOINTS)
                .permitAll()
                 .requestMatchers(HttpMethod.GET, PUBLIC_GET_ENDPOINTS)
                 .permitAll()
                 .requestMatchers("/dev/**")
                 .denyAll()
                .requestMatchers(SWAGGER_ENDPOINTS)
                .permitAll()
                .requestMatchers(WEBSOCKET_ENDPOINTS)
                .permitAll()
                 .requestMatchers(ACTUATOR_PUBLIC_ENDPOINTS)
                 .permitAll()
                .requestMatchers("/oauth2/**", "/login/oauth2/**", "/auth/oauth/google/profile")
                .permitAll()
                .anyRequest()
                .authenticated());

    httpSecurity.oauth2ResourceServer(
        oauth2 ->
            oauth2
                .jwt(jwtConfigurer -> jwtConfigurer
                    .decoder(jwtDecoder)
                    .jwtAuthenticationConverter(jwtAuthenticationConverter()))
                .bearerTokenResolver(
                    request -> {
                      String path = request.getRequestURI();
                      if (path.endsWith("/auth/login") || path.endsWith("/auth/register") || path.endsWith("/auth/refresh")
                          || path.contains("/auth/forgot-password") || path.contains("/auth/reset-password")
                          || path.contains("/actuator/health")) {
                        return null; // Bỏ qua JWT filter cho các API public
                      }

                      // 1. Check query param (for SSE)
                      String tokenFromQuery = request.getParameter("access_token");
                      if (tokenFromQuery != null && !tokenFromQuery.isBlank()) {
                        return tokenFromQuery;
                      }

                      // 2. Check cookie (for WebSocket & SSE fallback)
                      if (request.getCookies() != null) {
                        for (var cookie : request.getCookies()) {
                          if ("accessToken".equals(cookie.getName())) {
                            return cookie.getValue();
                          }
                        }
                      }

                      // 3. Check Authorization header (standard)
                      String authorization = request.getHeader("Authorization");
                      if (authorization != null && authorization.startsWith("Bearer ")) {
                        return authorization.substring(7);
                      }
                      return null;
                    })
                .authenticationEntryPoint(
                    (request, response, authException) -> {
                      ErrorCode errorCode = ErrorCode.UNAUTHENTICATED;

                      response.setStatus(errorCode.getStatusCode().value());
                      response.setContentType("application/json");

                      ApiResponse<?> apiResponse =
                          ApiResponse.builder()
                              .status(errorCode.getCode())
                              .message(errorCode.getMessage())
                              .build();

                      ObjectMapper objectMapper = new ObjectMapper();
                      response.getWriter().write(objectMapper.writeValueAsString(apiResponse));
                      response.flushBuffer();
                    }));

    // API clients must receive 401, never an OAuth HTML redirect. The explicit
    // /oauth2/authorization/google navigation is still handled by its own filter.
    httpSecurity.exceptionHandling(exceptions -> exceptions
        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)));

    if (googleOAuthProperties.isEnabled()) {
      httpSecurity.oauth2Login(oauth -> oauth
          .authorizationEndpoint(authorization -> authorization
              .authorizationRequestResolver(new GoogleAccountChooserAuthorizationRequestResolver(
                  googleClientRegistrationRepository())))
          .successHandler(googleOAuthSuccessHandler)
          .failureHandler(googleOAuthFailureHandler));
    }

    httpSecurity.csrf(AbstractHttpConfigurer::disable);

    // Thêm Rate Limiting Filter vào đầu chuỗi
    httpSecurity.addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class);

    // Thêm Blacklist Filter sau Rate Limiting, trước JWT validation
    httpSecurity.addFilterAfter(tokenBlacklistFilter, RateLimitingFilter.class);

    return httpSecurity.build();
  }

  @Bean
  @ConditionalOnProperty(prefix = "app.oauth.google", name = "enabled", havingValue = "true")
  ClientRegistrationRepository googleClientRegistrationRepository() {
    ClientRegistration google = ClientRegistration.withRegistrationId("google")
        .clientId(googleOAuthProperties.getClientId())
        .clientSecret(googleOAuthProperties.getClientSecret())
        .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
        .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
        .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
        .scope("openid", "profile", "email")
        .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
        .tokenUri("https://oauth2.googleapis.com/token")
        .jwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
        .userInfoUri("https://openidconnect.googleapis.com/v1/userinfo")
        .userNameAttributeName("sub")
        .clientName("Google")
        .build();
    return new InMemoryClientRegistrationRepository(google);
  }

  @Bean
  public org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter jwtAuthenticationConverter() {
    var grantedAuthoritiesConverter = new org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter();
    grantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");
    grantedAuthoritiesConverter.setAuthoritiesClaimName("roles");

    var jwtAuthenticationConverter = new org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter();
    jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
    return jwtAuthenticationConverter;
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(allowedOrigins);
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
    configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Cache-Control", "Cookie"));
    configuration.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }
}
