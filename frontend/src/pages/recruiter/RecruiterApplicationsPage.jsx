
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  GraduationCap,
  LoaderCircle,
  Mail,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  XCircle,
} from 'lucide-react';
import { api, REC_KEY } from '../../lib/api';
import { inputCls } from '../../lib/format';

const ST = {
  new: 'New',
  in_review: 'In review',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  rejected: 'Rejected',
  hired: 'Hired',
  withdrawn: 'Withdrawn',
};

const statusStyles = {
  new: 'bg-sky-50 text-sky-700 ring-sky-200',
  in_review: 'bg-amber-50 text-amber-700 ring-amber-200',
  shortlisted: 'bg-violet-50 text-violet-700 ring-violet-200',
  interview: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
  hired: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  withdrawn: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const dateLabel = (value) => {
  if (!value) return 'Not provided';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not provided';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

function StatusBadge({ status }) {
  const style = statusStyles[status] || 'bg-slate-100 text-slate-600 ring-slate-200';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${style}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {ST[status] || status || 'Unknown'}
    </span>
  );
}

function Section({ title, icon: Icon, children }) {
  if (!children) return null;

  return (
    <section className="border-b border-slate-100 py-5 last:border-0">
      <div className="mb-3 flex items-center gap-2">
        {Icon && (
          <span className="rounded-lg bg-indigo-50 p-2 text-indigo-700">
            <Icon size={16} />
          </span>
        )}
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {title}
        </h3>
      </div>
      <div className="text-sm leading-6 text-slate-700">{children}</div>
    </section>
  );
}

function LoadingPanel({ text = 'Loading application...' }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center">
      <LoaderCircle size={28} className="animate-spin text-indigo-600" />
      <p className="mt-3 font-semibold text-slate-800">{text}</p>
      <p className="mt-1 text-sm text-slate-500">Please wait a moment.</p>
    </div>
  );
}

