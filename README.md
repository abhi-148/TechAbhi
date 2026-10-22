# TechAbhi – Phase 1 starter

Admin AI job publishing → public job pages → external Apply → sharing → SEO.
Stack: React + Vite + Tailwind, Express, MySQL (mysql2), Gemini (server-side only).

## IMPORTANT: merging with your existing project
This was written WITHOUT seeing your repo or schema. Do not overwrite working files.
1. Compare `backend/migrations/001_phase1.sql` with your real `jobs` / `admin_users` tables.
   Add only missing columns (`ALTER TABLE jobs ADD COLUMN ...`), never drop or recreate.
   Column names here: status(draft|published|closed), published_at, expires_at, application_url,
   application_email, application_instructions, work_mode, employment_type, skills(JSON) etc.
2. Copy over the routes/pages you want, adapting names to your existing ones.
3. Phase 2+ (candidate accounts, recruiter, career assistance) are intentionally NOT included.

## Run locally
```
# database
mysql -u root -p -e "CREATE DATABASE techabhi"
mysql -u root -p techabhi < backend/migrations/001_phase1.sql

# backend
cd backend && cp .env.example .env     # fill DB_PASSWORD, JWT_SECRET, GEMINI_API_KEY
npm install
npm run create-admin -- you@example.com "a-strong-password"
npm run dev                            # http://localhost:4000

# frontend (new terminal)
cd frontend && npm install && npm run dev   # http://localhost:5173
```
Secrets live only in `backend/.env` (git-ignored). Get a Gemini key at aistudio.google.com.

## Production (SEO)
`cd frontend && npm run build`, then run the backend. It serves `frontend/dist` and injects
title, canonical, Open Graph and JobPosting JSON-LD into `/jobs/:id` HTML, plus `/sitemap.xml`
and `/robots.txt`. Set `PUBLIC_URL` to your real domain. Submit the sitemap in Google Search Console.
Indexing and traffic are never guaranteed.

## What was tested (MariaDB, 35 API checks, all passing)
Login/invalid token, draft privacy, publish validation, unpublish/close/reopen/expiry,
filters/search/sort, SQL-injection input, URL validation (javascript:/ftp: rejected),
events/stats, JSON-LD/canonical/sitemap/robots, delete safeguards. Frontend builds cleanly.
## NOT tested
Gemini extraction (needs your key), browser UI clicks, real MySQL 8 (tested on MariaDB),
mobile layout visually, Google rich-results validation.

## Manual checks to do
Admin: login → paste a job → Extract → edit → Save & preview → Publish → copy link/message.
Public: open /jobs/ID in a private window, click Apply Now (no login), try WhatsApp/Telegram share.
Rich results: paste the live URL into Google's Rich Results Test.

## Notes / assumptions
- Salary min/max (optional) are treated as yearly INR for filters and JSON-LD; the shown salary is the employer's text.
- "Apply link clicks" are clicks on the employer link, not confirmed applications.
- Privacy/Terms/Contact pages are templates; replace the email and get legal review.
- AI output is validated server-side; company/URL/email/salary are dropped if not literally in your pasted text.

---
# Phase 2 – optional candidate accounts (added)

Run `backend/migrations/002_phase2.sql` after 001 (same caution: if your DB already has
`candidates`, `candidate_resumes`, `saved_jobs` or `job_applications`, compare columns and ALTER instead).
New dependency: `pdf-parse` v2 (needs Node 20+; run `npm install` in backend). New env: `UPLOAD_DIR` (default `uploads/resumes`, git-ignored; keep it outside any public/static folder).

## Routes
Frontend: `/candidate/login`, `/candidate/register`, `/candidate/dashboard`, `/candidate/profile`,
`/candidate/resume`, `/candidate/saved-jobs`, `/candidate/applications`.
Backend: everything under `/api/candidate/*` (JWT with role `candidate`; admin and candidate tokens are not interchangeable).

## Behaviour
- Accounts are optional. Job pages, search and Apply Now never need one. Logged-in candidates get a Save button, a "check my resume for this job" link, and Apply clicks are logged as **"Opened employer link"**.
- Application tracker: `link_opened` is automatic; `applied / interview / offer / rejected / withdrawn` are **self-reported** and labelled so. Re-opening a link never downgrades a status. Nothing is employer-confirmed.
- Resume: PDF (max 2 MB, magic-byte checked) or pasted text. Stored under a random filename, downloadable only by the owner via an authenticated endpoint. Delete resume / delete account removes the file.
- AI profile builder: drafts the form from the stored resume. Skills, schools, companies and projects that do not literally appear in the resume are dropped with a warning. Nothing is saved until the candidate clicks Save.
- Resume analysis: skill comparison is deterministic keyword matching (whole-token, so "Java" does not match "JavaScript"). AI only adds suggestions, project ideas, interview tips and "could not be verified". There is no score and no auto-rejection.
- Recommendations: rule-based (skill overlap + stated preferences), each with the reason shown. Not AI, not a hiring prediction.
- Profiles and resumes are never shown publicly and are not shared with anyone (recruiter sharing is Phase 3 and would need explicit consent).

