// Security suite: run against a live server with a FRESH database (see tests/run.sh).
import fs from 'fs'; import path from 'path'; import crypto from 'crypto';
import { fileURLToPath } from 'url'; import jwt from 'jsonwebtoken';
const here = path.dirname(fileURLToPath(import.meta.url));
const B = process.env.API_URL || 'http://localhost:4000'; const SECRET = process.env.JWT_SECRET;
let pass = 0, fail = 0, skip = 0;
const ok = (n, c, x = '') => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (c ? '' : '  -> ' + x)); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// retries on 429 (the global limiter) so the big sweeps are not flaky; pass raw:true to see 429s
async function req(p, { method = 'GET', body, token, headers = {}, raw = false, rawBody } = {}) {
  for (let i = 0; i < 4; i++) {
    const h = { ...headers, ...(token && { Authorization: 'Bearer ' + token }) }; if (body && !rawBody) h['Content-Type'] = 'application/json';
    const r = await fetch(B + p, { method, headers: h, body: rawBody ?? (body && JSON.stringify(body)) });
    if (r.status === 429 && !raw) { await sleep((Number(r.headers.get('retry-after')) || 5) * 1000 + 200); continue; }
    const buf = Buffer.from(await r.arrayBuffer()); let j = null; try { j = JSON.parse(buf.toString()); } catch { /* html */ }
    return { s: r.status, j, t: buf.toString(), h: r.headers, ms: 0 };
  }
}
const timed = async (p, o) => { const t = Date.now(); const r = await req(p, o); r.ms = Date.now() - t; return r; };

// ---------- setup ----------
const A = (await req('/api/admin/login', { method: 'POST', body: { email: 'admin@test.com', password: 'longpassword123' } })).j.token;
const C = (await req('/api/candidate/register', { method: 'POST', body: { email: 'sec-c@x.com', full_name: 'Sec C', password: 'password123' } })).j.token;
const Rr = await req('/api/recruiter/register', { method: 'POST', body: { email: 'sec-r@x.com', full_name: 'Sec R', password: 'password123', company_name: 'SecCo', status: 'approved', role: 'admin' } }); const R = Rr.j.token;
let r = await req('/api/recruiter/me', { token: R }); ok('mass assignment: registering with status=approved is ignored', r.j.recruiter.status === 'pending');

// ---------- headers / CORS / basics ----------
r = await req('/api/health');
const csp = r.h.get('content-security-policy') || '';
ok('CSP present: default-src self, frame-ancestors none, object-src none', /default-src 'self'/.test(csp) && /frame-ancestors 'none'/.test(csp) && /object-src 'none'/.test(csp), csp);
ok('nosniff, no X-Powered-By', r.h.get('x-content-type-options') === 'nosniff' && !r.h.get('x-powered-by'));
r = await req('/api/health', { headers: { Origin: 'https://evil.example' } }); ok('CORS: foreign origin gets no allow header', !r.h.get('access-control-allow-origin'));
r = await req('/api/does-not-exist'); ok('unknown /api path -> JSON 404 (not the SPA page)', r.s === 404 && r.j?.error === 'Not found');
r = await req('/api/candidate/login', { method: 'POST', rawBody: '{bad json', headers: { 'Content-Type': 'application/json' } }); ok('malformed JSON -> 400, not 500', r.s === 400 && r.j?.error === 'Invalid JSON');
r = await req('/api/candidate/login', { method: 'POST', rawBody: JSON.stringify({ email: 'a', password: 'x'.repeat(300000) }), headers: { 'Content-Type': 'application/json' } }); ok('oversized JSON -> 413', r.s === 413, r.s);
r = await req('/api/candidate/resume/upload', { method: 'POST', token: C, rawBody: Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(3 * 1024 * 1024)]), headers: { 'Content-Type': 'application/pdf' } }); ok('oversized PDF upload (3 MB) -> 413', r.s === 413, r.s);

