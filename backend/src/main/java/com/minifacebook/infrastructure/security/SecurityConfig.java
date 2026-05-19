package com.minifacebook.infrastructure.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.minifacebook.infrastructure.filter.RateLimitingFilter;
import com.minifacebook.shared.dto.ApiResponse;
import com.minifacebook.shared.exception.ErrorCode;
import javax.crypto.spec.SecretKeySpec;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

  private final RateLimitingFilter rateLimitingFilter;

  private final String[] PUBLIC_POST_ENDPOINTS = {
    "/auth/login", "/auth/register", "/auth/refresh", "/auth/introspect"
  };

  private final String[] PUBLIC_GET_ENDPOINTS = {
    "/auth/verify"
  };

  private final String[] SWAGGER_ENDPOINTS = {
    "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html", "/docs/**", "/api-docs/**"
  };

  @Value("${app.jwt.secret}")
  private String SIGNER_KEY;

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
                .requestMatchers(SWAGGER_ENDPOINTS)
                .permitAll()
                .anyRequest()
                .authenticated());

    httpSecurity.oauth2ResourceServer(
        oauth2 ->
            oauth2
                .jwt(jwtConfigurer -> jwtConfigurer.decoder(jwtDecoder()))
                .bearerTokenResolver(
                    request -> {
                      if (request.getCookies() != null) {
                        for (var cookie : request.getCookies()) {
                          if ("accessToken".equals(cookie.getName())) {
                            return cookie.getValue();
                          }
                        }
                      }
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

    httpSecurity.csrf(AbstractHttpConfigurer::disable);

    // Thêm Rate Limiting Filter vào đầu chuỗi
    httpSecurity.addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class);

    return httpSecurity.build();
  }

  @Bean
  JwtDecoder jwtDecoder() {
    SecretKeySpec secretKeySpec = new SecretKeySpec(SIGNER_KEY.getBytes(), "HS256");
    return NimbusJwtDecoder.withSecretKey(secretKeySpec).macAlgorithm(MacAlgorithm.HS256).build();
  }

  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(List.of("http://localhost:5173"));
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Cache-Control", "Cookie"));
    configuration.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }
}
