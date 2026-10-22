# Deployment checklist

## 1. Prerequisites
- Node 20+, MySQL 8 (or MariaDB 10.5+), HTTPS in front (nginx/Caddy/Cloudflare), a process manager (systemd/pm2/Docker).
- A Google AI Studio key for Gemini (server-side only).

## 2. Database
```
CREATE DATABASE techabhi CHARACTER SET utf8mb4;
CREATE USER 'techabhi_app'@'%' IDENTIFIED BY '<long random password>';
GRANT SELECT, INSERT, UPDATE, DELETE ON techabhi.* TO 'techabhi_app'@'%';   -- no DROP/ALTER/GRANT at runtime
```
Run `backend/migrations/001…004*.sql` once, in order, **with an admin account** (not the app user). If you already have tables, compare columns and `ALTER` instead (see README). Turn on automated backups and test a restore.

## 3. Backend `.env` (never commit; never put in the frontend)
```
PORT=4000
DB_HOST=…  DB_USER=techabhi_app  DB_PASSWORD=…  DB_NAME=techabhi
JWT_SECRET=<node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
GEMINI_API_KEY=…            GEMINI_MODEL=gemini-2.5-flash
PUBLIC_URL=https://yourdomain.com      # used in sitemap/canonical/share links
CORS_ORIGIN=https://yourdomain.com     # same-origin deployments can leave empty
UPLOAD_DIR=/var/lib/techabhi/resumes   # outside the web root, mode 700, encrypted disk, backed up
DEFAULT_COUNTRY=IN
NODE_ENV=production
```
Create the first admin: `cd backend && npm ci --omit=dev && npm run create-admin -- you@domain "a-strong-passphrase"`.

## 4. Build and run
```
cd frontend && npm ci && npm run build        # produces frontend/dist
cd ../backend && node server.js                # serves API + dist + SEO tags + sitemap + robots
```
The Express server serves the built SPA and injects per-job SEO tags, so route all traffic (including `/jobs/*`, `/sitemap.xml`, `/robots.txt`) to it. If you host the frontend elsewhere (CDN), job pages will NOT get server-rendered SEO tags.

## 5. Reverse proxy
- Terminate TLS; redirect HTTP→HTTPS; set `X-Forwarded-For`. The app uses `trust proxy = 1` (one proxy hop). Change it in `server.js` if you have more/less.
- Limit request size at the proxy too (e.g. `client_max_body_size 3m`).

## 6. Before launch
- [ ] `bash backend/tests/run.sh` and `cd frontend && npm test` pass against a **test** database (never your production DB: the runner drops its database).
- [ ] `npm audit --omit=dev` is clean in both folders.
- [ ] Replace the placeholder email/addresses in Contact, Privacy and Terms; have Privacy/Terms/consent wording reviewed legally.
- [ ] Confirm `curl -I https://yourdomain.com` shows the CSP header and HTTPS redirect.
- [ ] Publish one real job; open `/jobs/<id>` with "view source": one `<title>`, one description, canonical and `JobPosting` JSON-LD present; test it in Google's Rich Results Test.
- [ ] Submit `https://yourdomain.com/sitemap.xml` in Google Search Console. Indexing and traffic are not guaranteed.
- [ ] Verify an unauthenticated request to `/api/admin/jobs` returns 401 and a draft job's URL returns 404.
- [ ] Decide retention periods for assistance data and old accounts; schedule a purge.
- [ ] Set up log shipping/alerts. Logs never contain SQL, tokens or request bodies; keep it that way.

## 7. Operating
- Rotate `JWT_SECRET` (logs everyone out) and the DB/Gemini credentials if they leak; rotate on staff changes.
- Review pending recruiters promptly (check website + domain email); suspend bad actors, which also closes their live jobs.
- Admins can read assistance requests while open; every view/packet is logged in `assistance_access_log`.
- Keep Node and dependencies patched; re-run the audit and the test suites after every upgrade.
