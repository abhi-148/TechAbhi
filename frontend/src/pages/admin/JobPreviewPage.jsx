
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  MapPin,
  CalendarDays,
  Building2,
  ClipboardCheck,
} from 'lucide-react';

import { api } from '../../lib/api';
import { btnGhost, btnPrimary } from '../../lib/format';
import JobView from '../../components/JobView';
import SharePanel from '../../components/SharePanel';

function StatusBadge({ status }) {
  const styles = {
    published: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    draft: 'bg-slate-100 text-slate-700 ring-slate-200',
    closed: 'bg-amber-50 text-amber-800 ring-amber-200',
    expired: 'bg-rose-50 text-rose-800 ring-rose-200',
  };

  const dotStyles = {
    published: 'bg-emerald-500',
    draft: 'bg-slate-400',
    closed: 'bg-amber-500',
    expired: 'bg-rose-500',
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold capitalize ring-1 ring-inset ${
        styles[status] || styles.draft
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          dotStyles[status] || 'bg-slate-400'
        }`}
      />
      {status || 'Unknown'}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
        <LoaderCircle size={28} className="animate-spin text-indigo-600" />
      </div>
      <h2 className="mt-5 text-lg font-black text-slate-900">
        Loading job preview
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Fetching the latest job information...
      </p>
    </div>
  );
}

function ErrorState({ message, onRetry, backTo }) {
  return (
    <div className="space-y-5">
      <Link
        to={backTo}
        className="inline-flex items-center gap-2 text-sm font-bold text-indigo-700 transition hover:text-indigo-900"
      >
        <ArrowLeft size={16} />
        Back to jobs
      </Link>

      <div
        role="alert"
        className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-rose-50 p-3 text-rose-600">
            <CircleAlert size={24} />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="font-black text-slate-900">
              Unable to load job preview
            </h2>
            <p className="mt-2 break-words text-sm leading-6 text-slate-600">
              {message}
            </p>

            <button
              type="button"
              onClick={onRetry}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Alert({ type = 'info', children }) {
  const styles = {
    info: 'border-indigo-200 bg-indigo-50 text-indigo-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    error: 'border-rose-200 bg-rose-50 text-rose-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
  };

  const Icon =
    type === 'success'
      ? CheckCircle2
      : type === 'error'
        ? CircleAlert
        : type === 'warning'
          ? CircleAlert
          : Sparkles;

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-2xl border p-4 text-sm leading-6 ${styles[type]}`}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1 whitespace-pre-line">{children}</div>
    </div>
  );
}

