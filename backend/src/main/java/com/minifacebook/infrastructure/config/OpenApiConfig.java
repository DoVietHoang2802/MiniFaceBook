package com.minifacebook.infrastructure.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

  @Bean
  public OpenAPI miniFaceBookOpenAPI() {
    return new OpenAPI()
        .info(
            new Info()
                .title("MiniFaceBook API Reference")
                .description(
                    "Tài liệu API chi tiết cho dự án mạng xã hội MiniFaceBook (Spring Boot 3.3 + Java 21)")
                .version("v0.3.0")
                .license(new License().name("Apache 2.0").url("http://springdoc.org")))
        .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
        .components(
            new Components()
                .addSecuritySchemes(
                    "bearerAuth",
                    new SecurityScheme()
                        .name("bearerAuth")
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")));
  }
}