// ---------- JWT attacks ----------
const forge = (header, payload, sig = '') => [header, payload].map((x) => Buffer.from(JSON.stringify(x)).toString('base64url')).join('.') + '.' + sig;
const exp = Math.floor(Date.now() / 1000) + 3600;
r = await req('/api/admin/stats', { token: forge({ alg: 'none', typ: 'JWT' }, { sub: 1, role: 'admin', exp }) }); ok('JWT alg=none rejected', r.s === 401);
r = await req('/api/admin/stats', { token: jwt.sign({ sub: 1, role: 'admin' }, 'some-other-secret-value-0123456789abcd') }); ok('JWT signed with wrong secret rejected', r.s === 401);
r = await req('/api/admin/stats', { token: jwt.sign({ sub: 1, role: 'admin' }, SECRET, { expiresIn: -10 }) }); ok('expired JWT rejected', r.s === 401);
r = await req('/api/admin/stats', { token: jwt.sign({ sub: 1, role: 'admin' }, SECRET, { algorithm: 'HS512' }) }); ok('JWT with non-pinned algorithm (HS512) rejected', r.s === 401);
r = await req('/api/admin/stats', { token: jwt.sign({ sub: 1, role: 'candidate' }, SECRET) }); ok('valid signature but wrong role rejected', r.s === 401);
r = await req('/api/admin/stats', { token: A + 'x' }); ok('tampered signature rejected', r.s === 401);

// ---------- auth matrix over EVERY protected route, discovered from the source ----------
const specs = [['adminJobs.js', null, '/api/admin', 'admin', ['/login']], ['adminRecruiters.js', null, '/api/admin', 'admin', []],
  ['candidate.js', null, '/api/candidate', 'candidate', ['/register', '/login']], ['recruiter.js', null, '/api/recruiter', 'recruiter', ['/register', '/login']],
  ['assistance.js', 'candidateRouter', '/api/candidate/assistance', 'candidate', []], ['assistance.js', 'adminRouter', '/api/admin/assistance', 'admin', []]];
const tokens = { admin: A, candidate: C, recruiter: R }; const routes = [];
for (const [file, obj, prefix, role, skipPaths] of specs) {
  const src = fs.readFileSync(path.join(here, '..', 'routes', file), 'utf8');
  const re = new RegExp(`^${obj || 'r'}\\.(get|post|put|delete)\\(\\s*'([^']+)'`, 'gm'); let m;
  while ((m = re.exec(src))) { if (skipPaths.includes(m[2])) continue; routes.push({ method: m[1].toUpperCase(), url: prefix + m[2].replace(/:\w+(?:\([^)]*\))?/g, '1'), role }); }
}
ok(`auth matrix discovered ${routes.length} protected routes (sanity: > 60)`, routes.length > 60);
let leaks = [];
for (const rt of routes) {
  for (const who of ['none', ...Object.keys(tokens).filter((k) => k !== rt.role)]) {
    const x = await req(rt.url, { method: rt.method, token: who === 'none' ? undefined : tokens[who], body: rt.method === 'GET' || rt.method === 'DELETE' ? undefined : {} });
    if (x.s !== 401) leaks.push(`${rt.method} ${rt.url} as ${who} -> ${x.s}`);
  }
}
ok('EVERY protected route returns 401 with no token and with every wrong-role token', leaks.length === 0, leaks.slice(0, 5).join(' | '));

// ---------- timing / enumeration ----------
for (const [name, p] of [['admin', '/api/admin/login'], ['candidate', '/api/candidate/login'], ['recruiter', '/api/recruiter/login']]) {
  const unknown = await timed(p, { method: 'POST', body: { email: `nobody-${crypto.randomUUID()}@x.com`, password: 'wrongpass123' } });
  ok(`${name} login: unknown email costs a full password check (>80 ms) and says the same thing`, unknown.s === 401 && unknown.ms > 80 && unknown.j.error === 'Invalid email or password', unknown.ms + 'ms ' + JSON.stringify(unknown.j));
}

