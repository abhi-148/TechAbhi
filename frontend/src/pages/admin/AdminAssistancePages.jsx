
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  FileText,
  LoaderCircle,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldCheck,
  UserRound,
  Users,
  X,
  XCircle,
} from 'lucide-react';

import { api, TOKEN_KEY } from '../../lib/api';
import { btnGhost, btnPrimary, inputCls, fmtDate } from '../../lib/format';

const TABS = [
  'submitted',
  'in_review',
  'in_progress',
  'on_hold',
  'closed',
  'all',
];

const NEXT_ACTIONS = {
  candidate_approved: [['shared', 'Mark as shared']],
  shared: [
    ['response_received', 'Company responded'],
    ['no_response', 'No response'],
  ],
  response_received: [
    ['interview_scheduled', 'Record interview'],
    ['no_response', 'No response'],
  ],
  interview_scheduled: [],
  no_response: [],
};

const STATUS_STYLE = {
  submitted: 'bg-sky-50 text-sky-700 ring-sky-200',
  in_review: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  in_progress: 'bg-violet-50 text-violet-700 ring-violet-200',
  on_hold: 'bg-amber-50 text-amber-700 ring-amber-200',
  closed: 'bg-slate-100 text-slate-600 ring-slate-200',
  proposed: 'bg-amber-50 text-amber-700 ring-amber-200',
  candidate_approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  candidate_declined: 'bg-rose-50 text-rose-700 ring-rose-200',
  shared: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  response_received: 'bg-sky-50 text-sky-700 ring-sky-200',
  interview_scheduled: 'bg-violet-50 text-violet-700 ring-violet-200',
  no_response: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const cx = (...classes) => classes.filter(Boolean).join(' ');

function safeDate(value) {
  if (!value) return 'Not available';
  try {
    return fmtDate(value);
  } catch {
    return 'Not available';
  }
}

function StatusBadge({ status }) {
  const label = String(status || 'unknown').replace(/_/g, ' ');

  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold capitalize ring-1 ring-inset',
        STATUS_STYLE[status] ||
          'bg-slate-100 text-slate-700 ring-slate-200'
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function Hero({ eyebrow, title, description, icon: Icon }) {
  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-6 text-white shadow-xl shadow-indigo-950/10 sm:p-8">
      <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />

      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-indigo-100">
          <Icon size={15} />
          {eyebrow}
        </div>

        <h1 className="mt-4 break-words text-2xl font-black tracking-tight sm:text-3xl">
          {title}
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100/85">
          {description}
        </p>
      </div>
    </section>
  );
}

function Panel({ title, icon: Icon, children, action }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <h2 className="flex items-center gap-2.5 font-bold text-slate-900">
          {Icon && (
            <span className="rounded-lg bg-indigo-50 p-2 text-indigo-700">
              <Icon size={17} />
            </span>
          )}
          {title}
        </h2>

        {action}
      </div>

      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function ErrorBox({ message, onRetry, onClose }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
    >
      <div className="flex items-start gap-3">
        <XCircle size={19} className="mt-0.5 shrink-0" />

        <div className="min-w-0 flex-1">
          <p className="font-bold">Something went wrong</p>
          <p className="mt-1 break-words">{message}</p>

          <div className="mt-3 flex flex-wrap gap-3">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 font-bold hover:underline"
              >
                <RefreshCw size={14} />
                Try again
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="font-semibold hover:underline"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessBox({ message, onClose }) {
  if (!message) return null;

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
    >
      <CheckCircle2 size={19} className="mt-0.5 shrink-0" />

      <p className="min-w-0 flex-1 break-words">{message}</p>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss success message"
          className="font-bold"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}

function Loading({ label = 'Loading assistance data...' }) {
  return (
    <div
      role="status"
      className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center"
    >
      <LoaderCircle size={28} className="animate-spin text-indigo-600" />
      <p className="mt-3 text-sm font-semibold text-slate-700">{label}</p>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color = 'indigo' }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-700',
    violet: 'bg-violet-50 text-violet-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className={cx('rounded-xl p-2.5', tones[color] || tones.indigo)}>
          <Icon size={20} />
        </div>

        <div className="min-w-0">
          <p className="break-words text-xl font-black capitalize text-slate-900 sm:text-2xl">
            {value}
          </p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, description, icon: Icon = Users }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center">
      <Icon size={28} className="mx-auto text-slate-400" />
      <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   ADMIN: CAREER ASSISTANCE REQUEST LIST
========================================================= */

export function AdminAssistanceList() {
  const [tab, setTab] = useState('submitted');
  const [list, setList] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setErr('');
    setLoading(true);

    try {
      const query =
        tab === 'all' ? '' : `?status=${encodeURIComponent(tab)}`;

      const data = await api(`/admin/assistance${query}`, {
        admin: true,
      });

      if (!Array.isArray(data?.requests)) {
        throw new Error('Unexpected response from the assistance API.');
      }

      setList(data.requests);
    } catch (error) {
      setErr(error.message || 'Unable to load assistance requests.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = {
    submitted: list?.filter((r) => r.status === 'submitted').length ?? 0,
    in_progress:
      list?.filter((r) => r.status === 'in_progress').length ?? 0,
    closed: list?.filter((r) => r.status === 'closed').length ?? 0,
  };

  return (
    <div className="space-y-6">
      <Hero
        eyebrow="CANDIDATE SUPPORT"
        title="Career assistance"
        description="Review candidate requests, manage progress, and coordinate approved outreach with care."
        icon={Users}
      />

      {list && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Shown requests"
            value={list.length}
            icon={FileText}
          />
          <StatCard
            label="Submitted"
            value={counts.submitted}
            icon={Clock3}
            color="amber"
          />
          <StatCard
            label="In progress"
            value={counts.in_progress}
            icon={BriefcaseBusiness}
            color="violet"
          />
          <StatCard
            label="Closed"
            value={counts.closed}
            icon={CheckCircle2}
            color="emerald"
          />
        </div>
      )}

      <Panel
        title="Assistance requests"
        icon={FileText}
        action={
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className={cx(btnGhost, 'text-xs')}
          >
            <RefreshCw
              size={14}
              className={loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        }
      >
        <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
          {TABS.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setTab(item)}
              aria-pressed={tab === item}
              className={cx(
                'shrink-0 rounded-full px-4 py-2 text-xs font-bold capitalize transition',
                tab === item
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
              )}
            >
              {item.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <ErrorBox message={err} onRetry={load} />

        {loading && !list && <Loading />}

        {!loading && !err && list?.length === 0 && (
          <EmptyState
            title="No requests in this view"
            description="Choose another status or check again later."
          />
        )}

        {list?.length > 0 && (
          <div className="space-y-3">
            {list.map((request) => (
              <Link
                key={request.id}
                to={`/admin/assistance/${request.id}`}
                className="group block rounded-2xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/30 hover:shadow-sm sm:p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <UserRound size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words font-bold text-slate-900 group-hover:text-indigo-700">
                        {request.full_name || 'Candidate'}
                      </h3>
                      <StatusBadge status={request.status} />
                    </div>

                    <p className="mt-2 break-words text-sm leading-5 text-slate-600">
                      {request.target_roles || 'No target roles specified'}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={13} />
                        {safeDate(request.created_at)}
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <MessageSquare size={13} />
                        {request.outreach_count ?? 0} outreach
                      </span>
                    </div>
                  </div>

                  <span className="mt-1 shrink-0 rounded-lg bg-slate-100 p-2 text-slate-500 transition group-hover:bg-indigo-100 group-hover:text-indigo-700">
                    <ArrowLeft size={16} className="rotate-180" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

/* =========================================================
   ADMIN: CAREER ASSISTANCE REQUEST DETAIL
========================================================= */

export function AdminAssistanceDetail() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [message, setMessage] = useState('');
  const [note, setNote] = useState('');

  const [outreachForm, setOutreachForm] = useState({
    company_name: '',
    hr_contact: '',
    job_id: '',
    message: '',
    email: false,
    profile: false,
    resume: false,
  });

  const [packet, setPacket] = useState(null);

  const [interview, setInterview] = useState({
    id: null,
    at: '',
    info: '',
  });

  const load = useCallback(async () => {
    setErr('');
    setLoading(true);

    try {
      const response = await api(`/admin/assistance/${id}`, {
        admin: true,
      });

      if (!response?.request || !response?.candidate) {
        throw new Error('Unexpected response from the assistance API.');
      }

      setData(response);
      setNote(response.request.admin_note || '');
    } catch (error) {
      setErr(error.message || 'Unable to load this request.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (operation, successMessage = 'Changes saved successfully.') => {
    if (busy) return;

    setErr('');
    setSuccess('');
    setBusy(true);

    try {
      await operation();
      await load();
      setSuccess(successMessage);
    } catch (error) {
      const details = Array.isArray(error.details)
        ? error.details.join(' ')
        : '';

      setErr([error.message, details].filter(Boolean).join(' '));
    } finally {
      setBusy(false);
    }
  };

  const setRequestStatus = (status) => {
    let reason;

    if (status === 'closed') {
      reason = window.prompt(
        'Reason for closing (the candidate will see this):'
      );

      if (!reason?.trim()) return;
    }

    act(
      () =>
        api(`/admin/assistance/${id}/status`, {
          method: 'PUT',
          body: { status, reason },
          admin: true,
        }),
      `Request status updated to ${status.replace(/_/g, ' ')}.`
    );
  };

  const postUpdate = () => {
    if (!message.trim()) {
      setErr('Enter a candidate-facing update first.');
      return;
    }

    const submittedMessage = message.trim();

    act(
      async () => {
        await api(`/admin/assistance/${id}/updates`, {
          method: 'POST',
          body: { message: submittedMessage },
          admin: true,
        });

        setMessage('');
      },
      'Candidate-facing update posted.'
    );
  };

  const proposeOutreach = () => {
    if (!outreachForm.company_name.trim() || !outreachForm.message.trim()) {
      setErr('Company name and candidate-facing message are required.');
      return;
    }

    const form = { ...outreachForm };

    act(
      async () => {
        await api(`/admin/assistance/${id}/outreach`, {
          method: 'POST',
          body: {
            company_name: form.company_name.trim(),
            hr_contact: form.hr_contact.trim(),
            job_id: form.job_id.trim() || null,
            message: form.message.trim(),
            shared_fields: ['email', 'profile', 'resume'].filter(
              (key) => form[key]
            ),
          },
          admin: true,
        });

        setOutreachForm({
          company_name: '',
          hr_contact: '',
          job_id: '',
          message: '',
          email: false,
          profile: false,
          resume: false,
        });
      },
      'Company proposal sent to the candidate for approval.'
    );
  };

  const moveOutreach = (outreachId, status) => {
    if (status === 'closed') {
      const confirmed = window.confirm(
        'Close this company outreach record?'
      );

      if (!confirmed) return;
    }

    act(
      () =>
        api(`/admin/assistance/outreach/${outreachId}`, {
          method: 'PUT',
          body: { status },
          admin: true,
        }),
      `Outreach status updated to ${status.replace(/_/g, ' ')}.`
    );
  };

  const saveInterview = () => {
    if (!interview.id || !interview.at || !interview.info.trim()) {
      setErr('Enter the confirmed interview date/time and details.');
      return;
    }

    const selected = { ...interview };

    act(
      async () => {
        await api(`/admin/assistance/outreach/${selected.id}`, {
          method: 'PUT',
          body: {
            status: 'interview_scheduled',
            interview_at: selected.at,
            interview_info: selected.info.trim(),
          },
          admin: true,
        });

        setInterview({ id: null, at: '', info: '' });
      },
      'Interview details saved.'
    );
  };

  const getPacket = (outreachId) => {
    act(
      async () => {
        const response = await api(
          `/admin/assistance/outreach/${outreachId}/packet`,
          { admin: true }
        );

        setPacket({ oid: outreachId, ...response });
      },
      'Approved share packet loaded.'
    );
  };

  const downloadResume = async () => {
    if (busy) return;

    setErr('');
    setSuccess('');
    setBusy(true);

    try {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      const response = await fetch(
        `/api/admin/assistance/${id}/resume`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          'Resume download failed or no resume file is available.'
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download = 'resume.pdf';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setSuccess('Resume download started.');
    } catch (error) {
      setErr(error.message || 'Could not download the resume.');
    } finally {
      setBusy(false);
    }
  };

  const saveNote = () => {
    act(
      () =>
        api(`/admin/assistance/${id}/note`, {
          method: 'PUT',
          body: { admin_note: note },
          admin: true,
        }),
      'Private admin note saved.'
    );
  };

  const copyPacket = async () => {
    if (!packet?.text) return;

    try {
      await navigator.clipboard.writeText(packet.text);
      setSuccess('Approved share packet copied.');
    } catch {
      window.prompt('Copy approved share packet:', packet.text);
    }
  };

  if (loading && !data) {
    return <Loading />;
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700"
          to="/admin/assistance"
        >
          <ArrowLeft size={16} />
          All requests
        </Link>

        <ErrorBox message={err} onRetry={load} />
      </div>
    );
  }

  const request = data.request;
  const candidate = data.candidate;
  const profile = data.profile;
  const resume = data.resume;

  const outreach = Array.isArray(data.outreach) ? data.outreach : [];
  const updates = Array.isArray(data.updates) ? data.updates : [];
  const open = request.status !== 'closed';

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-indigo-700 hover:text-indigo-900"
        to="/admin/assistance"
      >
        <ArrowLeft size={16} />
        All assistance requests
      </Link>

      <Hero
        eyebrow="CANDIDATE CASE"
        title={candidate.name || candidate.full_name || 'Candidate'}
        description="Manage career assistance, candidate-approved company outreach, and progress updates."
        icon={UserRound}
      />

      <ErrorBox
        message={err}
        onRetry={load}
        onClose={() => setErr('')}
      />

      <SuccessBox
        message={success}
        onClose={() => setSuccess('')}
      />

      {busy && (
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700">
          <LoaderCircle size={14} className="animate-spin" />
          Saving changes...
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Request status"
          value={String(request.status || 'unknown').replace(/_/g, ' ')}
          icon={FileText}
        />

        <StatCard
          label="Outreach records"
          value={outreach.length}
          icon={Building2}
          color="violet"
        />

        <StatCard
          label="Target roles provided"
          value={request.target_roles ? 'Yes' : 'No'}
          icon={BriefcaseBusiness}
          color="amber"
        />

        <StatCard
          label="Updates"
          value={updates.length}
          icon={MessageSquare}
          color="emerald"
        />
      </section>

      {/* Request overview */}
      <Panel title="Request overview" icon={FileText}>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={request.status} />

          {candidate.email && (
            <span className="break-all text-sm text-slate-500">
              {candidate.email}
            </span>
          )}
        </div>

        {open ? (
          <>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ['Target roles', request.target_roles],
                ['Preferred locations', request.preferred_locations],
                ['Availability', request.availability],
                ['Submitted', safeDate(request.created_at)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    {label}
                  </p>
                  <p className="mt-2 break-words text-sm font-semibold text-slate-800">
                    {value || 'Not provided'}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Candidate's challenges
              </p>

              <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-700">
                {request.challenges || 'No challenges provided.'}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {[
                ['in_review', 'In review'],
                ['in_progress', 'In progress'],
                ['on_hold', 'On hold'],
              ].map(([status, label]) => (
                <button
                  key={status}
                  type="button"
                  disabled={busy || request.status === status}
                  className={btnGhost}
                  onClick={() => setRequestStatus(status)}
                >
                  {label}
                </button>
              ))}

              <button
                type="button"
                disabled={busy}
                className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                onClick={() => setRequestStatus('closed')}
              >
                Close request
              </button>
            </div>
          </>
        ) : (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-bold text-slate-800">
              This request is closed.
            </p>

            <p className="mt-1 text-sm text-slate-600">
              Reason: {request.closed_reason || 'No reason provided.'}
            </p>
          </div>
        )}
      </Panel>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <ShieldCheck size={19} className="mt-0.5 shrink-0" />

        <p>
          <strong>Privacy and outreach rules:</strong> Never promise a job
          or interview. Record only contacts and responses that actually
          occurred. Do not share candidate information with a company until
          the candidate approves that company. Follow the platform's access
          controls when viewing candidate data.
        </p>
      </div>

      {/* Candidate profile */}
      {open && profile && (
        <Panel title="Candidate profile" icon={UserRound}>
          <p className="mb-4 text-xs text-slate-500">
            Information available to you for this assistance request.
          </p>

          {profile.headline && (
            <h3 className="text-lg font-bold text-slate-900">
              {profile.headline}
            </h3>
          )}

          {profile.summary && (
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
              {profile.summary}
            </p>
          )}

          <div className="mt-5 space-y-5">
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                Skills
              </h3>

              <div className="flex flex-wrap gap-2">
                {(Array.isArray(profile.skills) ? profile.skills : []).length ? (
                  profile.skills.map((skill, index) => (
                    <span
                      key={`${skill}-${index}`}
                      className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-400">
                    Not provided
                  </span>
                )}
              </div>
            </div>

            {[
              {
                title: 'Education',
                icon: '🎓',
                items: profile.education || [],
                format: (item) =>
                  [item.degree, item.institution, item.year]
                    .filter(Boolean)
                    .join(' · '),
              },
              {
                title: 'Experience',
                icon: '💼',
                items: profile.experience || [],
                format: (item) =>
                  [item.title, item.company, item.period]
                    .filter(Boolean)
                    .join(' · '),
              },
              {
                title: 'Projects',
                icon: '🛠️',
                items: profile.projects || [],
                format: (item) => item.name || 'Project',
              },
            ].map((section) => (
              <div key={section.title}>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  {section.title}
                </h3>

                {Array.isArray(section.items) && section.items.length ? (
                  <div className="space-y-2">
                    {section.items.map((item, index) => (
                      <div
                        key={`${section.title}-${index}`}
                        className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700"
                      >
                        <span className="mr-2">{section.icon}</span>
                        {section.format(item)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Not provided</p>
                )}
              </div>
            ))}
          </div>

          {resume?.text && (
            <details className="mt-5 rounded-xl border border-slate-200">
              <summary className="cursor-pointer p-4 text-sm font-bold text-indigo-700 hover:bg-indigo-50">
                View resume text
              </summary>

              <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words border-t border-slate-100 p-4 text-xs leading-5 text-slate-600">
                {resume.text}
              </pre>
            </details>
          )}

          {resume?.has_file && (
            <button
              type="button"
              disabled={busy}
              className={cx(btnGhost, 'mt-4')}
              onClick={downloadResume}
            >
              <Download size={16} />
              Download resume PDF
            </button>
          )}
        </Panel>
      )}

      {/* Propose company outreach */}
      {open && (
        <Panel title="Propose company outreach" icon={Building2}>
          <p className="mb-5 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs leading-5 text-indigo-900">
            The candidate sees the proposed company, your message, and the
            information you want to share. They must approve the proposal
            before you share their details. HR contact information is private
            to the admin workflow.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Company name *
              </span>

              <input
                className={cx(inputCls, 'w-full')}
                placeholder="Company name"
                value={outreachForm.company_name}
                maxLength={200}
                disabled={busy}
                onChange={(event) =>
                  setOutreachForm((previous) => ({
                    ...previous,
                    company_name: event.target.value,
                  }))
                }
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Private HR contact
              </span>

              <input
                className={cx(inputCls, 'w-full')}
                placeholder="Name or contact you have verified"
                value={outreachForm.hr_contact}
                maxLength={300}
                disabled={busy}
                onChange={(event) =>
                  setOutreachForm((previous) => ({
                    ...previous,
                    hr_contact: event.target.value,
                  }))
                }
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                TechAbhi job ID{' '}
                <span className="font-normal text-slate-400">
                  (optional)
                </span>
              </span>

              <input
                className={cx(inputCls, 'w-full')}
                placeholder="Job ID"
                value={outreachForm.job_id}
                maxLength={100}
                disabled={busy}
                onChange={(event) =>
                  setOutreachForm((previous) => ({
                    ...previous,
                    job_id: event.target.value,
                  }))
                }
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Message to candidate *
              </span>

              <textarea
                className={cx(inputCls, 'w-full')}
                rows={4}
                maxLength={3000}
                placeholder="Explain why this company may be relevant and what you propose to do..."
                value={outreachForm.message}
                disabled={busy}
                onChange={(event) =>
                  setOutreachForm((previous) => ({
                    ...previous,
                    message: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-bold text-slate-800">
              Information proposed for sharing
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Candidate name is always included.
            </p>

            <div className="mt-4 flex flex-wrap gap-4">
              {[
                ['email', 'Email address'],
                ['profile', 'Profile'],
                ['resume', 'Resume'],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                >
                  <input
                    className="h-4 w-4 accent-indigo-600"
                    type="checkbox"
                    checked={outreachForm[key]}
                    disabled={busy}
                    onChange={(event) =>
                      setOutreachForm((previous) => ({
                        ...previous,
                        [key]: event.target.checked,
                      }))
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={
              busy ||
              !outreachForm.company_name.trim() ||
              !outreachForm.message.trim()
            }
            className={cx(btnPrimary, 'mt-5')}
            onClick={proposeOutreach}
          >
            {busy ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            Send proposal to candidate
          </button>
        </Panel>
      )}

      {/* Company outreach timeline */}
      <Panel title="Company outreach timeline" icon={BriefcaseBusiness}>
        {outreach.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No outreach yet"
            description="Proposed company contacts will appear here."
          />
        ) : (
          <div className="space-y-4">
            {outreach.map((item) => {
              const fields = Array.isArray(item.shared_fields)
                ? item.shared_fields
                : [];

              const nextActions = NEXT_ACTIONS[item.status] || [];
              const packetOpen = packet?.oid === item.id;

              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                      <Building2 size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="break-words font-bold text-slate-900">
                        {item.company_name || 'Company'}
                      </h3>

                      {item.job_title && (
                        <p className="mt-1 text-sm text-slate-500">
                          {item.job_title}
                        </p>
                      )}

                      <div className="mt-2">
                        <StatusBadge status={item.status} />
                      </div>
                    </div>

                    <p className="text-xs text-slate-400">
                      Proposed fields: name
                      {fields.length ? `, ${fields.join(', ')}` : ''}
                    </p>
                  </div>

                  {item.message && (
                    <div className="mt-4 rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Candidate-facing message
                      </p>
                      <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-700">
                        {item.message}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
                    <p className="break-words text-slate-600">
                      <strong className="text-slate-800">
                        Private HR contact:
                      </strong>{' '}
                      {item.hr_contact || 'Not provided'}
                    </p>

                    {item.interview_at && (
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-emerald-800">
                        <p className="font-bold">Interview recorded</p>
                        <p className="mt-1 text-sm">
                          {safeDate(item.interview_at)}
                          {item.interview_info
                            ? ` · ${item.interview_info}`
                            : ''}
                        </p>
                      </div>
                    )}

                    {item.status === 'proposed' && (
                      <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                        Waiting for candidate approval. Do not share candidate
                        details yet.
                      </p>
                    )}

                    {item.status === 'candidate_declined' && (
                      <p className="rounded-lg bg-rose-50 p-3 text-xs leading-5 text-rose-800">
                        The candidate declined this proposal. Do not share
                        their details.
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      'candidate_approved',
                      'shared',
                      'response_received',
                      'interview_scheduled',
                      'no_response',
                    ].includes(item.status) &&
                      open && (
                        <button
                          type="button"
                          disabled={busy}
                          className={btnGhost}
                          onClick={() => getPacket(item.id)}
                        >
                          <FileText size={15} />
                          Get approved share packet
                        </button>
                      )}

                    {open &&
                      nextActions.map(([status, label]) =>
                        status === 'interview_scheduled' ? (
                          <button
                            key={status}
                            type="button"
                            disabled={busy}
                            className={btnGhost}
                            onClick={() =>
                              setInterview({
                                id: item.id,
                                at: '',
                                info: '',
                              })
                            }
                          >
                            {label}
                          </button>
                        ) : (
                          <button
                            key={status}
                            type="button"
                            disabled={busy}
                            className={btnGhost}
                            onClick={() =>
                              moveOutreach(item.id, status)
                            }
                          >
                            {label}
                          </button>
                        )
                      )}

                    {open &&
                      !['closed', 'candidate_declined'].includes(
                        item.status
                      ) && (
                        <button
                          type="button"
                          disabled={busy}
                          className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                          onClick={() =>
                            moveOutreach(item.id, 'closed')
                          }
                        >
                          Close outreach
                        </button>
                      )}
                  </div>

                  {interview.id === item.id && (
                    <div className="mt-4 grid gap-3 rounded-xl border border-violet-100 bg-violet-50/50 p-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-xs font-bold text-slate-600">
                          Confirmed interview date/time
                        </span>

                        <input
                          className={cx(inputCls, 'w-full')}
                          type="datetime-local"
                          value={interview.at}
                          disabled={busy}
                          onChange={(event) =>
                            setInterview((previous) => ({
                              ...previous,
                              at: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-bold text-slate-600">
                          Confirmed details
                        </span>

                        <input
                          className={cx(inputCls, 'w-full')}
                          maxLength={1000}
                          placeholder="Details confirmed by company"
                          value={interview.info}
                          disabled={busy}
                          onChange={(event) =>
                            setInterview((previous) => ({
                              ...previous,
                              info: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <div className="flex flex-wrap gap-2 sm:col-span-2">
                        <button
                          type="button"
                          disabled={busy}
                          className={btnPrimary}
                          onClick={saveInterview}
                        >
                          <Check size={15} />
                          Save interview
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          className={btnGhost}
                          onClick={() =>
                            setInterview({
                              id: null,
                              at: '',
                              info: '',
                            })
                          }
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {packetOpen && (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                      <p className="text-sm font-bold text-emerald-900">
                        Approved share packet
                      </p>

                      <p className="mt-1 text-xs leading-5 text-emerald-800">
                        Use this packet only for the candidate-approved
                        company outreach.
                      </p>

                      <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-emerald-100 bg-white p-3 text-xs leading-5 text-slate-700">
                        {packet.text || 'No packet text returned.'}
                      </pre>

                      <button
                        type="button"
                        disabled={!packet.text}
                        className={cx(btnGhost, 'mt-3')}
                        onClick={copyPacket}
                      >
                        <Copy size={15} />
                        Copy packet
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </Panel>

      {/* Candidate-facing update */}
      {open && (
        <Panel title="Candidate-facing update" icon={MessageSquare}>
          <p className="mb-4 text-xs leading-5 text-slate-500">
            This message is visible to the candidate. Share accurate progress
            only and do not promise outcomes.
          </p>

          <textarea
            className={cx(inputCls, 'w-full')}
            rows={4}
            maxLength={3000}
            value={message}
            disabled={busy}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Write a clear progress update for the candidate..."
          />

          <p className="mt-1 text-right text-xs text-slate-400">
            {message.length}/3000
          </p>

          <button
            type="button"
            disabled={busy || !message.trim()}
            className={cx(btnPrimary, 'mt-3')}
            onClick={postUpdate}
          >
            <Send size={16} />
            Post update
          </button>
        </Panel>
      )}

      {/* Private admin note */}
      <Panel title="Private admin note" icon={ShieldCheck}>
        <p className="mb-4 text-xs leading-5 text-slate-500">
          Internal administration only. The candidate should not be able to
          see this note.
        </p>

        <textarea
          className={cx(inputCls, 'w-full')}
          rows={4}
          maxLength={5000}
          value={note}
          disabled={busy}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Add an internal note..."
        />

        <button
          type="button"
          disabled={busy}
          className={cx(btnGhost, 'mt-3')}
          onClick={saveNote}
        >
          <CheckCircle2 size={16} />
          Save private note
        </button>
      </Panel>

      {/* Activity timeline */}
      <Panel title="Activity timeline" icon={Clock3}>
        {updates.length === 0 ? (
          <p className="py-4 text-sm text-slate-500">
            No updates have been recorded yet.
          </p>
        ) : (
          <div className="relative space-y-4 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-slate-200">
            {updates.map((update, index) => (
              <div
                key={update.id || `${update.created_at}-${index}`}
                className="relative flex gap-3 pl-1"
              >
                <span className="relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-indigo-500 bg-white" />

                <div className="min-w-0 flex-1 rounded-xl bg-slate-50 p-3">
                  <p className="whitespace-pre-line break-words text-sm leading-6 text-slate-700">
                    {update.message}
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    {safeDate(update.created_at)} · {update.author || 'System'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
