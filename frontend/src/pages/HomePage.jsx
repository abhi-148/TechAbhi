
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  BriefcaseBusiness,
  ArrowUpRight,
  ShieldCheck,
  GraduationCap,
  Laptop,
  Sparkles,
  Building2,
  ChevronRight,
  Compass,
  Bookmark,
  FileText,
  CheckCircle2,
  Command,
  Users,
} from 'lucide-react';
import { api } from '../lib/api';
import { useMeta } from '../lib/format';
import JobCard from '../components/JobCard';

const quickLinks = [
  { label: 'All jobs', to: '/jobs', icon: BriefcaseBusiness },
  { label: 'Freshers', to: '/fresher-jobs', icon: GraduationCap },
  { label: 'Internships', to: '/internships', icon: Sparkles },
  { label: 'Remote', to: '/remote-jobs', icon: Laptop },
];

function SectionHeading({ eyebrow, title, description, to }) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-600">
          {eyebrow}
        </p>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            {description}
          </p>
        )}
      </div>

      <Link
        to={to}
        className="group inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
      >
        Explore all
        <ArrowUpRight
          size={16}
          className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      </Link>
    </div>
  );
}

function JobSection({ title, eyebrow, description, params, to }) {
  const [jobs, setJobs] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    setJobs(null);
    setFailed(false);

    api('/jobs?limit=4&' + params)
      .then((data) => {
        if (!active) return;
        setJobs(Array.isArray(data.jobs) ? data.jobs : []);
      })
      .catch(() => {
        if (!active) return;
        setJobs([]);
        setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [params]);

  if (jobs !== null && jobs.length === 0 && !failed) return null;

  return (
    <section className="mx-auto mt-16 max-w-7xl px-5 sm:px-8 lg:mt-20">
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
        to={to}
      />

      {jobs === null ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="min-h-48 animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="h-10 w-10 rounded-xl bg-slate-100" />
              <div className="mt-5 h-4 w-3/4 rounded bg-slate-100" />
              <div className="mt-3 h-3 w-1/2 rounded bg-slate-100" />
              <div className="mt-6 h-8 rounded-lg bg-slate-100" />
            </div>
          ))}
        </div>
      ) : failed ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
          <p className="font-bold text-slate-900">
            Unable to load these opportunities right now.
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Please check your connection and try again, or browse all available jobs.
          </p>
          <Link
            to={to}
            className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-indigo-700 hover:text-indigo-900"
          >
            Browse opportunities <ArrowUpRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </section>
  );
}

function BenefitCard({ icon: Icon, title, description }) {
  return (
    <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-950/[0.05] sm:p-6">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition duration-300 group-hover:bg-indigo-600 group-hover:text-white">
        <Icon size={23} strokeWidth={1.8} />
      </div>
      <h3 className="font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </article>
  );
}

function BrowseCard({ icon: Icon, title, description, children, tone = 'indigo' }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600',
    violet: 'bg-violet-50 text-violet-600',
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-950/[0.02] sm:p-8">
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon size={21} />
        </div>
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-950 sm:text-xl">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2.5">{children}</div>
    </div>
  );
}

