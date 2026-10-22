
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
} from 'lucide-react';

const links = [
  { to: '/jobs', label: 'All Jobs' },
  { to: '/internships', label: 'Internships' },
  { to: '/fresher-jobs', label: 'Freshers' },
  { to: '/remote-jobs', label: 'Remote' },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const acct = isCandidate()
    ? { to: '/candidate/dashboard', label: 'My account' }
    : { to: '/candidate/login', label: 'Log in' };

  const all = [...links, acct];

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  const navClass = ({ isActive }) =>
    `relative inline-flex items-center rounded-xl px-3 py-2.5 text-sm font-bold transition ${
      isActive
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-700'
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Main navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm shadow-slate-900/[0.02] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link
            to="/"
            className="group flex shrink-0 items-center gap-3"
            aria-label="TechAbhi home"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-600/20 transition group-hover:-translate-y-0.5">
              <BriefcaseBusiness size={22} />
            </span>
            <span>
              <span className="block text-xl font-black tracking-tight text-slate-950">
                TechAbhi<span className="text-indigo-600">.</span>
              </span>
              <span className="hidden text-[10px] font-extrabold uppercase tracking-[0.17em] text-slate-400 sm:block">
                Find your next opportunity
              </span>
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={navClass}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Account and mobile menu */}
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to={acct.to}
              className="hidden items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/15 transition hover:-translate-y-0.5 hover:bg-indigo-700 sm:inline-flex"
            >
              <UserRound size={16} />
              {acct.label}
              <ArrowUpRight size={14} />
            </Link>

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 lg:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile navigation */}
        {open && (
          <div className="border-t border-slate-100 bg-white px-4 pb-5 pt-3 shadow-lg lg:hidden sm:px-6">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1" aria-label="Mobile navigation">
              {all.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-700'
                    }`
                  }
                >
                  {label}
                  <ChevronRight size={16} className="opacity-50" />
                </NavLink>
              ))}

              <div className="mt-3 rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-4 text-white">
                <div className="flex items-center gap-2 text-indigo-200">
                  <Sparkles size={17} />
                  <span className="text-sm font-bold">Your next opportunity starts here</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-indigo-100/75">
                  Explore jobs, internships and remote opportunities.
                </p>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="mt-10 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <Link to="/" className="inline-flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
                  <BriefcaseBusiness size={18} />
                </span>
                <span className="text-lg font-black tracking-tight text-slate-950">
                  TechAbhi<span className="text-indigo-600">.</span>
                </span>
              </Link>

              <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                Discover job opportunities, internships and career openings in one place.
                Always verify the role and apply through the employer's official channel.
              </p>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <ShieldCheck size={14} />
                Apply responsibly
              </div>
            </div>

            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">
                Quick links
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                {[
                  ['/recruiter/login', 'For recruiters'],
                  ['/about', 'About us'],
                  ['/contact', 'Contact'],
                  ['/privacy', 'Privacy policy'],
                  ['/terms', 'Terms of use'],
                  ['/jobs', 'Browse jobs'],
                ].map(([to, label]) => (
                  <Link
                    key={to}
                    to={to}
                    className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 transition hover:text-indigo-700"
                  >
                    {label}
                    <ArrowUpRight size={12} className="opacity-50" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} TechAbhi. All rights reserved.</p>
            <p>Built to help you take the next step in your career.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
