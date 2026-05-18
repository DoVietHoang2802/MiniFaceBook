package com.minifacebook.module.auth.infrastructure.security;

import com.minifacebook.shared.exception.AppException;
import com.minifacebook.shared.exception.ErrorCode;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSObject;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.Payload;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Service xử lý tạo và kiểm tra tính hợp lệ của JSON Web Token (JWT). Đặt tại
 * module.auth.infrastructure.security như một phần hạ tầng của Auth module.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {

  @NonFinal
  @Value("${app.jwt.secret}")
  protected String SIGNER_KEY;

  @NonFinal
  @Value("${app.jwt.access-token-expiration}")
  protected long ACCESS_TOKEN_EXPIRATION;

  @NonFinal
  @Value("${app.jwt.refresh-token-expiration}")
  protected long REFRESH_TOKEN_EXPIRATION;

  /** Tạo Token (Access hoặc Refresh). */
  public String generateToken(String username, boolean isRefresh) {
    JWSHeader header = new JWSHeader(JWSAlgorithm.HS256);

    long expiration = isRefresh ? REFRESH_TOKEN_EXPIRATION : ACCESS_TOKEN_EXPIRATION;

    JWTClaimsSet jwtClaimsSet =
        new JWTClaimsSet.Builder()
            .subject(username)
            .issuer("minifacebook.com")
            .issueTime(new Date())
            .expirationTime(
                new Date(Instant.now().plus(expiration, ChronoUnit.SECONDS).toEpochMilli()))
            .jwtID(UUID.randomUUID().toString())
            .claim("scope", isRefresh ? "REFRESH_TOKEN" : "ACCESS_TOKEN")
            .build();

    Payload payload = new Payload(jwtClaimsSet.toJSONObject());

    JWSObject jwsObject = new JWSObject(header, payload);

    try {
      jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
      return jwsObject.serialize();
    } catch (JOSEException e) {
      log.error("Cannot create token", e);
      throw new RuntimeException(e);
    }
  }

  /** Kiểm tra tính hợp lệ của Token. */
  public SignedJWT verifyToken(String token) throws JOSEException, ParseException {
    JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());

    SignedJWT signedJWT = SignedJWT.parse(token);

    Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();

    var verified = signedJWT.verify(verifier);

    if (!(verified && expiryTime.after(new Date()))) {
      throw new AppException(ErrorCode.UNAUTHENTICATED);
    }

    return signedJWT;
  }
}
