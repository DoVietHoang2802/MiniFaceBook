# Local Configuration Guide

This guide documents local-only credentials and startup behavior. Do not commit `application-local.yml`, secrets, downloaded OAuth JSON files, or production environment values.

## Local Profile

Run the backend with the `local` Spring profile:

```powershell
mvn "-Dspring-boot.run.profiles=local" spring-boot:run
```

Spring loads `application.yml` and overrides it with `application-local.yml`. Restart the backend after changing any credential or configuration value.

## Cloudinary

`application-local.yml` contains local Cloudinary configuration under `app.cloudinary`.

```yaml
app:
  cloudinary:
    cloud-name: "YOUR_CLOUD_NAME"
    api-key: "YOUR_API_KEY"
    api-secret: "YOUR_API_SECRET"
    verify-on-startup: true
```

Startup must report:

```text
Cloudinary credentials verified successfully for cloud: YOUR_CLOUD_NAME
```

If Cloudinary reports `api_secret mismatch`, copy the API key and API secret from the same Cloudinary API key record. If it reports missing `create` permission, grant that key upload/create permission for `miniface` media folders. Use a least-privilege key for production; a temporary broad development role may be used only to validate local setup.

Uploaded media locations:

| Media | Cloudinary folder |
| --- | --- |
| Avatar | `miniface/avatars` |
| Cover | `miniface/covers` |
| Post image | `miniface/posts` |

MongoDB stores Cloudinary URLs, not image binaries. Existing seed/Picsum/Unsplash URLs are not migrated automatically.

## Google OAuth Local

Enable Google OAuth only in local configuration after creating a Google OAuth Web Application client.

```yaml
app:
  oauth:
    google:
      enabled: true
      client-id: "YOUR_GOOGLE_CLIENT_ID"
      client-secret: "YOUR_GOOGLE_CLIENT_SECRET"
      frontend-url: "http://localhost:5173"
      secure-cookies: false
```

Configure this exact Google authorized redirect URI:

```text
http://localhost:8080/api/login/oauth2/code/google
```

Add the developer Gmail account to OAuth Consent Screen test users while the app remains in testing mode. Never send or paste OAuth/Cloudinary secrets into source control, browser console, screenshots, chat, or issue trackers. Rotate any secret that has been exposed.

## Local Verification

1. Start Docker infrastructure: `docker-compose up -d`.
2. Start backend with `local` profile.
3. Start frontend: `npm run dev` in `frontend`.
4. Verify Cloudinary startup message before testing avatar, cover, or post uploads.
5. Verify Google button redirects browser navigation, not Axios/XHR, to `/api/oauth2/authorization/google`.

## Production Boundary

AWS must use environment variables or a secrets manager, not `application-local.yml`. Production requires HTTPS, `secure-cookies: true`, real frontend/API domains, production Google redirect URI, and a dedicated restricted Cloudinary key.
