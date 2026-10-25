
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronRight,
  Clock3,
  FileSearch,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { api, track } from '../lib/api';
import { useMeta } from '../lib/format';
import JobView from '../components/JobView';
import JobCard from '../components/JobCard';

function PageContainer({ children }) {
  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      {children}
    </main>
  );
}

function BackToJobs() {
  return (
    <Link
      to="/jobs"
      className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-700"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition group-hover:border-indigo-200 group-hover:bg-indigo-50">
        <ArrowLeft size={16} />
      </span>
      Back to opportunities
    </Link>
  );
}

function LoadingPage() {
  return (
    <PageContainer>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="h-5 w-44 animate-pulse rounded-lg bg-slate-200" />

        <div className="mt-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="h-1.5 animate-pulse bg-gradient-to-r from-indigo-200 to-violet-200" />

          <div className="p-6 sm:p-10">
            <div className="h-5 w-32 animate-pulse rounded bg-slate-100" />
            <div className="mt-5 h-10 max-w-xl animate-pulse rounded-xl bg-slate-200" />
            <div className="mt-4 h-5 max-w-sm animate-pulse rounded bg-slate-100" />

            <div className="mt-8 flex flex-wrap gap-3">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-10 w-28 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="h-[440px] animate-pulse rounded-3xl border border-slate-200 bg-white" />
          <div className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-white" />
        </div>
      </div>
    </PageContainer>
  );
}

