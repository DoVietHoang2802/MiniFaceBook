# Google OAuth Login Plan

> **Status:** OAuth core, production callback/origins and browser smoke flow implemented; optional password-creation reauthentication, consent/review operations and repeatable browser regression remain open
> **Scope:** Sign in/sign up with Google using OAuth 2.0 Authorization Code and OpenID Connect
> **Primary constraint:** Reuse MiniFaceBook JWT HttpOnly-cookie sessions; never expose a Google client secret or application JWT in a URL.

## Implementation Status

### Implemented

- Spring OAuth2 Client feature flag and Google browser authorization route.
- Google OIDC subject persistence with partial unique Mongo index.
- Existing Google session login, verified-email auto-link, and new-user display-name completion route.
- Existing JWT HttpOnly cookie issuance after OAuth completion.
- Generic OAuth failure redirect and API 401 entrypoint to prevent Axios/XHR CORS redirects to Google.
- Provider-aware password UI/recovery guard for `GOOGLE` accounts.

### Still Pending / Hardening

- Google reauthentication before optional first local password creation.
- Handler/service coverage and production browser smoke exist; dedicated repeatable OAuth Playwright coverage remains desirable.
- Google consent-screen publication/review and operational audit evidence for automatic verified-email linking.
- Production audit notification for automatic verified-email linking.

## 1. Goal And Non-Goals

Allow a user to create or access a MiniFaceBook account through a verified Google identity, while preserving the existing password login, email verification, JWT refresh rotation, logout, ban and role behavior.

### In Scope

- Google Authorization Code flow with OpenID Connect scopes `openid`, `email`, `profile`.
- New Google users with a verified Google email.
- A one-field display-name confirmation step for new Google users before MiniFaceBook account creation.
- Existing users who previously linked the same immutable Google subject.
- Explicit linking of Google to an existing password account from authenticated Settings.
- Google-only users creating a local MiniFaceBook password after recent Google reauthentication.
- Backend-issued MiniFaceBook access/refresh cookies after a successful Google callback.

### Out Of Scope For First Release

- Google Calendar, Drive, contacts or any scope beyond identity.
- Google access-token storage or offline Google API access.
- Automatic social profile synchronization after the first account creation.
- Other providers such as Facebook, Apple or GitHub.
- Native mobile deep-link OAuth flow.

## 2. Product Decisions

| Decision | First-release policy | Reason |
| --- | --- | --- |
| Existing local account with same email | Auto-link and sign in only when local email is verified and Google returns the same `email_verified=true` email | Removes avoidable login friction while requiring two independent verified-email proofs. |
| Existing Google subject | Sign in immediately | Google `sub` is immutable identity key. |
| New Google account | Create a verified MiniFaceBook user only after display-name confirmation | Google `email_verified=true` is accepted as verified identity proof. |
| New Google display name | Ask user to confirm or edit a prefilled Google name before creating the account | Prevents an unwanted Google profile name from becoming a permanent public identity. |
| Password for Google-only user | Nullable initially; Settings offers `Tạo mật khẩu` after recent Google session verification | User can later choose email/password login without a synthetic password. |
| Name/avatar | Use confirmed name at account creation; retain default avatar in Phase 1 | Never overwrite user-customized profile data on future login. |
| Google unlink | Not in Phase 1 | Prevent account lockout until password/passkey recovery policy exists. |
| Existing account linking | Auto-link only for exact verified-email match; Settings linking remains available for an authenticated user with a different Google email | Covers normal same-Gmail login without allowing arbitrary account merge. |
| Google-only password recovery | Hide forgot/change password; require recent Google reauthentication to create the first local password | Google remains the initial credential and no email OTP bypasses this policy. |

## 3. Recommended Authentication Flow

```text
React Login button
  -> GET backend /oauth2/authorization/google
  -> Google consent/login
  -> GET backend /login/oauth2/code/google
  -> validate state, issuer, audience, nonce, authorization code and email_verified
  -> find MiniFaceBook user by googleSubject
  -> existing Google subject: issue session
  -> matching verified local email + verified Google email: link Google subject, audit and issue session
  -> new Google identity: create a short-lived profile-completion transaction
  -> 302 redirect to frontend /oauth/complete-profile
  -> user confirms display name
  -> backend creates verified user
  -> issueSession enforces banned/role policy and issues existing JWT access + refresh tokens
  -> 302 redirect to frontend /oauth/callback for existing/linked accounts
  -> React loads /auth/me and enters application
```

The callback must never place MiniFaceBook access tokens, refresh tokens, Google code, Google ID token or client secrets in the browser URL.

## 4. Architecture Decisions

