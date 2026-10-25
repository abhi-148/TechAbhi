import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  ShieldCheck,
  UserRound,
  Send,
  LoaderCircle,
  CircleAlert,
  ArrowRight,
  X,
  Eye,
  LockKeyhole,
  RefreshCw,
} from 'lucide-react';

import { api, isCandidate } from '../lib/api';
import { btnPrimary, btnGhost, inputCls, fmtDate } from '../lib/format';

const LABEL = {
  new: 'Received',
  in_review: 'In review',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  rejected: 'Not selected',
  hired: 'Hired',
  withdrawn: 'Withdrawn',
};

const STATUS_STYLES = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  in_review: 'bg-amber-50 text-amber-700 border-amber-200',
  shortlisted: 'bg-violet-50 text-violet-700 border-violet-200',
  interview: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  hired: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  withdrawn: 'bg-slate-100 text-slate-600 border-slate-200',
};

function StatusBadge({ status }) {
  const normalized = status || 'new';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold ${
        STATUS_STYLES[normalized] ||
        'border-slate-200 bg-slate-50 text-slate-700'
      }`}
    >
      <Clock3 size={15} />
      {LABEL[normalized] || normalized.replaceAll('_', ' ')}
    </span>
  );
}

function Alert({ type = 'error', children }) {
  const styles = {
    error: 'border-rose-200 bg-rose-50 text-rose-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  };

  const Icon = type === 'success' ? CheckCircle2 : CircleAlert;

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm leading-6 ${styles[type]}`}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1 whitespace-pre-line break-words">
        {children}
      </div>
    </div>
  );
}

