# AWS Deployment Checklist

## Current Status

- [x] AWS EC2 instance created with Amazon Linux 2023.
- [x] Security group allows SSH (22) from the developer IP only.
- [x] Security group allows public HTTP (80) and HTTPS (443).
- [x] SSH access verified with the local EC2 key pair.
- [x] Docker, Git, Docker Compose, and 1 GB swap verified on the EC2 instance.
- [x] Elastic IP assigned and added to MongoDB Atlas Network Access.
- [ ] Backend and Redis deployed to AWS.
- [ ] Vercel frontend connected to the production API.
- [ ] Production DNS, HTTPS, Resend, and Google OAuth configured.

## Production Architecture

| Service | Responsibility |
| --- | --- |
| AWS EC2 | Spring Boot backend, Redis, reverse proxy, and Docker containers |
| MongoDB Atlas | Persistent production database |
| Cloudinary | Avatar, cover, and post media |
| Vercel | React frontend |
| Domain | Frontend domain and API subdomain |
| Resend | Verification and password-reset emails |
| Google Cloud Console | Google OAuth production client and redirect URI |

## 1. Prepare AWS

Connect to the instance as `ec2-user`, then run:

```bash
sudo dnf update -y
sudo dnf install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
exit
```

Reconnect through SSH and verify:

```bash
docker --version
git --version
```

Install Docker Compose if `docker compose version` is unavailable.

## 2. Assign a Stable IP

1. Allocate an Elastic IP in EC2.
2. Associate it with the MiniFace EC2 instance.
3. Keep the instance running while the Elastic IP is associated.
4. Record the Elastic IP privately for MongoDB Atlas and DNS configuration.

Do not use the temporary public IPv4 address for final DNS records. It can change after an instance stop/start.

## Resource Plan For The Current Instance

Current EC2 capacity: approximately 912 MiB RAM, 2 vCPU, and 29 GB free disk.

- Do not run MongoDB on this server; MongoDB Atlas is the production database.
- Create a 1 GB swap file before starting Docker. Swap prevents an immediate out-of-memory crash, but it is slower than RAM.
- Limit Spring Boot to a 384 MB maximum heap and a 512-550 MB container memory limit.
- Limit Redis to 96 MB `maxmemory` and a 128 MB container memory limit.
- Keep the reverse proxy within a 64 MB container limit.
- This capacity is suitable for a small MVP, not sustained high traffic.

Create swap once:

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
free -h
```

## 3. Configure MongoDB Atlas

1. Create a dedicated database user for MiniFace production.
2. Grant only the required database permissions.
3. Add the AWS Elastic IP to the Atlas network access list.
4. Do not allow `0.0.0.0/0` in production.
5. Store the connection string as `MONGODB_URI` in AWS secrets/environment variables.

## 4. Deploy Backend and Redis

Deploy the backend and Redis with Docker on AWS. Do not expose Redis publicly.

The repository contains `backend/Dockerfile`, `deploy/docker-compose.prod.yml`, and `deploy/.env.production.example`. The production compose file runs only Spring Boot and Redis. MongoDB remains on Atlas.

Set these environment variables on AWS, never in Git, Vercel, or frontend code:

```text
SPRING_PROFILES_ACTIVE=prod
MONGODB_URI
REDIS_HOST
REDIS_PORT
REDIS_PASSWORD
JWT_SECRET
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_OAUTH_ENABLED=true
APP_FRONTEND_URL
APP_API_URL
RESEND_API_KEY
RESEND_FROM_EMAIL
RESEND_FROM_NAME
SENTRY_DSN
```

The backend production profile intentionally fails to start if required secrets are missing.

After the deployment changes are committed, run on AWS:

```bash
git clone https://github.com/DoVietHoang2802/MiniFaceBook.git
cd MiniFaceBook/deploy
cp .env.production.example .env.production
chmod 600 .env.production
```

Fill `.env.production` privately, then start the containers:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up --build -d
docker compose --env-file .env.production -f docker-compose.prod.yml ps
curl http://127.0.0.1:8080/api/actuator/health
```

## 5. Configure DNS and HTTPS

1. Point `api.<domain>` to the AWS Elastic IP.
2. Point the root domain or `www.<domain>` to Vercel.
3. Configure a reverse proxy on AWS so only ports 80 and 443 are public.
4. Issue a TLS certificate for the API domain.
5. Keep backend port 8080, MongoDB port 27017, and Redis port 6379 private.

## 6. Deploy Frontend to Vercel

1. Import the GitHub repository into Vercel.
2. Configure the frontend production API URL as `https://api.<domain>/api`.
3. Connect the frontend domain in Vercel.
4. Verify login, refresh, and CORS behavior over HTTPS.

## 7. Configure Resend

1. Add and verify the sending domain in Resend.
2. Create a production API key with sending permission.
3. Set `RESEND_FROM_EMAIL` to an address on the verified domain, such as `noreply@<domain>`.
4. Add the Resend values to AWS environment variables.
5. Test verification and forgot-password emails.

Mailpit remains local/test only. Resend is activated only with the `prod` Spring profile.

## 8. Configure Google OAuth Production

1. Add the production frontend origin to Google OAuth authorized JavaScript origins.
2. Add this production redirect URI:

```text
https://api.<domain>/api/login/oauth2/code/google
```

3. Complete Google consent screen details, privacy policy, and terms URLs.
4. Set the production Google client ID and secret in AWS environment variables.
5. Test sign-in, account selection, new-user onboarding, returning user, and logout.

## 9. Final Release Verification

- [ ] Backend health check passes through HTTPS.
- [ ] Frontend can call the API over HTTPS without CORS errors.
- [ ] Local password signup/login works.
- [ ] Google OAuth works with account chooser.
- [ ] Post image upload works with Cloudinary production credentials.
- [ ] Search, chat, notifications, and Admin bulk deletion work.
- [ ] Resend verification and reset emails arrive.
- [ ] Docker containers restart after a server reboot.
- [ ] MongoDB backup, log retention, and monitoring are configured.

## Secret Rules

- Never commit a `.pem` key, `application-local.yml`, `.env`, API key, JWT secret, database URI, or OAuth secret.
- Never paste secrets into chat, screenshots, frontend variables, or Vercel environment variables.
- Rotate Cloudinary and Google OAuth credentials used during local development before production.
- Keep the EC2 private key only on the developer machine with restricted file permissions.
