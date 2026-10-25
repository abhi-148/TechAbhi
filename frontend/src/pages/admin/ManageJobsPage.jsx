import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Copy,
  ExternalLink,
  Eye,
  FileEdit,
  Filter,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  XCircle,
  Sparkles,
  MapPin,
  CalendarDays,
} from 'lucide-react';

import { api } from '../../lib/api';
import {
  btnGhost,
  inputCls,
  publicUrl,
  shareMessage,
  fmtDate,
} from '../../lib/format';

const TABS = ['all', 'published', 'draft', 'closed', 'expired'];

const STATUS_STYLES = {
  published: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  draft: 'bg-slate-100 text-slate-700 ring-slate-200',
  closed: 'bg-amber-50 text-amber-700 ring-amber-200',
  expired: 'bg-rose-50 text-rose-700 ring-rose-200',
};

function StatusBadge({ status }) {
  const normalized = status || 'unknown';

  const Icon =
    normalized === 'published'
      ? CheckCircle2
      : normalized === 'closed' || normalized === 'expired'
        ? Clock3
        : CircleAlert;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold capitalize ring-1 ring-inset ${
        STATUS_STYLES[normalized] ||
        'bg-slate-100 text-slate-600 ring-slate-200'
      }`}
    >
      <Icon size={12} />
      {normalized}
    </span>
  );
}

function Metric({ label, value, icon: Icon, tone = 'indigo' }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>

        <span className={`rounded-xl p-2.5 ${tones[tone] || tones.indigo}`}>
          <Icon size={19} />
        </span>
      </div>

      <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}

function Alert({ type = 'error', children, onClose }) {
  const styles = {
    error: 'border-rose-200 bg-rose-50 text-rose-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  };

  const Icon = type === 'success' ? CheckCircle2 : CircleAlert;

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${styles[type]}`}
    >
      <Icon size={19} className="mt-0.5 shrink-0" />

      <div className="min-w-0 flex-1 whitespace-pre-line break-words">
        {children}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notification"
          className="shrink-0 rounded-lg p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100"
        >
          <XCircle size={16} />
        </button>
      )}
    </div>
  );
}

function EmptyState({ query, tab, onClear }) {
  return (
    <div className="px-5 py-14 text-center sm:px-8">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <BriefcaseBusiness size={28} />
      </div>

      <h3 className="mt-4 text-lg font-black text-slate-900">
        No jobs found
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {query.trim()
          ? 'Try another search term or clear your search.'
          : tab !== 'all'
            ? `There are no ${tab} jobs in this view yet.`
            : 'Create your first job listing to get started.'}
      </p>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {(query || tab !== 'all') && (
          <button
            type="button"
            onClick={onClear}
            className={btnGhost}
          >
            Clear filters
          </button>
        )}

        <Link
          to="/admin/jobs/new"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
        >
          <Plus size={16} />
          Create job
        </Link>
      </div>
    </div>
  );
}

