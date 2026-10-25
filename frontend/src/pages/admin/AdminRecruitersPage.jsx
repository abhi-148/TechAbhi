
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Globe,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Users,
  UserRound,
  BriefcaseBusiness,
  XCircle,
  AlertTriangle,
  Mail,
  Phone,
  CalendarDays,
  SlidersHorizontal,
  RotateCcw,
  Info,
} from 'lucide-react';

import { api } from '../../lib/api';
import { fmtDate, safeHttp } from '../../lib/format';

const TABS = ['pending', 'approved', 'rejected', 'suspended', 'all'];

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  approved: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  rejected: 'bg-rose-50 text-rose-800 ring-rose-200',
  suspended: 'bg-slate-100 text-slate-700 ring-slate-200',
};

const STATUS_ICONS = {
  pending: Clock3,
  approved: CheckCircle2,
  rejected: XCircle,
  suspended: ShieldAlert,
};

const STATUS_LABELS = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
  suspended: 'Suspended',
  all: 'All recruiters',
};

function StatusBadge({ status }) {
  const normalized = String(status || 'pending').toLowerCase();
  const Icon = STATUS_ICONS[normalized] || Info;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold capitalize ring-1 ring-inset ${
        STATUS_STYLES[normalized] ||
        'bg-slate-100 text-slate-700 ring-slate-200'
      }`}
    >
      <Icon size={13} />
      {normalized}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, tone = 'indigo' }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    rose: 'bg-rose-50 text-rose-700 ring-rose-100',
    violet: 'bg-violet-50 text-violet-700 ring-violet-100',
  };

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className={`rounded-xl p-3 ring-1 ${tones[tone] || tones.indigo}`}>
          <Icon size={20} />
        </div>
        <span className="text-xs font-semibold text-slate-400">
          Accounts
        </span>
      </div>

      <p className="mt-4 text-3xl font-black tracking-tight text-slate-950">
        {Number(value || 0).toLocaleString('en-IN')}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-600">{label}</p>
    </article>
  );
}

function LoadingState() {
  return (
    <div
      role="status"
      className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center"
    >
      <div className="rounded-2xl bg-indigo-50 p-4 text-indigo-600">
        <LoaderCircle size={28} className="animate-spin" />
      </div>

      <p className="mt-4 font-bold text-slate-800">
        Loading recruiter accounts
      </p>

      <p className="mt-1 text-sm text-slate-500">
        Fetching the latest registrations...
      </p>
    </div>
  );
}

function ErrorState({ message, onRetry, loading }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-rose-200 bg-rose-50 p-5"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-white p-2.5 text-rose-600">
          <AlertTriangle size={21} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-bold text-rose-900">
            Could not load recruiter accounts
          </p>
          <p className="mt-1 break-words text-sm leading-6 text-rose-800">
            {message}
          </p>

          <button
            type="button"
            disabled={loading}
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-rose-700 px-3.5 py-2 text-sm font-bold text-white transition hover:bg-rose-800 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ searching, onClear }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-14 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        {searching ? <Search size={27} /> : <Building2 size={27} />}
      </div>

      <h3 className="mt-5 text-lg font-black text-slate-900">
        {searching
          ? 'No matching recruiters'
          : 'No recruiters in this category'}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {searching
          ? 'Try a different company name, recruiter name, email address, or phone number.'
          : 'Recruiter accounts matching this status will appear here when available.'}
      </p>

      {searching && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
        >
          <RotateCcw size={15} />
          Clear search
        </button>
      )}
    </div>
  );
}

function VerificationNotice() {
  return (
    <div className="mt-5 flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
      <ShieldCheck size={19} className="mt-0.5 shrink-0 text-indigo-700" />
      <div>
        <p className="text-sm font-bold text-indigo-950">
          Before approving a recruiter
        </p>
        <p className="mt-1 text-xs leading-5 text-indigo-900/80">
          Review the company website, business email domain, professional
          presence, and legitimacy of the organization. A website alone does
          not establish that a company is genuine.
        </p>
      </div>
    </div>
  );
}

function RecruiterCard({ recruiter, busy, onAction }) {
  const website = safeHttp(recruiter.company_website);
  const status = String(recruiter.status || 'pending').toLowerCase();

  const registeredDate = (() => {
    try {
      return recruiter.created_at
        ? fmtDate(recruiter.created_at)
        : 'Not available';
    } catch {
      return 'Not available';
    }
  })();

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-200 hover:border-indigo-200 hover:shadow-md">
      <div className="p-4 sm:p-5 lg:p-6">
        {/* Recruiter identity */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-600/15">
            <Building2 size={25} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="break-words text-lg font-black tracking-tight text-slate-950">
                {recruiter.company_name || 'Unnamed company'}
              </h3>
              <StatusBadge status={status} />
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Recruiter account
              {recruiter.id != null ? ` · ID ${recruiter.id}` : ''}
            </p>

            <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <div className="flex min-w-0 items-start gap-2.5">
                <UserRound
                  size={16}
                  className="mt-0.5 shrink-0 text-slate-400"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Contact person
                  </p>
                  <p className="mt-1 break-words text-sm font-semibold text-slate-700">
                    {recruiter.full_name || 'Not provided'}
                  </p>
                </div>
              </div>

              <div className="flex min-w-0 items-start gap-2.5">
                <BriefcaseBusiness
                  size={16}
                  className="mt-0.5 shrink-0 text-slate-400"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Job listings
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {Number(recruiter.job_count || 0).toLocaleString('en-IN')}{' '}
                    job(s)
                  </p>
                </div>
              </div>

              <div className="flex min-w-0 items-start gap-2.5">
                <Mail
                  size={16}
                  className="mt-0.5 shrink-0 text-slate-400"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Email address
                  </p>
                  {recruiter.email ? (
                    <a
                      href={`mailto:${recruiter.email}`}
                      className="mt-1 block break-all text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                    >
                      {recruiter.email}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">Not provided</p>
                  )}
                </div>
              </div>

              <div className="flex min-w-0 items-start gap-2.5">
                <Phone
                  size={16}
                  className="mt-0.5 shrink-0 text-slate-400"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Phone number
                  </p>
                  {recruiter.phone ? (
                    <a
                      href={`tel:${recruiter.phone}`}
                      className="mt-1 block break-words text-sm font-semibold text-slate-700 hover:text-indigo-700"
                    >
                      {recruiter.phone}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">Not provided</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 sm:flex-col sm:items-start sm:gap-1">
            <CalendarDays size={15} className="text-slate-400" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Registered
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-700">
                {registeredDate}
              </p>
            </div>
          </div>
        </div>

        {/* Website */}
        {website && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Company website
            </p>

            <a
              className="inline-flex max-w-full items-center gap-2 break-all text-sm font-semibold text-indigo-700 hover:text-indigo-900"
              href={website}
              target="_blank"
              rel="noopener noreferrer nofollow"
            >
              <Globe size={16} className="shrink-0" />
              {recruiter.company_website}
              <ExternalLink size={13} className="shrink-0" />
            </a>
          </div>
        )}

        {/* Company description */}
        {recruiter.company_description && (
          <div className="mt-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              About the company
            </p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
              {recruiter.company_description}
            </p>
          </div>
        )}

        {/* Reason */}
        {recruiter.status_reason && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
              <ShieldAlert size={15} />
              Status reason
            </p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-amber-950">
              {recruiter.status_reason}
            </p>
          </div>
        )}

        <VerificationNotice />

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
          {status !== 'approved' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onAction(recruiter, 'approved')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Approve recruiter
            </button>
          )}

          {status === 'pending' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onAction(recruiter, 'rejected')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <XCircle size={16} />
              Reject
            </button>
          )}

          {status === 'approved' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onAction(recruiter, 'suspended')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <ShieldAlert size={16} />
              )}
              Suspend account
            </button>
          )}

          {status === 'suspended' && (
            <div className="flex items-start gap-2 text-xs leading-5 text-slate-500">
              <ShieldAlert size={15} className="mt-0.5 shrink-0" />
              This account is suspended. Review its details before taking
              further action.
            </div>
          )}

          {status === 'rejected' && (
            <p className="text-xs text-slate-500">
              This registration was rejected. Review the details before
              changing its status.
            </p>
          )}
        </div>

        {status === 'approved' && (
          <p className="mt-3 text-xs leading-5 text-rose-700">
            Suspending this recruiter may close their live jobs.
          </p>
        )}
      </div>
    </article>
  );
}

export default function AdminRecruitersPage() {
  const [tab, setTab] = useState('pending');
  const [list, setList] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(null);
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    setNotice('');

    try {
      const endpoint =
        '/admin/recruiters' +
        (tab === 'all' ? '' : `?status=${encodeURIComponent(tab)}`);

      const data = await api(endpoint, { admin: true });

      if (!Array.isArray(data?.recruiters)) {
        throw new Error('The server returned an unexpected recruiter list.');
      }

      setList(data.recruiters);
    } catch (error) {
      setList(null);
      setErr(error.message || 'Unable to fetch recruiter accounts.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (recruiter, status) => {
    if (actionBusy !== null) return;

    let reason = '';

    if (status === 'rejected' || status === 'suspended') {
      reason = window.prompt(
        `Reason for ${status === 'rejected' ? 'rejecting' : 'suspending'} ${recruiter.company_name || 'this recruiter'} (the recruiter will see this):`
      );

      if (!reason?.trim()) return;
    }

    if (
      status === 'suspended' &&
      !window.confirm(
        `Suspend ${recruiter.company_name || 'this recruiter'}? Their live jobs may be closed.`
      )
    ) {
      return;
    }

    const actionLabel =
      status === 'approved'
        ? 'approved'
        : status === 'rejected'
          ? 'rejected'
          : status === 'suspended'
            ? 'suspended'
            : 'updated';

    setActionBusy(recruiter.id);
    setErr('');
    setNotice('');

    try {
      const result = await api(
        `/admin/recruiters/${recruiter.id}/status`,
        {
          method: 'POST',
          body: { status, reason: reason.trim() },
          admin: true,
        }
      );

      const extra = result?.jobs_closed
        ? ` ${result.jobs_closed} live job(s) were closed.`
        : '';

      setNotice(
        `${recruiter.company_name || 'Recruiter'} was ${actionLabel}.${extra}`
      );

      // Reload the currently selected server-side status filter.
      await load();
    } catch (error) {
      setErr(error.message || 'Unable to update recruiter status.');
    } finally {
      setActionBusy(null);
    }
  };

  const filtered = useMemo(() => {
    const recruiters = Array.isArray(list) ? list : [];
    const term = search.trim().toLowerCase();

    if (!term) return recruiters;

    return recruiters.filter((recruiter) =>
      [
        recruiter.company_name,
        recruiter.full_name,
        recruiter.email,
        recruiter.phone,
        recruiter.company_website,
        recruiter.status,
      ].some((value) =>
        String(value || '').toLowerCase().includes(term)
      )
    );
  }, [list, search]);

  const count = (status) =>
    (Array.isArray(list) ? list : []).filter(
      (recruiter) => recruiter.status === status
    ).length;

  const totalInView = Array.isArray(list) ? list.length : 0;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-7 pb-8">
      {/* Hero */}
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-6 text-white shadow-xl shadow-indigo-950/10 sm:p-8 lg:p-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-16 h-72 w-72 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-2 top-4 h-48 w-48 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 right-1/3 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl"
        />

        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-indigo-100">
              <ShieldCheck size={15} />
              ADMIN CONTROL CENTER
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
              Recruiter management
              <span className="text-violet-300">.</span>
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100/80 sm:text-base">
              Review registrations, check company information, and manage
              recruiter access to the TechAbhi platform.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-indigo-100/80">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                <ShieldCheck size={14} />
                Admin-only actions
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                <Building2 size={14} />
                Recruiter verification
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
            <div className="rounded-xl bg-white/10 p-3">
              <Users size={24} />
            </div>
            <div>
              <p className="text-2xl font-black tabular-nums">
                {loading ? '—' : totalInView.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-indigo-100/75">
                Accounts in this view
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback */}
      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
          <p className="flex-1 leading-6">{notice}</p>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setNotice('')}
            className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100"
          >
            <XCircle size={17} />
          </button>
        </div>
      )}

      {err && (
        <ErrorState message={err} onRetry={load} loading={loading} />
      )}

      {/* Status overview */}
      {list && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                Recruiter overview
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                Registration status
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Counts reflect the currently loaded server response.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard
              label="Pending review"
              value={count('pending')}
              icon={Clock3}
              tone="amber"
            />
            <StatCard
              label="Approved"
              value={count('approved')}
              icon={CheckCircle2}
              tone="emerald"
            />
            <StatCard
              label="Rejected"
              value={count('rejected')}
              icon={XCircle}
              tone="rose"
            />
            <StatCard
              label="Suspended"
              value={count('suspended')}
              icon={ShieldAlert}
              tone="violet"
            />
          </div>
        </section>
      )}

      {/* Recruiter list */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                Directory
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                Recruiter accounts
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Search company details and review registration status.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative block w-full sm:min-w-72 xl:max-w-sm">
                <span className="sr-only">Search recruiter accounts</span>
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search company, name or email..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </label>

              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={loading ? 'animate-spin' : ''}
                />
                Refresh
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
            {TABS.map((item) => {
              const active = tab === item;

              return (
                <button
                  type="button"
                  key={item}
                  onClick={() => setTab(item)}
                  aria-pressed={active}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold capitalize transition focus:outline-none focus:ring-4 focus:ring-indigo-500/10 ${
                    active
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700'
                  }`}
                >
                  {item === 'pending' && <Clock3 size={15} />}
                  {item === 'approved' && <CheckCircle2 size={15} />}
                  {item === 'rejected' && <XCircle size={15} />}
                  {item === 'suspended' && <ShieldAlert size={15} />}
                  {item === 'all' && <Users size={15} />}
                  {item}
                  {list && active && (
                    <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-xs">
                      {totalInView}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {loading && !list && <LoadingState />}

          {!loading && !list && !err && <LoadingState />}

          {list && filtered.length === 0 && (
            <EmptyState
              searching={Boolean(search.trim())}
              onClear={() => setSearch('')}
            />
          )}

          {list && filtered.length > 0 && (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-slate-500">
                  Showing{' '}
                  <strong className="text-slate-900">
                    {filtered.length.toLocaleString('en-IN')}
                  </strong>{' '}
                  of{' '}
                  <strong className="text-slate-900">
                    {list.length.toLocaleString('en-IN')}
                  </strong>{' '}
                  loaded recruiter account(s)
                </p>

                {search.trim() && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900"
                  >
                    <RotateCcw size={13} />
                    Clear search
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {filtered.map((recruiter) => (
                  <RecruiterCard
                    key={recruiter.id}
                    recruiter={recruiter}
                    busy={actionBusy === recruiter.id}
                    onAction={act}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2">
          <ShieldCheck size={15} className="text-indigo-600" />
          Recruiter actions are restricted to administrators.
        </span>

        <button
          type="button"
          disabled={loading}
          onClick={load}
          className="inline-flex items-center gap-1.5 font-bold text-indigo-700 hover:text-indigo-900 disabled:opacity-50"
        >
          <RefreshCw
            size={13}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh recruiter list
        </button>
      </div>
    </div>
  );
}
