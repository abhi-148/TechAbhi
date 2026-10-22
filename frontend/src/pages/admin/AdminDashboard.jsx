
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  LoaderCircle,
  MousePointerClick,
  Plus,
  RefreshCw,
  Share2,
  ShieldCheck,
  Users,
  UserRoundCheck,
  XCircle,
} from 'lucide-react';
import { api } from '../../lib/api';
import { fmtDate } from '../../lib/format';

const StatCard = ({ label, value, note, icon: Icon, tone = 'indigo' }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    violet: 'bg-violet-50 text-violet-700 ring-violet-100',
    sky: 'bg-sky-50 text-sky-700 ring-sky-100',
    rose: 'bg-rose-50 text-rose-700 ring-rose-100',
  };

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={`rounded-xl p-2.5 ring-1 ${colors[tone]}`}>
          <Icon size={20} />
        </div>
        <Activity size={16} className="text-slate-300 transition group-hover:text-indigo-400" />
      </div>
      <p className="mt-4 text-3xl font-black tracking-tight text-slate-950">
        {value ?? 0}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
      {note && <p className="mt-2 text-xs leading-5 text-slate-400">{note}</p>}
    </div>
  );
};

function SectionTitle({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950 sm:text-xl">
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <div className="rounded-2xl bg-indigo-50 p-4 text-indigo-600">
        <LoaderCircle size={28} className="animate-spin" />
      </div>
      <p className="mt-4 font-bold text-slate-800">Loading your dashboard</p>
      <p className="mt-1 text-sm text-slate-500">Fetching the latest platform statistics...</p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="rounded-2xl border border-rose-200 bg-white p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-rose-50 p-3 text-rose-600">
          <XCircle size={22} />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-slate-900">Dashboard couldn't load</h2>
          <p className="mt-1 break-words text-sm text-slate-600">{message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            <RefreshCw size={15} /> Try again
          </button>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ to, icon: Icon, title, description, tone = 'indigo' }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white',
    violet: 'bg-violet-50 text-violet-700 group-hover:bg-violet-600 group-hover:text-white',
    sky: 'bg-sky-50 text-sky-700 group-hover:bg-sky-600 group-hover:text-white',
    emerald: 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white',
  };

  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
    >
      <div className={`rounded-xl p-3 transition ${tones[tone]}`}>
        <Icon size={21} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      <ArrowRight size={17} className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-600" />
    </Link>
  );
}