export default function ManageJobsPage() {
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [jobs, setJobs] = useState(null);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');

    const params = new URLSearchParams();

    if (tab !== 'all') {
      params.set('status', tab);
    }

    if (q.trim()) {
      params.set('q', q.trim());
    }

    try {
      const data = await api(
        '/admin/jobs?' + params.toString(),
        { admin: true }
      );

      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
    } catch (error) {
      setErr(error.message || 'Unable to load jobs.');
    } finally {
      setLoading(false);
    }
  }, [tab, q]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 300);

    return () => clearTimeout(timer);
  }, [load]);

  const flash = (message) => {
    setNote(message);
  };

  const isExpired = (job) =>
    job.status === 'published' &&
    job.expires_at &&
    !Number.isNaN(new Date(job.expires_at).getTime()) &&
    new Date(job.expires_at) <= new Date();

  const getDisplayStatus = (job) =>
    isExpired(job) ? 'expired' : job.status;

  const validateJobForPublishing = (job) => {
    const missing = [];

    if (!job.title?.trim()) missing.push('Job title');
    if (!job.company?.trim()) missing.push('Company');
    if (!job.location?.trim()) missing.push('Location');
    if (!job.description?.trim()) missing.push('Job description');

    const hasApplicationMethod = Boolean(
      job.application_url?.trim() ||
        job.application_email?.trim() ||
        job.application_instructions?.trim()
    );

    if (!hasApplicationMethod) {
      missing.push('Application link, email, or instructions');
    }

    return missing;
  };

  const setStatus = async (job, status) => {
    if (busyId !== null) return;

    if (status === 'published') {
      const missing = validateJobForPublishing(job);

      if (missing.length > 0) {
        setErr(
          `Cannot publish "${job.title || 'Untitled job'}". Please complete these details first:\n• ${missing.join('\n• ')}`
        );
        return;
      }
    }

    const actionLabel = {
      published: 'published',
      draft: 'unpublished',
      closed: 'closed',
    }[status] || 'updated';

    if (
      status === 'closed' &&
      !window.confirm(`Close "${job.title}"?`)
    ) {
      return;
    }

    if (
      status === 'draft' &&
      !window.confirm(`Unpublish "${job.title}"?`)
    ) {
      return;
    }

    if (
      status === 'published' &&
      !window.confirm(`Publish "${job.title}"?`)
    ) {
      return;
    }

    setBusyId(job.id);
    setErr('');
    setNote('');

    try {
      await api(`/admin/jobs/${job.id}/status`, {
        method: 'POST',
        body: { status },
        admin: true,
      });

      flash(`Job ${actionLabel} successfully.`);
      await load();
    } catch (error) {
      setErr(
        [error.message, ...(error.details || [])]
          .filter(Boolean)
          .join('\n') || 'Unable to update job status.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const del = async (job) => {
    if (busyId !== null) return;

    const confirmed = window.confirm(
      `Delete "${job.title}" permanently? This action cannot be undone.`
    );

    if (!confirmed) return;

    setBusyId(job.id);
    setErr('');
    setNote('');

    try {
      await api(`/admin/jobs/${job.id}`, {
        method: 'DELETE',
        admin: true,
      });

      flash('Job deleted successfully.');
      await load();
    } catch (error) {
      setErr(error.message || 'Unable to delete this job.');
    } finally {
      setBusyId(null);
    }
  };

  const copy = async (value, message) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        flash(message);
      } else {
        window.prompt('Copy this text:', value);
      }
    } catch {
      window.prompt('Copy this text:', value);
    }
  };

  const allJobs = jobs || [];

  const counts = {
    all: allJobs.length,
    published: allJobs.filter(
      (job) => job.status === 'published' && !isExpired(job)
    ).length,
    draft: allJobs.filter((job) => job.status === 'draft').length,
    closed: allJobs.filter((job) => job.status === 'closed').length,
    expired: allJobs.filter(isExpired).length,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      {/* Header */}
      <header className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-6 text-white shadow-xl shadow-indigo-950/10 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute bottom-0 right-1/3 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-indigo-100">
              <ShieldCheck size={14} />
              ADMIN WORKSPACE
            </span>

            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Manage jobs<span className="text-violet-300">.</span>
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100/80 sm:text-base">
              Manage listings, review AI-assisted job details, and keep
              opportunities up to date.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-indigo-100/80">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
                <Sparkles size={13} />
                AI-assisted workflow
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
                <ShieldCheck size={13} />
                Admin controls
              </span>
            </div>
          </div>

          <Link
            to="/admin/jobs/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-indigo-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50"
          >
            <Plus size={18} />
            Create new job
          </Link>
        </div>
      </header>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          label="Total results"
          value={loading && !jobs ? '—' : counts.all}
          icon={BriefcaseBusiness}
          tone="indigo"
        />

        <Metric
          label="Published"
          value={loading && !jobs ? '—' : counts.published}
          icon={CheckCircle2}
          tone="emerald"
        />

        <Metric
          label="Drafts"
          value={loading && !jobs ? '—' : counts.draft}
          icon={FileEdit}
          tone="slate"
        />

        <Metric
          label="Closed / expired"
          value={
            loading && !jobs
              ? '—'
              : counts.closed + counts.expired
          }
          icon={Clock3}
          tone="amber"
        />
      </div>

      {/* Search and filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              className={`${inputCls} w-full pl-10`}
              placeholder="Search by job title or company..."
              value={q}
              onChange={(event) => setQ(event.target.value)}
              aria-label="Search jobs"
            />

            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <XCircle size={16} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className={`${btnGhost} inline-flex items-center justify-center gap-2 disabled:opacity-50`}
          >
            <RefreshCw
              size={15}
              className={loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <Filter size={16} className="shrink-0 text-slate-400" />

          <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
            {TABS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                aria-pressed={tab === item}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold capitalize transition ${
                  tab === item
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700'
                }`}
              >
                {item}

                <span
                  className={`rounded-md px-1.5 py-0.5 text-xs ${
                    tab === item
                      ? 'bg-white/15 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {counts[item]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Notifications */}
      {note && (
        <Alert type="success" onClose={() => setNote('')}>
          {note}
        </Alert>
      )}

      {err && (
        <Alert type="error" onClose={() => setErr('')}>
          {err}

          <button
            type="button"
            onClick={load}
            className="mt-2 block font-bold underline underline-offset-2"
          >
            Try again
          </button>
        </Alert>
      )}

      {/* Job list */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-black text-slate-950">Job listings</h2>
            <p className="mt-1 text-xs text-slate-500">
              {loading
                ? 'Updating results...'
                : `${allJobs.length} result${allJobs.length === 1 ? '' : 's'} in this view`}
            </p>
          </div>

          {loading && (
            <LoaderCircle
              size={19}
              className="animate-spin text-indigo-600"
            />
          )}
        </div>

        {loading && !jobs ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-xl border border-slate-100 p-5"
              >
                <div className="h-4 w-2/5 rounded bg-slate-200" />
                <div className="mt-3 h-3 w-1/4 rounded bg-slate-100" />
                <div className="mt-5 h-8 w-1/2 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : allJobs.length === 0 ? (
          <EmptyState
            query={q}
            tab={tab}
            onClear={() => {
              setQ('');
              setTab('all');
            }}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {allJobs.map((job) => {
              const displayStatus = getDisplayStatus(job);
              const busy = busyId === job.id;
              const missingDetails = validateJobForPublishing(job);

              return (
                <article
                  key={job.id}
                  className="p-5 transition hover:bg-slate-50/70 sm:p-6"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-words text-base font-black text-slate-950 sm:text-lg">
                          {job.title || 'Untitled job'}
                        </h3>

                        <StatusBadge status={displayStatus} />

                        {job.recruiter_id && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700 ring-1 ring-inset ring-violet-200">
                            <BriefcaseBusiness size={12} />
                            Recruiter job
                          </span>
                        )}
                      </div>

                      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                        <BriefcaseBusiness
                          size={15}
                          className="shrink-0"
                        />

                        <span className="font-semibold text-slate-700">
                          {job.company || 'Company not specified'}
                        </span>

                        <span className="text-slate-300">·</span>

                        <span>Updated {fmtDate(job.updated_at)}</span>
                      </p>

                      {job.location && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                          <MapPin size={13} />
                          {job.location}
                        </p>
                      )}

                      {job.expires_at && (
                        <p
                          className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${
                            isExpired(job)
                              ? 'text-rose-600'
                              : 'text-slate-400'
                          }`}
                        >
                          <CalendarDays size={13} />
                          {isExpired(job) ? 'Expired on ' : 'Expiry date: '}
                          {fmtDate(job.expires_at)}
                        </p>
                      )}

                      {job.status !== 'published' &&
                        missingDetails.length > 0 && (
                          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                            <CircleAlert
                              size={15}
                              className="mt-0.5 shrink-0"
                            />
                            <span>
                              Complete {missingDetails.length} item
                              {missingDetails.length === 1 ? '' : 's'} before
                              publishing: {missingDetails.join(', ')}.
                            </span>
                          </div>
                        )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          className={`${btnGhost} inline-flex items-center gap-1.5`}
                          to={`/admin/jobs/${job.id}/edit`}
                        >
                          <FileEdit size={14} />
                          Edit
                        </Link>

                        <Link
                          className={`${btnGhost} inline-flex items-center gap-1.5`}
                          to={`/admin/jobs/${job.id}/preview`}
                        >
                          <Eye size={14} />
                          Preview
                        </Link>

                        {job.status !== 'published' && (
                          <button
                            type="button"
                            disabled={busy}
                            className={`${btnGhost} inline-flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-50`}
                            onClick={() => setStatus(job, 'published')}
                          >
                            {busy ? (
                              <LoaderCircle
                                size={14}
                                className="animate-spin"
                              />
                            ) : (
                              <CheckCircle2 size={14} />
                            )}

                            {job.status === 'closed'
                              ? 'Reopen & publish'
                              : 'Publish'}
                          </button>
                        )}

                        {job.status === 'published' && (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              className={`${btnGhost} inline-flex items-center gap-1.5 disabled:opacity-50`}
                              onClick={() => setStatus(job, 'draft')}
                            >
                              <XCircle size={14} />
                              Unpublish
                            </button>

                            <button
                              type="button"
                              disabled={busy}
                              className={`${btnGhost} inline-flex items-center gap-1.5 disabled:opacity-50`}
                              onClick={() => setStatus(job, 'closed')}
                            >
                              <Clock3 size={14} />
                              Close
                            </button>

                            <a
                              className={`${btnGhost} inline-flex items-center gap-1.5`}
                              href={`/jobs/${job.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink size={14} />
                              Open page
                            </a>

                            <button
                              type="button"
                              className={`${btnGhost} inline-flex items-center gap-1.5`}
                              onClick={() =>
                                copy(
                                  publicUrl(job),
                                  'Public job URL copied.'
                                )
                              }
                            >
                              <Copy size={14} />
                              Copy URL
                            </button>

                            <button
                              type="button"
                              className={`${btnGhost} inline-flex items-center gap-1.5`}
                              onClick={() =>
                                copy(
                                  shareMessage(job, publicUrl(job)),
                                  'Share message copied.'
                                )
                              }
                            >
                              <Send size={14} />
                              Copy message
                            </button>
                          </>
                        )}

                        {job.status !== 'published' && (
                          <button
                            type="button"
                            disabled={busy}
                            className={`${btnGhost} inline-flex items-center gap-1.5 text-rose-600 hover:border-rose-200 hover:bg-rose-50 disabled:opacity-50`}
                            onClick={() => del(job)}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 text-xs text-slate-400 xl:pt-1">
                      <span className="font-mono">ID #{job.id}</span>

                      {busy && (
                        <LoaderCircle
                          size={15}
                          className="animate-spin text-indigo-600"
                        />
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <p className="flex items-center justify-center gap-2 text-center text-xs text-slate-400">
        <ShieldCheck size={14} />
        Manage listings securely from your TechAbhi admin workspace.
      </p>
    </div>
  );
}