# TechAbhi – security notes

Verified by `backend/tests/run.sh` (263 API checks incl. 43 security checks) and `frontend` `npm test` (39 UI checks).
`npm audit --omit=dev`: **0 vulnerabilities** in both backend and frontend production dependencies.

## What is enforced
**Authentication** – bcrypt (cost 12) passwords; JWT HS256 only (algorithm pinned; `none`, HS512, wrong-secret, expired, tampered and wrong-role tokens are rejected); 3 separate roles (admin, candidate, recruiter) that cannot use each other's tokens; recruiter status is re-read from the DB on every request, so suspension is immediate; server refuses to start with a missing, short (<32) or placeholder `JWT_SECRET`.
**Authorisation** – a test discovers all 62 protected routes from the source and asserts each returns 401 with no token and with every wrong-role token, so newly added routes are covered automatically. Recruiters only ever query their own jobs/applications (others return 404). Candidates only reach their own data. Drafts and unpublished jobs are never served publicly.
**Injection** – every query is parameterised; the only interpolated SQL fragments are code constants (verified by review + 118 hostile inputs against the public API and login endpoints). Mass-assignment is blocked by whitelisting fields (status, ids, recruiter_id, password etc. in request bodies are ignored).
**XSS** – React escapes rendering; server-rendered SEO tags are HTML-escaped and JSON-LD escapes `<`; verified with a hostile job (`</title><script>`, `onerror`, `</script>` in JSON-LD). External links are rendered only if http(s) and use `rel="noopener noreferrer nofollow"`. `?next=` redirects accept in-app paths only (react-router 7 also fixes the upstream open-redirect advisory).
**HTTP** – strict CSP (self only, no inline script, `frame-ancestors 'none'`, `object-src 'none'`), nosniff, no `X-Powered-By`, CORS limited to `CORS_ORIGIN`, JSON/PDF body limits (200 KB / 2 MB → 413), malformed JSON → 400, unknown `/api/*` → JSON 404, generic 500s that never log SQL, tokens or bodies.
**Abuse** – per-route limits on logins (10/15 min), registrations, AI endpoints (8–10/min) and events, plus a global 300/min per IP. Login timing is equalised so unknown emails cannot be told apart from wrong passwords.
**Files** – resumes must start with `%PDF-`, ≤2 MB, are stored under random names outside any static folder, and are only streamed through authenticated, ownership-checked endpoints (verified: not reachable at `/<name>` or `/uploads/<name>`).
**AI** – Gemini key is server-side only (verified absent from the frontend bundle). All AI output is untrusted: re-validated, and values not literally present in the source text (company, URLs, emails, salary, skills, schools, employers, projects) are removed. AI never publishes anything or scores/ranks people.
**Privacy** – consent is explicit and per-purpose (internal applications; career assistance review; each company share); withdrawal wipes snapshots; account deletion cascades and removes files; admin access to assistance data is logged and ends when a request closes.

## Known limitations / accepted risks (decide for your deployment)
1. **Tokens live in `localStorage`.** Any XSS would expose them. CSP + React escaping reduce that risk; moving to httpOnly cookies would need CSRF protection. Not done.
2. **Rate limits are per IP and in memory.** They reset on restart and are not shared across instances (use a Redis store if you run several). Set `trust proxy` to match your proxy chain or all users share one IP. There is no per-account lockout and no CAPTCHA.
3. **No email verification, password reset or 2FA.** Candidate sign-ups can be fake; recruiter approval is manual and is the only identity check; admins all have equal power.
4. **Analytics are inflatable** by bots (view/apply/share counters are rate-limited, not bot-proof).
5. **Resumes are stored unencrypted on disk** and are in DB backups. Use an encrypted volume or private object storage; restrict backup access.
6. **No data-retention job.** Decide how long closed assistance requests, shared records and old accounts are kept, and add a purge.
7. **Parsing untrusted PDFs** uses pdf.js in-process (size-capped). For high volume run it in a separate worker/container.
8. **Prompt injection** in pasted job text/resumes is mitigated (data-only prompts + output validation + human review) but not impossible; the admin must review AI-filled fields.
9. **CSP allows inline style *attributes*** (React inline `style={{}}`), not inline scripts.
10. **Dev-tooling advisories (not shipped):** `npm audit` (including devDependencies) reports 13 findings, in `vite` 5 / `esbuild` (dev-server), `vitest` 2 / `tinypool` (test runner API) and Tailwind's glob helpers (`braces`, `micromatch`, build-time ReDoS). None run in production. Do not expose `npm run dev` or `vitest --ui/--api` to an untrusted network. I could not get an upgrade to vite 7 / vitest 4 to resolve in my environment (npm crashed), so try it on your machine (needs Node 20.19+) and re-run the tests.
11. Not tested: real Gemini behaviour, real browsers/mobile layout, MySQL 8 specifically (tests ran on MariaDB), load/performance, penetration testing by a third party. Treat this as a solid baseline, not a certification.

## Reporting
Add a `security@yourdomain` mailbox and link it from the Contact page.
