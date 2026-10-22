
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BriefcaseBusiness,
  Bookmark,
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  CircleUserRound,
  Clock3,
  FileText,
  HeartHandshake,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  AlertCircle,
} from 'lucide-react';

import { api } from '../../lib/api';
import JobCard from '../../components/JobCard';

function StatCard({ icon: Icon, label, value, to, color = 'indigo', detail }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
    violet: 'bg-violet-50 text-violet-600 ring-violet-100',
    sky: 'bg-sky-50 text-sky-600 ring-sky-100',
  };

  return (
    <Link
      to={to}
      className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-950/5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${colors[color]}`}>
          <Icon size={21} />
        </div>
        <ArrowRight
          size={17}
          className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-600"
        />
      </div>

      <p className="mt-5 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
        {value ?? '—'}
      </p>
      {detail && <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>}
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-52 animate-pulse rounded-3xl bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-40 animate-pulse rounded-2xl bg-slate-200" />
        ))}
      </div>
      <div className="h-56 animate-pulse rounded-2xl bg-slate-200" />
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
        <AlertCircle size={24} />
      </div>
      <h2 className="mt-4 text-xl font-bold text-slate-900">
        Dashboard couldn’t load
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {message || 'Something went wrong. Please try again.'}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
      >
        <RefreshCw size={16} />
        Try again
      </button>
    </div>
  );
}

export default function CandidateDashboardPage() {
  const [d, setD] = useState(null);
  const [rec, setRec] = useState(null);
  const [err, setErr] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;

    setD(null);
    setErr('');
    setRec(null);

    api('/candidate/dashboard', { candidate: true })
      .then((result) => {
        if (active) setD(result);
      })
      .catch((error) => {
        if (active) setErr(error.message || 'Unable to load your dashboard.');
      });

    api('/candidate/recommendations', { candidate: true })
      .then((result) => {
        if (active) setRec(result);
      })
      .catch(() => {
        if (active) setRec({ jobs: [] });
      });

    return () => {
      active = false;
    };
  }, [retry]);

  if (err) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState message={err} onRetry={() => setRetry((n) => n + 1)} />
      </div>
    );
  }

  if (!d) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DashboardSkeleton />
      </div>
    );
  }

  const c = d.completeness || { percent: 0, missing: [] };
  const percent = Math.max(0, Math.min(100, Number(c.percent) || 0));
  const missing = Array.isArray(c.missing) ? c.missing : [];
  const jobs = Array.isArray(rec?.jobs) ? rec.jobs : [];

  return (
    <main className="min-h-screen bg-[#f7f8fc] pb-14">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        {/* Welcome hero */}
        <section className="relative isolate overflow-hidden rounded-3xl bg-[#111735] px-6 py-8 shadow-xl shadow-indigo-950/10 sm:px-9 sm:py-10 lg:px-10">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -right-12 -top-24 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl" />
            <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:36px_36px]" />
          </div>

          <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-2 text-xs font-semibold text-indigo-100">
                <Sparkles size={14} className="text-violet-300" />
                CANDIDATE DASHBOARD
              </div>

              <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
                Welcome back,{' '}
                <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-sky-300 bg-clip-text text-transparent">
                  {d.full_name}
                </span>
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                Your next career opportunity starts here. Keep your profile
                updated and explore jobs that match your skills.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/jobs"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-950 transition hover:bg-indigo-50"
                >
                  <Search size={16} />
                  Explore jobs
                  <ArrowRight size={16} />
                </Link>

                <Link
                  to="/candidate/profile"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <CircleUserRound size={16} />
                  My profile
                </Link>
              </div>
            </div>

            <div className="hidden shrink-0 items-center justify-center md:flex">
              <div className="flex h-32 w-32 items-center justify-center rounded-[2rem] border border-white/15 bg-white/[0.07] shadow-2xl backdrop-blur-sm">
                <div className="flex h-24 w-24 items-center justify-center rounded-[1.6rem] bg-gradient-to-br from-indigo-400 to-violet-500 text-white shadow-lg">
                  <BriefcaseBusiness size={43} strokeWidth={1.5} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard metrics */}
        <section>
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
              Your overview
            </p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">
              Your career at a glance
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={Bookmark}
              label="Saved jobs"
              value={d.saved}
              to="/candidate/saved-jobs"
              color="violet"
              detail="Opportunities you bookmarked"
            />
            <StatCard
              icon={ChartNoAxesColumnIncreasing}
              label="Jobs you're tracking"
              value={d.tracked}
              to="/candidate/applications"
              color="indigo"
              detail="Keep up with your applications"
            />

            <Link
              to="/candidate/profile"
              className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-950/5 sm:col-span-2 lg:col-span-1"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
                  <UserRound size={21} />
                </div>
                <ArrowRight size={17} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-600" />
              </div>

              <p className="mt-5 text-sm font-medium text-slate-500">
                Profile completeness
              </p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {percent}%
                </span>
                <span className="text-xs text-slate-400">completed</span>
              </div>

              <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-label="Profile completeness"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all duration-700"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </Link>
          </div>
        </section>

        {/* Profile improvement */}
        <section className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <CircleUserRound size={21} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Build a stronger profile
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Keep your candidate details up to date.
                  </p>
                </div>
              </div>

              <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${percent >= 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>
                {percent >= 100 ? 'Profile complete' : `${percent}% complete`}
              </span>
            </div>

            <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all duration-700"
                style={{ width: `${percent}%` }}
              />
            </div>

            {missing.length > 0 ? (
              <>
                <p className="mt-4 text-sm font-semibold text-slate-700">
                  Details you can still add
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {missing.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800"
                    >
                      <Clock3 size={13} />
                      {item}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-700">
                <CheckCircle2 size={17} />
                Great! There are no missing profile items to show.
              </p>
            )}

            <Link
              to="/candidate/profile"
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              Update my profile
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-6 text-white shadow-lg shadow-indigo-900/10 sm:p-7">
            <div className="pointer-events-none absolute -right-12 -top-12 -z-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
              <HeartHandshake size={24} />
            </div>

            <h2 className="mt-5 text-xl font-extrabold">
              Need career guidance?
            </h2>
            <p className="mt-3 text-sm leading-7 text-indigo-100">
              If you need help navigating your job search, explore the optional
              TechAbhi career assistance service.
            </p>

            <Link
              to="/candidate/career-assistance"
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50"
            >
              Explore assistance
              <ArrowRight size={16} />
            </Link>

            <p className="mt-4 text-xs leading-5 text-indigo-100/80">
              Optional service. It does not guarantee a job or interview.
            </p>
          </div>
        </section>

        {/* Recommended jobs */}
        <section>
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                <Sparkles size={14} />
                Curated for your journey
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Jobs that match your skills
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Suggestions compare skills on your profile with skills listed
                for each job. They are not predictions of hiring outcomes.
              </p>
            </div>

            <Link
              to="/jobs"
              className="inline-flex w-fit items-center gap-2 text-sm font-bold text-indigo-600 transition hover:text-indigo-800"
            >
              Browse all jobs
              <ArrowRight size={16} />
            </Link>
          </div>

          {!rec ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {[1, 2].map((item) => (
                <div key={item} className="h-56 animate-pulse rounded-2xl bg-slate-200" />
              ))}
            </div>
          ) : (
            <>
              {rec.fallback && (
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <div className="mt-0.5 shrink-0">
                    <Target size={18} />
                  </div>
                  <div>
                    <p className="font-bold">Let’s improve your matches</p>
                    <p className="mt-1 leading-6">
                      No skill matches yet. Add skills to your profile to help
                      discover more relevant opportunities. Newest jobs are
                      shown for now.
                    </p>
                    <Link
                      to="/candidate/profile"
                      className="mt-2 inline-flex items-center gap-1 font-bold underline underline-offset-4"
                    >
                      Add your skills
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              )}

              {jobs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <BriefcaseBusiness size={25} />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">
                    No open jobs to recommend right now
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Check back later or explore all available opportunities.
                  </p>
                  <Link
                    to="/jobs"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
                  >
                    Explore all jobs
                    <ArrowRight size={16} />
                  </Link>
                </div>
              ) : (
                <div className="grid items-stretch gap-5 sm:grid-cols-2">
                  {jobs.map((job) => (
                    <div key={job.id} className="min-w-0">
                      <JobCard job={job} />

                      {((job.matched_skills?.length || 0) > 0 ||
                        (job.reasons?.length || 0) > 0) && (
                        <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
                          <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                            <CheckCircle2 size={14} />
                            Why this job appears
                          </p>
                          <p className="mt-1 text-xs leading-5 text-emerald-800">
                            {[
                              job.matched_skills?.length
                                ? `Matching skills: ${job.matched_skills.join(', ')}`
                                : null,
                              ...(job.reasons || []),
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {/* Quick navigation */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Quick access
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Jump straight to the tools you need.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                label: 'My profile',
                description: 'Update your candidate details',
                to: '/candidate/profile',
                icon: CircleUserRound,
              },
              {
                label: 'Saved jobs',
                description: 'Revisit bookmarked opportunities',
                to: '/candidate/saved-jobs',
                icon: Bookmark,
              },
              {
                label: 'Applications tracker',
                description: 'Review jobs you are tracking',
                to: '/candidate/applications',
                icon: FileText,
              },
            ].map(({ label, description, to, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-indigo-100 group-hover:text-indigo-700">
                  <Icon size={19} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800">{label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
                </div>
                <ArrowRight size={16} className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-600" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