## Tested for Phase 2 (MariaDB, mock Gemini server, real PDF): 54 checks passing
Auth/token separation, validation, profile sanitising, PDF upload/download + owner-only access,
deterministic skill matching, AI-output guards (invented skills/companies/schools removed),
saved jobs (no duplicates, closed jobs flagged), tracker rules, recommendations, account deletion.
Phase 1's 35 checks still pass.
## NOT tested
Real Gemini responses (only a mock with deliberately bad output), browser clicking, scanned/OCR PDFs
(rejected with a message), DOCX resumes (not supported; paste text), email verification / password reset (not built),
guest "save in browser" (not built; saving needs an account).


---
# Phase 3 – recruiters (added)

Run `backend/migrations/003_phase3.sql` once, after 001 and 002. It creates `recruiters` and `job_submissions`
and adds `jobs.recruiter_id`. The ALTER is not idempotent. If you already have a `recruiters` table, compare columns first.

## Flow
Recruiter registers (status **pending**) -> admin reviews at `/admin/recruiters` and approves/rejects (reason required) ->
approved recruiter posts jobs (AI parser works here too), publishes, and reviews applications.

## Rules enforced on the server
- Recruiter identity comes only from the verified JWT; **status is re-read from the DB on every request**, so suspension is immediate.
- Pending / rejected / suspended recruiters get 403 on every feature route.
- Every job and application query is scoped to the logged-in recruiter. Other people's jobs and applications return 404.
- A recruiter's jobs are always posted under their registered company name. A spoofed `company` is overwritten.
- Suspending or rejecting a recruiter **closes their live jobs**.
- Recruiter jobs can be published without an external URL, because candidates can apply through TechAbhi. The public API shows only `accepts_applications`, never the recruiter id.

## Applying through TechAbhi (needed so recruiters can receive applications)
- Only on recruiter-posted jobs. External-link jobs behave exactly as before, with no account needed.
- The candidate must tick an explicit consent box (name, email, profile, and optionally the resume). The server requires `consent === true`.
- The recruiter sees a **snapshot** of what was shared. A resume is shared only if the candidate chose to, as a separate copy of the file.
- **Withdraw** wipes the snapshot (profile, email, note, resume copy, recruiter notes). Deleting a candidate account removes their submissions and copied files.
- Candidates see the employer-set status and whether the employer opened the application. Both are real events recorded inside TechAbhi. The recruiter's private note is never shown to the candidate.
- Candidate-side distinction: `Employer link opened` / `self-reported` (their own tracker) vs `Applied through TechAbhi` (employer status). Nothing is presented as employer-confirmed unless it was set by the employer in TechAbhi.
- No AI ranking or scoring of candidates anywhere.

## Tested (MariaDB, mock Gemini, real PDFs) – all passing
Phase 1: 35 | Phase 2: 54 | Phase 3: 73, run in sequence on a fresh database.
Phase 3 covers registration/token separation, pending lockout, approval, company spoofing, cross-recruiter isolation
(read/edit/close/delete/applications/resume), consent rules, snapshot privacy, status updates, withdraw wiping data,
suspension closing jobs, FK-safe deletes, and account deletion removing files.

## Fixed while building Phase 3
`pdf-parse` 1.x (bundled pdf.js 1.10) rejected the first valid PDF in a fresh Node process, so a resume upload could fail
after a server restart. Phase 2's tests only passed because of call ordering. Switched to `pdf-parse` v2, which parsed every
fixture first time. If a user's PDF still fails they get a "paste your text" message.

## NOT built / NOT tested
- **Email**: no verification, password reset or notification emails (no email service configured). Candidates see status changes in their tracker; recruiters contact candidates themselves.
- Recruiter approval is manual and is the only identity check. Consider requiring a company-domain email.
- Real Gemini output, browser click-through, mobile layout, scanned/OCR PDFs, DOCX resumes.
- `/candidate/career-assistance` is Phase 4.


---
# Phase 4 – career assistance (added)

