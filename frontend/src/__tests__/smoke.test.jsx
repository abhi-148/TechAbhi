import { screen, waitFor, fireEvent, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { setup, job, list, status } from './harness';
import { safeNext, safeHttp } from '../lib/format';

const find = (t) => screen.findByText(t, { exact: false });
const findAll = (t) => screen.findAllByText(t, { exact: false });

describe('pure helpers', () => {
  it('safeNext only allows in-app paths', () => {
    for (const ok of ['/jobs/1', '/candidate/resume?job=4']) expect(safeNext(ok, '/x')).toBe(ok);
    for (const bad of ['//evil.com', '/\\evil.com', '/\\/evil.com', 'https://evil.com', 'javascript:alert(1)', '', null, undefined, '/a\\b', '/a\nb']) expect(safeNext(bad, '/x')).toBe('/x');
  });
  it('safeHttp only allows http(s)', () => {
    expect(safeHttp('https://a.b')).toBe(true); expect(safeHttp('HTTP://a.b')).toBe(true);
    for (const bad of ['javascript:alert(1)', 'data:text/html,x', 'ftp://a', '//a.b', '', null]) expect(safeHttp(bad)).toBe(false);
  });
});

describe('public site', () => {
  it('home renders jobs, search and the optional-account / recruiter CTAs', async () => {
    const { unmocked } = setup('/', { routes: { 'GET /api/jobs': list() } });
    expect(await find('Find your next job')).toBeTruthy(); expect((await findAll('MERN Intern')).length).toBeGreaterThan(0);
    expect(screen.getByText(/Register as a recruiter/)).toBeTruthy(); expect(screen.getByText(/Create a free account/)).toBeTruthy();
    expect(unmocked).toEqual([]);
  });
  it('jobs list shows card details; empty and error states work', async () => {
    setup('/jobs', { routes: { 'GET /api/jobs': list() } });
    expect(await screen.findByText('MERN Intern')).toBeTruthy(); expect(screen.getByText('₹4-6 LPA')).toBeTruthy(); expect(screen.getByText('React')).toBeTruthy();
  });
  it('jobs list empty state', async () => { setup('/jobs', { routes: { 'GET /api/jobs': list([]) } }); expect(await find('No jobs match your search')).toBeTruthy(); });
  it('jobs list error state', async () => { setup('/jobs', { routes: { 'GET /api/jobs': status(500, { error: 'boom' }) } }); expect(await find('boom')).toBeTruthy(); });
  it('job page: Apply Now opens the exact external URL safely, no login needed', async () => {
    const { unmocked } = setup('/jobs/1', { routes: { 'GET /api/jobs/1': { job, related: [] } } });
    const a = await screen.findByRole('link', { name: /Apply Now/ });
    expect(a.getAttribute('href')).toBe('https://acme.example/apply'); expect(a.getAttribute('target')).toBe('_blank'); expect(a.getAttribute('rel')).toMatch(/noopener/);
    expect(screen.getByText(/does not submit applications for you/)).toBeTruthy(); expect(screen.getByText(/Optional: free account/)).toBeTruthy();
    expect(unmocked).toEqual([]);
  });
  it('job page: a javascript: URL from the API is never rendered as a link', async () => {
    setup('/jobs/1', { routes: { 'GET /api/jobs/1': { job: { ...job, application_url: 'javascript:alert(1)' }, related: [] } } });
    await screen.findByText('MERN Intern');
    expect(screen.queryByRole('link', { name: /Apply Now/ })).toBeNull(); expect(document.querySelector('a[href^="javascript"]')).toBeNull();
    expect(screen.getByText('hr@acme.example')).toBeTruthy();
  });
  it('job page: missing apply info is explained', async () => {
    setup('/jobs/1', { routes: { 'GET /api/jobs/1': { job: { ...job, application_url: null, application_email: null }, related: [] } } });
    expect(await find('No application details were provided')).toBeTruthy();
  });
  it('job page: 404 and closed states', async () => {
    setup('/jobs/9', { routes: { 'GET /api/jobs/9': status(404, { error: 'x' }) } }); expect(await find('Job not found')).toBeTruthy();
  });
  it('job page: closed (410)', async () => { setup('/jobs/9', { routes: { 'GET /api/jobs/9': status(410, { error: 'x' }) } }); expect(await find('This job is closed')).toBeTruthy(); });
  it('job page: internal-apply card prompts login when logged out', async () => {
    setup('/jobs/1', { routes: { 'GET /api/jobs/1': { job: { ...job, accepts_applications: true }, related: [] } } });
    expect(await find('Apply through TechAbhi')).toBeTruthy(); expect(screen.getByRole('link', { name: /Log in to apply/ })).toBeTruthy();
  });
  it('job page: consented internal application flow (consent gate + payload)', async () => {
    const { calls } = setup('/jobs/1', { as: 'candidate', routes: { 'GET /api/jobs/1': { job: { ...job, accepts_applications: true }, related: [] }, 'GET /api/candidate/saved/ids': { ids: [] }, 'GET /api/candidate/submissions/1': { submission: null }, 'POST /api/candidate/applications/submit': { ok: true } } });
    fireEvent.click(await screen.findByRole('button', { name: /Apply with my profile/ }));
    const submit = screen.getByRole('button', { name: /Submit application/ }); expect(submit.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText(/I agree to share my name/)); expect(submit.disabled).toBe(false);
    fireEvent.click(screen.getByLabelText(/Also share my resume/)); fireEvent.click(submit);
    await waitFor(() => expect(calls.find((c) => c.path === '/api/candidate/applications/submit')).toBeTruthy());
    const c = calls.find((x) => x.path === '/api/candidate/applications/submit'); expect(c.body).toMatchObject({ job_id: 1, consent: true, share_resume: true }); expect(c.auth).toBe('Bearer tok-candidate');
    expect(await find('You applied on')).toBeTruthy();
  });
  it('static pages and 404', async () => { setup('/privacy'); expect(await screen.findByRole('heading', { name: /Privacy Policy/ })).toBeTruthy(); });
  it('unknown route', async () => { setup('/nope/nothing'); expect(await find('Page not found')).toBeTruthy(); });
});

describe('candidate area', () => {
  const me = { 'GET /api/candidate/me': { candidate: { id: 1, email: 'a@x.com', full_name: 'Abhi' } } };
  it('redirects to login (with next) when logged out', async () => { setup('/candidate/dashboard'); expect(await screen.findByRole('heading', { name: /Log in/ })).toBeTruthy(); });
  it('dashboard: completeness, counts, explained recommendations', async () => {
    const { unmocked } = setup('/candidate/dashboard', { as: 'candidate', routes: { ...me, 'GET /api/candidate/dashboard': { full_name: 'Abhi', completeness: { percent: 57, missing: ['Resume added'] }, saved: 1, tracked: 2 }, 'GET /api/candidate/recommendations': { fallback: false, jobs: [{ ...job, matched_skills: ['React'], reasons: ['Matches your preferred location'] }] } } });
    expect(await find('Hi, Abhi')).toBeTruthy(); expect(screen.getByText('57%')).toBeTruthy(); expect(await find('Matching skills: React')).toBeTruthy(); expect(screen.getByText(/ask the TechAbhi team for help/)).toBeTruthy();
    expect(unmocked).toEqual([]);
  });
  it('profile: AI draft shows warnings and is NOT saved until Save', async () => {
    const prof = { full_name: 'Abhi', profile: { headline: '', summary: '', skills: [], education: [], experience: [], projects: [], preferred_location: '', preferred_employment_type: null, preferred_work_mode: null, career_interests: '' }, completeness: { percent: 14, missing: [] } };
    const { calls } = setup('/candidate/profile', { as: 'candidate', routes: { ...me, 'GET /api/candidate/profile': prof, 'POST /api/candidate/profile/extract': { profile: { headline: 'MERN dev', summary: '', skills: ['React'], education: [], experience: [], projects: [] }, warnings: ['1 skill(s) removed because they are not in your resume'] }, 'PUT /api/candidate/profile': { ok: true } } });
    fireEvent.click(await screen.findByRole('button', { name: /Fill from my resume/ }));
    expect(await find('1 skill(s) removed')).toBeTruthy(); expect(screen.getByDisplayValue('MERN dev')).toBeTruthy();
    expect(calls.some((c) => c.method === 'PUT')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: /Save profile/ })); await waitFor(() => expect(calls.some((c) => c.method === 'PUT' && c.body.headline === 'MERN dev')).toBe(true));
  });
  it('resume: analysis shows found / missing skills, suggestions and the disclaimer', async () => {
    setup('/candidate/resume?job=1', { as: 'candidate', routes: { ...me, 'GET /api/candidate/resume': { has: true, text: 'resume text '.repeat(10), file_name: 'cv.pdf', has_file: true, uploaded_at: '2026-10-01' }, 'GET /api/candidate/saved': { jobs: [] }, 'POST /api/candidate/resume/analyze': { job: { id: 1, title: 'MERN Intern', company: 'Acme' }, matching_skills: ['React'], missing_skills: ['Docker'], note: null, ai: { improvement_suggestions: ['Add metrics'], project_ideas: [], interview_tips: [], unverifiable: [] }, ai_error: null, disclaimer: 'It is not a hiring decision.' } } });
    fireEvent.click(await screen.findByRole('button', { name: 'Analyse' }));
    expect(await find('Skills found in your resume')).toBeTruthy(); expect(screen.getByText('Docker')).toBeTruthy(); expect(screen.getByText('Add metrics')).toBeTruthy(); expect(screen.getByText(/not a hiring decision/)).toBeTruthy();
  });
  it('saved jobs and applications trackers label employer vs self-reported', async () => {
    setup('/candidate/saved-jobs', { as: 'candidate', routes: { ...me, 'GET /api/candidate/saved': { jobs: [{ ...job, available: true }, { id: 2, title: 'Old Role', company: 'Z', available: false, status_note: 'No longer accepting applications' }] } } });
    expect(await screen.findByText('MERN Intern')).toBeTruthy(); expect(screen.getByText('No longer accepting applications')).toBeTruthy();
  });
  it('applications page', async () => {
    setup('/candidate/applications', { as: 'candidate', routes: { ...me, 'GET /api/candidate/applications': { applications: [{ ...job, available: true, app_status: 'applied', updated_at: '2026-10-02', sub_status: 'shortlisted', submitted_at: '2026-10-02', viewed_at: '2026-10-03' }] } } });
    expect(await screen.findByText('Shortlisted')).toBeTruthy(); expect(screen.getByText(/the employer opened your application/)).toBeTruthy(); expect(screen.getByRole('button', { name: /Withdraw application/ })).toBeTruthy();
  });
  const rq = (extra = {}) => ({ can_request: false, request: { id: 1, status: 'in_progress', target_roles: 'MERN', preferred_locations: '', availability: '', challenges: '', closed_reason: null, first_viewed_at: '2026-10-02', created_at: '2026-10-01', updates: [{ author: 'team', message: 'Looking', created_at: '2026-10-02' }], outreach: [{ id: 5, company_name: 'Acme Corp', job_title: null, message: 'Hiring juniors', shared_fields: ['email'], status: 'proposed', shared_at: null, interview_at: null, interview_info: null }], ...extra } });
  it('career assistance: request form needs consent', async () => {
    setup('/candidate/career-assistance', { as: 'candidate', routes: { ...me, 'GET /api/candidate/assistance': { request: null, can_request: true } } });
    const btn = await screen.findByRole('button', { name: /Submit request/ }); expect(btn.disabled).toBe(true); expect(screen.getByText(/No guarantee/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText(/I agree that the TechAbhi team can read/)); expect(btn.disabled).toBe(false);
  });
  it('career assistance: proposal shows exactly what is shared; approval is explicit', async () => {
    const { calls } = setup('/candidate/career-assistance', { as: 'candidate', routes: { ...me, 'GET /api/candidate/assistance': rq(), 'POST /api/candidate/assistance/outreach/5/decision': rq() } });
    expect(await find('Would be shared: your name, your email address.')).toBeTruthy(); expect(screen.getByText(/not a promise of a job/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Approve sharing/ })); await waitFor(() => expect(calls.find((c) => c.path.endsWith('/decision'))?.body).toEqual({ decision: 'approve' }));
  });
});

