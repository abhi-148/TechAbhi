
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

const dt = (date) =>
  new Date(date).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const cx = (...classes) => classes.filter(Boolean).join(' ');

function Panel({ children, className = '' }) {
  return (
    <section className={cx(
      'rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7',
      className
    )}>
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
      {success
        ? <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
        : <AlertCircle size={19} className="mt-0.5 shrink-0" />}
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
    <span className={cx(
      'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold capitalize ring-1 ring-inset',
      styles[status] || 'bg-slate-100 text-slate-600 ring-slate-200'
    )}>
      {(OUT_TEXT[status] || status || 'Unknown').replaceAll('_', ' ')}
    </span>
  );
}

function LoadingPage() {
  return (
    <div className="space-y-5">
      <div className="h-48 animate-pulse rounded-3xl bg-slate-200" />
      {[1, 2].map((item) => (
        <div key={item} className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="h-5 w-48 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 h-20 animate-pulse rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, description, icon: Icon = HeartHandshake }) {
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
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const [f, setF] = useState({
    target_roles: '',
    preferred_locations: '',
    availability: '',
    challenges: '',
  });

  const [consent, setConsent] = useState(false);

  useEffect(() => {
    let active = true;

    api('/candidate/assistance', { candidate: true })
      .then((data) => {
        if (active) setD(data);
      })
      .catch((error) => {
        if (active) setErr(error.message || 'Unable to load career assistance.');
      });

    return () => {
      active = false;
    };
  }, []);

  const run = async (fn, successMessage = '') => {
    if (busy) return;

    setBusy(true);
    setErr('');
    setMsg('');

    try {
      const data = await fn();
      setD(data);
      if (successMessage) setMsg(successMessage);
    } catch (error) {
      setErr(error.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const set = (key) => (event) => {
    setF((previous) => ({
      ...previous,
      [key]: event.target.value,
    }));
  };

  const submit = (event) => {
    event.preventDefault();

    if (!f.target_roles.trim()) {
      setErr('Please tell us which roles you are looking for.');
      return;
    }

    if (!consent) {
      setErr('Please review and accept the consent statement before submitting.');
      return;
    }

    run(
      () => api('/candidate/assistance', {
        method: 'POST',
        candidate: true,
        body: {
          ...f,
          target_roles: f.target_roles.trim(),
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
      () => api(`/candidate/assistance/outreach/${id}/decision`, {
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

    run(
      async () => {
        await api('/candidate/assistance/withdraw', {
          method: 'POST',
          candidate: true,
        });
        return api('/candidate/assistance', { candidate: true });
      },
      'Your withdrawal request has been processed.'
    );
  };

  if (!d) {
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
    ) : <LoadingPage />;
  }

  const rq = d.request;

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

      {/* Important expectations */}
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
            <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                <Icon size={19} />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-xs leading-6 text-slate-500">{text}</p>
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
      {d.can_request && (
        <Panel>
          <SectionHeading
            icon={BriefcaseBusiness}
            title="Request career assistance"
            description="Share enough information for the team to understand your goals."
            badge="Optional"
          />

          {rq?.status === 'closed' && (
            <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-bold text-slate-800">Your previous request is closed.</p>
              <p className="mt-1">
                {rq.closed_reason
                  ? `Reason: ${rq.closed_reason}`
                  : 'You can submit a new request if you need further assistance.'}
              </p>
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label htmlFor="target-roles" className="mb-2 block text-sm font-semibold text-slate-700">
                Which roles are you looking for? <span className="text-rose-500">*</span>
              </label>
              <input
                id="target-roles"
                className={cx(inputCls, 'h-12 rounded-xl border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10')}
                placeholder="e.g. Frontend Developer, Java Developer, Software Engineer"
                value={f.target_roles}
                onChange={set('target_roles')}
                maxLength={500}
                required
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="preferred-locations" className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <MapPin size={15} className="text-indigo-500" />
                  Preferred locations
                </label>
                <input
                  id="preferred-locations"
                  className={cx(inputCls, 'h-12 rounded-xl border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10')}
                  placeholder="e.g. Ahmedabad, Pune, Noida"
                  value={f.preferred_locations}
                  onChange={set('preferred_locations')}
                  maxLength={500}
                />
              </div>

              <div>
                <label htmlFor="availability" className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <CalendarClock size={15} className="text-indigo-500" />
                  Availability
                </label>
                <input
                  id="availability"
                  className={cx(inputCls, 'h-12 rounded-xl border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10')}
                  placeholder="e.g. Immediate, 30-day notice"
                  value={f.availability}
                  onChange={set('availability')}
                  maxLength={250}
                />
              </div>
            </div>

            <div>
              <label htmlFor="challenges" className="mb-2 block text-sm font-semibold text-slate-700">
                What is making your job search difficult?
              </label>
              <textarea
                id="challenges"
                className="min-h-32 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                rows={4}
                maxLength={3000}
                placeholder="For example: finding suitable fresher roles, getting interview calls, choosing a career path…"
                value={f.challenges}
                onChange={set('challenges')}
              />
              <p className="mt-1.5 text-right text-xs text-slate-400">
                {f.challenges.length}/3000
              </p>
            </div>

            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
              <p className="text-sm font-bold text-slate-800">Before you submit</p>
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
              disabled={!consent || !f.target_roles.trim() || busy}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {busy ? (
                <span className="animate-pulse">Submitting request…</span>
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
      {rq && rq.status !== 'closed' && (
        <>
          <Panel>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Clock3 size={21} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Your assistance request</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {STATUS_TEXT[rq.status] || 'Your request status has been updated.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold capitalize text-indigo-700">
                  {rq.status.replaceAll('_', ' ')}
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

            {rq.first_viewed_at && (
              <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <Clock3 size={14} />
                The team first opened your request on {fmtDate(rq.first_viewed_at)}.
              </p>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Target roles
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {rq.target_roles}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Preferred locations
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {rq.preferred_locations || 'No preference provided'}
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
              badge={`${rq.outreach.length} proposal${rq.outreach.length === 1 ? '' : 's'}`}
            />

            {rq.outreach.length === 0 && (
              <EmptyState
                title="No proposals yet"
                description="If the team identifies a potential opportunity, the proposal will appear here. You remain in control of each decision."
                icon={Handshake}
              />
            )}

            {rq.outreach.map((outreach) => (
              <Panel key={outreach.id} className="overflow-hidden">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Building2 size={23} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="break-words text-base font-bold text-slate-900">
                          {outreach.company_name}
                        </h3>
                        {outreach.job_title && (
                          <p className="mt-1 text-sm text-slate-500">
                            {outreach.job_title}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={outreach.status} />
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-50 p-4">
                      <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                        <MessageSquareText size={14} />
                        Message from the team
                      </p>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {outreach.message}
                      </p>
                    </div>

                    <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/70 p-4">
                      <p className="flex items-center gap-2 text-sm font-bold text-amber-900">
                        <LockKeyhole size={16} />
                        Information proposed for sharing
                      </p>
                      <p className="mt-2 text-sm leading-6 text-amber-900/80">
                        Your name
                        {outreach.shared_fields.length
                          ? ', ' + outreach.shared_fields
                              .map((field) => FIELD_TEXT[field] || field)
                              .join(', ')
                          : ' only'}.
                      </p>
                      <p className="mt-2 text-xs leading-5 text-amber-800/80">
                        Check the proposed information carefully before approving.
                      </p>
                    </div>

                    {outreach.shared_at && (
                      <p className="mt-3 text-xs text-slate-500">
                        Sharing recorded by the team on {fmtDate(outreach.shared_at)}.
                      </p>
                    )}

                    {outreach.interview_at && (
                      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="flex items-center gap-2 font-bold text-emerald-800">
                          <CheckCircle2 size={17} />
                          Interview recorded by the team
                        </p>
                        <p className="mt-2 text-sm leading-6 text-emerald-800">
                          {dt(outreach.interview_at)}
                          {outreach.interview_info ? ` · ${outreach.interview_info}` : ''}
                        </p>
                        <p className="mt-2 text-xs leading-5 text-emerald-700">
                          Please confirm all interview arrangements directly with the company.
                        </p>
                      </div>
                    )}

                    {outreach.status === 'proposed' && (
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
                            onClick={() => decide(outreach.id, 'approve')}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <Check size={17} />
                            Approve sharing
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => decide(outreach.id, 'decline')}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                          >
                            <X size={17} />
                            Decline proposal
                          </button>
                        </div>
                      </div>
                    )}

                    {outreach.status === 'candidate_approved' && (
                      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="flex items-start gap-2 text-sm leading-6 text-emerald-800">
                          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                          <span>
                            <strong>You approved this proposal.</strong> According
                            to the current workflow, you can request cancellation
                            before the information is shared.
                          </span>
                        </p>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => decide(outreach.id, 'revoke')}
                          className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-300 bg-white px-3.5 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
                        >
                          <X size={14} />
                          Cancel my approval
                        </button>
                      </div>
                    )}

                    {outreach.status === 'candidate_declined' && (
                      <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                        <CheckCircle2 size={16} />
                        You declined this proposal. No further action is needed.
                      </p>
                    )}
                  </div>
                </div>
              </Panel>
            ))}
          </section>
        </>
      )}

      {/* Updates */}
      {rq && (
        <Panel>
          <SectionHeading
            icon={Clock3}
            title="Request updates"
            description="A timeline of updates recorded for your request."
          />

          {rq.updates.length === 0 ? (
            <EmptyState
              title="No updates yet"
              description="Updates will appear here when there is activity on your request."
              icon={Clock3}
            />
          ) : (
            <ol className="relative space-y-5 border-l-2 border-indigo-100 pl-5">
              {rq.updates.map((update, index) => (
                <li key={`${update.created_at}-${index}`} className="relative">
                  <span className="absolute -left-[27px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-indigo-500 ring-4 ring-white" />

                  <p className="text-sm leading-6 text-slate-700">
                    {update.message}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-400">
                    {dt(update.created_at)} · {update.author === 'team' ? 'TechAbhi team' : 'System'}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      )}

      {/* Footer note */}
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