Run `backend/migrations/004_phase4.sql` once, after 001-003 (needs MySQL 5.7+/MariaDB 10.2+ for the generated column that enforces one open request per candidate).
Candidate page: `/candidate/career-assistance`. Admin pages: `/admin/assistance`, `/admin/assistance/:id`.
It is kept separate from job browsing and recruiter applications. It is only linked from inside the candidate area.

## Flow
Candidate submits a request (with a review consent) -> admin reviews -> admin **proposes** contacting a specific company
(with a message and exactly which fields would be shared) -> candidate **approves or declines that proposal** ->
admin copies the approved "share packet", contacts HR OUTSIDE the app, then records it -> admin records responses/interviews ->
candidate sees every step in an in-app timeline.

## Consent and privacy rules enforced on the server
- Request needs `consent_review === true`. Admin can read the candidate's profile/resume **only while the request is open**; after close or withdrawal that data is no longer returned.
- Sharing with a company needs a **separate, per-company approval**. The server refuses "mark as shared" and refuses to build the share packet unless the candidate approved that outreach. Declined, revoked or cancelled outreach can never be shared.
- The packet contains only the approved fields (name always; email / profile / resume only if ticked). Verified in tests: an email-only approval leaks no profile or resume text.
- Candidate can revoke an approval until it is recorded as shared; afterwards the app says plainly it can no longer be changed.
- The candidate never sees the admin's HR contact or private notes.
- Interview details require a date and confirmed details and are shown with a "confirm directly with the company" note.
- Statuses only claim what was recorded: "recorded shared", "response recorded by the team" and so on. The app never says an employer hired, saw or reviewed anything.
- The first time the team opens a request the candidate sees it (real event). Every admin view/packet/resume access is written to `assistance_access_log`.
- Withdraw: closes the request, cancels unshared outreach, erases the free-text details. Deleting the account cascades everything.
- No guarantees anywhere in the candidate copy; "never pay anyone for a job".

## Tested (MariaDB): Phase 1: 35, Phase 2: 54, Phase 3: 73, Phase 4: 58, all passing on a fresh DB
A bug found by the tests while building this phase: outreach status messages were built eagerly, which crashed non-interview transitions
and left half-applied updates. Fixed.

## NOT built / NOT tested
- **No email or SMS.** All updates are in-app. The admin contacts HR manually and records it. The app never contacts any company itself.
- Nothing verifies the admin's claims (that a contact exists, that a company responded). The tool records what the admin enters, so keep an honest process.
- No fees/payments. Browser click-through and mobile layout untested. Real Gemini output untested.
- Policy items you should decide: how long closed/shared records are retained, who counts as "admin" on your team (all admins see all requests), and the exact consent wording (current text is a sensible default, not legal advice).


---
# Phase 5 – security, regression and end-to-end verification (Step 12 of the spec)

Your spec has four feature phases plus a final "security, regression and end-to-end tests" step. This is that step.
See `SECURITY.md` (what is protected, what is not) and `DEPLOYMENT.md` (launch checklist).

## Run everything
```
cd frontend && npm ci && npm run build && npm test          # 39 UI render/interaction tests (jsdom, mocked API)
cd ../backend && npm ci && bash tests/run.sh                 # builds a throw-away DB, runs 5 suites (263 checks)
```
`run.sh` DROPS and recreates `$DB_NAME` (default `techabhi_test`). Never point it at real data. Config: see the header of `tests/run.sh`.

## Results at delivery (MariaDB 10.x, Node 22)
phase 1: 35 | phase 2: 54 | phase 3: 73 | phase 4: 58 | security: 43 | UI: 39, all passing. `npm audit --omit=dev`: 0 / 0.

## What changed in this step
- **Fixed** unknown `/api/*` paths returning the SPA page with 200; error handler returning 500 for bad JSON / oversized bodies (now 400 / 413).
- **Fixed** duplicate `<title>` and description tags on job pages (now exactly one of each).
- **Added** a strict Content-Security-Policy; JWT algorithm pinning; constant-time-ish logins (no account enumeration by timing); refusal to start with a placeholder/short `JWT_SECRET`.
- **Upgraded** react-router-dom to v7 (fixes the open-redirect advisory); `?next=` now only accepts in-app paths; external apply/website links only render for http(s).
- **Added** an auto-discovered auth matrix over all 62 protected routes, SQLi/XSS/JWT/traversal/mass-assignment/rate-limit tests, and the first real UI tests (which would have caught the earlier shared-form bug).

## Still NOT verified
Real Gemini output, real browsers and mobile layout, MySQL 8 itself, performance under load, third-party pentest, email flows (none exist). See `SECURITY.md` for accepted risks.
