
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  BriefcaseBusiness,
  Building2,
  Clock3,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
  Sparkles,
  Laptop,
  GraduationCap,
  IndianRupee,
  ArrowUpDown,
  SearchX,
} from 'lucide-react';

import { api } from '../lib/api';
import {
  inputCls,
  TYPE_LABEL,
  MODE_LABEL,
  useMeta,
} from '../lib/format';
import JobCard from '../components/JobCard';

const PRESETS = {
  all: { title: 'Explore opportunities', fixed: '' },
  internships: {
    title: 'Internships',
    fixed: 'employment_type=internship',
  },
  remote: {
    title: 'Remote jobs',
    fixed: 'work_mode=remote',
  },
  fresher: {
    title: 'Fresher jobs',
    fixed: 'fresher=1',
  },
};

const KEYS = [
  'q',
  'location',
  'employment_type',
  'work_mode',
  'category',
  'experience',
  'min_salary',
  'sort',
];

const FILTER_META = {
  q: { label: 'Keyword', icon: Search },
  location: { label: 'Location', icon: MapPin },
  category: { label: 'Category', icon: BriefcaseBusiness },
  employment_type: { label: 'Job type', icon: Building2 },
  work_mode: { label: 'Work mode', icon: Laptop },
  experience: { label: 'Experience', icon: GraduationCap },
  min_salary: { label: 'Minimum salary', icon: IndianRupee },
};

const cx = (...classes) => classes.filter(Boolean).join(' ');

function FieldLabel({ children, icon: Icon }) {
  return (
    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
      {Icon && <Icon size={15} className="text-indigo-500" />}
      {children}
    </label>
  );
}

function SearchField({ icon: Icon, label, children, className = '' }) {
  return (
    <div className={className}>
      <FieldLabel icon={Icon}>{label}</FieldLabel>
      {children}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 animate-pulse rounded-xl bg-slate-100" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
      <div className="mt-6 h-3 w-full animate-pulse rounded bg-slate-100" />
      <div className="mt-3 h-3 w-4/5 animate-pulse rounded bg-slate-100" />
      <div className="mt-6 flex gap-2">
        <div className="h-7 w-20 animate-pulse rounded-lg bg-indigo-50" />
        <div className="h-7 w-24 animate-pulse rounded-lg bg-slate-100" />
      </div>
      <div className="mt-6 border-t border-slate-100 pt-4">
        <div className="h-9 w-full animate-pulse rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

function EmptyState({ onClear, hasFilters }) {
  return (
    <div className="rounded-3xl border border-dashed border-indigo-200 bg-white px-5 py-14 text-center sm:px-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <SearchX size={30} />
      </div>
      <h2 className="mt-5 text-xl font-bold tracking-tight text-slate-900">
        No matching opportunities yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        Try another keyword, explore a different location, or remove some
        filters to discover more opportunities.
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/15 transition hover:bg-indigo-700"
        >
          <RotateCcw size={16} />
          Clear all filters
        </button>
      )}
    </div>
  );
}

function ActiveFilters({ sp, remove, clear }) {
  const active = KEYS.filter((key) => {
    const value = sp.get(key);
    return Boolean(value) && !(key === 'sort' && value === 'newest');
  });

  if (!active.length) return null;

  const getLabel = (key) => {
    const value = sp.get(key);

    if (key === 'employment_type') return TYPE_LABEL[value] || value;
    if (key === 'work_mode') return MODE_LABEL[value] || value;
    if (key === 'sort') return value === 'salary' ? 'Highest salary' : value;
    if (key === 'min_salary') return `₹${Number(value).toLocaleString('en-IN')}+`;
    return value;
  };

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Active filters
      </span>
      {active.map((key) => {
        const Icon = FILTER_META[key]?.icon || SlidersHorizontal;

        return (
          <button
            key={key}
            type="button"
            onClick={() => remove(key)}
            className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/80 px-3 py-1.5 text-xs font-medium text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100"
            aria-label={`Remove ${FILTER_META[key]?.label || key} filter`}
          >
            <Icon size={13} />
            <span>{getLabel(key)}</span>
            <X size={13} className="ml-0.5 text-indigo-400" />
          </button>
        );
      })}
      <button
        type="button"
        onClick={clear}
        className="px-2 py-1.5 text-xs font-semibold text-slate-500 transition hover:text-rose-600"
      >
        Clear all
      </button>
    </div>
  );
}

