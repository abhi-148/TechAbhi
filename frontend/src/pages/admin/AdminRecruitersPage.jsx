
import { useCallback, useEffect, useState } from 'react';
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
} from 'lucide-react';
import { api } from '../../lib/api';
import { btnGhost, fmtDate, safeHttp } from '../../lib/format';

const TABS = ['pending', 'approved', 'rejected', 'suspended', 'all'];

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  approved: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  rejected: 'bg-rose-50 text-rose-800 ring-rose-200',
  suspended: 'bg-slate-100 text-slate-700 ring-slate-200',
};

function StatusBadge({ status }) {
  const Icon = status === 'approved'
    ? CheckCircle2
    : status === 'pending'
      ? Clock3
      : status === 'suspended'
        ? ShieldAlert
        : XCircle;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold capitalize ring-1 ring-inset ${STATUS_STYLES[status] || 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
      <Icon size={13} />
      {status}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, tone = 'indigo' }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`rounded-xl p-3 ${tones[tone]}`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-black text-slate-950">{value}</p>
          <p className="text-xs font-medium text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <LoaderCircle size={28} className="animate-spin text-indigo-600" />
      <p className="mt-3 font-bold text-slate-800">Loading recruiter accounts</p>
      <p className="mt-1 text-sm text-slate-500">Fetching the latest registrations...</p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-rose-600" />
        <div className="flex-1">
          <p className="font-bold text-rose-900">Could not load recruiters</p>
          <p className="mt-1 break-words text-sm text-rose-800">{message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-rose-800 hover:text-rose-950"
          >
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminRecruitersPage() {
  const [tab, setTab] = useState('pending');
  const [list, setList] = useState(null);
  const [err, setErr] = useState('');
  const [actionBusy, setActionBusy] = useState(null);
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setErr('');
    setList(null);

    try {
      const data = await api(
        '/admin/recruiters' + (tab === 'all' ? '' : '?status=' + tab),
        { admin: true }
      );
      setList(data.recruiters);
    } catch (error) {
      setErr(error.message || 'Unable to fetch recruiter accounts.');
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (recruiter, status) => {
    let reason = '';

    if (status === 'rejected' || status === 'suspended') {
      reason = window.prompt(
        `Reason for ${status === 'rejected' ? 'rejecting' : 'suspending'} ${recruiter.company_name} (the recruiter will see this):`
      );

      if (!reason?.trim()) return;
    }

    const actionLabel = status === 'approved'
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
      const result = await api(`/admin/recruiters/${recruiter.id}/status`, {
        method: 'POST',
        body: { status, reason },
        admin: true,
      });

      setNotice(
        `${recruiter.company_name} was ${actionLabel}.` +
        (result.jobs_closed ? ` ${result.jobs_closed} live job(s) were closed.` : '')
      );

      await load();
    } catch (error) {
      setErr(error.message || 'Unable to update recruiter status.');
    } finally {
      setActionBusy(null);
    }
  };

  const filtered = (list || []).filter((recruiter) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;

    return [
      recruiter.company_name,
      recruiter.full_name,
      recruiter.email,
      recruiter.phone,
      recruiter.company_website,
    ].some((value) => String(value || '').toLowerCase().includes(term));
  });

  const count = (status) => (list || []).filter((r) => r.status === status).length;

  return (
    <div className="space-y-7">
      {/* Page hero */}
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-6 text-white shadow-xl shadow-indigo-950/10 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-indigo-100">
              <ShieldCheck size={15} /> ADMIN CONTROL CENTER
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Recruiter management<span className="text-violet-300">.</span>
            </h1>
            <p className="mt-3 text-sm leading-6 text-indigo-100/80 sm:text-base">
              Review company registrations, verify business details, and manage recruiter access to the platform.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-4">
            <div className="rounded-xl bg-white/10 p-3">
              <Building2 size={23} />
            </div>
            <div>
              <p className="text-2xl font-black">{list?.length ?? '—'}</p>
              <p className="text-xs text-indigo-100/75">Accounts in this view</p>
            </div>
          </div>
        </div>
      </section>

      {notice && (
        <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <p>{notice}</p>
        </div>
      )}

      {err && <ErrorState message={err} onRetry={load} />}

      {/* Status overview */}
      {list && (
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard label="Pending review" value={count('pending')} icon={Clock3} tone="amber" />
          <StatCard label="Approved" value={count('approved')} icon={CheckCircle2} tone="emerald" />
          <StatCard label="Rejected" value={count('rejected')} icon={XCircle} tone="rose" />
          <StatCard label="Suspended" value={count('suspended')} icon={ShieldAlert} />
        </section>
      )}

      {/* Filters and recruiter list */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-lg font-black text-slate-950">Recruiter accounts</h2>
              <p className="mt-1 text-sm text-slate-500">
                Verify company details before approving new accounts.
              </p>
            </div>

            <div className="relative w-full lg:max-w-xs">
              <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search company, name or email..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {TABS.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setTab(item)}
                className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold capitalize transition ${
                  tab === item
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700'
                }`}
              >
                {item}
                {item !== 'all' && list && tab === item && (
                  <span className="ml-2 opacity-75">{count(item)}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {!list && !err && <LoadingState />}

          {list && filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                {search ? <Search size={25} /> : <Building2 size={25} />}
              </div>
              <h3 className="mt-4 font-bold text-slate-900">
                {search ? 'No matching recruiters' : 'No recruiters in this category'}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {search
                  ? 'Try searching with a different company name, email, or recruiter name.'
                  : 'Recruiter registrations matching this status will appear here.'}
              </p>
            </div>
          )}

          {filtered.length > 0 && list && (
            <div className="space-y-4">
              {filtered.map((recruiter) => {
                const busy = actionBusy === recruiter.id;
                const website = safeHttp(recruiter.company_website);

                return (
                  <article
                    key={recruiter.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 transition hover:border-indigo-200 hover:shadow-sm"
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-600/15">
                          <Building2 size={22} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="break-words text-lg font-black text-slate-950">
                              {recruiter.company_name}
                            </h3>
                            <StatusBadge status={recruiter.status} />
                          </div>

                          <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                            <p className="flex min-w-0 items-start gap-2">
                              <UserRound size={16} className="mt-0.5 shrink-0 text-slate-400" />
                              <span className="break-words">{recruiter.full_name}</span>
                            </p>
                            <p className="flex min-w-0 items-start gap-2">
                              <BriefcaseBusiness size={16} className="mt-0.5 shrink-0 text-slate-400" />
                              <span>{recruiter.job_count ?? 0} job(s)</span>
                            </p>
                            <p className="flex min-w-0 items-start gap-2">
                              <span className="mt-0.5 text-slate-400">@</span>
                              <span className="break-all">{recruiter.email}</span>
                            </p>
                            {recruiter.phone && (
                              <p className="flex min-w-0 items-start gap-2">
                                <span className="text-slate-400">☎</span>
                                <span>{recruiter.phone}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Registered</p>
                          <p className="mt-1 text-xs font-semibold text-slate-700">{fmtDate(recruiter.created_at)}</p>
                        </div>
                      </div>

                      {website && (
                        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">Company website</p>
                          <a
                            className="inline-flex max-w-full items-center gap-2 break-all text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                            href={website}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                          >
                            <Globe size={15} className="shrink-0" />
                            {recruiter.company_website}
                            <ExternalLink size={13} className="shrink-0" />
                          </a>
                        </div>
                      )}

                      {recruiter.company_description && (
                        <div className="mt-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">About the company</p>
                          <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">
                            {recruiter.company_description}
                          </p>
                        </div>
                      )}

                      {recruiter.status_reason && (
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-800">
                            <ShieldAlert size={14} /> Status reason
                          </p>
                          <p className="mt-1 whitespace-pre-line text-sm leading-5 text-amber-900">
                            {recruiter.status_reason}
                          </p>
                        </div>
                      )}

                      <div className="mt-5 flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 p-3">
                        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-indigo-700" />
                        <p className="text-xs leading-5 text-indigo-900">
                          <strong>Verification checklist:</strong> Check the company website, business email domain, LinkedIn presence, and legitimacy of the organization before approving.
                        </p>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                        {recruiter.status !== 'approved' && (
                          <button
                            type="button"
                            disabled={busy}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => act(recruiter, 'approved')}
                          >
                            {busy ? <LoaderCircle size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                            Approve recruiter
                          </button>
                        )}

                        {recruiter.status === 'pending' && (
                          <button
                            type="button"
                            disabled={busy}
                            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                            onClick={() => act(recruiter, 'rejected')}
                          >
                            <XCircle size={15} /> Reject
                          </button>
                        )}

                        {recruiter.status === 'approved' && (
                          <button
                            type="button"
                            disabled={busy}
                            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                            onClick={() => act(recruiter, 'suspended')}
                          >
                            <ShieldAlert size={15} /> Suspend account
                          </button>
                        )}

                        {recruiter.status === 'suspended' && (
                          <p className="flex items-center gap-2 text-xs text-slate-500">
                            <ShieldAlert size={15} />
                            This account is suspended. Review its details before taking further action.
                          </p>
                        )}
                      </div>

                      {recruiter.status === 'approved' && (
                        <p className="mt-3 text-xs leading-5 text-rose-700">
                          Suspending this recruiter will close their live jobs.
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <span className="flex items-center gap-2"><ShieldCheck size={15} /> Recruiter actions are restricted to admins.</span>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 font-bold text-indigo-700 hover:text-indigo-900"
        >
          <RefreshCw size={13} /> Refresh list
        </button>
      </div>
    </div>
  );
}