export default function AdminDashboard() {
  const [s, setS] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setErr('');

    try {
      const data = await api('/admin/stats', { admin: true });
      setS(data);
    } catch (e) {
      setErr(e.message || 'Unable to fetch dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading && !s) return <LoadingState />;
  if (err && !s) return <ErrorState message={err} onRetry={load} />;

  const jobs = [
    { label: 'Published', value: s.published, tone: 'emerald', icon: CheckCircle2 },
    { label: 'Drafts', value: s.draft, tone: 'amber', icon: FileText },
    { label: 'Closed', value: s.closed, tone: 'rose', icon: XCircle },
    { label: 'Expired', value: s.expired, tone: 'sky', icon: Clock3 },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Welcome banner */}
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-6 text-white shadow-xl shadow-indigo-950/10 sm:p-8 lg:p-9">
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-28 right-1/4 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-indigo-100">
              <ShieldCheck size={14} /> TECHABHI ADMIN CONSOLE
            </div>
            <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
              Dashboard overview<span className="text-violet-300">.</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100/80 sm:text-base">
              Monitor job listings, platform activity, candidate accounts and recruiter approvals from one place.
            </p>
          </div>
          <Link
            to="/admin/jobs/new"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-indigo-950 shadow-lg transition hover:bg-indigo-50"
          >
            <Plus size={18} /> Create a job
          </Link>
        </div>
      </section>

      {err && <ErrorState message={err} onRetry={load} />}

      {/* Main metrics */}
      <section className="space-y-4">
        <SectionTitle
          eyebrow="Platform performance"
          title="At a glance"
          description="Current totals reported by TechAbhi."
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total jobs" value={s.total} icon={BriefcaseBusiness} tone="indigo" />
          <StatCard label="Published jobs" value={s.published} icon={CheckCircle2} tone="emerald" />
          <StatCard label="Candidate accounts" value={s.candidates} icon={Users} tone="violet" />
          <StatCard label="Pending recruiters" value={s.pending_recruiters} icon={Building2} tone="amber" note="Awaiting approval" />
        </div>
      </section>

      {/* Job status breakdown */}
      <section className="space-y-4">
        <SectionTitle
          eyebrow="Job management"
          title="Listing status"
          description="A quick breakdown of job publishing states."
          action={
            <Link to="/admin/jobs" className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-700 hover:text-indigo-900">
              Manage jobs <ArrowRight size={15} />
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {jobs.map((item) => (
            <StatCard
              key={item.label}
              label={item.label}
              value={item.value}
              icon={item.icon}
              tone={item.tone}
            />
          ))}
        </div>
      </section>

      {/* Activity metrics */}
      <section className="space-y-4">
        <SectionTitle
          eyebrow="Engagement"
          title="Platform activity"
          description="Understand how people are interacting with your job listings."
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Job page views"
            value={s.views}
            icon={Eye}
            tone="sky"
            note="One view per browser session per job"
          />
          <StatCard
            label="Apply link clicks"
            value={s.apply_clicks}
            icon={MousePointerClick}
            tone="violet"
            note="Employer link opened; not a confirmed application"
          />
          <StatCard
            label="Share clicks"
            value={s.shares}
            icon={Share2}
            tone="emerald"
          />
          <StatCard
            label="Tracked applications"
            value={s.tracked_applications}
            icon={UserRoundCheck}
            tone="indigo"
            note="Candidate-tracked; not employer-confirmed"
          />
          <StatCard
            label="New assistance requests"
            value={s.new_assistance_requests}
            icon={Users}
            tone="amber"
          />
          <StatCard
            label="Recruiters awaiting approval"
            value={s.pending_recruiters}
            icon={Building2}
            tone="rose"
          />
        </div>
      </section>

      {/* Latest published jobs */}
      <section className="space-y-4">
        <SectionTitle
          eyebrow="Recently published"
          title="Latest jobs"
          description="The most recent jobs returned by your admin dashboard."
          action={
            <Link to="/admin/jobs" className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-700 hover:text-indigo-900">
              View all jobs <ArrowRight size={15} />
            </Link>
          }
        />

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {s.latest.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <BriefcaseBusiness size={26} />
              </div>
              <h3 className="mt-4 font-bold text-slate-900">No published jobs yet</h3>
              <p className="mt-1 text-sm text-slate-500">Create your first listing to get started.</p>
              <Link
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
                to="/admin/jobs/new"
              >
                <Plus size={16} /> Create first job
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {s.latest.map((job) => (
                <div key={job.id} className="flex flex-wrap items-center gap-3 p-4 transition hover:bg-slate-50 sm:px-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <BriefcaseBusiness size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      className="font-bold text-slate-900 hover:text-indigo-700"
                      to={`/admin/jobs/${job.id}/preview`}
                    >
                      {job.title}
                    </Link>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      {job.company && <><Building2 size={13} /> {job.company}<span className="mx-1">·</span></>}
                      <Clock3 size={13} /> Published {fmtDate(job.published_at)}
                    </p>
                  </div>
                  <Link
                    to={`/admin/jobs/${job.id}/preview`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    Preview <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Quick navigation */}
      <section className="space-y-4">
        <SectionTitle
          eyebrow="Shortcuts"
          title="Quick actions"
          description="Jump directly to the areas that need your attention."
        />
        <div className="grid gap-3 md:grid-cols-2">
          <QuickAction
            to="/admin/jobs/new"
            icon={Plus}
            title="Create a job"
            description="Add a new opportunity to the platform."
            tone="indigo"
          />
          <QuickAction
            to="/admin/jobs"
            icon={BriefcaseBusiness}
            title="Manage jobs"
            description="Review, edit and manage job listings."
            tone="violet"
          />
          <QuickAction
            to="/admin/recruiters"
            icon={Building2}
            title="Recruiter approvals"
            description={`${s.pending_recruiters ?? 0} recruiter account(s) awaiting approval.`}
            tone="sky"
          />
          <QuickAction
            to="/admin/assistance"
            icon={Users}
            title="Career assistance"
            description={`${s.new_assistance_requests ?? 0} new candidate assistance request(s).`}
            tone="emerald"
          />
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2"><ShieldCheck size={15} /> Admin-only platform statistics</span>
        <button type="button" onClick={load} className="inline-flex items-center gap-1.5 font-bold text-indigo-700 hover:text-indigo-900">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh dashboard
        </button>
      </div>
    </div>
  );
}
