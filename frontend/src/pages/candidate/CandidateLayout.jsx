
import { useEffect, useState } from 'react';
import {
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  ChevronRight,
  CircleUserRound,
  FileText,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';

import { api, CAND_KEY } from '../../lib/api';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    description: 'Your career overview',
    to: '/candidate/dashboard',
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: 'My Profile',
    description: 'Personal and professional details',
    to: '/candidate/profile',
    icon: CircleUserRound,
  },
  {
    label: 'My Resume',
    description: 'Manage your resume',
    to: '/candidate/resume',
    icon: FileText,
  },
  {
    label: 'Saved Jobs',
    description: 'Your bookmarked opportunities',
    to: '/candidate/saved-jobs',
    icon: Bookmark,
  },
  {
    label: 'Applications',
    description: 'Jobs you are tracking',
    to: '/candidate/applications',
    icon: BriefcaseBusiness,
  },
  {
    label: 'Career Assistance',
    description: 'Explore optional career support',
    to: '/candidate/career-assistance',
    icon: HeartHandshake,
  },
];

function LoadingScreen() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-[#f7f8fc] px-4">
      <div
        className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"
        role="status"
        aria-live="polite"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <ShieldCheck size={27} />
        </div>

        <h1 className="mt-5 text-lg font-bold text-slate-900">
          Checking your account
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Please wait while we securely verify your session.
        </p>

        <div className="mx-auto mt-5 h-1.5 w-40 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-indigo-600" />
        </div>
      </div>
    </main>
  );
}

function Brand({ onNavigate }) {
  return (
    <NavLink
      to="/"
      onClick={onNavigate}
      className="group inline-flex items-center gap-3"
      aria-label="TechAbhi home"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-600/20 transition group-hover:scale-105">
        <BriefcaseBusiness size={20} />
      </div>

      <div>
        <div className="text-lg font-extrabold tracking-tight text-slate-900">
          Tech<span className="text-indigo-600">Abhi</span>
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
          Candidate portal
        </p>
      </div>
    </NavLink>
  );
}

function SidebarNav({ onNavigate }) {
  return (
    <nav aria-label="Candidate navigation" className="space-y-1.5">
      <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.17em] text-slate-400">
        Workspace
      </p>

      {NAV_ITEMS.map(({ label, description, to, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            [
              'group flex items-center gap-3 rounded-xl px-3 py-3 transition duration-150',
              isActive
                ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
            ].join(' ')
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={[
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                    : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-indigo-600',
                ].join(' ')}
              >
                <Icon size={18} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{label}</span>
                <span
                  className={[
                    'mt-0.5 block text-[11px] leading-4',
                    isActive ? 'text-indigo-600/75' : 'text-slate-400',
                  ].join(' ')}
                >
                  {description}
                </span>
              </span>

              {isActive && (
                <ChevronRight
                  size={16}
                  className="shrink-0 text-indigo-500"
                />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarFooter({ onLogout, onNavigate, busy }) {
  return (
    <div className="mt-6 border-t border-slate-100 pt-5">
      <div className="mb-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
          <Sparkles size={18} />
        </div>

        <h3 className="mt-3 text-sm font-bold text-slate-900">
          Your next move starts here
        </h3>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Discover opportunities and keep moving towards your career goals.
        </p>

        <NavLink
          to="/jobs"
          onClick={onNavigate}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900"
        >
          Explore jobs
          <ArrowRight size={14} />
        </NavLink>
      </div>

      <button
        type="button"
        onClick={onLogout}
        disabled={busy}
        className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <LogOut size={18} />
        {busy ? 'Logging out…' : 'Log out'}
      </button>
    </div>
  );
}

export default function CandidateLayout() {
  const [ok, setOk] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    let active = true;

    const token = localStorage.getItem(CAND_KEY);

    if (!token) {
      setOk(false);

      return () => {
        active = false;
      };
    }

    api('/candidate/me', { candidate: true })
      .then(() => {
        if (active) setOk(true);
      })
      .catch(() => {
        if (active) {
          localStorage.removeItem(CAND_KEY);
          setOk(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [loc.pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen]);

  const logout = () => {
    if (loggingOut) return;

    setLoggingOut(true);
    localStorage.removeItem(CAND_KEY);
    nav('/', { replace: true });
  };

  if (ok === null) return <LoadingScreen />;

  if (!ok) {
    return (
      <Navigate
        to={`/candidate/login?next=${encodeURIComponent(
          loc.pathname + loc.search
        )}`}
        replace
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      {/* Top header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[70px] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 lg:hidden"
              aria-label="Open candidate menu"
              aria-expanded={mobileOpen}
              aria-controls="candidate-mobile-navigation"
            >
              <Menu size={20} />
            </button>

            <Brand />
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <NavLink
              to="/jobs"
              className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700 sm:inline-flex"
            >
              <BriefcaseBusiness size={16} />
              Browse jobs
            </NavLink>

            <div className="hidden h-8 w-px bg-slate-200 sm:block" />

            <NavLink
              to="/candidate/profile"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-3 transition hover:border-indigo-200 hover:bg-indigo-50/50"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                <CircleUserRound size={18} />
              </span>

              <span className="hidden text-xs font-semibold text-slate-700 sm:inline">
                My account
              </span>
            </NavLink>
          </div>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-slate-950/45 backdrop-blur-[2px]"
            aria-label="Close candidate menu"
            onClick={() => setMobileOpen(false)}
          />

          <aside
            id="candidate-mobile-navigation"
            className="absolute inset-y-0 left-0 flex w-[min(88vw,340px)] flex-col overflow-y-auto bg-white p-5 shadow-2xl"
            aria-label="Mobile candidate menu"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-5">
              <Brand onNavigate={() => setMobileOpen(false)} />

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Close candidate menu"
              >
                <X size={19} />
              </button>
            </div>

            <div className="flex-1 py-6">
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </div>

            <SidebarFooter
              onLogout={logout}
              onNavigate={() => setMobileOpen(false)}
              busy={loggingOut}
            />
          </aside>
        </div>
      )}

      {/* Main workspace */}
      <div className="mx-auto flex max-w-[1600px] items-start gap-7 px-4 py-6 sm:px-6 sm:py-8 lg:gap-8 lg:px-8">
        <aside className="sticky top-[94px] hidden w-[260px] shrink-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm lg:block xl:w-[280px]">
          <SidebarNav />
          <SidebarFooter onLogout={logout} busy={loggingOut} />
        </aside>

        <div className="min-w-0 flex-1">
          <Outlet />

          <footer className="mt-10 flex flex-col justify-between gap-3 border-t border-slate-200/80 py-5 text-xs text-slate-400 sm:flex-row sm:items-center">
            <p>
              © {new Date().getFullYear()} TechAbhi. Keep moving forward.
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <NavLink
                to="/privacy"
                className="transition hover:text-indigo-600"
              >
                Privacy
              </NavLink>

              <NavLink
                to="/terms"
                className="transition hover:text-indigo-600"
              >
                Terms
              </NavLink>

              <NavLink
                to="/"
                className="inline-flex items-center gap-1 transition hover:text-indigo-600"
              >
                <ArrowLeft size={12} />
                Main website
              </NavLink>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
