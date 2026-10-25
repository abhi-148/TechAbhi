
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { isCandidate } from '../lib/api';
import {
  BriefcaseBusiness,
  Menu,
  X,
  ArrowUpRight,
  UserRound,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Search,
  GraduationCap,
} from 'lucide-react';

const links = [
  { to: '/jobs', label: 'Find Jobs', icon: Search },
  { to: '/internships', label: 'Internships', icon: GraduationCap },
  { to: '/fresher-jobs', label: 'For Freshers' },
  { to: '/remote-jobs', label: 'Remote Jobs' },
];

const quickLinks = [
  ['/jobs', 'Browse jobs'],
  ['/recruiter/login', 'For recruiters'],
  ['/about', 'About us'],
  ['/contact', 'Contact'],
  ['/privacy', 'Privacy policy'],
  ['/terms', 'Terms of use'],
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const acct = isCandidate()
    ? { to: '/candidate/dashboard', label: 'My account' }
    : { to: '/candidate/login', label: 'Candidate login' };

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const navClass = ({ isActive }) =>
    [
      'relative inline-flex items-center gap-2 rounded-xl px-3 py-2.5',
      'text-sm font-semibold transition-all duration-200',
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500',
      isActive
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-700',
    ].join(' ');

  const mobileNavClass = ({ isActive }) =>
    [
      'flex min-h-12 items-center justify-between rounded-xl px-4 py-3',
      'text-sm font-semibold transition-colors',
      isActive
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-700',
    ].join(' ');

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-slate-50 text-slate-900">
      <a
        href="#main-content"
        className="sr-only z-[100] rounded-lg bg-white p-3 text-indigo-700 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:shadow-lg"
      >
        Skip to content
      </a>

      {/* Main navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur-2xl">
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link
            to="/"
            className="group flex shrink-0 items-center gap-3 rounded-xl"
            aria-label="TechAbhi home"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/20 transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-indigo-600/30">
              <BriefcaseBusiness size={22} strokeWidth={2.2} />
            </span>

            <span className="leading-tight">
              <span className="block text-xl font-black tracking-tight text-slate-950 sm:text-[22px]">
                TechAbhi<span className="text-indigo-600">.</span>
              </span>
              <span className="mt-1 hidden text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 sm:block">
                Your career starts here
              </span>
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="Main navigation"
          >
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={navClass}>
                {Icon && <Icon size={15} strokeWidth={1.9} />}
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Account and mobile menu */}
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to={acct.to}
              className="hidden min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-md shadow-indigo-600/15 transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:inline-flex"
            >
              <UserRound size={16} />
              <span>{acct.label}</span>
              <ArrowUpRight size={14} />
            </Link>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 lg:hidden"
              aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={open}
              aria-controls="mobile-navigation"
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile navigation */}
        {open && (
          <div
            id="mobile-navigation"
            className="border-t border-slate-100 bg-white px-4 pb-5 pt-3 shadow-xl shadow-slate-900/5 sm:px-6 lg:hidden"
          >
            <nav
              className="mx-auto flex max-w-7xl flex-col gap-1"
              aria-label="Mobile navigation"
            >
              {links.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={mobileNavClass}
                >
                  <span className="flex items-center gap-3">
                    {Icon && (
                      <Icon size={17} className="text-indigo-500" />
                    )}
                    {label}
                  </span>
                  <ChevronRight size={16} className="opacity-50" />
                </NavLink>
              ))}

              <NavLink to={acct.to} className={mobileNavClass}>
                <span className="flex items-center gap-3">
                  <UserRound size={17} className="text-indigo-500" />
                  {acct.label}
                </span>
                <ArrowUpRight size={16} className="opacity-50" />
              </NavLink>

              <div className="mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-5 text-white">
                <div className="flex items-center gap-2 text-indigo-200">
                  <Sparkles size={17} />
                  <span className="text-sm font-bold">
                    Your next opportunity starts here
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-indigo-100/75">
                  Explore job openings, internships and remote opportunities
                  to take your career forward.
                </p>
                <Link
                  to="/jobs"
                  className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-bold text-indigo-800 transition hover:bg-indigo-50"
                >
                  Explore opportunities
                  <ArrowUpRight size={15} />
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Page content */}
      <main id="main-content" className="min-w-0 flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
            {/* Brand and description */}
            <div>
              <Link
                to="/"
                className="group inline-flex items-center gap-3 rounded-xl"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/15 transition group-hover:-translate-y-0.5">
                  <BriefcaseBusiness size={19} />
                </span>
                <span className="text-xl font-black tracking-tight text-slate-950">
                  TechAbhi<span className="text-indigo-600">.</span>
                </span>
              </Link>

              <p className="mt-4 max-w-md text-sm leading-7 text-slate-500">
                Discover job opportunities, internships and career openings
                in one place. Verify each opportunity and apply through the
                employer&apos;s official channel.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700">
                <ShieldCheck size={15} />
                Apply responsibly
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">
                Explore TechAbhi
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4">
                {quickLinks.map(([to, label]) => (
                  <Link
                    key={to}
                    to={to}
                    className="group inline-flex w-fit items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-indigo-700"
                  >
                    <span>{label}</span>
                    <ArrowUpRight
                      size={13}
                      className="opacity-40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 flex flex-col gap-3 border-t border-slate-100 pt-6 text-xs leading-5 text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} TechAbhi. All rights reserved.
            </p>
            <p className="max-w-md sm:text-right">
              Helping you discover the next step in your career.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
