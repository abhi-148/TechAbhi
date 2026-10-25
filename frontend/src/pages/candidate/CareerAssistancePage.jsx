
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Handshake,
  HeartHandshake,
  Info,
  LockKeyhole,
  MapPin,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserRound,
  X,
} from 'lucide-react';

import { api } from '../../lib/api';
import { inputCls, fmtDate } from '../../lib/format';

const STATUS_TEXT = {
  submitted: 'Your request has been received and is waiting for the TechAbhi team to review.',
  in_review: 'The team is reviewing your request.',
  in_progress: 'The team is looking for suitable opportunities. This does not guarantee a job or interview.',
  on_hold: 'Your request is currently on hold.',
  closed: 'This request is closed.',
};

const OUT_TEXT = {
  proposed: 'Your decision needed',
  candidate_approved: 'Approved by you',
  candidate_declined: 'Declined by you',
  shared: 'Sharing recorded by the team',
  response_received: 'Response recorded by the team',
  interview_scheduled: 'Interview recorded by the team',
  no_response: 'No response recorded',
  closed: 'Proposal closed',
};

const FIELD_TEXT = {
  email: 'your email address',
  profile: 'your TechAbhi profile',
  resume: 'your resume',
};

const cx = (...classes) => classes.filter(Boolean).join(' ');