export default function SubmitApplication({ job }) {
  const logged = isCandidate();

  const [sub, setSub] = useState(undefined);
  const [checking, setChecking] = useState(false);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [share, setShare] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;

    setErr('');
    setSuccess('');
    setOpen(false);
    setNote('');
    setShare(false);
    setConsent(false);

    if (!logged) {
      setSub(undefined);
      setChecking(false);

      return () => {
        active = false;
      };
    }

    setSub(undefined);
    setChecking(true);

    api('/candidate/submissions/' + job.id, {
      candidate: true,
    })
      .then((data) => {
        if (active) {
          setSub(data.submission ?? null);
        }
      })
      .catch((error) => {
        if (active) {
          setErr(
            error.message ||
              'Unable to check your application status. Please try again.'
          );
        }
      })
      .finally(() => {
        if (active) {
          setChecking(false);
        }
      });

    return () => {
      active = false;
    };
  }, [job.id, logged]);

  const refreshStatus = async () => {
    setChecking(true);
    setErr('');

    try {
      const data = await api('/candidate/submissions/' + job.id, {
        candidate: true,
      });

      setSub(data.submission ?? null);
    } catch (error) {
      setErr(
        error.message ||
          'Unable to refresh application status. Please try again.'
      );
    } finally {
      setChecking(false);
    }
  };

  const submit = async () => {
    if (busy || !consent || !logged || !job?.id) return;

    setBusy(true);
    setErr('');
    setSuccess('');

    try {
      await api('/candidate/applications/submit', {
        method: 'POST',
        candidate: true,
        body: {
          job_id: job.id,
          cover_note: note.trim(),
          share_resume: share,
          consent: true,
        },
      });

      setSub({
        status: 'new',
        submitted_at: new Date().toISOString(),
      });

      setOpen(false);
      setNote('');
      setShare(false);
      setConsent(false);
      setSuccess('Your application has been submitted successfully.');
    } catch (error) {
      setErr(
        error.message ||
          'Unable to submit your application. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  const next = encodeURIComponent('/jobs/' + job.id);
  const statusLabel = sub ? LABEL[sub.status] || sub.status : '';

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-5 text-white sm:p-6">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-16 right-1/3 h-32 w-32 rounded-full bg-violet-500/20 blur-2xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
            <BriefcaseBusiness size={23} />
          </div>

          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-indigo-200">
              Candidate applications
            </span>

            <h2 className="mt-1 text-lg font-black tracking-tight sm:text-xl">
              Apply through TechAbhi
            </h2>

            <p className="mt-1 text-xs leading-5 text-indigo-100/75">
              Apply directly using your candidate profile.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {success && <Alert type="success">{success}</Alert>}

        {/* Guest state */}
        {!logged && (
          <>
            <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                <UserRound size={20} />
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Your next career step starts here
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Create a free candidate account or log in to apply for this
                  opportunity. You can review information-sharing consent
                  before submitting.
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Link
                className={`${btnPrimary} inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3`}
                to={`/candidate/login?next=${next}`}
              >
                <UserRound size={16} />
                Log in to apply
                <ArrowRight size={15} />
              </Link>

              <Link
                className={`${btnGhost} inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3`}
                to={`/candidate/register?next=${next}`}
              >
                Create free account
              </Link>
            </div>

            <p className="flex items-start gap-2 text-xs leading-5 text-slate-400">
              <ShieldCheck size={15} className="mt-0.5 shrink-0" />
              Your information is shared through the application process
              after you provide consent.
            </p>
          </>
        )}

        {/* Checking application status */}
        {logged && (sub === undefined || checking) && (
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
            <LoaderCircle
              size={19}
              className="animate-spin text-indigo-600"
            />

            <div>
              <p className="text-sm font-bold text-slate-800">
                Checking your application
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Please wait while we check your submission status.
              </p>
            </div>
          </div>
        )}

        {/* Application status could not be checked */}
        {logged && sub === undefined && !checking && (
          <div className="space-y-3">
            {err && <Alert type="error">{err}</Alert>}

            <button
              type="button"
              onClick={refreshStatus}
              disabled={checking}
              className={`${btnGhost} inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3`}
            >
              <RefreshCw size={16} />
              Retry status check
            </button>
          </div>
        )}

        {/* Already applied */}
        {logged && sub && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                <CheckCircle2 size={23} />
              </span>

              <div className="min-w-0 flex-1">
                <h3 className="font-black text-emerald-900">
                  Application submitted
                </h3>

                <p className="mt-1 text-sm leading-6 text-emerald-800">
                  Submitted on {fmtDate(sub.submitted_at)}.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Employer's application status
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <StatusBadge status={sub.status} />

                <Link
                  to="/candidate/applications"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800"
                >
                  Manage applications
                  <ArrowRight size={15} />
                </Link>
              </div>

              {sub.viewed_at && (
                <p className="mt-3 flex items-center gap-2 text-xs text-emerald-700">
                  <Eye size={14} />
                  The employer has opened your application.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={refreshStatus}
              disabled={checking}
              className={`${btnGhost} inline-flex items-center justify-center gap-2 rounded-xl`}
            >
              <RefreshCw
                size={15}
                className={checking ? 'animate-spin' : ''}
              />
              Refresh status
            </button>
          </div>
        )}

        {/* Application form entry */}
        {logged && sub === null && !open && (
          <>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <FileText size={20} />
              </div>

              <div>
                <h3 className="font-extrabold text-slate-900">
                  Ready to submit your application?
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Add an optional note, choose whether to share your resume,
                  and confirm consent. Your profile will be used for this
                  application.
                </p>
              </div>
            </div>

            <button
              type="button"
              className={`${btnPrimary} flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5`}
              onClick={() => {
                setErr('');
                setOpen(true);
              }}
            >
              <Send size={17} />
              Apply with my profile
              <ArrowRight size={16} />
            </button>

            <p className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={14} />
              Review the consent details before submitting.
            </p>
          </>
        )}

        {/* Application form */}
        {logged && sub === null && open && (
          <div className="space-y-5">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
              <p className="text-sm font-extrabold text-indigo-950">
                Applying for {job.title || 'this position'}
              </p>

              <p className="mt-1 text-xs leading-5 text-indigo-800">
                {job.company || 'Company not specified'}
                {job.location ? ` · ${job.location}` : ''}
              </p>
            </div>

            {/* Cover note */}
            <div>
              <label
                htmlFor="application-cover-note"
                className="mb-2 block text-sm font-extrabold text-slate-800"
              >
                Note to the employer
                <span className="ml-2 text-xs font-medium text-slate-400">
                  Optional
                </span>
              </label>

              <textarea
                id="application-cover-note"
                className={`${inputCls} min-h-28 w-full resize-y rounded-xl p-3.5 leading-6`}
                rows={4}
                maxLength={2000}
                placeholder="Briefly introduce yourself or explain why you're interested in this role..."
                value={note}
                onChange={(event) => setNote(event.target.value)}
                disabled={busy}
              />

              <p className="mt-1.5 text-right text-xs text-slate-400">
                {note.length}/2000 characters
              </p>
            </div>

            {/* Resume sharing */}
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                share
                  ? 'border-indigo-200 bg-indigo-50/60'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                checked={share}
                onChange={(event) => setShare(event.target.checked)}
                disabled={busy}
                className="mt-1 h-4 w-4 shrink-0 accent-indigo-600"
              />

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-900">
                  <FileText size={16} className="text-indigo-600" />
                  Also share my resume
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                    Optional
                  </span>
                </span>

                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  Select this only if you want to include your resume in this
                  application.
                </span>
              </span>
            </label>

            {/* Required consent */}
            <div
              className={`rounded-xl border p-4 transition ${
                consent
                  ? 'border-emerald-200 bg-emerald-50/60'
                  : 'border-amber-200 bg-amber-50/70'
              }`}
            >
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  disabled={busy}
                  className="mt-1 h-4 w-4 shrink-0 accent-emerald-600"
                />

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                    <LockKeyhole size={16} />
                    Required: information-sharing consent
                  </span>

                  <span className="mt-2 block text-sm leading-6 text-slate-700">
                    I agree to share my name, email, and TechAbhi profile
                    {share ? ', plus my resume,' : ''} with{' '}
                    <strong>{job.company || 'the employer'}</strong> for this
                    job application. I understand that handling or deletion
                    of information already received by the employer may be
                    subject to the employer's own privacy practices.
                  </span>
                </span>
              </label>

              {!consent && (
                <p className="mt-3 text-xs font-semibold text-amber-800">
                  Please confirm your consent before submitting.
                </p>
              )}
            </div>

            {err && <Alert type="error">{err}</Alert>}

            {/* Form actions */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className={`${btnPrimary} inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3.5 disabled:cursor-not-allowed disabled:opacity-50`}
                disabled={!consent || busy}
                onClick={submit}
              >
                {busy ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Submit application
                  </>
                )}
              </button>

              <button
                type="button"
                className={`${btnGhost} inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3.5`}
                disabled={busy}
                onClick={() => {
                  setOpen(false);
                  setErr('');
                }}
              >
                <X size={16} />
                Cancel
              </button>
            </div>

            <p className="flex items-start gap-2 text-xs leading-5 text-slate-400">
              <ShieldCheck size={14} className="mt-0.5 shrink-0" />
              TechAbhi cannot guarantee a reply, interview, or job offer.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}