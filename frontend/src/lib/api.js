export const TOKEN_KEY = 'techabhi_admin_token';
export const CAND_KEY = 'techabhi_candidate_token';
export const REC_KEY = 'techabhi_recruiter_token';
export const isCandidate = () => !!localStorage.getItem(CAND_KEY);

export async function api(path, { method = 'GET', body, admin = false, candidate = false, recruiter = false, file } = {}) {
  const headers = {};
  const tk = admin ? TOKEN_KEY : candidate ? CAND_KEY : recruiter ? REC_KEY : null;
  if (tk) { const t = localStorage.getItem(tk); if (t) headers.Authorization = 'Bearer ' + t; }
  let payload;
  if (file) { headers['Content-Type'] = 'application/pdf'; payload = file; }
  else if (body) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  let res;
  try { res = await fetch('/api' + path, { method, headers, body: payload }); }
  catch { throw Object.assign(new Error('Cannot reach the server. Check your connection.'), { status: 0 }); }
  let data = null;
  try { data = await res.json(); } catch { /* empty */ }
  if (!res.ok) {
    if (tk && res.status === 401) localStorage.removeItem(tk);
    throw Object.assign(new Error(data?.error || 'Request failed'), { status: res.status, details: data?.details });
  }
  return data;
}
export const track = (id, type) => { try { fetch(`/api/jobs/${id}/event`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type }), keepalive: true }); } catch { /* ignore */ } };
// Logged-in candidates only: records that they opened the employer link (not that they applied).
export function markOpened(id) {
  const t = localStorage.getItem(CAND_KEY); if (!t) return;
  try { fetch('/api/candidate/applications/opened', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }, body: JSON.stringify({ job_id: id }), keepalive: true }); } catch { /* ignore */ }
}