function ErrorPanel({ message, onRetry }) {
  return (
    <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
      <div className="flex items-start gap-3">
        <XCircle size={19} className="mt-0.5 shrink-0 text-rose-600" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-rose-900">Something went wrong</p>
          <p className="mt-1 break-words text-sm text-rose-700">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
            >
              <RefreshCw size={14} /> Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ id, onChanged }) {
  const [application, setApplication] = useState(null);
  const [err, setErr] = useState('');
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setErr('');
    setMsg('');
    setApplication(null);

    try {
      const data = await api('/recruiter/applications/' + id, {
        recruiter: true,
      });
      setApplication(data.application);
      setStatus(data.application.status);
      setNote(data.application.recruiter_note || '');
      onChanged();
    } catch (error) {
      setErr(error.message || 'Unable to load this application.');
    }
  }, [id, onChanged]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setBusy(true);
    setErr('');
    setMsg('');

    try {
      await api('/recruiter/applications/' + id, {
        method: 'PUT',
        body: { status, recruiter_note: note },
        recruiter: true,
      });
      setMsg('Application status and private note saved successfully.');
      await load();
    } catch (error) {
      setErr(error.message || 'Unable to save changes.');
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    setBusy(true);
    setErr('');

    try {
      const response = await fetch(`/api/recruiter/applications/${id}/resume`, {
        headers: {
          Authorization: 'Bearer ' + localStorage.getItem(REC_KEY),
        },
      });

      if (!response.ok) {
        throw new Error(
          response.status === 401 || response.status === 403
            ? 'Your session may have expired. Please sign in again.'
            : 'Resume download failed. Please try again.'
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
    } catch (error) {
      setErr(error.message || 'Unable to download the resume.');
    } finally {
      setBusy(false);
    }
  };

  if (err && !application) {
    return <ErrorPanel message={err} onRetry={load} />;
  }

  if (!application) {
    return <LoadingPanel />;
  }

  if (application.status === 'withdrawn') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-7 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <XCircle size={25} />
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-900">
          Application withdrawn
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This candidate withdrew their application. Their application details
          are no longer available.
        </p>
      </div>
    );
  }

  const profile = application.profile || {};

  return (
    <div className="space-y-5">
      {err && <ErrorPanel message={err} />}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-5 text-white sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white">
              <UserRound size={27} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                Candidate profile
              </p>
              <h2 className="mt-1 break-words text-2xl font-black tracking-tight">
                {application.candidate_name}
              </h2>
              <p className="mt-2 break-all text-sm text-indigo-100">
                {application.candidate_email}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={application.status} />
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-indigo-100">
                  <CalendarDays size={13} />
                  Applied {dateLabel(application.submitted_at)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-5 text-indigo-100">
            <ShieldCheck size={16} className="mt-0.5 shrink-0" />
            <p>
              Review the information the candidate chose to share for this
              application. TechAbhi does not score or rank candidates.
            </p>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-700">
              <BriefcaseBusiness size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Applied role
              </p>
              <p className="mt-1 break-words font-bold text-slate-900">
                {application.job_title}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <Clock3 size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Submitted on
              </p>
              <p className="mt-1 font-bold text-slate-900">
                {dateLabel(application.submitted_at)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-5 sm:px-6">
        <Section title="Candidate's note" icon={FileText}>
          {application.cover_note ? (
            <p className="whitespace-pre-line">{application.cover_note}</p>
          ) : (
            <p className="italic text-slate-400">No cover note provided.</p>
          )}
        </Section>

        <Section title="Professional headline" icon={Sparkles}>
          {profile.headline || <span className="italic text-slate-400">Not provided</span>}
        </Section>

        <Section title="Professional summary" icon={FileText}>
          {profile.summary || <span className="italic text-slate-400">Not provided</span>}
        </Section>

        <Section title="Skills" icon={CheckCircle2}>
          {profile.skills?.length ? (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <span className="italic text-slate-400">No skills listed.</span>
          )}
        </Section>

        <Section title="Education" icon={GraduationCap}>
          {profile.education?.length ? (
            <div className="space-y-3">
              {profile.education.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                >
                  <p className="font-bold text-slate-800">
                    {[item.degree, item.institution].filter(Boolean).join(' · ') || 'Education'}
                  </p>
                  {item.year && <p className="mt-1 text-xs text-slate-500">{item.year}</p>}
                </div>
              ))}
            </div>
          ) : (
            <span className="italic text-slate-400">No education details provided.</span>
          )}
        </Section>

        <Section title="Experience" icon={BriefcaseBusiness}>
          {profile.experience?.length ? (
            <div className="space-y-3">
              {profile.experience.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                >
                  <p className="font-bold text-slate-800">
                    {[item.title, item.company].filter(Boolean).join(' · ') || 'Experience'}
                  </p>
                  {item.period && <p className="mt-1 text-xs text-slate-500">{item.period}</p>}
                  {item.details && <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{item.details}</p>}
                </div>
              ))}
            </div>
          ) : (
            <span className="italic text-slate-400">No experience details provided.</span>
          )}
        </Section>

        <Section title="Projects" icon={Sparkles}>
          {profile.projects?.length ? (
            <div className="space-y-3">
              {profile.projects.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                >
                  <p className="font-bold text-slate-800">{item.name || 'Project'}</p>
                  {item.details && <p className="mt-1 text-sm text-slate-600">{item.details}</p>}
                </div>
              ))}
            </div>
          ) : (
            <span className="italic text-slate-400">No projects provided.</span>
          )}
        </Section>

        {application.resume_text ? (
          <Section title="Resume text" icon={FileText}>
            <details className="group rounded-xl border border-slate-200">
              <summary className="cursor-pointer p-3 font-semibold text-indigo-700 hover:bg-indigo-50">
                View extracted resume text
              </summary>
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words border-t border-slate-100 p-4 text-xs leading-5 text-slate-600">
                {application.resume_text}
              </pre>
            </details>
          </Section>
        ) : (
          <Section title="Resume" icon={FileText}>
            <p className="text-slate-500">No extracted resume text was shared.</p>
          </Section>
        )}

        {application.has_resume_file && (
          <div className="border-t border-slate-100 py-5">
            <button
              type="button"
              disabled={busy}
              onClick={download}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-800 transition hover:bg-indigo-100 disabled:opacity-50 sm:w-auto"
            >
              {busy ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Download size={17} />
              )}
              Download resume PDF
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
        <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white p-2.5 text-indigo-700 shadow-sm">
              <Save size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Review & decision</h3>
              <p className="mt-1 text-sm text-slate-600">
                Update the candidate's application status and your private notes.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-800">
              Application status
            </span>
            <select
              className={`${inputCls} w-full`}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              disabled={busy}
            >
              {Object.entries(ST)
                .filter(([key]) => key !== 'withdrawn')
                .map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
            </select>
            <span className="mt-2 block text-xs leading-5 text-slate-500">
              The candidate can see the application status you set.
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-800">
              Private recruiter note
            </span>
            <textarea
              className={`${inputCls} w-full`}
              rows={4}
              placeholder="Add internal review notes for your team..."
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={busy}
            />
            <span className="mt-2 block text-xs text-slate-500">
              This note is private and is not shown to the candidate.
            </span>
          </label>

          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {busy ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}
            Save changes
          </button>

          {msg && (
            <p role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
              {msg}
            </p>
          )}
        </div>
      </div>

      <p className="flex items-start gap-2 px-1 text-xs leading-5 text-slate-500">
        <ShieldCheck size={15} className="mt-0.5 shrink-0" />
        Assess candidates using relevant job requirements and your own review. Contact candidates directly by email for next steps.
      </p>
    </div>
  );
}