function ReviewItem({ label, value, complete }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3">
      {complete ? (
        <CheckCircle2
          size={18}
          className="mt-0.5 shrink-0 text-emerald-600"
        />
      ) : (
        <CircleAlert
          size={18}
          className="mt-0.5 shrink-0 text-amber-600"
        />
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-800">{label}</p>
        <p className="mt-1 break-words text-xs leading-5 text-slate-500">
          {complete ? value : 'Missing — review before publishing'}
        </p>
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
  const [showReview, setShowReview] = useState(false);

  const load = useCallback(async () => {
    setErr('');
    setLoading(true);

    try {
      const data = await api(`${P}/jobs/${id}`, { ...A });

      if (!data?.job) {
        throw new Error('The server did not return a job record.');
      }

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

  const live = job?.status === 'published';
  const publishedFromRedirect = sp.get('published') === '1';

  // Check the information that candidates need before applying.
  // Missing values are flagged for review rather than fabricated.
  const reviewItems = useMemo(() => {
    if (!job) return [];

    const hasApplicationMethod = Boolean(
      job.application_url?.trim() ||
      job.application_email?.trim() ||
      job.application_instructions?.trim()
    );

    return [
      {
        label: 'Job title',
        value: job.title,
        complete: Boolean(job.title?.trim()),
      },
      {
        label: 'Company',
        value: job.company,
        complete: Boolean(job.company?.trim()),
      },
      {
        label: 'Location',
        value: job.location,
        complete: Boolean(job.location?.trim()),
      },
      {
        label: 'Job description',
        value: job.description,
        complete: Boolean(job.description?.trim()),
      },
      {
        label: 'Application method',
        value:
          job.application_url ||
          job.application_email ||
          job.application_instructions,
        complete: hasApplicationMethod,
      },
    ];
  }, [job]);

  const missingItems = reviewItems.filter((item) => !item.complete);
  const readyToPublish = missingItems.length === 0;

  const change = async (status) => {
    if (busy || !job) return;

    if (status === 'draft') {
      const confirmed = window.confirm(
        'Unpublish this job? Candidates will no longer see it as a live listing.'
      );

      if (!confirmed) return;
    }

    if (status === 'published' && !readyToPublish) {
      setShowReview(true);
      setErr(
        'Please review the missing job details before publishing. No information has been invented or filled in automatically.'
      );

      document
        .getElementById('job-publish-review')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });

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

      // Refresh from the server so the displayed status remains authoritative.
      await load();

      setNotice(
        status === 'published'
          ? 'Job published successfully.'
          : status === 'draft'
            ? 'Job unpublished and moved to draft.'
            : 'Job status updated.'
      );

      setShowReview(false);
    } catch (error) {
      setErr(
        [error.message, ...(error.details || [])]
          .filter(Boolean)
          .join('\n') || 'Unable to update the job status.'
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading && !job) return <LoadingState />;

  if (err && !job) {
    return (
      <ErrorState
        message={err}
        onRetry={load}
        backTo={`${P}/jobs`}
      />
    );
  }

  if (!job) return null;

  const publicJobUrl = `/jobs/${id}`;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      {/* Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`${P}/jobs`}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-indigo-700"
        >
          <ArrowLeft size={16} />
          Back to jobs
        </Link>

        <button
          type="button"
          onClick={load}
          disabled={loading || busy}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      {/* Header */}
      <header className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-6 text-white shadow-xl shadow-indigo-950/10 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-indigo-100">
              <Eye size={14} />
              JOB PREVIEW
            </div>

            <h1 className="mt-4 break-words text-2xl font-black tracking-tight sm:text-3xl">
              {job.title || 'Untitled job'}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-indigo-100/80">
              {job.company && (
                <span className="inline-flex items-center gap-2">
                  <Building2 size={15} />
                  {job.company}
                </span>
              )}

              {job.location && (
                <span className="inline-flex items-center gap-2">
                  <MapPin size={15} />
                  {job.location}
                </span>
              )}

              {job.expires_at && (
                <span className="inline-flex items-center gap-2">
                  <CalendarDays size={15} />
                  Deadline: {job.expires_at}
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={job.status} />

              {job.work_mode && (
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
                  {job.work_mode}
                </span>
              )}

              {job.employment_type && (
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
                  {job.employment_type}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              to={`${P}/jobs/${id}/edit`}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15"
            >
              <FileEdit size={16} />
              Edit job
            </Link>

            {live && (
              <a
                href={publicJobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-950 transition hover:bg-indigo-50"
              >
                <ExternalLink size={16} />
                Open public page
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Alerts */}
      {err && (
        <Alert type="error">
          {err}
        </Alert>
      )}

      {notice && (
        <Alert type="success">
          {notice}
        </Alert>
      )}

      {loading && job && (
        <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-800">
          <LoaderCircle size={16} className="animate-spin" />
          Refreshing job details...
        </div>
      )}

      {/* Publish status */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`rounded-2xl p-3 ${
                live
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {live ? (
                <CheckCircle2 size={24} />
              ) : (
                <Sparkles size={24} />
              )}
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-950">
                {live ? 'This job is live' : 'Ready to publish?'}
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                {live
                  ? 'Candidates can access the public listing. Check the details and share the opportunity with relevant candidates.'
                  : 'Review the job details and application method before publishing. AI-generated details should be verified against the original job source.'}
              </p>

              {!live && (
                <button
                  type="button"
                  onClick={() => setShowReview((value) => !value)}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-indigo-700 hover:text-indigo-900"
                >
                  <ClipboardCheck size={16} />
                  {showReview ? 'Hide review checklist' : 'Review publishing checklist'}
                  <ArrowRight
                    size={14}
                    className={showReview ? 'rotate-90 transition' : 'transition'}
                  />
                </button>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {live ? (
              <button
                type="button"
                disabled={busy}
                className={`${btnGhost} disabled:cursor-not-allowed disabled:opacity-50`}
                onClick={() => change('draft')}
              >
                {busy ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <XCircle size={15} />
                )}
                Unpublish
              </button>
            ) : (
              <button
                type="button"
                disabled={busy || loading}
                className={`${btnPrimary} disabled:cursor-not-allowed disabled:opacity-50`}
                onClick={() => change('published')}
              >
                {busy ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={15} />
                )}
                {job.status === 'closed' ? 'Reopen & publish' : 'Publish job'}
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>

        {!live && showReview && (
          <div
            id="job-publish-review"
            className="mt-6 border-t border-slate-100 pt-5"
          >
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-black text-slate-900">
                  Publishing checklist
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Verify the essentials before candidates see this listing.
                </p>
              </div>

              <span
                className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-bold ${
                  readyToPublish
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-800'
                }`}
              >
                {readyToPublish
                  ? 'Essentials complete'
                  : `${missingItems.length} item${missingItems.length === 1 ? '' : 's'} to review`}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {reviewItems.map((item) => (
                <ReviewItem
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  complete={item.complete}
                />
              ))}
            </div>

            {missingItems.length > 0 && (
              <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-amber-900">
                  Complete the missing information. Don't guess salary,
                  eligibility, deadlines, or application details.
                </p>

                <Link
                  to={`${P}/jobs/${id}/edit`}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-700"
                >
                  <FileEdit size={15} />
                  Complete details
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Share published listing */}
      {live && (
        <section className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-sm">
          <div className="flex items-start gap-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 sm:p-6">
            <div className="rounded-2xl bg-white p-3 text-emerald-700 shadow-sm">
              <Send size={22} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-widest text-emerald-700">
                {publishedFromRedirect
                  ? 'Successfully published'
                  : 'Promote your listing'}
              </p>

              <h2 className="mt-1 text-lg font-black text-emerald-950">
                {publishedFromRedirect
                  ? 'Your job is ready to share!'
                  : 'Share this job'}
              </h2>

              <p className="mt-1 text-sm leading-6 text-emerald-900/70">
                Share the public listing so candidates can review the
                opportunity and application details.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <SharePanel job={job} showMessage count={false} />
          </div>
        </section>
      )}

      {/* Candidate preview */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-black text-slate-950">
              Candidate preview
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Review how the job information is presented to candidates.
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
            <Globe size={13} />
            Listing content
          </span>
        </div>

        <div className="p-4 sm:p-6">
          <JobView job={job} preview />
        </div>
      </section>

      {/* Footer actions */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-start gap-3">
          <ShieldCheck
            size={19}
            className="mt-0.5 shrink-0 text-indigo-600"
          />
          <div>
            <p className="text-sm font-bold text-slate-800">
              Verify before sharing
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Confirm the job source, eligibility, salary details and
              application link. AI extraction does not guarantee accuracy.
            </p>
          </div>
        </div>

        <Link
          to={`${P}/jobs/${id}/edit`}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 transition hover:border-indigo-200 hover:bg-indigo-50"
        >
          <FileEdit size={15} />
          Edit listing
          <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