// ---------- SQL injection sweep ----------
const adminJob = await req('/api/admin/jobs', { method: 'POST', token: A, body: { title: "Sqli Canary'; DROP TABLE jobs;--", company: 'Canary Inc', description: 'd', application_url: 'https://canary.example/apply', skills: 'React' } });
await req(`/api/admin/jobs/${adminJob.j.job.id}/status`, { method: 'POST', token: A, body: { status: 'published' } });
ok('hostile title stored and returned verbatim (parameterised)', adminJob.j.job.title === "Sqli Canary'; DROP TABLE jobs;--");
const payloads = ["' OR '1'='1", '1; DROP TABLE jobs; --', '" OR ""="', "' UNION SELECT password_hash,2,3 FROM admin_users --", '%', '_', '\\', "\\' OR 1=1 #", '1 OR 1=1', '0x27', 'a'.repeat(5000)];
let bad = [];
for (const p of payloads) for (const k of ['q', 'location', 'category', 'experience', 'min_salary', 'sort', 'page', 'limit', 'work_mode', 'employment_type']) {
  const x = await req(`/api/jobs?${k}=${encodeURIComponent(p)}`);
  if (x.s >= 500 || /password_hash|admin@test/.test(x.t)) bad.push(`${k}=${p.slice(0, 20)} -> ${x.s}`);
}
for (const p of payloads.slice(0, 8)) { const x = await req('/api/jobs/' + encodeURIComponent(p)); if (x.s >= 500) bad.push(`path ${p.slice(0, 15)} -> ${x.s}`); }
ok(`${payloads.length * 10 + 8} hostile query/path inputs: no 5xx, no data leak`, bad.length === 0, bad.slice(0, 4).join(' | '));
r = await req('/api/jobs?q=' + encodeURIComponent("' OR '1'='1")); ok("' OR '1'='1 matches nothing (not everything)", r.j.total === 0);
r = await req('/api/jobs'); ok('jobs table intact after injection attempts', r.s === 200 && r.j.total >= 1);
for (const [name, p] of [['admin', '/api/admin/login'], ['candidate', '/api/candidate/login'], ['recruiter', '/api/recruiter/login']]) {
  r = await req(p, { method: 'POST', body: { email: "admin@test.com' OR '1'='1' -- ", password: "' OR '1'='1" } }); ok(`${name} login SQLi bypass fails`, r.s === 401);
}

// ---------- mass assignment ----------
r = await req('/api/admin/recruiters?status=pending', { token: A }); const rid = r.j.recruiters.find((x) => x.email === 'sec-r@x.com').id;
await req(`/api/admin/recruiters/${rid}/status`, { method: 'POST', token: A, body: { status: 'approved' } });
r = await req('/api/recruiter/jobs', { method: 'POST', token: R, body: { title: 'Mass', description: 'd', status: 'published', recruiter_id: 9999, id: 7, published_at: '2000-01-01' } });
ok('recruiter cannot force status/recruiter_id/id on create', r.s === 201 && r.j.job.status === 'draft' && r.j.job.recruiter_id === rid && r.j.job.id !== 7 && !r.j.job.published_at, JSON.stringify(r.j));
r = await req('/api/admin/jobs', { method: 'POST', token: A, body: { title: 'Mass2', status: 'published', id: 5 } }); ok('admin create ignores status/id in body (always draft)', r.j.job.status === 'draft' && r.j.job.id !== 5);
r = await req('/api/candidate/profile', { method: 'PUT', token: C, body: { headline: 'x', candidate_id: 1, id: 1, password_hash: 'pwn', email: 'pwn@x.com', full_name: 'Renamed' } });
const me = await req('/api/candidate/me', { token: C }); ok('candidate profile PUT cannot change email/ids/password', r.s === 200 && me.j.candidate.email === 'sec-c@x.com');
r = await req('/api/candidate/login', { method: 'POST', body: { email: 'sec-c@x.com', password: 'password123' } }); ok('password unchanged after mass-assignment attempt', r.s === 200);

