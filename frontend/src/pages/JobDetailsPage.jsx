
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileSearch,
  GraduationCap,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wifi,
} from 'lucide-react';

import { api, track } from '../lib/api';
import { useMeta } from '../lib/format';
import JobView from '../components/JobView';
import JobCard from '../components/JobCard';

function PageContainer({ children }) {
  return (
    <main className="min-h-screen bg-[#f8f9fd] text-slate-900">
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
      <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white transition group-hover:border-indigo-200 group-hover:bg-indigo-50">
        <ArrowLeft size={16} />
      </span>
      Back to opportunities
    </Link>
  );
}

function LoadingPage() {
  return (
    <PageContainer>
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="h-5 w-44 animate-pulse rounded-lg bg-slate-200" />

        <div className="mt-7 overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="h-2 animate-pulse bg-indigo-100" />
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

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="h-80 animate-pulse rounded-3xl border border-slate-200 bg-white" />
          <div className="h-64 animate-pulse rounded-3xl border border-slate-200 bg-white" />
        </div>
      </div>
    </PageContainer>
  );
}

function StatusPage({ title, description, icon: Icon, action, onRetry }) {
  return (
    <PageContainer>
      <div className="mx-auto flex min-h-[65vh] max-w-7xl items-center justify-center px-5 py-16 sm:px-8">
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
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100"
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

function getJobFacts(job) {
  const facts = [
    {
      icon: MapPin,
      label: 'Location',
      value: job.location,
    },
    {
      icon: BriefcaseBusiness,
      label: 'Employment',
      value: job.employment_type,
    },
    {
      icon: Wifi,
      label: 'Work mode',
      value: job.work_mode,
    },
    {
      icon: GraduationCap,
      label: 'Experience',
      value: job.experience,
    },
  ];

  return facts.filter(
    (fact) =>
      fact.value &&
      String(fact.value).trim() &&
      String(fact.value).toLowerCase() !== 'null'
  );
}

function formatLabel(value) {
  if (!value) return '';
  return String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function JobHero({ job }) {
  const facts = getJobFacts(job);

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
            <span className="rounded-full border border-white bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {formatLabel(job.work_mode)}
            </span>
          )}

          {job.employment_type && (
            <span className="rounded-full border border-white bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {formatLabel(job.employment_type)}
            </span>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white bg-white text-indigo-600 shadow-sm sm:h-20 sm:w-20">
            <Building2 size={32} strokeWidth={1.5} />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="break-words text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-[2.75rem]">
              {job.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-600 sm:text-base">
              {job.company && (
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                  <Building2 size={16} className="text-indigo-600" />
                  {job.company}
                </span>
              )}

              {job.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={16} className="text-slate-400" />
                  {job.location}
                </span>
              )}
            </div>

            {job.salary && (
              <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800">
                <CheckCircle2 size={17} />
                {job.salary}
              </div>
            )}
          </div>
        </div>

        {facts.length > 0 && (
          <div className="mt-8 grid gap-3 border-t border-indigo-100/80 pt-6 sm:grid-cols-2 lg:grid-cols-4">
            {facts.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex min-w-0 items-start gap-3 rounded-2xl border border-white/90 bg-white/75 p-3.5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Icon size={18} />
                </span>

                <span className="min-w-0">
                  <span className="block text-xs font-medium text-slate-500">
                    {label}
                  </span>
                  <span className="mt-1 block break-words text-sm font-bold text-slate-800">
                    {formatLabel(value)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
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
  useMeta(title + ' | TechAbhi');

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

    api('/jobs/' + id)
      .then((data) => {
        if (!active) return;

        const job = data.job;
        setState({
          job,
          related: Array.isArray(data.related) ? data.related : [],
        });

        if (job) {
          try {
            const key = 'viewed_' + id;

            if (!sessionStorage.getItem(key)) {
              sessionStorage.setItem(key, '1');
              track(id, 'view');
            }
          } catch {
            // Viewing the job should still work if session storage is unavailable.
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
      ? `${job.title}${job.company ? ' at ' + job.company : ''} | TechAbhi`
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
      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-10">
        <div className="mb-6">
          <BackToJobs />
        </div>

        <JobHero job={job} />

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_290px]">
          <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-9">
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <BriefcaseBusiness size={22} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-950">
                  Job overview
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Role details and application information
                </p>
              </div>
            </div>

            {/* Keep the existing component responsible for job content and apply behaviour. */}
            <JobView job={job} />
          </section>

          <aside className="space-y-4 lg:sticky lg:top-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                YOUR NEXT STEP
              </p>

              <h2 className="mt-3 text-xl font-extrabold tracking-tight text-slate-950">
                Interested in this role?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Read the full description and follow the application process
                provided for this opening.
              </p>

              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                  <ShieldCheck size={19} />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Check before applying
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Confirm eligibility, required skills and application details.
                  </p>
                </div>
              </div>

              <Link
                to="/jobs"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                Explore more jobs
                <ArrowUpRight size={16} />
              </Link>
            </div>

            <ApplicationNote />

            {job.expires_at && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <CalendarDays size={17} className="text-indigo-600" />
                  Application deadline
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {new Date(job.expires_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}
          </aside>
        </div>

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

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((relatedJob) => (
                <JobCard key={relatedJob.id} job={relatedJob} />
              ))}
            </div>
          </section>
        )}
      </div>
    </PageContainer>
  );
}