### 4.1 Backend Is The OAuth Client

Add `spring-boot-starter-oauth2-client`. The backend owns the Google client secret, exchanges the authorization code and validates the OpenID Connect result. React only redirects the browser to the backend authorization endpoint.

Do not implement Google Identity Services token verification entirely in React for this web application. It would introduce browser token handling, complex nonce validation and a second incompatible session flow.

### 4.2 OAuth Transaction Session For Single-Instance Deployment

The application session remains JWT HttpOnly cookies. Spring `HttpSession` is used only for the short-lived OAuth authorization transaction (`state` and `nonce`) while the browser is away at Google. It is not a MiniFaceBook authenticated session.

For the current single AWS instance, retain Spring Security's standard session-backed authorization request repository:

- Spring Security generates and validates cryptographically random `state` and OIDC `nonce` values.
- `JSESSIONID` exists only during this authorization round trip and is invalidated by the success/failure handler.
- The callback rejects missing, expired or mismatched state through Spring Security.
- The app still uses Redis for the separate one-time profile-completion transaction because that transaction survives the OAuth session invalidation.
- Never store Google client secrets or MiniFaceBook JWTs in the session.

When deployment changes to multiple backend replicas without sticky sessions, replace this repository with Redis-backed state storage or Spring Session Redis. Do not add Redis state complexity before that scale requirement exists.

### 4.3 Existing Session Issuance

Extract the session creation block currently inside `AuthService.login` into one private/shared method:

```text
issueSession(user)
  -> reject banned account
  -> generate access token and refresh token
  -> revoke prior refresh tokens according to existing single-session policy
  -> persist new refresh token
  -> return LoginResult
```

Password login and Google success handler both call this method. This guarantees identical JWT roles, refresh rotation and logout behavior.

The existing behavior revokes prior refresh tokens for the user. Google login will preserve this single-session policy; the product must state that signing in with either method signs out other MiniFaceBook sessions.

### 4.4 New Google User Profile Completion

Do not immediately persist a new user solely from the Google callback. For a first-time Google identity:

1. Validate the OIDC response and create a one-time Redis transaction `oauth2:google:profile:{token}` with a 10-minute TTL.
2. Store the minimum verified claims: Google `sub`, verified email and suggested display name. Do not import a remote Google avatar URL in Phase 1; use the normal default avatar/profile upload flow.
3. Set only an HttpOnly, Secure, `SameSite=Lax`, short-lived onboarding transaction cookie; do not issue MiniFaceBook access/refresh cookies yet.
4. Redirect to `/oauth/complete-profile`.
5. Show a focused page or card, not a modal over Home: `Chào mừng, hãy xác nhận tên hiển thị của bạn`.
6. Prefill the Google profile name. The user can accept it with one click or edit it.
7. `POST /auth/oauth/google/complete-profile` validates the display name using the same server rule as normal registration, consumes the transaction once, creates the verified user and issues the normal MiniFaceBook session.

This creates a small, understandable first-login step without allowing Google-supplied display data to bypass local profile validation.

## 5. Data Model And Migration

For Google-only first release, add these nullable fields to `User`, `UserDocument`, response/mapping contracts and schema documentation:

| Field | Type | Rule |
| --- | --- | --- |
| `googleSubject` | string | Google OIDC `sub`; immutable identity key; unique partial Mongo index for non-empty strings only. |
| `authProvider` | enum/string | `PASSWORD`, `GOOGLE`, or `PASSWORD_AND_GOOGLE`; useful for UX and account recovery policy. |

Keep `email` unique. Do not use email as the provider identity key because a Google account's email may change; use `sub`.

`password` becomes nullable for `GOOGLE` accounts. Password login must explicitly reject a null password as generic invalid credentials rather than passing null to BCrypt.

Add a Mongock migration that creates a partial unique index for `googleSubject`, for example only documents where it is a non-empty string. Existing accounts retain `PASSWORD` and null `googleSubject`. The migration and integration test must verify that multiple legacy null/missing fields do not collide.

`authProvider` is owner-only account metadata. It may be returned from `/auth/me` and Settings APIs, but never from visitor Profile, friend, search or public user DTOs.

## 6. Account Resolution Rules

1. Reject the callback if Google does not provide `sub`, a valid email, or `email_verified=true`.
2. Find user by `googleSubject`.
3. If found, issue session unless banned.
4. If no user exists with the returned email, create only the one-time profile-completion transaction. Do not persist a user until the display-name endpoint consumes that transaction.
5. If a password account exists with the same email, auto-link only when the stored local email is `verified=true` and Google returns the same normalized email with `email_verified=true`; record an audit event and notify the account email.
6. If an existing local account is unverified, or email values do not match exactly, do not link; return a generic retry/support path without account enumeration.
7. If `googleSubject` belongs to another account, reject linking with an explicit application error.
8. Handle duplicate-key races from email/googleSubject creation or linking by reloading the canonical account and applying the same rules, never creating a second account.