export default function RecruiterApplicationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [list, setList] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [err, setErr] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');

  const query = searchParams.toString();

  const load = useCallback(async () => {
    setErr('');

    try {
      const normalizedQuery = query.replace(/(^|&)job=/, '$1job_id=');
      const data = await api(
        '/recruiter/applications' + (normalizedQuery ? '?' + normalizedQuery : ''),
        { recruiter: true }
      );
      setList(data.applications);
    } catch (error) {
      setErr(error.message || 'Unable to load applications.');
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api('/recruiter/jobs', { recruiter: true })
      .then((data) => setJobs(data.jobs))
      .catch(() => {});
  }, []);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
    setSelectedId(null);
  };

  const filteredList = (list || []).filter((application) => {
    const queryText = search.trim().toLowerCase();
    if (!queryText) return true;

    return [
      application.candidate_name,
      application.candidate_email,
      application.job_title,
    ].some((value) => String(value || '').toLowerCase().includes(queryText));
  });

  const newCount = (list || []).filter((item) => item.status === 'new').length;
  const shortlistedCount = (list || []).filter((item) => item.status === 'shortlisted').length;
  const interviewCount = (list || []).filter((item) => item.status === 'interview').length;

  const selectedApplication = filteredList.find((item) => item.id === selectedId);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7 pb-10">
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 px-6 py-8 text-white shadow-xl shadow-indigo-950/10 sm:px-9 sm:py-10">
        <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-1 -top-5 h-44 w-44 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-indigo-100">
              <Users size={15} />
              RECRUITER WORKSPACE
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Applications
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100/85 sm:text-base">
              Review candidate profiles, manage application stages, and keep your hiring workflow organized.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
            <div className="rounded-xl bg-white/10 p-2.5">
              <BriefcaseBusiness size={22} />
            </div>
            <div>
              <p className="text-2xl font-black">{list?.length ?? '—'}</p>
              <p className="text-xs text-indigo-100">Applications</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700"><Users size={20} /></div>
            <div>
              <p className="text-sm text-slate-500">Total applications</p>
              <p className="text-2xl font-black text-slate-900">{list?.length ?? '—'}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-sky-50 p-2.5 text-sky-700"><Sparkles size={20} /></div>
            <div>
              <p className="text-sm text-slate-500">New applications</p>
              <p className="text-2xl font-black text-slate-900">{list ? newCount : '—'}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-50 p-2.5 text-violet-700"><CheckCircle2 size={20} /></div>
            <div>
              <p className="text-sm text-slate-500">Shortlisted</p>
              <p className="text-2xl font-black text-slate-900">{list ? shortlistedCount : '—'}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><CalendarDays size={20} /></div>
            <div>
              <p className="text-sm text-slate-500">Interviews</p>
              <p className="text-2xl font-black text-slate-900">{list ? interviewCount : '—'}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="font-bold text-slate-900">Find applications</h2>
          <p className="text-sm text-slate-500">Filter by job or status, or search by candidate name and email.</p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="relative block">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className={`${inputCls} w-full pl-10`}
              placeholder="Search candidates..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <select
            className={`${inputCls} w-full`}
            value={searchParams.get('job') || ''}
            onChange={(event) => updateFilter('job', event.target.value)}
          >
            <option value="">All jobs</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>

          <select
            className={`${inputCls} w-full`}
            value={searchParams.get('status') || ''}
            onChange={(event) => updateFilter('status', event.target.value)}
          >
            <option value="">All statuses</option>
            {Object.entries(ST).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-500">
            Showing <strong className="text-slate-800">{filteredList.length}</strong> of{' '}
            <strong className="text-slate-800">{list?.length ?? 0}</strong> applications
          </p>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw size={15} /> Refresh list
          </button>
        </div>
      </section>

      {err && <ErrorPanel message={err} onRetry={load} />}

      {!list && !err && <LoadingPanel text="Loading recruiter applications..." />}

      {list?.length === 0 && !err && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <FileText size={29} />
          </div>
          <h2 className="mt-5 text-lg font-bold text-slate-900">No applications yet</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
            Candidates who apply through TechAbhi will appear here. Candidates who follow an external application link are not visible in this list.
          </p>
        </div>
      )}

      {list?.length > 0 && filteredList.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <Search className="mx-auto text-slate-400" size={27} />
          <p className="mt-3 font-bold text-slate-900">No matching candidates</p>
          <p className="mt-1 text-sm text-slate-500">Try another search term or change your filters.</p>
        </div>
      )}

      {filteredList.length > 0 && (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.5fr)]">
          <section className="min-w-0 space-y-3">
            <div className="flex items-end justify-between gap-2 px-1">
              <div>
                <h2 className="font-bold text-slate-900">Candidate inbox</h2>
                <p className="mt-1 text-xs text-slate-500">Select a candidate to review details.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                {filteredList.length}
              </span>
            </div>

            <div className="space-y-2">
              {filteredList.map((application) => {
                const selected = selectedId === application.id;

                return (
                  <button
                    key={application.id}
                    type="button"
                    onClick={() => setSelectedId(application.id)}
                    className={`block w-full rounded-2xl border p-4 text-left transition ${
                      selected
                        ? 'border-indigo-300 bg-indigo-50/70 shadow-md shadow-indigo-950/5'
                        : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        selected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <UserRound size={20} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="break-words font-bold text-slate-900">
                            {application.candidate_name}
                          </p>
                          {application.status === 'new' && !application.viewed_at && (
                            <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-sky-700">
                              New
                            </span>
                          )}
                        </div>

                        <p className="mt-1 break-words text-xs text-slate-500">
                          {application.job_title}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <StatusBadge status={application.status} />
                          <span className="text-[11px] text-slate-400">
                            {dateLabel(application.submitted_at)}
                          </span>
                        </div>
                      </div>

                      <ChevronRight
                        size={17}
                        className={`mt-1 shrink-0 ${selected ? 'text-indigo-600' : 'text-slate-300'}`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="min-w-0">
            {selectedApplication ? (
              <Detail
                key={selectedId}
                id={selectedId}
                onChanged={load}
              />
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <div className="rounded-2xl bg-indigo-50 p-4 text-indigo-600">
                  <UserRound size={28} />
                </div>
                <h3 className="mt-4 font-bold text-slate-900">Select an application</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Candidate information, resume details, and review controls will appear here.
                </p>
              </div>
            )}
          </section>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <ShieldCheck size={19} className="mt-0.5 shrink-0" />
        <p>
          <strong>Responsible hiring:</strong> Use candidate information only to assess the relevant application. Keep private notes professional and job-related, and make decisions based on your own review.
        </p>
      </div>
    </div>
  );
}
