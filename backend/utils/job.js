export const WORK_MODES = ['onsite', 'remote', 'hybrid'];
export const TYPES = ['full-time', 'part-time', 'internship', 'contract', 'freelance'];
const norm = (v) => (typeof v === 'string' ? v.trim().toLowerCase().replace(/[\s_]+/g, '-') : '');
const str = (v, max) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
};
const int = (v, max) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
};
const list = (v, split, n = 30, len = 500) => {
  let a = v;
  if (typeof a === 'string') a = a.split(split);
  if (!Array.isArray(a)) return [];
  return a.map((x) => str(x, len)).filter(Boolean).slice(0, n);
};
// returns URL string, null (empty) or undefined (invalid)
export function safeUrl(v) {
  const s = str(v, 1000);
  if (!s) return null;
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : undefined;
  } catch { return undefined; }
}
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
function dateVal(v) {
  if (!v) return null;
  const s = String(v);
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? s + 'T23:59:59Z' : s);
  return isNaN(d) ? undefined : d;
}
const mapMode = (x) => { const n = norm(x); return n === 'on-site' || n === 'office' || n === 'work-from-office' ? 'onsite' : n === 'wfh' || n === 'work-from-home' ? 'remote' : n; };
const mapType = (x) => { const n = norm(x); return n === 'fulltime' ? 'full-time' : n === 'parttime' ? 'part-time' : n === 'intern' ? 'internship' : n; };

/** Validates & normalises job input. lenient=true (AI output): bad values become null instead of errors. */
export function sanitizeJob(b = {}, { lenient = false } = {}) {
  const errors = [];
  const bad = (msg) => { if (!lenient) errors.push(msg); };
  const v = {
    title: str(b.title, 255), company: str(b.company, 255), category: str(b.category, 100),
    location: str(b.location, 255), experience: str(b.experience, 100), salary: str(b.salary, 150),
    education: str(b.education, 255), description: str(b.description, 20000),
    eligibility: str(b.eligibility, 5000), application_instructions: str(b.application_instructions, 5000),
    responsibilities: list(b.responsibilities, /\r?\n/), requirements: list(b.requirements, /\r?\n/),
    benefits: list(b.benefits, /\r?\n/), skills: list(b.skills, /\r?\n|,/, 40, 60),
    openings: int(b.openings, 100000), salary_min: int(b.salary_min, 1e9), salary_max: int(b.salary_max, 1e9),
  };
  const mode = b.work_mode ? mapMode(b.work_mode) : null;
  if (mode && !WORK_MODES.includes(mode)) { bad('work_mode must be onsite, remote or hybrid'); v.work_mode = null; } else v.work_mode = mode || null;
  const type = b.employment_type ? mapType(b.employment_type) : null;
  if (type && !TYPES.includes(type)) { bad('employment_type must be one of ' + TYPES.join(', ')); v.employment_type = null; } else v.employment_type = type || null;
  const url = safeUrl(b.application_url);
  if (url === undefined) { bad('application_url must be a valid http(s) URL'); v.application_url = null; } else v.application_url = url;
  const email = str(b.application_email, 255);
  if (email && !emailOk(email)) { bad('application_email is not a valid email'); v.application_email = null; } else v.application_email = email;
  const exp = dateVal(b.expires_at);
  if (exp === undefined) { bad('expires_at is not a valid date'); v.expires_at = null; } else v.expires_at = exp;
  if (v.salary_min !== null && v.salary_max !== null && v.salary_min > v.salary_max) bad('salary_min cannot exceed salary_max');
  if (!lenient && !v.title) errors.push('title is required');
  return { value: v, errors };
}

export function publishErrors(j, { internal = false } = {}) {
  const e = [];
  if (!j.title) e.push('title is required');
  if (!j.company) e.push('company is required to publish');
  if (!j.description) e.push('description is required to publish');
  if (!internal && !j.application_url && !j.application_email && !j.application_instructions)
    e.push('add an application URL, email or instructions before publishing');
  return e;
}

export const J = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
};
export const serialize = (row) => row && ({ ...row, responsibilities: J(row.responsibilities), requirements: J(row.requirements), benefits: J(row.benefits), skills: J(row.skills) });
