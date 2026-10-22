import { pool } from '../db.js';
import { LIVE } from './publicJobs.js';

export const baseUrl = () => (process.env.PUBLIC_URL || 'http://localhost:5173').replace(/\/$/, '');
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const TYPE_MAP = { 'full-time': 'FULL_TIME', 'part-time': 'PART_TIME', internship: 'INTERN', contract: 'CONTRACTOR', freelance: 'CONTRACTOR' };

export function jobHead(job) {
  const url = `${baseUrl()}/jobs/${job.id}`;
  const title = `${job.title}${job.company ? ' at ' + job.company : ''}${job.location ? ' – ' + job.location : ''} | TechAbhi`;
  const desc = (job.description || `${job.title} job opening${job.company ? ' at ' + job.company : ''}. View details and apply on TechAbhi.`).replace(/\s+/g, ' ').slice(0, 155);
  const li = (a) => (a.length ? `<ul>${a.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '');
  const html = [job.description && `<p>${esc(job.description)}</p>`, job.responsibilities.length && `<h3>Responsibilities</h3>${li(job.responsibilities)}`, job.requirements.length && `<h3>Requirements</h3>${li(job.requirements)}`, job.benefits.length && `<h3>Benefits</h3>${li(job.benefits)}`].filter(Boolean).join('');
  const ld = {
    '@context': 'https://schema.org', '@type': 'JobPosting', title: job.title, description: html || esc(job.title),
    datePosted: new Date(job.published_at || job.created_at).toISOString().slice(0, 10), url,
    ...(job.expires_at && { validThrough: new Date(job.expires_at).toISOString() }),
    ...(job.employment_type && TYPE_MAP[job.employment_type] && { employmentType: TYPE_MAP[job.employment_type] }),
    ...(job.company && { hiringOrganization: { '@type': 'Organization', name: job.company } }),
    ...(job.education && { educationRequirements: job.education }),
    directApply: false,
  };
  const country = process.env.DEFAULT_COUNTRY || 'IN';
  if (job.work_mode === 'remote') { ld.jobLocationType = 'TELECOMMUTE'; ld.applicantLocationRequirements = { '@type': 'Country', name: country }; }
  else if (job.location) ld.jobLocation = { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: job.location, addressCountry: country } };
  if (job.salary_min && job.salary_max) ld.baseSalary = { '@type': 'MonetaryAmount', currency: 'INR', value: { '@type': 'QuantitativeValue', minValue: job.salary_min, maxValue: job.salary_max, unitText: 'YEAR' } };
  const jsonld = JSON.stringify(ld).replace(/</g, '\\u003c');
  return `<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:site_name" content="TechAbhi"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary"><script type="application/ld+json">${jsonld}</script>`;
}

export async function sitemap(req, res) {
  const b = baseUrl();
  const [jobs] = await pool.query(`SELECT id, updated_at FROM jobs WHERE ${LIVE} ORDER BY published_at DESC LIMIT 5000`);
  const fixed = ['', '/jobs', '/internships', '/remote-jobs', '/fresher-jobs', '/about', '/contact'];
  const urls = [...fixed.map((p) => `<url><loc>${b}${p}</loc></url>`), ...jobs.map((j) => `<url><loc>${b}/jobs/${j.id}</loc><lastmod>${new Date(j.updated_at).toISOString()}</lastmod></url>`)];
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`);
}
export const robots = (req, res) => res.type('text/plain').send(`User-agent: *\nDisallow: /admin\nDisallow: /api/admin\nAllow: /\nSitemap: ${baseUrl()}/sitemap.xml\n`);