function StatusPage({
  title,
  description,
  icon: Icon,
  action,
  onRetry,
}) {
  return (
    <PageContainer>
      <div className="flex min-h-[65vh] items-center justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Icon size={29} strokeWidth={1.7} />
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
            TECHABHI OPPORTUNITIES
          </p>

          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
            {title}
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-500">
            {description}
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
              >
                <RefreshCw size={16} />
                Try again
              </button>
            )}

            <Link
              to={action?.to || '/jobs'}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              {action?.label || 'Browse jobs'}
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function JobHero({ job }) {
  return (
    <section className="relative isolate overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/70 to-violet-50/80 shadow-sm">
      <div className="pointer-events-none absolute -right-20 -top-24 -z-10 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 -z-10 h-60 w-60 rounded-full bg-violet-200/30 blur-3xl" />

      <div className="relative p-6 sm:p-9 lg:p-11">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-white/90 px-3 py-1.5 text-xs font-bold text-indigo-700">
            <Sparkles size={13} />
            Job opportunity
          </span>

          {job.work_mode && (
            <span className="rounded-full border border-white bg-white/80 px-3 py-1.5 text-xs font-semibold capitalize text-slate-600">
              {String(job.work_mode).replaceAll('_', ' ')}
            </span>
          )}

          {job.employment_type && (
            <span className="rounded-full border border-white bg-white/80 px-3 py-1.5 text-xs font-semibold capitalize text-slate-600">
              {String(job.employment_type).replaceAll('_', ' ')}
            </span>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white bg-white text-indigo-600 shadow-sm sm:h-20 sm:w-20">
            <Building2 size={32} strokeWidth={1.5} />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="break-words text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-[2.75rem]">
              {job.title || 'Job opportunity'}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600 sm:text-base">
              {job.company && (
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                  <BriefcaseBusiness size={16} className="text-indigo-600" />
                  <span className="break-words">{job.company}</span>
                </span>
              )}

              {job.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={16} className="shrink-0 text-slate-400" />
                  {job.location}
                </span>
              )}
            </div>

            <div className="mt-5 inline-flex max-w-full items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800">
              <span className="shrink-0">
                <BriefcaseBusiness size={17} />
              </span>
              <span className="break-words">
                {job.salary || 'Salary not disclosed'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-3 border-t border-indigo-100/80 pt-6 sm:grid-cols-2 lg:grid-cols-3">
          {job.experience && (
            <HeroFact
              label="Experience"
              value={job.experience}
              icon={ShieldCheck}
            />
          )}

          {job.education && (
            <HeroFact
              label="Education"
              value={job.education}
              icon={Building2}
            />
          )}

          {job.published_at && (
            <HeroFact
              label="Posted on"
              value={formatDate(job.published_at)}
              icon={CalendarDays}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function HeroFact({ label, value, icon: Icon }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-white/90 bg-white/75 p-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <Icon size={18} />
      </span>

      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-bold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function ApplicationNote() {
  return (
    <aside className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
          <ShieldCheck size={21} />
        </span>

        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Apply with confidence
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Review the role details, eligibility and application instructions
            before submitting your application.
          </p>
        </div>
      </div>
    </aside>
  );
}

export function NotFound({
  title = 'Page not found',
  text = "We couldn't find what you were looking for.",
}) {
  useMeta(`${title} | TechAbhi`);

  return (
    <StatusPage
      title={title}
      description={text}
      icon={FileSearch}
      action={{ to: '/jobs', label: 'Browse open jobs' }}
    />
  );
}

export default function JobDetailsPage() {
  const { id } = useParams();

  const [state, setState] = useState({ loading: true });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;

    setState({ loading: true });

    api(`/jobs/${id}`)
      .then((data) => {
        if (!active) return;

        const job = data?.job;

        setState({
          job,
          related: Array.isArray(data?.related) ? data.related : [],
        });

        if (job) {
          try {
            const key = `viewed_${id}`;

            if (!sessionStorage.getItem(key)) {
              sessionStorage.setItem(key, '1');
              track(id, 'view');
            }
          } catch {
            // Job details remain available if session storage is unavailable.
          }
        }
      })
      .catch((error) => {
        if (active) setState({ error });
      });

    return () => {
      active = false;
    };
  }, [id, retryKey]);

  const job = state.job;

  useMeta(
    job
      ? `${job.title}${job.company ? ` at ${job.company}` : ''} | TechAbhi`
      : 'Job Details | TechAbhi',
    job?.description?.slice(0, 155)
  );

  if (state.loading) return <LoadingPage />;

  if (state.error?.status === 410) {
    return (
      <StatusPage
        title="This opportunity has closed"
        description="This job is no longer accepting applications. Explore other openings to find your next opportunity."
        icon={Clock3}
      />
    );
  }

  if (state.error?.status === 404) {
    return (
      <StatusPage
        title="Job not found"
        description="This job may have been removed or is not currently published. You can explore other available opportunities."
        icon={FileSearch}
      />
    );
  }

  if (state.error) {
    return (
      <StatusPage
        title="We couldn't load this job"
        description="Something interrupted the request. Check your connection and try again."
        icon={RefreshCw}
        onRetry={() => setRetryKey((value) => value + 1)}
      />
    );
  }

  if (!job) {
    return (
      <StatusPage
        title="Job details unavailable"
        description="We couldn't find the details for this opportunity."
        icon={FileSearch}
      />
    );
  }

  const related = Array.isArray(state.related) ? state.related : [];

  return (
    <PageContainer>
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-6">
          <BackToJobs />
        </div>

        <JobHero job={job} />

        {/* JobView owns the full description and application sidebar. */}
        <section className="mt-8">
          <JobView job={job} />
        </section>

        <div className="mt-6">
          <ApplicationNote />
        </div>

        {job.expires_at && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <CalendarDays size={18} />
            </span>

            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Application deadline
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {formatDate(job.expires_at)}
              </p>
            </div>
          </div>
        )}

        {related.length > 0 && (
          <section className="mt-16 border-t border-slate-200 pt-10 sm:mt-20 sm:pt-12">
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                  KEEP EXPLORING
                </p>

                <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                  More opportunities for you
                </h2>

                <p className="mt-2 text-sm text-slate-500 sm:text-base">
                  Take a look at other available roles.
                </p>
              </div>

              <Link
                to="/jobs"
                className="inline-flex w-fit items-center gap-2 text-sm font-bold text-indigo-600 transition hover:text-indigo-800"
              >
                View all jobs
                <ChevronRight size={17} />
              </Link>
            </div>

            <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((relatedJob) => (
                <JobCard key={relatedJob.id} job={relatedJob} />
              ))}
            </div>
          </section>
        )}

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-5 sm:p-6">
          <div>
            <h2 className="font-extrabold text-slate-900">
              Still exploring your next move?
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Discover more roles that match your career goals.
            </p>
          </div>

          <Link
            to="/jobs"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            Browse all jobs
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