export default function JobsPage({ preset = 'all' }) {
  const P = PRESETS[preset] || PRESETS.all;
  const [sp, setSp] = useSearchParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [cats, setCats] = useState([]);
  const [keyword, setKeyword] = useState(sp.get('q') || '');
  const [location, setLocation] = useState(sp.get('location') || '');
  const [experience, setExperience] = useState(sp.get('experience') || '');
  const [salary, setSalary] = useState(sp.get('min_salary') || '');
  const [filtersOpen, setFiltersOpen] = useState(true);

  const page = Math.max(1, parseInt(sp.get('page'), 10) || 1);
  const qs = sp.toString();

  useMeta(
    `${P.title} | TechAbhi`,
    `Browse ${P.title.toLowerCase()} on TechAbhi and apply on the employer's official page.`
  );

  useEffect(() => {
    let active = true;

    api('/jobs/meta')
      .then((meta) => {
        if (active) setCats(meta.categories || []);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    setData(null);
    setErr('');

    api(`/jobs?${P.fixed}${P.fixed && qs ? '&' : ''}${qs}`)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((error) => {
        if (active) setErr(error.message || 'Unable to load jobs.');
      });

    return () => {
      active = false;
    };
  }, [qs, P.fixed]);

  useEffect(() => {
    setKeyword(sp.get('q') || '');
    setLocation(sp.get('location') || '');
    setExperience(sp.get('experience') || '');
    setSalary(sp.get('min_salary') || '');
  }, [qs]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(sp);

    if (value !== '' && value !== null && value !== undefined) {
      next.set(key, String(value));
    } else {
      next.delete(key);
    }

    next.delete('page');
    setSp(next);
  };

  const applySearch = (event) => {
    event?.preventDefault();

    const next = new URLSearchParams(sp);

    const fields = {
      q: keyword.trim(),
      location: location.trim(),
      experience: experience.trim(),
      min_salary: salary.trim(),
    };

    Object.entries(fields).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });

    next.delete('page');
    setSp(next);
  };

  const clearFilters = () => {
    setSp({});
    setKeyword('');
    setLocation('');
    setExperience('');
    setSalary('');
  };

  const removeFilter = (key) => {
    const next = new URLSearchParams(sp);
    next.delete(key);
    next.delete('page');
    setSp(next);
  };

  const hasFilters = useMemo(
    () => KEYS.some((key) => {
      const value = sp.get(key);
      return Boolean(value) && !(key === 'sort' && value === 'newest');
    }),
    [qs]
  );

  const quickLinks = [
    { label: 'All jobs', path: '/jobs', icon: BriefcaseBusiness, active: preset === 'all' },
    { label: 'Freshers', path: '/jobs/fresher', icon: GraduationCap, active: preset === 'fresher' },
    { label: 'Internships', path: '/jobs/internships', icon: Sparkles, active: preset === 'internships' },
    { label: 'Remote', path: '/jobs/remote', icon: Laptop, active: preset === 'remote' },
  ];

  return (
    <main className="min-h-screen bg-[#f7f8fc] pb-16">
      <section className="relative isolate overflow-hidden bg-[#111735]">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute -bottom-36 left-1/4 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:38px_38px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-2 text-xs font-medium text-indigo-100 shadow-sm backdrop-blur">
              <Sparkles size={14} className="text-violet-300" />
              Your next chapter starts here
            </div>

            <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              {P.title === 'Explore opportunities' ? (
                <>
                  Find work that
                  <span className="block bg-gradient-to-r from-indigo-300 via-violet-300 to-sky-300 bg-clip-text text-transparent">
                    moves you forward.
                  </span>
                </>
              ) : (
                <>
                  Discover your next
                  <span className="block bg-gradient-to-r from-indigo-300 via-violet-300 to-sky-300 bg-clip-text text-transparent">
                    {P.title.toLowerCase()} opportunity.
                  </span>
                </>
              )}
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Explore relevant opportunities, find your fit, and take the next
              step in your career — all in one place.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {quickLinks.map(({ label, path, icon: Icon, active }) => (
                <a
                  key={path}
                  href={path}
                  className={cx(
                    'inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition',
                    active
                      ? 'border-white bg-white text-indigo-950 shadow-lg'
                      : 'border-white/15 bg-white/[0.06] text-slate-200 hover:border-white/30 hover:bg-white/10'
                  )}
                >
                  <Icon size={15} />
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-7 max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="relative rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_20px_70px_-35px_rgba(31,41,91,0.25)] sm:rounded-3xl sm:p-6 lg:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Search size={18} />
                </div>
                Find your fit
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Search smarter with filters that work for you.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setFiltersOpen((value) => !value)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal size={16} />
              {filtersOpen ? 'Hide filters' : 'Show filters'}
            </button>
          </div>

          <form onSubmit={applySearch}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <SearchField label="Role, skill or company" icon={Search}>
                <input
                  className={cx(inputCls, 'h-12 rounded-xl border-slate-200 bg-slate-50/70 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10')}
                  placeholder="e.g. React Developer"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                />
              </SearchField>

              <SearchField label="Preferred location" icon={MapPin}>
                <input
                  className={cx(inputCls, 'h-12 rounded-xl border-slate-200 bg-slate-50/70 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10')}
                  placeholder="e.g. Ahmedabad, Remote"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                />
              </SearchField>

              <SearchField label="Job category" icon={BriefcaseBusiness}>
                <select
                  className={cx(inputCls, 'h-12 rounded-xl border-slate-200 bg-slate-50/70 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10')}
                  value={sp.get('category') || ''}
                  onChange={(event) => setFilter('category', event.target.value)}
                >
                  <option value="">All categories</option>
                  {cats.map((category) => (
                    <option key={category.name} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </SearchField>

              <SearchField label="Employment type" icon={Building2}>
                <select
                  className={cx(inputCls, 'h-12 rounded-xl border-slate-200 bg-slate-50/70 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10')}
                  value={sp.get('employment_type') || (preset === 'internships' ? 'internship' : '')}
                  onChange={(event) => setFilter('employment_type', event.target.value)}
                  disabled={preset === 'internships'}
                >
                  <option value="">Any employment type</option>
                  {Object.entries(TYPE_LABEL).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </SearchField>
            </div>

            {filtersOpen && (
              <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                <SearchField label="Work arrangement" icon={Laptop}>
                  <select
                    className={cx(inputCls, 'h-12 rounded-xl border-slate-200 bg-slate-50/70')}
                    value={sp.get('work_mode') || (preset === 'remote' ? 'remote' : '')}
                    onChange={(event) => setFilter('work_mode', event.target.value)}
                    disabled={preset === 'remote'}
                  >
                    <option value="">Any work mode</option>
                    {Object.entries(MODE_LABEL).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </SearchField>

                <SearchField label="Experience" icon={GraduationCap}>
                  <input
                    className={cx(inputCls, 'h-12 rounded-xl border-slate-200 bg-slate-50/70')}
                    placeholder="e.g. Fresher, 2 years"
                    value={experience}
                    onChange={(event) => setExperience(event.target.value)}
                  />
                </SearchField>

                <SearchField label="Minimum yearly salary" icon={IndianRupee}>
                  <input
                    className={cx(inputCls, 'h-12 rounded-xl border-slate-200 bg-slate-50/70')}
                    type="number"
                    min="0"
                    placeholder="e.g. 400000"
                    value={salary}
                    onChange={(event) => setSalary(event.target.value)}
                  />
                </SearchField>

                <SearchField label="Sort opportunities" icon={ArrowUpDown}>
                  <select
                    className={cx(inputCls, 'h-12 rounded-xl border-slate-200 bg-slate-50/70')}
                    value={sp.get('sort') || 'newest'}
                    onChange={(event) => setFilter('sort', event.target.value === 'newest' ? '' : event.target.value)}
                  >
                    <option value="newest">Newest first</option>
                    <option value="salary">Highest salary</option>
                  </select>
                </SearchField>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-indigo-600/30 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
              >
                <Search size={17} />
                Search opportunities
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-rose-600"
              >
                <RotateCcw size={15} />
                Reset filters
              </button>

              <p className="text-xs leading-5 text-slate-400 sm:ml-auto">
                Refine your search to find a better match.
              </p>
            </div>
          </form>
        </section>

        <section className="pt-10">
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Your career search
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {P.title}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Explore opportunities that match your next move.
              </p>
            </div>

            {data && !err && (
              <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <BriefcaseBusiness size={16} />
                </div>
                <div>
                  <p className="text-lg font-extrabold leading-5 text-slate-900">
                    {Number(data.total || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-slate-500">
                    {data.total === 1 ? 'opportunity found' : 'opportunities found'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <ActiveFilters
            sp={sp}
            remove={removeFilter}
            clear={clearFilters}
          />

          {err && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-rose-600">
                  <SearchX size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-rose-900">
                    We couldn’t load the opportunities
                  </h3>
                  <p className="mt-1 text-sm text-rose-700">{err}</p>
                  <button
                    type="button"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-rose-800 underline underline-offset-4"
                    onClick={() => setSp(new URLSearchParams(sp))}
                  >
                    <RotateCcw size={14} />
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {!data && !err && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          )}

          {data && !err && data.jobs.length === 0 && (
            <EmptyState
              hasFilters={hasFilters}
              onClear={clearFilters}
            />
          )}

          {data && !err && data.jobs.length > 0 && (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
                <span>
                  Showing{' '}
                  <strong className="font-bold text-slate-800">
                    {Math.min((page - 1) * (data.jobs.length || 1) + 1, data.total)}
                    {'–'}
                    {Math.min(page * data.jobs.length, data.total)}
                  </strong>
                  {' '}of{' '}
                  <strong className="font-bold text-slate-800">{data.total}</strong>
                  {' '}opportunities
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 size={14} className="text-indigo-500" />
                  {sp.get('sort') === 'salary' ? 'Highest salary first' : 'Recently listed'}
                </span>
              </div>

              <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data.jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>

              {data.pages > 1 && (
                <nav
                  className="mt-10 flex flex-wrap items-center justify-center gap-3"
                  aria-label="Job results pages"
                >
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={page <= 1}
                    onClick={() => setFilter('page', page - 1)}
                  >
                    <ChevronLeft size={17} />
                    Previous
                  </button>

                  <span className="rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-3 text-sm font-bold text-indigo-700">
                    Page {data.page || page} of {data.pages}
                  </span>

                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={page >= data.pages}
                    onClick={() => setFilter('page', page + 1)}
                  >
                    Next
                    <ChevronRight size={17} />
                  </button>
                </nav>
              )}
            </>
          )}
        </section>

        <div className="mt-12 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-violet-50 p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100">
              <Sparkles size={22} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900">
                Your next opportunity could be one search away.
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Keep exploring, stay curious, and take the next step in your career.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-600 hover:text-white"
            >
              <Search size={15} />
              Search again
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
