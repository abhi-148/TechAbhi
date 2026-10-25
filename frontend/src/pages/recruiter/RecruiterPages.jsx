
import { useCallback, useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Activity,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  LoaderCircle,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import { api } from '../../lib/api';
import { inputCls, fmtDate, publicUrl } from '../../lib/format';

function ErrorBanner({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-rose-200 bg-rose-50 p-4"
    >
      <div className="flex items-start gap-3">
        <CircleAlert
          size={19}
          className="mt-0.5 shrink-0 text-rose-600"
        />

        <div className="min-w-0 flex-1">
          <p className="font-bold text-rose-900">Something went wrong</p>
          <p className="mt-1 break-words text-sm text-rose-700">
            {message}
          </p>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
            >
              <RefreshCw size={14} />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingPanel({ text = 'Loading your workspace...' }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center">
      <LoaderCircle
        size={28}
        className="animate-spin text-indigo-600"
      />
      <p className="mt-3 font-semibold text-slate-800">{text}</p>
      <p className="mt-1 text-sm text-slate-500">
        Please wait a moment.
      </p>
    </div>
  );
}

function PageHero({
  eyebrow,
  title,
  description,
  icon: Icon,
  action,
}) {
  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 px-6 py-8 text-white shadow-xl shadow-indigo-950/10 sm:px-9 sm:py-10">
      <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -right-1 -top-5 h-44 w-44 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />

      <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-indigo-100">
            {Icon && <Icon size={15} />}
            {eyebrow}
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            {title}
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100/85 sm:text-base">
            {description}
          </p>
        </div>

        {action && (
          <div className="relative shrink-0">{action}</div>
        )}
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  note,
  icon: Icon,
  color = 'indigo',
}) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-700',
    violet: 'bg-violet-50 text-violet-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    sky: 'bg-sky-50 text-sky-700',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>

          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            {value ?? 0}
          </p>

          {note && (
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {note}
            </p>
          )}
        </div>

        {Icon && (
          <div className={`rounded-xl p-3 ${tones[color] || tones.indigo}`}>
            <Icon size={21} />
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action = false,
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        {Icon && <Icon size={25} />}
      </div>

      <h3 className="mt-4 font-bold text-slate-900">{title}</h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>

      {action && (
        <Link
          to="/recruiter/jobs/new"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
        >
          <Plus size={16} />
          Create a job
        </Link>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    draft: 'bg-slate-100 text-slate-700 ring-slate-200',
    published: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    closed: 'bg-amber-50 text-amber-700 ring-amber-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold capitalize ring-1 ring-inset ${
        styles[status] || styles.draft
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status || 'Unknown'}
    </span>
  );
}

/* ------------------------- RECRUITER DASHBOARD ------------------------- */

export function RecruiterDashboardPage() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setErr('');

    try {
      const result = await api('/recruiter/dashboard', {
        recruiter: true,
      });

      setData(result);
    } catch (error) {
      setErr(error.message || 'Unable to load the dashboard.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (err && !data) {
    return <ErrorBanner message={err} onRetry={load} />;
  }

  if (!data) {
    return <LoadingPanel text="Loading your hiring overview..." />;
  }

  const applications = data.applications || {};
  const jobs = data.jobs || {};
  const events = data.events || {};
  const recent = Array.isArray(data.recent) ? data.recent : [];

  const totalApplications = Object.entries(applications)
    .filter(([key]) => key !== 'withdrawn')
    .reduce((sum, [, value]) => sum + (Number(value) || 0), 0);

  const jobTotal =
    (Number(jobs.published) || 0) +
    (Number(jobs.draft) || 0) +
    (Number(jobs.closed) || 0);

  return (
    <div className="space-y-7">
      <PageHero
        eyebrow="HIRING OVERVIEW"
        title="Your recruiter dashboard"
        description="Track job performance, review incoming applications, and stay on top of your hiring activity."
        icon={Activity}
        action={
          <Link
            to="/recruiter/jobs/new"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-950 shadow-lg transition hover:bg-indigo-50"
          >
            <Plus size={17} />
            Post a job
          </Link>
        }
      />

      {err && <ErrorBanner message={err} onRetry={load} />}

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              Job overview
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              A snapshot of your current job listings.
            </p>
          </div>

          <Link
            to="/recruiter/jobs"
            className="inline-flex items-center gap-1 text-sm font-bold text-indigo-700 hover:text-indigo-900"
          >
            Manage jobs <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Published jobs"
            value={jobs.published}
            icon={BriefcaseBusiness}
            color="emerald"
          />
          <StatCard
            label="Drafts"
            value={jobs.draft}
            icon={FileText}
            color="amber"
          />
          <StatCard
            label="Closed jobs"
            value={jobs.closed}
            icon={XCircle}
            color="sky"
          />
          <StatCard
            label="All job listings"
            value={jobTotal}
            icon={Building2}
            note="Published, draft and closed"
            color="violet"
          />
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-black text-slate-950">
            Application & engagement
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Understand candidate activity across your job listings.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Applications received"
            value={totalApplications}
            icon={Users}
            note="Submitted through TechAbhi"
            color="indigo"
          />
          <StatCard
            label="New applications"
            value={applications.new}
            icon={Sparkles}
            color="sky"
          />
          <StatCard
            label="Shortlisted"
            value={applications.shortlisted}
            icon={CheckCircle2}
            color="emerald"
          />
          <StatCard
            label="Job page views"
            value={events.view}
            icon={Eye}
            note="One per browser session"
            color="violet"
          />
          <StatCard
            label="External apply clicks"
            value={events.apply_click}
            icon={ExternalLink}
            note="Not confirmed applications"
            color="amber"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              Latest applications
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Recently submitted candidate applications.
            </p>
          </div>

          <Link
            to="/recruiter/applications"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          >
            View all <ArrowUpRight size={16} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="p-5 sm:p-6">
            <EmptyState
              icon={Users}
              title="No applications yet"
              description="When candidates apply to your jobs through TechAbhi, their applications will appear here."
              action
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recent.map((application) => (
              <Link
                key={application.id}
                to="/recruiter/applications"
                className="flex flex-col gap-3 p-4 transition hover:bg-indigo-50/40 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <Users size={19} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">
                      {application.candidate_name || 'Candidate'}
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-500">
                      {application.job_title || 'Job listing'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                    <CalendarDays size={14} />
                    {fmtDate(application.submitted_at)}
                  </span>
                  <ChevronRight size={17} className="text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          to="/recruiter/jobs"
          className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-200 hover:shadow-md"
        >
          <div className="rounded-xl bg-indigo-50 p-3 text-indigo-700">
            <BriefcaseBusiness size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-900">
              Manage job listings
            </h3>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Edit, publish, close, or preview your opportunities.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-indigo-700">
              Open jobs <ChevronRight size={15} />
            </span>
          </div>
        </Link>

        <Link
          to="/recruiter/applications"
          className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-200 hover:shadow-md"
        >
          <div className="rounded-xl bg-violet-50 p-3 text-violet-700">
            <Users size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-900">
              Review candidates
            </h3>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Review candidate details and update application stages.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-indigo-700">
              Open applications <ChevronRight size={15} />
            </span>
          </div>
        </Link>
      </section>
    </div>
  );
}

/* -------------------------- COMPANY PROFILE ---------------------------- */

export function RecruiterProfilePage() {
  const { me } = useOutletContext();

  const [form, setForm] = useState({
    full_name: me?.full_name || '',
    phone: me?.phone || '',
    company_website: me?.company_website || '',
    company_description: me?.company_description || '',
  });

  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm({
      full_name: me?.full_name || '',
      phone: me?.phone || '',
      company_website: me?.company_website || '',
      company_description: me?.company_description || '',
    });
  }, [
    me?.full_name,
    me?.phone,
    me?.company_website,
    me?.company_description,
  ]);

  const updateField = (key) => (event) => {
    setForm((previous) => ({
      ...previous,
      [key]: event.target.value,
    }));

    setMsg('');
    setErr('');
  };

  const save = async (event) => {
    event.preventDefault();

    if (busy) return;

    setBusy(true);
    setMsg('');
    setErr('');

    try {
      await api('/recruiter/profile', {
        method: 'PUT',
        body: form,
        recruiter: true,
      });

      setMsg('Your profile has been saved successfully.');
    } catch (error) {
      setErr(error.message || 'Unable to save your profile.');
    } finally {
      setBusy(false);
    }
  };

  const fieldClass = `${inputCls} w-full rounded-xl border-slate-200 bg-white py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100`;
  const labelClass = 'mb-2 block text-sm font-bold text-slate-700';

  return (
    <div className="space-y-7">
      <PageHero
        eyebrow="YOUR ORGANIZATION"
        title="Company profile"
        description="Keep your recruiter contact details and company information accurate and up to date."
        icon={Building2}
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.8fr)]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <h2 className="text-lg font-black text-slate-950">
              Profile information
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Update the details you can manage directly.
            </p>
          </div>

          <form onSubmit={save} className="space-y-5 p-5 sm:p-6">
            {msg && (
              <div
                role="status"
                className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
              >
                <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
                {msg}
              </div>
            )}

            {err && <ErrorBanner message={err} />}

            <div>
              <label
                className={labelClass}
                htmlFor="recruiter_full_name"
              >
                Your full name
              </label>

              <input
                id="recruiter_full_name"
                className={fieldClass}
                autoComplete="name"
                required
                value={form.full_name}
                onChange={updateField('full_name')}
                placeholder="Your full name"
              />
            </div>

            <div>
              <label
                className={labelClass}
                htmlFor="recruiter_phone"
              >
                Phone number
              </label>

              <input
                id="recruiter_phone"
                className={fieldClass}
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={updateField('phone')}
                placeholder="Contact number"
              />
            </div>

            <div>
              <label
                className={labelClass}
                htmlFor="recruiter_website"
              >
                Company website
              </label>

              <div className="relative">
                <Globe
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="recruiter_website"
                  className={`${fieldClass} pl-10`}
                  type="url"
                  value={form.company_website}
                  onChange={updateField('company_website')}
                  placeholder="https://company.com"
                />
              </div>
            </div>

            <div>
              <label
                className={labelClass}
                htmlFor="recruiter_description"
              >
                About your company
              </label>

              <textarea
                id="recruiter_description"
                className={`${fieldClass} resize-y`}
                rows={5}
                value={form.company_description}
                onChange={updateField('company_description')}
                placeholder="Describe your organization, team, and work..."
              />

              <p className="mt-2 text-xs leading-5 text-slate-400">
                A clear company description helps candidates understand
                your organization.
              </p>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white shadow-lg shadow-indigo-600/15 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {busy ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              {busy ? 'Saving changes...' : 'Save profile'}
            </button>
          </form>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-5 sm:p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-indigo-700 shadow-sm">
              <Building2 size={23} />
            </div>

            <h3 className="mt-4 text-lg font-black text-slate-900">
              Verified account details
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your registered company name and email are managed by
              TechAbhi to help maintain consistent job ownership.
            </p>

            <div className="mt-5 space-y-3 rounded-xl border border-white bg-white/80 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Company name
                </p>
                <p className="mt-1 break-words text-sm font-bold text-slate-900">
                  {me?.company_name || 'Not provided'}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Registered email
                </p>
                <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                  {me?.email || 'Not provided'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-slate-900">
              <ShieldCheck size={19} className="text-emerald-600" />
              <h3 className="font-bold">Profile tip</h3>
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Use a current business website and a concise company
              description so applicants can learn more about your
              organization.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ---------------------------- MY JOBS ---------------------------------- */

const jobStatusLabels = {
  draft: 'Draft',
  published: 'Published',
  closed: 'Closed',
};

export function RecruiterJobsPage() {
  const [jobs, setJobs] = useState(null);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setErr('');

    try {
      const data = await api('/recruiter/jobs', {
        recruiter: true,
      });

      setJobs(Array.isArray(data?.jobs) ? data.jobs : []);
    } catch (error) {
      setErr(error.message || 'Unable to load your jobs.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (job, status) => {
    if (busyId !== null) return;

    setBusyId(job.id);
    setErr('');
    setNote('');

    try {
      await api(`/recruiter/jobs/${job.id}/status`, {
        method: 'POST',
        body: { status },
        recruiter: true,
      });

      setNote(
        `"${job.title}" status updated to ${
          jobStatusLabels[status] || status
        }.`
      );

      await load();
    } catch (error) {
      const details = Array.isArray(error.details)
        ? error.details
        : [];

      setErr(
        [error.message || 'Unable to update the job status.', ...details]
          .filter(Boolean)
          .join('\n')
      );
    } finally {
      setBusyId(null);
    }
  };

  const del = async (job) => {
    if (busyId !== null) return;

    if (!window.confirm(`Delete "${job.title}"?`)) return;

    setBusyId(job.id);
    setErr('');
    setNote('');

    try {
      await api(`/recruiter/jobs/${job.id}`, {
        method: 'DELETE',
        recruiter: true,
      });

      setJobs((previous) =>
        previous?.filter((item) => item.id !== job.id) ?? previous
      );

      setNote(`"${job.title}" was deleted.`);
    } catch (error) {
      setErr(error.message || 'Unable to delete this job.');
    } finally {
      setBusyId(null);
    }
  };

  const copy = async (job) => {
    const link = publicUrl(job);

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard unavailable');
      }

      await navigator.clipboard.writeText(link);
      setNote('Job link copied to clipboard.');
    } catch {
      window.prompt('Copy this job link:', link);
    }
  };

  return (
    <div className="space-y-7">
      <PageHero
        eyebrow="JOB MANAGEMENT"
        title="My jobs"
        description="Create and manage your opportunities, track applications, and share published job listings."
        icon={BriefcaseBusiness}
        action={
          <Link
            to="/recruiter/jobs/new"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-950 shadow-lg transition hover:bg-indigo-50"
          >
            <Plus size={17} />
            New job
          </Link>
        }
      />

      {note && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
          {note}
        </div>
      )}

      {err && <ErrorBanner message={err} onRetry={load} />}

      {!jobs && !err && (
        <LoadingPanel text="Loading your job listings..." />
      )}

      {jobs?.length === 0 && !err && (
        <EmptyState
          icon={BriefcaseBusiness}
          title="Your first job starts here"
          description="Create your first job listing and manage its publication status from this workspace."
          action
        />
      )}

      {jobs?.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Total listings"
              value={jobs.length}
              icon={BriefcaseBusiness}
              color="indigo"
            />

            <StatCard
              label="Published"
              value={
                jobs.filter((job) => job.status === 'published').length
              }
              icon={CheckCircle2}
              color="emerald"
            />

            <StatCard
              label="Applications received"
              value={jobs.reduce(
                (sum, job) => sum + (Number(job.app_count) || 0),
                0
              )}
              icon={Users}
              color="violet"
            />
          </div>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                Your listings
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Manage each job's status, preview its details, or review
                applications.
              </p>
            </div>

            <div className="space-y-4">
              {jobs.map((job) => (
                <article
                  key={job.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                        <BriefcaseBusiness size={22} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="break-words text-lg font-black text-slate-950">
                            {job.title}
                          </h2>
                          <StatusBadge status={job.status} />
                        </div>

                        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <Users size={15} />
                            {job.app_count ?? 0} applications
                          </span>
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                        <FileText size={17} className="text-indigo-600" />
                        <div>
                          <p className="text-lg font-black leading-5 text-slate-900">
                            {job.app_count ?? 0}
                          </p>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            Applicants
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
                      <Link
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        to={`/recruiter/jobs/${job.id}/edit`}
                      >
                        <FileText size={15} />
                        Edit
                      </Link>

                      <Link
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        to={`/recruiter/jobs/${job.id}/preview`}
                      >
                        <Eye size={15} />
                        Preview
                      </Link>

                      <Link
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        to={`/recruiter/applications?job=${encodeURIComponent(
                          job.id
                        )}`}
                      >
                        <Users size={15} />
                        Applications
                      </Link>

                      {job.status !== 'published' ? (
                        <button
                          type="button"
                          disabled={busyId === job.id}
                          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => setStatus(job, 'published')}
                        >
                          {busyId === job.id ? (
                            <LoaderCircle
                              size={15}
                              className="animate-spin"
                            />
                          ) : (
                            <ArrowUpRight size={15} />
                          )}
                          {job.status === 'closed'
                            ? 'Reopen job'
                            : 'Publish job'}
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={busyId === job.id}
                            className="inline-flex items-center gap-2 rounded-xl border border-amber-200 px-3.5 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => setStatus(job, 'draft')}
                          >
                            <FileText size={15} />
                            Unpublish
                          </button>

                          <button
                            type="button"
                            disabled={busyId === job.id}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => setStatus(job, 'closed')}
                          >
                            <XCircle size={15} />
                            Close
                          </button>

                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 px-3.5 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                            onClick={() => copy(job)}
                          >
                            <Copy size={15} />
                            Copy link
                          </button>
                        </>
                      )}

                      {job.status !== 'published' &&
                        Number(job.app_count || 0) === 0 && (
                          <button
                            type="button"
                            disabled={busyId === job.id}
                            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3.5 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => del(job)}
                          >
                            {busyId === job.id ? (
                              <LoaderCircle
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={15} />
                            )}
                            Delete
                          </button>
                        )}
                    </div>
                  </div>

                  {job.status === 'published' && (
                    <div className="flex items-center gap-2 border-t border-emerald-100 bg-emerald-50/60 px-5 py-3 text-xs text-emerald-800 sm:px-6">
                      <CheckCircle2 size={15} />
                      This job is published and available to candidates.
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