describe('recruiter area', () => {
  const rec = (st = 'approved', extra = {}) => ({ 'GET /api/recruiter/me': { recruiter: { id: 1, email: 'r@acme.com', full_name: 'Rec', company_name: 'Acme', company_website: '', company_description: '', phone: '', status: st, status_reason: null, ...extra } } });
  it('pending recruiter sees only a status screen', async () => { setup('/recruiter/dashboard', { as: 'recruiter', routes: rec('pending') }); expect(await find('Account pending')).toBeTruthy(); expect(screen.queryByText('+ New job')).toBeNull(); });
  it('suspended recruiter sees the reason', async () => { setup('/recruiter/jobs', { as: 'recruiter', routes: rec('suspended', { status_reason: 'Fake listings' }) }); expect(await find('Fake listings')).toBeTruthy(); });
  it('dashboard shows real counts', async () => {
    const { unmocked } = setup('/recruiter/dashboard', { as: 'recruiter', routes: { ...rec(), 'GET /api/recruiter/dashboard': { jobs: { published: 3 }, applications: { new: 2, shortlisted: 1, withdrawn: 4 }, events: { view: 9, apply_click: 1 }, recent: [] } } });
    const card = async (label) => (await screen.findByText(label)).parentElement;
    expect(within(await card('Published jobs')).getByText('3')).toBeTruthy();
    expect(within(await card('Applications received')).getByText('3')).toBeTruthy();   // 2 new + 1 shortlisted; the 4 withdrawn are excluded
    expect(within(await card('Job page views')).getByText('9')).toBeTruthy(); expect(unmocked).toEqual([]);
  });
  it('job form (recruiter scope): company locked, AI extract fills form, saves via RECRUITER api with the recruiter token', async () => {
    const { calls } = setup('/recruiter/jobs/new', { as: 'recruiter', routes: { ...rec(), 'POST /api/recruiter/jobs/parse': { job: { title: 'Backend Dev', company: 'Hallucinated Inc', skills: ['Node.js'], responsibilities: [], requirements: [], benefits: [] }, warnings: [] }, 'POST /api/recruiter/jobs': { job: { ...job, id: 7, status: 'draft' } }, 'GET /api/recruiter/jobs/7': { job: { ...job, id: 7, status: 'draft' } } } });
    const company = await screen.findByLabelText(/Company \(set from your recruiter profile\)/); expect(company.disabled).toBe(true);
    fireEvent.change(screen.getByPlaceholderText(/Paste the full job posting/), { target: { value: 'We are hiring a backend developer in Pune. '.repeat(3) } });
    fireEvent.click(screen.getByRole('button', { name: /Extract details with AI/ }));
    expect(await screen.findByDisplayValue('Backend Dev')).toBeTruthy(); expect(company.value).toBe('');   // AI-invented company never lands in a recruiter's form
    fireEvent.click(screen.getByRole('button', { name: /Save draft/ }));
    await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.path === '/api/recruiter/jobs')).toBe(true));
    expect(calls.filter((c) => c.path.startsWith('/api/recruiter/jobs')).every((c) => c.auth === 'Bearer tok-recruiter')).toBe(true);
    expect(calls.some((c) => c.path.startsWith('/api/admin'))).toBe(false);
  });
  it('applications: detail shows only what was shared and offers resume download when a file exists', async () => {
    setup('/recruiter/applications', { as: 'recruiter', routes: { ...rec(), 'GET /api/recruiter/jobs': { jobs: [{ ...job }] }, 'GET /api/recruiter/applications': { applications: [{ id: 5, job_id: 1, job_title: 'MERN Intern', candidate_name: 'Cand A', status: 'new', submitted_at: '2026-10-02', viewed_at: null, has_resume: true }] },
      'GET /api/recruiter/applications/5': { application: { id: 5, job_title: 'MERN Intern', candidate_name: 'Cand A', candidate_email: 'a@x.com', status: 'new', submitted_at: '2026-10-02', cover_note: 'Hello', resume_text: 'RESUME BODY', has_resume_file: true, recruiter_note: '', profile: { headline: 'MERN dev', skills: ['React'], education: [], experience: [], projects: [] } } } } });
    fireEvent.click(await screen.findByText('Cand A'));
    expect(await find('a@x.com')).toBeTruthy(); expect(screen.getByText('Hello')).toBeTruthy(); expect(screen.getByRole('button', { name: /Download resume PDF/ })).toBeTruthy(); expect(screen.getByText(/does not score or rank/)).toBeTruthy();
  });
  it('withdrawn application shows no personal data', async () => {
    setup('/recruiter/applications', { as: 'recruiter', routes: { ...rec(), 'GET /api/recruiter/jobs': { jobs: [] }, 'GET /api/recruiter/applications': { applications: [{ id: 5, job_id: 1, job_title: 'X', candidate_name: 'Cand A', status: 'withdrawn', submitted_at: '2026-10-02', viewed_at: null, has_resume: false }] }, 'GET /api/recruiter/applications/5': { application: { id: 5, status: 'withdrawn', candidate_name: 'Cand A', candidate_email: null, profile: null, resume_text: null } } } });
    fireEvent.click(await screen.findByText('Cand A')); expect(await find('withdrew this application')).toBeTruthy();
  });
});