// ---------- stored XSS in server-rendered SEO HTML ----------
const xss = await req('/api/admin/jobs', { method: 'POST', token: A, body: { title: '</title><script>alert(1)</script>', company: '"><img src=x onerror=alert(3)>', description: '</script><script>alert(2)</script>', location: "<svg onload=alert(4)>", application_url: 'https://x.example/a', responsibilities: '</script><b>r</b>' } });
await req(`/api/admin/jobs/${xss.j.job.id}/status`, { method: 'POST', token: A, body: { status: 'published' } });
r = await req('/jobs/' + xss.j.job.id);
if (!r.t.includes('id="root"')) { skip++; console.log('SKIP SEO XSS test (frontend/dist not built)'); }
else {
  const head = r.t.slice(0, r.t.indexOf('</head>'));
  const scripts = r.t.match(/<script[^>]*>/g) || [];
  ok('SEO HTML: attacker text is escaped (no raw <script>alert, <img, <svg; only the 2 legitimate script tags)', !/<script>alert|<img\s|<svg\s/i.test(r.t) && scripts.length === 2, scripts.join(' '));
  ok('SEO HTML: exactly one <title>, one description, one canonical (no duplicates)', (r.t.match(/<title>/g) || []).length === 1 && (r.t.match(/<meta name="description"/g) || []).length === 1 && (r.t.match(/rel="canonical"/g) || []).length === 1);
  const ldRaw = r.t.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)?.[1]; let ld = null; try { ld = JSON.parse(ldRaw); } catch { /* */ }
  ok('JSON-LD still parses and cannot be broken out of with </script>', !!ld && ld['@type'] === 'JobPosting' && ld.title.includes('</title>'), ldRaw?.slice(0, 200));
  ok('title tag is escaped text', /<title>&lt;\/title&gt;&lt;script&gt;/.test(r.t));
}
r = await req('/api/jobs/' + xss.j.job.id); ok('API returns hostile text as data (React escapes on render)', r.j.job.title.includes('<script>'));

// ---------- file / path safety ----------
for (const p of ['/%2e%2e%2f%2e%2e%2fetc/passwd', '/..%2f..%2fetc%2fpasswd', '/assets/..%2f..%2f..%2fetc/passwd', '/.env', '/package.json', '/uploads/resumes/x.pdf']) {
  const x = await req(p); if (/root:.*:0:0/.test(x.t) || /JWT_SECRET|DB_PASSWORD/.test(x.t)) { ok('path traversal / secret file exposed: ' + p, false, x.t.slice(0, 80)); }
}
ok('no traversal/secret-file exposure on 6 probe paths', true);
await req('/api/candidate/resume/upload?name=cv.pdf', { method: 'POST', token: C, rawBody: fs.readFileSync(path.join(here, 'fixtures', 'resume.pdf')), headers: { 'Content-Type': 'application/pdf' } });
const stored = fs.readdirSync(process.env.UPLOAD_DIR || '/tmp/test-uploads').find((f) => f.endsWith('.pdf'));
if (stored) { const x = await req('/' + stored); ok('stored resume filename is not reachable on any public URL', !x.t.startsWith('%PDF')); const y = await req('/uploads/' + stored); ok('…nor under /uploads', !y.t.startsWith('%PDF')); }

// ---------- rate limiting (last: exhausts counters) ----------
for (const [name, p, body, limit] of [['candidate login', '/api/candidate/login', { email: 'sec-c@x.com', password: 'bad' }, 10], ['recruiter login', '/api/recruiter/login', { email: 'sec-r@x.com', password: 'bad' }, 10], ['admin login', '/api/admin/login', { email: 'admin@test.com', password: 'bad' }, 10]]) {
  const codes = []; for (let i = 0; i < limit + 3; i++) codes.push((await req(p, { method: 'POST', body, raw: true })).s);
  const first = codes.indexOf(429);   // earlier checks in this suite already spent some of the 10 attempts, so it can come early
  ok(`${name} brute force is throttled (429 within ${limit} attempts, stays throttled, nothing but 401 before)`, first > 0 && first <= limit && codes.slice(0, first).every((c) => c === 401) && codes.slice(first).every((c) => c === 429), codes.join(','));
}
const regCodes = []; for (let i = 0; i < 13; i++) regCodes.push((await req('/api/recruiter/register', { method: 'POST', raw: true, body: { email: `flood${i}@x.com`, full_name: 'F', password: 'password123', company_name: 'F' } })).s);
ok('recruiter registration flood is throttled', regCodes.includes(429), regCodes.join(','));
r = await req('/api/jobs/1/event', { method: 'POST', body: { type: 'view' }, raw: true }); ok('public endpoints still reachable after throttling others (per-route limits)', r.s !== 500);

console.log(`\n${pass} passed, ${fail} failed${skip ? `, ${skip} skipped` : ''}`);
process.exit(fail ? 1 : 0);