export default function HomePage() {
  useMeta(
    'TechAbhi — Discover Jobs, Internships & Remote Careers',
    "Explore jobs, internships, fresher and remote opportunities on TechAbhi. Review job details and apply through the employer's official page."
  );

  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [meta, setMeta] = useState({ categories: [], locations: [] });

  useEffect(() => {
    let active = true;

    api('/jobs/meta')
      .then((data) => {
        if (!active) return;

        setMeta({
          categories: Array.isArray(data.categories) ? data.categories : [],
          locations: Array.isArray(data.locations) ? data.locations : [],
        });
      })
      .catch(() => {
        // The page remains usable if category metadata is unavailable.
      });

    return () => {
      active = false;
    };
  }, []);

  function handleSearch(event) {
    event.preventDefault();

    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (location.trim()) params.set('location', location.trim());

    navigate(`/jobs${params.toString() ? `?${params.toString()}` : ''}`);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#fafaff] text-slate-900">
      {/* Hero */}
      <section className="relative isolate border-b border-indigo-100/80 bg-gradient-to-br from-[#f0efff] via-white to-[#f4f5ff]">
        <div className="pointer-events-none absolute -left-32 top-12 -z-10 h-80 w-80 rounded-full bg-violet-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-20 -z-10 h-96 w-96 rounded-full bg-indigo-300/20 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:grid-cols-[1.12fr_0.88fr] lg:gap-10 lg:pb-24 lg:pt-20">
          <div className="relative z-10 mx-auto w-full max-w-2xl lg:mx-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/90 px-3.5 py-2 text-xs font-bold text-indigo-700 shadow-sm sm:text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100">
                <Sparkles size={13} />
              </span>
              Your next chapter starts here
              <ChevronRight size={14} />
            </div>

            <h1 className="mt-7 text-4xl font-black leading-[1.1] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-[4.15rem]">
              Find work that
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                moves you forward.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Discover jobs, internships, fresher openings and remote roles.
              Your next career opportunity could be one search away.
            </p>

            {/* Search */}
            <form
              onSubmit={handleSearch}
              className="mt-8 rounded-2xl border border-white bg-white p-2 shadow-[0_18px_65px_-24px_rgba(79,70,229,0.28)] ring-1 ring-slate-200/80"
            >
              <div className="grid gap-1.5 md:grid-cols-[1fr_0.8fr_auto]">
                <label className="flex min-w-0 items-center gap-3 rounded-xl px-3 py-3 transition focus-within:bg-indigo-50/70 sm:px-4">
                  <Search className="shrink-0 text-indigo-600" size={20} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Job or skill
                    </span>
                    <input
                      aria-label="Job title, skill or company"
                      className="mt-1 w-full border-0 bg-transparent p-0 text-sm font-medium text-slate-900 outline-none ring-0 placeholder:font-normal placeholder:text-slate-400 focus:ring-0"
                      placeholder="e.g. React Developer"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </span>
                </label>

                <label className="flex min-w-0 items-center gap-3 rounded-xl border-t border-slate-100 px-3 py-3 transition focus-within:bg-indigo-50/70 md:border-l md:border-t-0 md:px-4">
                  <MapPin className="shrink-0 text-indigo-600" size={20} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Location
                    </span>
                    <input
                      aria-label="Preferred location"
                      className="mt-1 w-full border-0 bg-transparent p-0 text-sm font-medium text-slate-900 outline-none ring-0 placeholder:font-normal placeholder:text-slate-400 focus:ring-0"
                      placeholder="City or remote"
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                    />
                  </span>
                </label>

                <button
                  type="submit"
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-extrabold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  <Search size={17} />
                  Search jobs
                </button>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <span className="mr-1 text-[11px] font-extrabold tracking-[0.12em] text-slate-500">
                QUICK EXPLORE
              </span>
              {quickLinks.map(({ label, to, icon: Icon }) => (
                <Link
                  key={label}
                  to={to}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/90 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 sm:text-sm"
                >
                  <Icon size={14} />
                  {label}
                </Link>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-slate-600 sm:text-sm">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck size={17} className="text-emerald-600" />
                Employer application links
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={17} className="text-indigo-600" />
                Clear job details
              </span>
            </div>
          </div>

          {/* Career preview */}
          <div className="relative mx-auto hidden w-full max-w-md lg:block">
            <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-indigo-200/50 to-violet-200/40 blur-2xl" />

            <div className="relative rounded-[2rem] border border-white/90 bg-white/85 p-5 shadow-2xl shadow-indigo-950/10 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div>
                  <p className="text-xs font-extrabold tracking-[0.12em] text-indigo-600">
                    YOUR CAREER SPACE
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold tracking-tight">
                    Find your direction.
                  </h2>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                  <Compass size={23} />
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider">
                      <Sparkles size={12} />
                      Make your next move
                    </span>
                    <h3 className="mt-4 text-2xl font-extrabold leading-tight">
                      A better role.
                      <br />
                      A bigger future.
                    </h3>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                    <BriefcaseBusiness size={25} />
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-indigo-100">
                  Explore opportunities at your own pace.
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link
                  to="/jobs"
                  className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:bg-indigo-50/50"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Search size={20} />
                  </span>
                  <span className="mt-3 block text-sm font-bold">Explore jobs</span>
                  <span className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    Browse openings
                    <ArrowUpRight size={13} className="transition-transform group-hover:-translate-y-0.5" />
                  </span>
                </Link>

                <Link
                  to="/internships"
                  className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-violet-200 hover:bg-violet-50/50"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <GraduationCap size={21} />
                  </span>
                  <span className="mt-3 block text-sm font-bold">Start learning</span>
                  <span className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    Find internships
                    <ArrowUpRight size={13} className="transition-transform group-hover:-translate-y-0.5" />
                  </span>
                </Link>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                  <ShieldCheck size={21} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Know before you apply</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Review the job details and application process before applying.
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute -right-5 top-24 hidden items-center gap-2 rounded-xl border border-white bg-white px-3 py-2.5 shadow-xl shadow-indigo-950/10 xl:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Bookmark size={17} />
              </span>
              <span>
                <span className="block text-xs font-bold">Your next step</span>
                <span className="mt-0.5 block text-[10px] text-slate-500">Starts with a search</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-7xl px-5 pt-8 sm:px-8 sm:pt-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <BenefitCard
            icon={Search}
            title="Search with purpose"
            description="Find openings by role, skill, company or location."
          />
          <BenefitCard
            icon={ShieldCheck}
            title="Clear application path"
            description="Review job details before heading to the employer's application page."
          />
          <BenefitCard
            icon={FileText}
            title="Your career workspace"
            description="Create a profile and manage your resume with a free account."
          />
          <BenefitCard
            icon={Compass}
            title="Different ways to grow"
            description="Explore fresher roles, internships and remote opportunities."
          />
        </div>
      </section>

      {/* Job listings */}
      <JobSection
        eyebrow="THE LATEST"
        title="Opportunities worth exploring"
        description="Start with the latest published openings on TechAbhi."
        params=""
        to="/jobs"
      />

      <JobSection
        eyebrow="LEARN BY DOING"
        title="Internships to kick-start your journey"
        description="Explore internships and find opportunities to build practical experience."
        params="employment_type=internship"
        to="/internships"
      />

      <JobSection
        eyebrow="YOUR FIRST BIG MOVE"
        title="Opportunities for freshers"
        description="Discover roles to help you take the next step after college."
        params="fresher=1"
        to="/fresher-jobs"
      />

      <JobSection
        eyebrow="WORK YOUR WAY"
        title="Explore remote jobs"
        description="Browse remote opportunities and review each role's work arrangement."
        params="work_mode=remote"
        to="/remote-jobs"
      />

      {/* Dynamic categories and locations */}
      {(meta.categories.length > 0 || meta.locations.length > 0) && (
        <section className="mx-auto mt-16 grid max-w-7xl gap-5 px-5 sm:px-8 lg:grid-cols-2 lg:gap-6">
          {meta.categories.length > 0 && (
            <BrowseCard
              icon={Command}
              title="Browse by category"
              description="Explore the fields that interest you."
            >
              {meta.categories.map((category) => (
                <Link
                  key={category.name}
                  to={`/jobs?category=${encodeURIComponent(category.name)}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {category.name}
                </Link>
              ))}
            </BrowseCard>
          )}

          {meta.locations.length > 0 && (
            <BrowseCard
              icon={MapPin}
              title="Browse by location"
              description="Look for opportunities where you want to work."
              tone="violet"
            >
              {meta.locations.map((item) => (
                <Link
                  key={item.name}
                  to={`/jobs?location=${encodeURIComponent(item.name)}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                >
                  <MapPin size={13} />
                  {item.name}
                </Link>
              ))}
            </BrowseCard>
          )}
        </section>
      )}

      {/* Candidate and recruiter CTA */}
      <section className="mx-auto mt-16 max-w-7xl px-5 sm:px-8 lg:mt-20">
        <div className="grid gap-5 lg:grid-cols-2">
          <article className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-700 to-violet-800 p-7 text-white shadow-xl shadow-indigo-900/10 sm:p-10">
            <div className="pointer-events-none absolute -right-14 -top-16 -z-10 h-56 w-56 rounded-full border-[38px] border-white/[0.07]" />
            <div className="pointer-events-none absolute -bottom-20 left-1/3 -z-10 h-48 w-48 rounded-full bg-violet-400/20 blur-3xl" />

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
              <GraduationCap size={25} />
            </div>

            <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-200">
              FOR CANDIDATES
            </p>
            <h2 className="mt-3 max-w-md text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Build a career that feels like yours.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-indigo-100 sm:text-base">
              Create your profile, manage your resume, save opportunities and
              keep track of applications with your optional free account.
            </p>

            <Link
              to="/candidate/register"
              className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-indigo-700 transition hover:-translate-y-0.5 hover:bg-indigo-50"
            >
              Create a free account
              <ArrowUpRight size={17} />
            </Link>
          </article>

          <article className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-emerald-100/60 blur-3xl" />

            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Building2 size={25} />
              </div>

              <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">
                FOR RECRUITERS
              </p>
              <h2 className="mt-3 max-w-md text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl">
                Meet the people behind the potential.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-slate-600 sm:text-base">
                Register your company for review. After approval, access
                recruiter tools and manage applications submitted through TechAbhi.
              </p>

              <Link
                to="/recruiter/register"
                className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-indigo-700"
              >
                Register your company
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </article>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto mt-12 max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-5 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-violet-50 p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="flex items-start gap-4">
            <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm sm:flex">
              <Users size={22} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">
                Ready to take your next career step?
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Explore available roles and find opportunities that match your goals.
              </p>
            </div>
          </div>

          <Link
            to="/jobs"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-extrabold text-white shadow-md shadow-indigo-600/15 transition hover:bg-indigo-700"
          >
            Explore opportunities
            <ChevronRight size={17} />
          </Link>
        </div>
      </section>

      <div className="h-10 sm:h-14" />
    </main>
  );
}
