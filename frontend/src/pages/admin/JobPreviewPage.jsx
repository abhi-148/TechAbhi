
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  Eye,
  FileEdit,
  Globe,
  LoaderCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { api } from '../../lib/api';
import { btnGhost, btnPrimary } from '../../lib/format';
import JobView from '../../components/JobView';
import SharePanel from '../../components/SharePanel';

function StatusBadge({ status }) {
  const style = {
    published: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    draft: 'bg-slate-100 text-slate-700 ring-slate-200',
    closed: 'bg-amber-50 text-amber-800 ring-amber-200',
    expired: 'bg-rose-50 text-rose-800 ring-rose-200',
  };

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold capitalize ring-1 ring-inset ${style[status] || 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
      <span className={`h-2 w-2 rounded-full ${status === 'published' ? 'bg-emerald-500' : status === 'closed' ? 'bg-amber-500' : 'bg-slate-400'}`} />
      {status || 'unknown'}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <LoaderCircle size={30} className="animate-spin text-indigo-600" />
      <p className="mt-4 font-bold text-slate-800">Loading job preview</p>
      <p className="mt-1 text-sm text-slate-500">Fetching the latest job information...</p>
    </div>
  );
}

function ErrorState({ message, onRetry, backTo }) {
  return (
    <div className="space-y-4">
      <Link to={backTo} className="inline-flex items-center gap-2 text-sm font-bold text-indigo-700 hover:text-indigo-900">
        <ArrowLeft size={16} /> Back to jobs
      </Link>
      <div role="alert" className="rounded-2xl border border-rose-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <CircleAlert size={22} className="mt-0.5 shrink-0 text-rose-600" />
          <div className="flex-1">
            <h2 className="font-bold text-slate-900">Unable to load job preview</h2>
            <p className="mt-1 break-words text-sm text-slate-600">{message}</p>
            <button type="button" onClick={onRetry} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">
              <RefreshCw size={15} /> Try again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JobPreviewPage({ scope = 'admin' }) {
  const P = '/' + scope;
  const A = scope === 'admin' ? { admin: true } : { recruiter: true };
  const { id } = useParams();
  const [sp] = useSearchParams();

  const [job, setJob] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setErr('');
    setLoading(true);

    try {
      const data = await api(P + '/jobs/' + id, { ...A });
      setJob(data.job);
    } catch (error) {
      setErr(error.message || 'Unable to load this job.');
    } finally {
      setLoading(false);
    }
  }, [id, scope]);

  useEffect(() => {
    load();
  }, [load]);

  const change = async (status) => {
    if (busy) return;

    const action = status === 'published'
      ? 'publish'
      : status === 'draft'
        ? 'unpublish'
        : 'reopen';

    if (status === 'draft' && !window.confirm('Unpublish this job? It will no longer be listed as a live job.')) {
      return;
    }

    setBusy(true);
    setErr('');
    setNotice('');

    try {
      await api(`${P}/jobs/${id}/status`, {
        method: 'POST',
        body: { status },
        ...A,
      });

      setNotice(
        status === 'published'
          ? 'Job published successfully.'
          : status === 'draft'
            ? 'Job unpublished and moved to draft.'
            : 'Job status updated.'
      );

      await load();
    } catch (error) {
      setErr([error.message, ...(error.details || [])].join('\n'));
    } finally {
      setBusy(false);
    }
  };

  if (loading && !job) return <LoadingState />;

  if (err && !job) {
    return <ErrorState message={err} onRetry={load} backTo={`${P}/jobs`} />;
  }

  if (!job) return null;

  const live = job.status === 'published';
  const publishedFromRedirect = sp.get('published') === '1';

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <Link to={`${P}/jobs`} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-indigo-700">
        <ArrowLeft size={16} /> Back to jobs
      </Link>

      {/* Page heading */}
      <header className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-6 text-white shadow-xl shadow-indigo-950/10 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-indigo-100">
              <Eye size={14} /> JOB PREVIEW
            </div>
            <h1 className="mt-4 break-words text-2xl font-black tracking-tight sm:text-3xl">
              {job.title || 'Untitled job'}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-indigo-100/80">
              {job.company && <><BriefcaseBusiness size={15} /> {job.company}<span>·</span></>}
              Preview the listing as you prepare it for candidates.
            </p>
            <div className="mt-4"><StatusBadge status={job.status} /></div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to={`${P}/jobs/${id}/edit`} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15">
              <FileEdit size={16} /> Edit job
            </Link>

            {live && (
              <a href={`/jobs/${id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-950 transition hover:bg-indigo-50">
                <ExternalLink size={16} /> Open public page
              </a>
            )}
          </div>
        </div>
      </header>

      {err && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <CircleAlert size={18} className="mt-0.5 shrink-0" />
          <p className="break-words whitespace-pre-line">{err}</p>
        </div>
      )}

      {notice && (
        <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <p>{notice}</p>
        </div>
      )}

      {/* Publish and status controls */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className={`rounded-xl p-3 ${live ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {live ? <CheckCircle2 size={22} /> : <Sparkles size={22} />}
            </div>
            <div>
              <h2 className="font-black text-slate-950">
                {live ? 'This job is live' : 'This job is not published'}
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                {live
                  ? 'Candidates can access the public job page. Check the details and share the listing with relevant candidates.'
                  : 'Review the job description, eligibility, salary and application instructions before publishing.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {live ? (
              <button type="button" disabled={busy} className={`${btnGhost} disabled:opacity-50`} onClick={() => change('draft')}>
                {busy ? <LoaderCircle size={15} className="animate-spin" /> : <XCircle size={15} />}
                Unpublish
              </button>
            ) : (
              <button type="button" disabled={busy} className={`${btnPrimary} disabled:opacity-50`} onClick={() => change('published')}>
                {busy ? <LoaderCircle size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                {job.status === 'closed' ? 'Reopen & publish' : 'Publish job'}
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Published share panel */}
      {live && (
        <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 sm:p-6">
            <div className="rounded-xl bg-white p-3 text-emerald-700 shadow-sm">
              <Send size={21} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-emerald-700">
                {publishedFromRedirect ? 'Successfully published' : 'Promote your listing'}
              </p>
              <h2 className="mt-1 text-lg font-black text-emerald-950">
                {publishedFromRedirect ? 'Your job is ready to share!' : 'Share this job'}
              </h2>
              <p className="mt-1 text-sm leading-6 text-emerald-900/70">
                Share the public listing so candidates can review the opportunity and application details.
              </p>
            </div>
          </div>
          <div className="p-5 sm:p-6">
            <SharePanel job={job} showMessage count={false} />
          </div>
        </section>
      )}

      {/* Public-facing job view */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-black text-slate-950">Candidate preview</h2>
            <p className="mt-1 text-xs text-slate-500">Review the information displayed on the job listing.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
            <Globe size={13} /> Listing content
          </span>
        </div>

        <div className="p-4 sm:p-6">
          <JobView job={job} preview />
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2"><ShieldCheck size={15} /> Preview and verify job details before sharing.</span>
        <Link to={`${P}/jobs/${id}/edit`} className="inline-flex items-center gap-1.5 font-bold text-indigo-700 hover:text-indigo-900">
          Edit listing <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