const dt = (date) => {
  if (!date) return 'Date not available';

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return 'Date not available';

  return value.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

function Panel({ children, className = '' }) {
  return (
    <section
      className={cx(
        'rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7',
        className
      )}
    >
      {children}
    </section>
  );
}

function SectionHeading({ icon: Icon, title, description, badge }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
        <Icon size={21} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
            {title}
          </h2>

          {badge && (
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
              {badge}
            </span>
          )}
        </div>

        {description && (
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function Message({ type = 'error', children, onClose }) {
  const success = type === 'success';

  return (
    <div
      role={success ? 'status' : 'alert'}
      className={cx(
        'flex items-start gap-3 rounded-2xl border p-4 text-sm',
        success
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-rose-200 bg-rose-50 text-rose-800'
      )}
    >
      {success ? (
        <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
      ) : (
        <AlertCircle size={19} className="mt-0.5 shrink-0" />
      )}

      <div className="min-w-0 flex-1 leading-6">{children}</div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-xs font-bold opacity-70 hover:opacity-100"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    submitted: 'bg-blue-50 text-blue-700 ring-blue-100',
    in_review: 'bg-violet-50 text-violet-700 ring-violet-100',
    in_progress: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
    on_hold: 'bg-amber-50 text-amber-800 ring-amber-100',
    closed: 'bg-slate-100 text-slate-600 ring-slate-200',
    proposed: 'bg-amber-50 text-amber-800 ring-amber-100',
    candidate_approved: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    candidate_declined: 'bg-slate-100 text-slate-600 ring-slate-200',
    shared: 'bg-blue-50 text-blue-700 ring-blue-100',
    response_received: 'bg-violet-50 text-violet-700 ring-violet-100',
    interview_scheduled: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    no_response: 'bg-slate-100 text-slate-600 ring-slate-200',
  };

  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset',
        styles[status] || 'bg-slate-100 text-slate-600 ring-slate-200'
      )}
    >
      {OUT_TEXT[status] || String(status || 'Unknown').replaceAll('_', ' ')}
    </span>
  );
}

function LoadingPage() {
  return (
    <div className="space-y-5">
      <div className="h-48 animate-pulse rounded-3xl bg-slate-200" />

      {[1, 2].map((item) => (
        <div
          key={item}
          className="rounded-2xl border border-slate-200 bg-white p-6"
        >
          <div className="h-5 w-48 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 h-20 animate-pulse rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  title,
  description,
  icon: Icon = HeartHandshake,
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <Icon size={26} />
      </div>

      <h3 className="mt-4 font-bold text-slate-900">{title}</h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

export default function CareerAssistancePage() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    target_roles: '',
    preferred_locations: '',
    availability: '',
    challenges: '',
  });

  const [consent, setConsent] = useState(false);

  useEffect(() => {
    let active = true;

    api('/candidate/assistance', { candidate: true })
      .then((response) => {
        if (active) setData(response);
      })
      .catch((error) => {
        if (active) {
          setErr(error.message || 'Unable to load career assistance.');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const run = async (operation, successMessage = '') => {
    if (busy) return;

    setBusy(true);
    setErr('');
    setMsg('');

    try {
      const response = await operation();
      setData(response);

      if (successMessage) setMsg(successMessage);
    } catch (error) {
      setErr(error.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const updateField = (field) => (event) => {
    setForm((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
  };

  const submit = (event) => {
    event.preventDefault();

    if (!form.target_roles.trim()) {
      setErr('Please tell us which roles you are looking for.');
      return;
    }

    if (!consent) {
      setErr('Please review and accept the consent statement before submitting.');
      return;
    }

    run(
      () =>
        api('/candidate/assistance', {
          method: 'POST',
          candidate: true,
          body: {
            ...form,
            target_roles: form.target_roles.trim(),
            preferred_locations: form.preferred_locations.trim(),
            availability: form.availability.trim(),
            challenges: form.challenges.trim(),
            consent_review: consent,
          },
        }),
      'Your career assistance request has been submitted.'
    );
  };

  const decide = (id, decision) => {
    const messages = {
      approve: 'Your approval has been recorded.',
      decline: 'Your decision to decline has been recorded.',
      revoke: 'Your request to cancel sharing approval has been recorded.',
    };

    run(
      () =>
        api(`/candidate/assistance/outreach/${id}/decision`, {
          method: 'POST',
          candidate: true,
          body: { decision },
        }),
      messages[decision] || 'Your decision has been recorded.'
    );
  };

  const withdraw = () => {
    const confirmed = window.confirm(
      'Withdraw your request? Anything not yet shared will be cancelled and your request details are erased.'
    );

    if (!confirmed) return;

    run(async () => {
      await api('/candidate/assistance/withdraw', {
        method: 'POST',
        candidate: true,
      });

      return api('/candidate/assistance', { candidate: true });
    }, 'Your withdrawal request has been processed.');
  };

  if (!data) {
    return err ? (
      <div className="rounded-2xl border border-rose-200 bg-white p-7 text-center">
        <AlertCircle size={28} className="mx-auto text-rose-500" />

        <h2 className="mt-3 text-lg font-bold text-slate-900">
          Unable to load your request
        </h2>

        <p className="mt-2 text-sm text-rose-700">{err}</p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700"
        >
          Try again
        </button>
      </div>
    ) : (
      <LoadingPage />
    );
  }

  const request = data.request;
  const outreach = Array.isArray(request?.outreach)
    ? request.outreach
    : [];
  const updates = Array.isArray(request?.updates)
    ? request.updates
    : [];

  return (
    <div className="space-y-6 pb-6">
      {/* Hero */}
      <section className="relative isolate overflow-hidden rounded-3xl bg-[#111735] p-6 shadow-lg shadow-indigo-950/10 sm:p-8">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-indigo-500/25 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />

          <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:34px_34px]" />
        </div>

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-indigo-100">
            <HeartHandshake size={32} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-200">
              <Sparkles size={13} />
              Candidate support
            </div>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Get support on your career journey
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Tell the TechAbhi team what you are looking for. Review every
              company-sharing proposal and decide for yourself.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-3 py-2.5 text-xs font-medium text-indigo-100">
            <ShieldCheck size={16} />
            Your choice matters
          </div>
        </div>
      </section>

      {err && (
        <Message type="error" onClose={() => setErr('')}>
          <p className="font-bold">Something needs your attention</p>
          <p className="mt-1">{err}</p>
        </Message>
      )}

      {msg && (
        <Message type="success" onClose={() => setMsg('')}>
          <p className="font-bold">{msg}</p>
        </Message>
      )}

      {/* How it works */}
      <Panel>
        <SectionHeading
          icon={ShieldCheck}
          title="How career assistance works"
          description="Understand the process before you submit a request."
        />

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: MessageSquareText,
              title: '1. Tell us your goals',
              text: 'Share your target roles, preferred locations and challenges.',
            },
            {
              icon: UserCheck,
              title: '2. Review proposals',
              text: 'Check the company and the exact information proposed for sharing.',
            },
            {
              icon: CheckCircle2,
              title: '3. You decide',
              text: 'Approve or decline each proposal individually.',
            },
          ].map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                <Icon size={19} />
              </div>

              <h3 className="mt-4 text-sm font-bold text-slate-900">
                {title}
              </h3>

              <p className="mt-2 text-xs leading-6 text-slate-500">
                {text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <Info size={19} className="mt-0.5 shrink-0" />

          <div className="leading-6">
            <p className="font-bold">Please keep expectations realistic</p>

            <ul className="mt-1 list-disc space-y-1 pl-4">
              <li>There is no guarantee of a job, interview or company response.</li>
              <li>Never pay anyone to get a job. Be careful with suspicious offers.</li>
              <li>Do not approve a proposal unless you understand what will be shared.</li>
            </ul>
          </div>
        </div>
      </Panel>

      {/* Request form */}
      {data.can_request && (
        <Panel>
          <SectionHeading
            icon={BriefcaseBusiness}
            title="Request career assistance"
            description="Share enough information for the team to understand your goals."
            badge="Optional"
          />

          {request?.status === 'closed' && (
            <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-bold text-slate-800">
                Your previous request is closed.
              </p>

              <p className="mt-1">
                {request.closed_reason
                  ? `Reason: ${request.closed_reason}`
                  : 'You can submit a new request if you need further assistance.'}
              </p>
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label
                htmlFor="target-roles"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Which roles are you looking for?{' '}
                <span className="text-rose-500">*</span>
              </label>

              <input
                id="target-roles"
                className={cx(
                  inputCls,
                  'h-12 rounded-xl border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10'
                )}
                placeholder="e.g. Frontend Developer, Java Developer, Software Engineer"
                value={form.target_roles}
                onChange={updateField('target_roles')}
                maxLength={500}
                required
                disabled={busy}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="preferred-locations"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                >
                  <MapPin size={15} className="text-indigo-500" />
                  Preferred locations
                </label>

                <input
                  id="preferred-locations"
                  className={cx(
                    inputCls,
                    'h-12 rounded-xl border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10'
                  )}
                  placeholder="e.g. Ahmedabad, Pune, Noida"
                  value={form.preferred_locations}
                  onChange={updateField('preferred_locations')}
                  maxLength={500}
                  disabled={busy}
                />
              </div>

              <div>
                <label
                  htmlFor="availability"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                >
                  <CalendarClock size={15} className="text-indigo-500" />
                  Availability
                </label>

                <input
                  id="availability"
                  className={cx(
                    inputCls,
                    'h-12 rounded-xl border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10'
                  )}
                  placeholder="e.g. Immediate, 30-day notice"
                  value={form.availability}
                  onChange={updateField('availability')}
                  maxLength={250}
                  disabled={busy}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="challenges"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                What is making your job search difficult?
              </label>

              <textarea
                id="challenges"
                className="min-h-32 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50"
                rows={4}
                maxLength={3000}
                placeholder="For example: finding suitable fresher roles, getting interview calls, choosing a career path…"
                value={form.challenges}
                onChange={updateField('challenges')}
                disabled={busy}
              />

              <p className="mt-1.5 text-right text-xs text-slate-400">
                {form.challenges.length}/3000
              </p>
            </div>

            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
              <p className="text-sm font-bold text-slate-800">
                Before you submit
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                The team may need to review your profile and resume. You can
                update them before submitting.
              </p>

              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  to="/candidate/profile"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900"
                >
                  <UserRound size={14} />
                  Review profile
                  <ArrowRight size={13} />
                </Link>

                <Link
                  to="/candidate/resume"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900"
                >
                  <FileText size={14} />
                  Review resume
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/30">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-indigo-600"
                required
                disabled={busy}
              />

              <span className="text-sm leading-6 text-slate-600">
                I agree that the TechAbhi team can review my profile, resume
                and the details above to assess my request and look for
                opportunities. I understand that nothing is shared with a
                company unless I approve that proposal separately.
              </span>
            </label>

            <button
              type="submit"
              disabled={!consent || !form.target_roles.trim() || busy}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {busy ? (
                'Submitting request…'
              ) : (
                <>
                  Submit assistance request
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
        </Panel>
      )}

      {/* Current request */}
      {request && request.status !== 'closed' && (
        <>
          <Panel>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Clock3 size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Your assistance request
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {STATUS_TEXT[request.status] ||
                      'Your request status has been updated.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold capitalize text-indigo-700">
                  {String(request.status || 'unknown').replaceAll('_', ' ')}
                </span>

                <button
                  type="button"
                  disabled={busy}
                  onClick={withdraw}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                >
                  <X size={14} />
                  Withdraw request
                </button>
              </div>
            </div>

            {request.first_viewed_at && (
              <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <Clock3 size={14} />
                The team first opened your request on{' '}
                {fmtDate(request.first_viewed_at)}.
              </p>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Target roles
                </p>

                <p className="mt-2 break-words text-sm font-semibold text-slate-800">
                  {request.target_roles}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Preferred locations
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {request.preferred_locations || 'No preference provided'}
                </p>
              </div>
            </div>
          </Panel>

          {/* Company proposals */}
          <section className="space-y-4">
            <SectionHeading
              icon={Building2}
              title="Company contact proposals"
              description="Review each proposal before deciding whether to approve sharing."
              badge={`${outreach.length} proposal${outreach.length === 1 ? '' : 's'}`}
            />

            {outreach.length === 0 && (
              <EmptyState
                title="No proposals yet"
                description="If the team identifies a potential opportunity, the proposal will appear here. You remain in control of each decision."
                icon={Handshake}
              />
            )}

            {outreach.map((item) => {
              const fields = Array.isArray(item.shared_fields)
                ? item.shared_fields
                : [];

              return (
                <Panel key={item.id} className="overflow-hidden">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Building2 size={23} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="break-words text-base font-bold text-slate-900">
                            {item.company_name || 'Company not specified'}
                          </h3>

                          {item.job_title && (
                            <p className="mt-1 text-sm text-slate-500">
                              {item.job_title}
                            </p>
                          )}
                        </div>

                        <StatusBadge status={item.status} />
                      </div>

                      <div className="mt-4 rounded-xl bg-slate-50 p-4">
                        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                          <MessageSquareText size={14} />
                          Message from the team
                        </p>

                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {item.message || 'No additional message provided.'}
                        </p>
                      </div>

                      <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/70 p-4">
                        <p className="flex items-center gap-2 text-sm font-bold text-amber-900">
                          <LockKeyhole size={16} />
                          Information proposed for sharing
                        </p>

                        <p className="mt-2 text-sm leading-6 text-amber-900/80">
                          Your name
                          {fields.length
                            ? ', ' +
                              fields
                                .map((field) => FIELD_TEXT[field] || field)
                                .join(', ')
                            : ' only'}
                          .
                        </p>

                        <p className="mt-2 text-xs leading-5 text-amber-800/80">
                          Check the proposed information carefully before approving.
                        </p>
                      </div>

                      {item.shared_at && (
                        <p className="mt-3 text-xs text-slate-500">
                          Sharing recorded by the team on{' '}
                          {fmtDate(item.shared_at)}.
                        </p>
                      )}

                      {item.interview_at && (
                        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                          <p className="flex items-center gap-2 font-bold text-emerald-800">
                            <CheckCircle2 size={17} />
                            Interview recorded by the team
                          </p>

                          <p className="mt-2 text-sm leading-6 text-emerald-800">
                            {dt(item.interview_at)}
                            {item.interview_info
                              ? ` · ${item.interview_info}`
                              : ''}
                          </p>

                          <p className="mt-2 text-xs leading-5 text-emerald-700">
                            Please confirm all interview arrangements directly with the company.
                          </p>
                        </div>
                      )}

                      {item.status === 'proposed' && (
                        <div className="mt-5">
                          <p className="text-sm font-bold text-slate-800">
                            What would you like to do?
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Your decision applies to this proposal only.
                          </p>

                          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => decide(item.id, 'approve')}
                              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <Check size={17} />
                              Approve sharing
                            </button>

                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => decide(item.id, 'decline')}
                              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                            >
                              <X size={17} />
                              Decline proposal
                            </button>
                          </div>
                        </div>
                      )}

                      {item.status === 'candidate_approved' && (
                        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                          <p className="flex items-start gap-2 text-sm leading-6 text-emerald-800">
                            <CheckCircle2
                              size={18}
                              className="mt-0.5 shrink-0"
                            />

                            <span>
                              <strong>You approved this proposal.</strong>{' '}
                              According to the current workflow, you can
                              request cancellation before the information is shared.
                            </span>
                          </p>

                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => decide(item.id, 'revoke')}
                            className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-300 bg-white px-3.5 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
                          >
                            <X size={14} />
                            Cancel my approval
                          </button>
                        </div>
                      )}

                      {item.status === 'candidate_declined' && (
                        <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                          <CheckCircle2 size={16} />
                          You declined this proposal. No further action is needed.
                        </p>
                      )}
                    </div>
                  </div>
                </Panel>
              );
            })}
          </section>
        </>
      )}

      {/* Request updates */}
      {request && (
        <Panel>
          <SectionHeading
            icon={Clock3}
            title="Request updates"
            description="A timeline of updates recorded for your request."
          />

          {updates.length === 0 ? (
            <EmptyState
              title="No updates yet"
              description="Updates will appear here when there is activity on your request."
              icon={Clock3}
            />
          ) : (
            <ol className="relative space-y-5 border-l-2 border-indigo-100 pl-5">
              {updates.map((update, index) => (
                <li
                  key={`${update.created_at || 'update'}-${index}`}
                  className="relative"
                >
                  <span className="absolute -left-[27px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-indigo-500 ring-4 ring-white" />

                  <p className="text-sm leading-6 text-slate-700">
                    {update.message}
                  </p>

                  <p className="mt-1.5 text-xs text-slate-400">
                    {dt(update.created_at)} ·{' '}
                    {update.author === 'team' ? 'TechAbhi team' : 'System'}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      )}

      {/* Footer */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-violet-50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
            <HeartHandshake size={20} />
          </div>

          <div>
            <h3 className="font-bold text-slate-900">
              Your career, your decisions
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Career assistance is optional. Always verify opportunities,
              confirm interview arrangements directly with employers, and
              never pay for a job offer.
            </p>

            <Link
              to="/jobs"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800"
            >
              Browse jobs yourself
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
