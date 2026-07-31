package com.minifacebook.shared.security;

/** Boundary used by the Spring Security OAuth adapter to resolve a verified Google identity. */
public interface GoogleOAuthLoginPort {

  GoogleOAuthLoginResult resolveGoogleLogin(String googleSubject, String email, String suggestedName);

  record GoogleOAuthLoginResult(String accessToken, String refreshToken, String onboardingToken) {
    public static GoogleOAuthLoginResult authenticated(String accessToken, String refreshToken) {
      return new GoogleOAuthLoginResult(accessToken, refreshToken, null);
    }

    public static GoogleOAuthLoginResult profileCompletionRequired(String onboardingToken) {
      return new GoogleOAuthLoginResult(null, null, onboardingToken);
    }

    public boolean requiresProfileCompletion() {
      return onboardingToken != null;
    }
  }
}
