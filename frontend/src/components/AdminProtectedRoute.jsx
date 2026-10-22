
import { useEffect, useState } from 'react';
import {
  Navigate,
  Outlet,
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  BriefcaseBusiness,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  UserPlus,
  LifeBuoy,
  LoaderCircle,
  X,
} from 'lucide-react';
import { api, TOKEN_KEY } from '../lib/api';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/jobs', label: 'Manage jobs', icon: BriefcaseBusiness },
  { to: '/admin/jobs/new', label: 'New job', icon: UserPlus, end: true },
  { to: '/admin/recruiters', label: 'Recruiters', icon: Users },
  { to: '/admin/assistance', label: 'Assistance', icon: LifeBuoy },
];

export default function AdminProtectedRoute() {
  const [ok, setOk] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const nav = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let active = true;

    if (!localStorage.getItem(TOKEN_KEY)) {
      setOk(false);
      return () => {
        active = false;
      };
    }

    api('/admin/me', { admin: true })
      .then(() => {
        if (active) setOk(true);
      })
      .catch(() => {
        if (active) setOk(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const logout = () => {
    if (loggingOut) return;

    setLoggingOut(true);
    localStorage.removeItem(TOKEN_KEY);
    nav('/admin/login', { replace: true });
  };

  if (ok === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <LoaderCircle size={30} className="animate-spin" />
          </div>
          <h1 className="mt-5 text-lg font-black text-slate-900">
            Verifying admin session
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Please wait while we securely check your access.
          </p>
          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-indigo-600" />
          </div>
        </div>
      </div>
    );
  }

  if (!ok) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Admin top bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-[1600px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to="/admin/dashboard"
            className="flex shrink-0 items-center gap-3"
            aria-label="TechAbhi admin dashboard"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-600/20">
              <BriefcaseBusiness size={22} />
            </span>
            <span>
              <span className="block text-lg font-black tracking-tight text-slate-950">
                TechAbhi<span className="text-indigo-600">.</span>
              </span>
              <span className="block text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
                Admin workspace
              </span>
            </span>
          </Link>

          <div className="ml-auto hidden items-center gap-3 md:flex">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Session verified
            </span>
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60"
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100 md:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Main navigation and page */}
      <div className="mx-auto flex max-w-[1600px] items-start gap-6 px-4 py-5 sm:px-6 sm:py-7 lg:gap-8 lg:px-8">
        {/* Desktop sidebar */}
        <aside className="sticky top-[96px] hidden w-60 shrink-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:block">
          <p className="px-3 pb-3 pt-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
            Workspace menu
          </p>

          <nav className="space-y-1" aria-label="Admin navigation">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
                  }`
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-5 rounded-xl bg-gradient-to-br from-slate-950 to-indigo-950 p-4 text-white">
            <div className="flex items-center gap-2 text-indigo-200">
              <ShieldCheck size={17} />
              <span className="text-xs font-bold">Admin access</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-300">
              Manage job listings, recruiters and career assistance from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60 md:hidden"
          >
            <LogOut size={16} /> Log out
          </button>
        </aside>

        {/* Mobile navigation */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setMenuOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <aside className="absolute bottom-0 left-0 top-0 flex w-[min(85vw,320px)] flex-col overflow-y-auto bg-white p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="text-lg font-black">Admin menu</span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="mt-6 space-y-2" aria-label="Mobile admin navigation">
                {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
                      }`
                    }
                  >
                    <Icon size={18} />
                    {label}
                  </NavLink>
                ))}
              </nav>

              <button
                type="button"
                onClick={logout}
                disabled={loggingOut}
                className="mt-auto flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700"
              >
                <LogOut size={16} /> Log out
              </button>
            </aside>
          </div>
        )}

        {/* Current page */}
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