## 7. Backend Components

| Component | Responsibility |
| --- | --- |
| `pom.xml` | Add OAuth2 Client starter. |
| `application.yml` | Add Google registration/provider configuration via environment variables only. |
| `SecurityConfig` | Enable `oauth2Login`, permit authorization/callback paths, configure success/failure handlers and Redis authorization-request repository. |
| `GoogleOAuthSuccessHandler` | Resolve user, issue MiniFaceBook session cookies, redirect to fixed frontend callback. |
| `GoogleOAuthFailureHandler` | Clear transaction state and redirect only approved error codes to Login. |
| `AuthService` | Resolve/link Google identity and share `issueSession`. |
| `User`/`UserDocument`/mappers | Persist provider fields and partial unique Google subject index. |
| `AuthController` | Reuse cookie creation through a shared component; add authenticated linking and Google-reauthenticated create-password endpoints in Phase 1. |

Cookie creation currently lives in `AuthController`. Move it to a focused session-cookie writer shared by password login, refresh and OAuth success handler. Access/refresh cookie `secure`, `sameSite`, domain and frontend redirect URI must be environment-configurable for local versus AWS deployment. Production requires HTTPS and a custom frontend/API domain under the same registrable site, for example `app.example.com` and `api.example.com`; do not rely on unrelated AWS hostnames for cookie-authenticated browser sessions.

## 8. Frontend Components

### Login

Replace the current Google mock button in `LoginForm.tsx` with a plain browser navigation:

```text
window.location.assign(`${API_BASE}/oauth2/authorization/google`)
```

Do not call it through Axios, do not use a popup for Phase 1 and do not handle Google tokens in React.

### OAuth Callback Route

Add `/oauth/callback` route that:

1. Displays short loading state.
2. Calls existing `/auth/me` with credentials.
3. Populates `AuthContext` and redirects Home on success.
4. Maps only allowlisted generic OAuth failure codes to safe Vietnamese explanations.
5. Removes query parameters from browser history.

### New Google Profile Completion Route

Add `/oauth/complete-profile` for the onboarding transaction. It contains one required field only:

```text
Họ và tên hiển thị
[prefilled Google display name                ]
                 [Tiếp tục]
```

- Normalize NFC, trim/collapse whitespace and apply the existing registration name rule on both React and backend. The backend remains authoritative.
- Do not display Google email on this page unless product copy requires it; email is private account data.
- If Google did not provide a usable name, leave the field empty and require user entry.
- On refresh, resume only while the HttpOnly transaction cookie and Redis transaction are valid.
- On expiry/cancel, return to Login with a generic retry message and delete temporary state.

### Settings Account Linking

For an authenticated user, add `Kết nối Google khác` in security/account settings. It starts the same backend authorization flow with an explicit linking transaction purpose stored in Redis. Exact verified-email matches link automatically during normal Google login; this Settings flow is for a different Google identity. Do not add unlink until a safe recovery method is present.

### Google-Only Password Setup

A Google-only account initially has no MiniFaceBook password. Therefore, ordinary `Đổi mật khẩu` is not shown until a local password exists. Settings instead shows `Tạo mật khẩu`:

1. The user is signed in through Google.
2. The user completes recent Google reauthentication, or repeats OAuth with a `set_password` transaction purpose.
3. The backend verifies that the short-lived transaction belongs to the authenticated user.
4. The user sets a password using the existing password policy.
5. The backend stores the BCrypt hash and changes provider state from `GOOGLE` to `PASSWORD_AND_GOOGLE`.
6. Future login can use either Google or email/password; ordinary password change and password reset then become available.

This provides a recovery path independent of Google without showing a misleading password-change form for an account that has no password.

### Account Security UI Policy

| Account state | Settings security actions |
| --- | --- |
| `GOOGLE` | Show `Đăng nhập bằng Google`; hide `Đổi mật khẩu`; optionally show `Tạo mật khẩu`. |
| `PASSWORD` | Show `Đổi mật khẩu` and existing password recovery actions. |
| `PASSWORD_AND_GOOGLE` | Show `Đổi mật khẩu`, `Đăng nhập bằng Google` and provider management. |

The Login page can retain `Quên mật khẩu?` for password users, but backend forgot-password and reset-password flows must reject `GOOGLE` accounts with a generic non-enumerating outcome and must not create a password. The preferred UX is to tell users after authenticated Google login that no local password exists and offer `Tạo mật khẩu` in Settings.

