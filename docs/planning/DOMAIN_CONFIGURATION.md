# Domain Configuration

## Registered Domain

- Domain: `miniface.site`
- Registrar and DNS provider: Tenten / GMO-Z.com RunSystem
- Authoritative nameservers: Tenten-managed nameservers

## Production Endpoints

| Host | Record | Target | Purpose |
| --- | --- | --- | --- |
| `api.miniface.site` | A | AWS Elastic IP | Spring Boot API and HTTPS reverse proxy |
| `miniface.site` | Vercel-managed | Vercel | Redirects to the canonical frontend domain |
| `www.miniface.site` | Vercel-managed | Vercel | Canonical React frontend domain |

## Application Configuration

- Vercel uses `VITE_API_BASE_URL=https://api.miniface.site/api` for production and preview builds.
- The backend accepts credentialed browser requests only from `https://miniface.site` and `https://www.miniface.site` through `CORS_ALLOWED_ORIGINS`.
- Do not expose backend port `8080`, Redis, or MongoDB directly; only Nginx ports `80` and `443` are public.

## Safety Rules

- Keep domain account credentials outside Git and chat.
- Do not store registration declarations, identity documents, addresses, phone numbers, or account-holder information in the repository.
- Keep the API record independent from the Vercel frontend records.
