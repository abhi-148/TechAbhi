import 'dotenv/config';
import 'express-async-errors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import adminJobs from './routes/adminJobs.js';
import candidateRoutes from './routes/candidate.js';
import recruiterRoutes from './routes/recruiter.js';
import adminRecruiters from './routes/adminRecruiters.js';
import assistance from './routes/assistance.js';
import { requireCandidate, requireAdmin } from './middleware/auth.js';
import publicJobs, { getPublicJob } from './routes/publicJobs.js';
import { jobHead, sitemap, robots } from './routes/seo.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || /^change-me/i.test(process.env.JWT_SECRET)) { console.error('JWT_SECRET must be set to a random value of 32+ characters (not the .env.example placeholder). Generate one: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'); process.exit(1); }
if (!process.env.DB_NAME) { console.error('DB_NAME missing'); process.exit(1); }

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: { useDefaults: false, directives: {
  'default-src': ["'self'"], 'script-src': ["'self'"], 'style-src': ["'self'"], 'style-src-attr': ["'unsafe-inline'"],
  'img-src': ["'self'", 'data:'], 'font-src': ["'self'"], 'connect-src': ["'self'"], 'object-src': ["'none'"],
  'base-uri': ["'self'"], 'form-action': ["'self'"], 'frame-ancestors': ["'none'"] } } }));
app.use(cors({ origin: (process.env.CORS_ORIGIN || '').split(',').filter(Boolean) }));
app.use(express.json({ limit: '200kb' }));
app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 300 }));

app.use('/api/admin', adminJobs);
app.use('/api/admin', adminRecruiters);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/candidate/assistance', requireCandidate, assistance.candidateRouter);
app.use('/api/admin/assistance', requireAdmin, assistance.adminRouter);
app.use('/api/jobs', publicJobs);
app.use('/api/candidate', candidateRoutes);
app.get('/sitemap.xml', (q, s, n) => sitemap(q, s).catch(n));
app.get('/robots.txt', robots);
app.get('/api/health', (q, s) => s.json({ ok: true }));
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));   // unknown API paths must not fall through to the SPA

// Serve the built frontend with per-job SEO tags injected (production)
const dist = path.resolve(__dirname, '../frontend/dist');
const indexFile = path.join(dist, 'index.html');
if (fs.existsSync(indexFile)) {
  const tpl = fs.readFileSync(indexFile, 'utf8');
  app.use(express.static(dist, { index: false }));
  app.get('/jobs/:id', async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { state, job } = id ? await getPublicJob(id) : { state: 'missing' };
      if (state === 'ok') {
        // drop the template's generic <title>/description so the page has exactly one of each
        const base = tpl.replace(/<title>[\s\S]*?<\/title>/i, '').replace(/<meta\s+name="description"[^>]*>/i, '');
        return res.send(base.replace('<!--SEO_HEAD-->', jobHead(job)));
      }
      res.status(state === 'closed' ? 410 : 404).send(tpl.replace('<!--SEO_HEAD-->', '<meta name="robots" content="noindex">'));
    } catch (e) { next(e); }
  });
  app.get('*', (req, res) => res.send(tpl.replace('<!--SEO_HEAD-->', '')));
}

app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request body too large' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  if (err.status >= 400 && err.status < 500) return res.status(err.status).json({ error: 'Bad request' });
  console.error('Unhandled error:', err.code || err.name, String(err.message).slice(0, 120));   // never log SQL, tokens or request bodies
  res.status(500).json({ error: 'Something went wrong' });
});

process.on('unhandledRejection', (e) => console.error('Unhandled rejection:', e?.code || e?.name, String(e?.message).slice(0, 120)));
app.listen(process.env.PORT || 4000, () => console.log('TechAbhi API on :' + (process.env.PORT || 4000)));