describe('admin area', () => {
  const adm = { 'GET /api/admin/me': { ok: true } };
  it('login page renders', async () => { setup('/admin/login'); expect(await screen.findByRole('heading', { name: /Admin login/ })).toBeTruthy(); });
  it('protected admin pages redirect when logged out', async () => { setup('/admin/jobs'); expect(await screen.findByRole('heading', { name: /Admin login/ })).toBeTruthy(); });
  it('dashboard shows every stat with honest labels', async () => {
    setup('/admin/dashboard', { as: 'admin', routes: { ...adm, 'GET /api/admin/stats': { total: 5, published: 3, draft: 1, closed: 1, expired: 0, views: 10, apply_clicks: 4, shares: 2, candidates: 7, pending_recruiters: 2, new_assistance_requests: 1, tracked_applications: 3, latest: [] } } });
    expect(await find('Recruiters awaiting approval')).toBeTruthy(); expect(screen.getByText(/Self-reported by candidates/)).toBeTruthy(); expect(screen.getByText(/not employer-confirmed/i)).toBeTruthy();
  });
  it('job form (admin scope) saves via ADMIN api', async () => {
    const { calls } = setup('/admin/jobs/new', { as: 'admin', routes: { ...adm, 'POST /api/admin/jobs': { job: { ...job, id: 8, status: 'draft' } }, 'GET /api/admin/jobs/8': { job: { ...job, id: 8, status: 'draft' } } } });
    fireEvent.change(await screen.findByLabelText(/Job title/), { target: { value: 'Draft Role' } });
    fireEvent.click(screen.getByRole('button', { name: /Save draft/ }));
    await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.path === '/api/admin/jobs' && c.body.title === 'Draft Role')).toBe(true));
    expect(calls.filter((c) => c.path.startsWith('/api/admin/jobs')).every((c) => c.auth === 'Bearer tok-admin')).toBe(true); expect(calls.some((c) => c.path.startsWith('/api/recruiter'))).toBe(false);
  });
  it('manage jobs flags recruiter jobs and offers share actions for published', async () => {
    setup('/admin/jobs', { as: 'admin', routes: { ...adm, 'GET /api/admin/jobs': { jobs: [{ ...job, recruiter_id: 4 }] } } });
    expect(await screen.findByText('recruiter job')).toBeTruthy(); expect(screen.getByRole('button', { name: /Copy message/ })).toBeTruthy(); expect(screen.getByRole('button', { name: /Unpublish/ })).toBeTruthy();
  });
  it('preview of a published job shows the share panel with the generated message', async () => {
    setup('/admin/jobs/1/preview?published=1', { as: 'admin', routes: { ...adm, 'GET /api/admin/jobs/1': { job } } });
    expect(await find('Published! Share it now')).toBeTruthy(); const ta = document.querySelector('textarea[readonly]'); expect(ta.value).toMatch(/NEW JOB OPPORTUNITY/); expect(ta.value).toMatch(/Company: Acme/); expect(ta.value).toMatch(/\/jobs\/1/);
  });
  it('recruiter approvals: vetting info and actions', async () => {
    setup('/admin/recruiters', { as: 'admin', routes: { ...adm, 'GET /api/admin/recruiters': { recruiters: [{ id: 3, email: 'r@acme.com', full_name: 'Rec', phone: '', company_name: 'Acme', company_website: 'https://acme.example', company_description: 'We build', status: 'pending', status_reason: null, created_at: '2026-10-01', job_count: 0 }] } } });
    expect(await screen.findByText('Acme')).toBeTruthy(); expect(screen.getByRole('button', { name: /^Approve$/ })).toBeTruthy(); expect(screen.getByRole('button', { name: /^Reject$/ })).toBeTruthy(); expect(screen.getByRole('link', { name: 'https://acme.example' }).getAttribute('rel')).toMatch(/nofollow/);
  });
  const detail = (st) => ({ request: { id: 1, status: 'in_progress', target_roles: 'MERN', preferred_locations: '', availability: '', challenges: 'None', closed_reason: null, admin_note: '', created_at: '2026-10-01', first_viewed_at: null }, candidate: { name: 'Cand', email: 'c@x.com' }, profile: { headline: 'h', summary: '', skills: ['React'], education: [], experience: [], projects: [] }, resume: null, updates: [], outreach: [{ id: 5, company_name: 'Acme', job_title: null, hr_contact: 'hr@acme.example', shared_fields: ['email'], status: st, interview_at: null, interview_info: null }] });
  it('assistance detail: no packet and no "mark shared" before the candidate approves', async () => {
    setup('/admin/assistance/1', { as: 'admin', routes: { ...adm, 'GET /api/admin/assistance/1': detail('proposed') } });
    expect(await find('You cannot share yet')).toBeTruthy(); expect(screen.queryByRole('button', { name: /Get approved share packet/ })).toBeNull(); expect(screen.queryByRole('button', { name: /Mark as shared/ })).toBeNull();
  });
  it('assistance detail: after approval the packet and "Mark as shared" appear', async () => {
    setup('/admin/assistance/1', { as: 'admin', routes: { ...adm, 'GET /api/admin/assistance/1': detail('candidate_approved') } });
    expect(await screen.findByRole('button', { name: /Get approved share packet/ })).toBeTruthy(); expect(screen.getByRole('button', { name: /Mark as shared/ })).toBeTruthy(); expect(screen.getByText(/never promise a job or interview/i)).toBeTruthy();
  });
  it('assistance list', async () => { setup('/admin/assistance', { as: 'admin', routes: { ...adm, 'GET /api/admin/assistance': { requests: [{ id: 1, status: 'submitted', created_at: '2026-10-01', first_viewed_at: null, target_roles: 'MERN', full_name: 'Cand A', outreach_count: 0 }] } } }); expect(await screen.findByText('Cand A')).toBeTruthy(); });
});