## 9. Configuration And Google Console Setup

Use environment variables, never committed configuration values:

```text
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APP_FRONTEND_URL=
APP_BACKEND_URL=
```

Spring OAuth registration should use:

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
            scope: openid, profile, email
            redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"
```

Google Cloud Console must register exact authorized redirect URIs:

| Environment | Redirect URI |
| --- | --- |
| Local | `http://localhost:8080/api/login/oauth2/code/google` |
| AWS production | `https://api.your-domain.com/api/login/oauth2/code/google` |

Also configure the OAuth consent screen, test users while the app is in testing mode, authorized JavaScript origins where required, privacy policy/terms URLs before production publication and separate local/production OAuth clients where practical.

## 10. Security Checklist

- [ ] Authorization Code flow only; never Implicit flow.
- [ ] Validate state, nonce, issuer, audience, expiration and `email_verified`.
- [ ] Use immutable Google `sub`, not email, as identity key.
- [ ] Auto-link only exact email matches where both MiniFaceBook and Google have verified the email; audit and notify every link.
- [ ] No token/code/secret in frontend URL, logs, analytics or error messages.
- [ ] Redis state single-use TTL is enforced.
- [ ] Fixed allowlisted frontend success/failure redirect; no user-controlled redirect URL.
- [ ] OAuth callback and `/oauth2/authorization/**` are public; all account-link completion endpoints require authentication.
- [ ] Enforce existing ban, role and refresh-token rules after Google identity resolution.
- [ ] Production cookies are Secure; CORS and allowed origins use real HTTPS domains, not wildcard origins.
- [ ] State-changing cookie-authenticated endpoints such as link-Google and create-password validate Origin or use an equivalent CSRF defense.
- [ ] Rate-limit authorization initiation and callback failures without blocking legitimate Google redirects.

## 11. Test Plan

### Backend

- Unit: new Google user, returning Google user, banned user, missing/false `email_verified`, duplicate Google subject, verified-email auto-link and unverified-email rejection.
- Unit: new Google profile-completion transaction, invalid display name, expired/replayed transaction and successful one-time user creation.
- Unit: `issueSession` is identical for password and Google login.
- Security: expired/replayed/mismatched state, wrong issuer/audience/nonce, malicious redirect target and missing OAuth transaction cookie.
- Integration: partial unique Google subject migration; callback success sets both HttpOnly cookies; callback failure clears transaction state; concurrent profile completion is idempotent.
- Regression: password login still works for password accounts, Google-only accounts receive generic invalid credentials on password login, forgot-password cannot create a password for Google-only accounts, refresh/logout behavior remains unchanged.

### Frontend And E2E

- Login button redirects to backend authorization endpoint.
- Callback route handles `/auth/me` success, failure and expired session states.
- Verified-email auto-link is transparent; all other OAuth failures contain no account enumeration details.
- Playwright uses a mocked OAuth callback/service account fixture; it must not automate a real Google account or persist Google credentials.

### Manual Pre-Release

- Local callback with local Google OAuth client.
- AWS HTTPS callback with production client and exact domain.
- New account, returning account, verified-email auto-link, Settings account-link, banned account and password-login regression.
- Browser coverage for Chrome, Safari and mobile Chrome because cookie behavior differs across browsers.

## 12. Delivery Sequence

1. Create Google Cloud OAuth clients and configure only local test redirect URI.
2. Add data model migration, OAuth2 Client dependency and shared session issuance refactor.
3. Implement standard Spring OAuth authorization session and backend success/failure handlers.
4. Replace frontend mock button, add callback route and new-user profile-completion route.
5. Add Settings linking for a different Google identity and Google-only password setup.
6. Complete automated tests and local manual callback validation.
7. Configure AWS environment variables, HTTPS domain and production redirect URI.
8. Enable production OAuth consent screen only after privacy/terms URLs and monitoring are ready.

## 13. Completion Criteria

- [ ] Google button is no longer a mock.
- [ ] No client secret or authentication token is exposed to React, URLs or Git.
- [ ] New Google users can sign in with existing MiniFaceBook cookie sessions.
- [ ] New Google users confirm a valid display name before their account is created.
- [ ] Verified-email password accounts auto-link safely; different Google identities require Settings linking.
- [ ] Google-only accounts can securely create a local password after recent Google reauthentication.
- [ ] Banned, replayed and invalid-provider cases are rejected safely.
- [ ] Password, refresh, logout and profile privacy regression suites pass.
- [ ] Local and AWS callback URLs are configured and manually verified.
