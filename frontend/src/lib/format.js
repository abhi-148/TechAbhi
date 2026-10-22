import { useEffect } from 'react';
export const TYPE_LABEL = { 'full-time': 'Full-time', 'part-time': 'Part-time', internship: 'Internship', contract: 'Contract', freelance: 'Freelance' };
export const MODE_LABEL = { onsite: 'On-site', remote: 'Remote', hybrid: 'Hybrid' };
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
export const publicUrl = (job) => `${window.location.origin}/jobs/${job.id}`;
export function shareMessage(job, url) {
  const lines = ['🚨 NEW JOB OPPORTUNITY', ''];
  if (job.company) lines.push(`Company: ${job.company}`);
  lines.push(`Role: ${job.title}`);
  if (job.location) lines.push(`Location: ${job.location}`);
  if (job.experience) lines.push(`Experience: ${job.experience}`);
  if (job.salary) lines.push(`Salary: ${job.salary}`);
  lines.push('', 'Check job details and application instructions:', url, '', "Apply through the employer's original application page.");
  return lines.join('\n');
}
export function useMeta(title, description) {
  useEffect(() => {
    document.title = title;
    let m = document.querySelector('meta[name="description"]');
    if (!m) { m = document.createElement('meta'); m.name = 'description'; document.head.appendChild(m); }
    if (description) m.content = description;
  }, [title, description]);
}
export const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600';
export const btn = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed';
export const btnPrimary = btn + ' bg-brand-600 text-white hover:bg-brand-700';
export const btnGhost = btn + ' border border-slate-300 bg-white text-slate-700 hover:bg-slate-100';

// Accept only in-app paths from ?next=. Rejects //host, /\host, absolute URLs and control characters.
export const safeNext = (n, fallback) => (typeof n === 'string' && /^\/(?![\/\\])[^\x00-\x1f\\]*$/.test(n) ? n : fallback);
export const safeHttp = (u) => /^https?:\/\//i.test(u || '');
export const emailLike = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');
