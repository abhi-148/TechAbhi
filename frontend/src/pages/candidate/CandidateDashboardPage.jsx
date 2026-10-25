
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  CheckCircle2,
  ChartNoAxesColumnIncreasing,
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
  MapPin,
  Zap,
  ChevronRight,
} from 'lucide-react';

import { api } from '../../lib/api';
import JobCard from '../../components/JobCard';

function StatCard({
  icon: Icon,
  label,
  value,
  to,
  color = 'indigo',
  detail,
}) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
    violet: 'bg-violet-50 text-violet-600 ring-violet-100',
    sky: 'bg-sky-50 text-sky-600 ring-sky-100',
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  };

  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-950/5"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${
            colors[color] || colors.indigo
          }`}
        >
          <Icon size={21} />
        </div>

        <ArrowRight
          size={17}
          className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-600"
        />
      </div>

      <p className="mt-5 text-sm font-medium text-slate-500">{label}</p>

      <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
        {value ?? 0}
      </p>

      {detail && (
        <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
      )}
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-7 animate-pulse">
      <div className="h-64 rounded-3xl bg-slate-200" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-40 rounded-2xl bg-slate-200" />
        ))}
      </div>

      <div className="h-64 rounded-2xl bg-slate-200" />

      <div className="grid gap-5 sm:grid-cols-2">
        {[1, 2].map((item) => (
          <div key={item} className="h-56 rounded-2xl bg-slate-200" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm sm:p-12">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
        <AlertCircle size={26} />
      </div>

      <h2 className="mt-5 text-xl font-extrabold text-slate-900">
        Dashboard couldn't load
      </h2>

      <p className="mx-auto mt-2 max-w-md break-words text-sm leading-6 text-slate-500">
        {message || 'Something went wrong. Please try again.'}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
      >
        <RefreshCw size={16} />
        Try again
      </button>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
            {eyebrow}
          </p>
        )}

        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
          {title}
        </h2>

        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}

function QuickLink({ icon: Icon, title, description, to }) {
  return (
    <Link
      to={to}
      className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:bg-indigo-50/50 hover:shadow-sm"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-indigo-100 group-hover:text-indigo-700">
        <Icon size={20} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-800">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>

      <ChevronRight
        size={17}
        className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-600"
      />
    </Link>
  );
}

export default function CandidateDashboardPage() {
  const [d, setD] = useState(null);
  const [rec, setRec] = useState(null);
  const [err, setErr] = useState('');
  const [retry, setRetry] = useState(0);

  const loadDashboard = useCallback(async () => {
    setErr('');

    try {
      const result = await api('/candidate/dashboard', {
        candidate: true,
      });

      setD(result);
    } catch (error) {
      setErr(error.message || 'Unable to load your dashboard.');
    }
  }, []);

  const loadRecommendations = useCallback(async () => {
    setRec(null);

    try {
      const result = await api('/candidate/recommendations', {
        candidate: true,
      });

      setRec(result || { jobs: [] });
    } catch {
      setRec({ jobs: [] });
    }
  }, []);

  useEffect(() => {
    let active = true;

    setD(null);
    setRec(null);
    setErr('');

    const load = async () => {
      try {
        const result = await api('/candidate/dashboard', {
          candidate: true,
        });

        if (active) setD(result);
      } catch (error) {
        if (active) {
          setErr(error.message || 'Unable to load your dashboard.');
        }
      }

      try {
        const result = await api('/candidate/recommendations', {
          candidate: true,
        });

        if (active) setRec(result || { jobs: [] });
      } catch {
        if (active) setRec({ jobs: [] });
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [retry]);

  if (err && !d) {
    return (
      <main className="min-h-screen bg-[#f7f8fc] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <ErrorState
            message={err}
            onRetry={() => setRetry((n) => n + 1)}
          />
        </div>
      </main>
    );
  }

  if (!d) {
    return (
      <main className="min-h-screen bg-[#f7f8fc] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <DashboardSkeleton />
        </div>
      </main>
    );
  }

  const completeness = d.completeness || {};
  const percent = Math.max(
    0,
    Math.min(100, Number(completeness.percent) || 0)
  );

  const missing = Array.isArray(completeness.missing)
    ? completeness.missing
    : [];

  const jobs = Array.isArray(rec?.jobs) ? rec.jobs : [];
  const firstName = String(d.full_name || 'there').trim().split(/\s+/)[0];

  return (
    <main className="min-h-screen bg-[#f7f8fc] pb-14">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
        {/* Welcome hero */}
        <section className="relative isolate overflow-hidden rounded-3xl bg-[#111735] px-5 py-7 shadow-xl shadow-indigo-950/10 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -right-12 -top-24 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl" />
            <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:36px_36px]" />
          </div>

          <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-2 text-xs font-semibold text-indigo-100">
                <Sparkles size={14} className="text-violet-300" />
                CANDIDATE WORKSPACE
              </div>

              <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                Welcome back,{' '}
                <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-sky-300 bg-clip-text text-transparent">
                  {firstName}
                </span>
                <span className="text-white">.</span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                Your next career opportunity starts here. Discover relevant
                jobs, manage your applications, and keep your profile ready
                for your next move.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/jobs"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-950 transition hover:bg-indigo-50 focus:outline-none focus:ring-4 focus:ring-white/20"
                >
                  <Search size={17} />
                  Explore jobs
                  <ArrowRight size={16} />
                </Link>

                <Link
                  to="/candidate/profile"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/20"
                >
                  <CircleUserRound size={17} />
                  My profile
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-emerald-300" />
                  Your candidate workspace
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <Zap size={15} className="text-amber-300" />
                  Keep moving forward
                </span>
              </div>
            </div>

            <div className="hidden shrink-0 items-center justify-center md:flex">
              <div className="flex h-36 w-36 items-center justify-center rounded-[2rem] border border-white/15 bg-white/[0.07] shadow-2xl backdrop-blur-sm lg:h-40 lg:w-40">
                <div className="flex h-28 w-28 items-center justify-center rounded-[1.6rem] bg-gradient-to-br from-indigo-400 to-violet-500 text-white shadow-lg lg:h-32 lg:w-32">
                  <BriefcaseBusiness size={48} strokeWidth={1.5} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard metrics */}
        <section>
          <SectionHeading
            eyebrow="Your overview"
            title="Your career at a glance"
            description="Your saved opportunities, application activity, and profile progress in one place."
          />

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
              detail="Review your application activity"
            />

            <Link
              to="/candidate/profile"
              className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-950/5 sm:col-span-2 lg:col-span-1"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
                  <UserRound size={21} />
                </div>

                <ArrowRight
                  size={17}
                  className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-600"
                />
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

              <p className="mt-2 text-xs text-slate-500">
                {percent >= 100
                  ? 'Your profile is complete.'
                  : 'Complete your profile to present yourself better.'}
              </p>
            </Link>
          </div>
        </section>

        {/* Profile improvement */}
        <section className="grid items-stretch gap-5 lg:grid-cols-[1.3fr_0.7fr]">
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
                    Keep your candidate details accurate and up to date.
                  </p>
                </div>
              </div>

              <span
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  percent >= 100
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-indigo-50 text-indigo-700'
                }`}
              >
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
                  {missing.map((item, index) => (
                    <span
                      key={`${item}-${index}`}
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
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
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
              Explore TechAbhi's optional career assistance service if you
              need help navigating your job search.
            </p>

            <Link
              to="/candidate/career-assistance"
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50 focus:outline-none focus:ring-4 focus:ring-white/30"
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
          <SectionHeading
            eyebrow="Curated for your journey"
            title="Jobs that match your skills"
            description="Suggestions compare skills on your profile with skills listed for each job. They are not predictions of hiring outcomes."
            action={
              <Link
                to="/jobs"
                className="inline-flex w-fit items-center gap-2 text-sm font-bold text-indigo-600 transition hover:text-indigo-800"
              >
                Browse all jobs
                <ArrowRight size={16} />
              </Link>
            }
          />

          {!rec ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="h-56 animate-pulse rounded-2xl bg-slate-200"
                />
              ))}
            </div>
          ) : (
            <>
              {rec.fallback && (
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <Target size={18} className="mt-0.5 shrink-0" />

                  <div>
                    <p className="font-bold">Let's improve your matches</p>
                    <p className="mt-1 leading-6">
                      No skill matches yet. Add skills to your profile to
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

                  <p className="mt-2 text-sm leading-6 text-slate-500">
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

                          <p className="mt-1 break-words text-xs leading-5 text-emerald-800">
                            {[
                              job.matched_skills?.length
                                ? `Matching skills: ${job.matched_skills.join(', ')}`
                                : null,
                              ...(Array.isArray(job.reasons) ? job.reasons : []),
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
          <SectionHeading
            eyebrow="Your workspace"
            title="Quick access"
            description="Jump straight to the tools you need."
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <QuickLink
              icon={CircleUserRound}
              title="My profile"
              description="Update your candidate details"
              to="/candidate/profile"
            />

            <QuickLink
              icon={Bookmark}
              title="Saved jobs"
              description="Revisit bookmarked opportunities"
              to="/candidate/saved-jobs"
            />

            <QuickLink
              icon={FileText}
              title="Applications tracker"
              description="Review jobs you are tracking"
              to="/candidate/applications"
            />

            <QuickLink
              icon={Search}
              title="Find opportunities"
              description="Explore the latest job listings"
              to="/jobs"
            />

            <QuickLink
              icon={HeartHandshake}
              title="Career assistance"
              description="Explore available career support"
              to="/candidate/career-assistance"
            />

            <QuickLink
              icon={ShieldCheck}
              title="Account overview"
              description="Review and maintain your profile"
              to="/candidate/profile"
            />
          </div>
        </section>

        {/* Bottom call to action */}
        <section className="flex flex-col justify-between gap-5 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-violet-50 p-5 sm:flex-row sm:items-center sm:p-7">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100">
              <BriefcaseBusiness size={21} />
            </div>

            <div>
              <h2 className="font-extrabold text-slate-900">
                Ready for your next opportunity?
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Explore open positions and find the next step in your career.
              </p>
            </div>
          </div>

          <Link
            to="/jobs"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            Explore jobs
            <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </main>
  );
}
