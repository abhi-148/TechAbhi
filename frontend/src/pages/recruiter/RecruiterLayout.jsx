
import { useEffect, useState } from 'react';
import {
  Navigate,
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  Plus,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import { api, REC_KEY } from '../../lib/api';

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/recruiter/dashboard', icon: LayoutDashboard, end: true },
  { label: 'My jobs', to: '/recruiter/jobs', icon: BriefcaseBusiness },
  { label: 'New job', to: '/recruiter/jobs/new', icon: Plus, special: true, end: true },
  { label: 'Applications', to: '/recruiter/applications', icon: FileText },
  { label: 'Company profile', to: '/recruiter/profile', icon: Building2 },
];

function LoadingScreen() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-slate-50 px-5 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <LoaderCircle size={28} className="animate-spin" />
      </div>
      <h2 className="mt-4 font-bold text-slate-900">Loading recruiter workspace</h2>
      <p className="mt-1 text-sm text-slate-500">Checking your account details...</p>
    </div>
  );
}

function AccountStatus({ me, onLogout }) {
  const messages = {
    pending: {
      title: 'Your account is under review',
      description: 'Our team manually reviews new recruiter registrations. Please check back after your account has been reviewed.',
      icon: Clock3,
      color: 'amber',
    },
    rejected: {
      title: 'Registration not approved',
      description: 'Your recruiter registration was not approved. Please review the reason below if one has been provided.',
      icon: ShieldAlert,
      color: 'rose',
    },
    suspended: {
      title: 'Account suspended',
      description: 'Your recruiter account has been suspended. Your live jobs have been closed.',
      icon: ShieldAlert,
      color: 'rose',
    },
  };

  const config = messages[me.status] || {
    title: `Account ${me.status || 'unavailable'}`,
    description: 'Your recruiter workspace is currently unavailable. Please contact the TechAbhi team for assistance.',
    icon: CircleHelp,
    color: 'slate',
  };

  const Icon = config.icon;
  const tones = {
    amber: {
      icon: 'bg-amber-100 text-amber-700',
      panel: 'border-amber-200 bg-amber-50 text-amber-900',
    },
    rose: {
      icon: 'bg-rose-100 text-rose-700',
      panel: 'border-rose-200 bg-rose-50 text-rose-900',
    },
    slate: {
      icon: 'bg-slate-100 text-slate-700',
      panel: 'border-slate-200 bg-slate-50 text-slate-800',
    },
  };
  const tone = tones[config.color] || tones.slate;

  return (
    <main className="relative flex min-h-[75vh] items-center justify-center overflow-hidden bg-slate-50 px-4 py-12">
      <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-indigo-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-violet-100/70 blur-3xl" />

      <section className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
        <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 px-7 py-8 text-white sm:px-9">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
              <BriefcaseBusiness size={24} />
            </div>
            <div>
              <p className="text-lg font-black">TechAbhi</p>
              <p className="text-xs text-indigo-200">Recruiter workspace</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-9">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${tone.icon}`}>
            <Icon size={27} />
          </div>

          <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
            {config.title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{config.description}</p>

          <div className={`mt-6 rounded-2xl border p-4 ${tone.panel}`}>
            <p className="text-xs font-bold uppercase tracking-wide opacity-70">Account details</p>
            <p className="mt-2 font-bold">{me.company_name || 'Company not provided'}</p>
            <p className="mt-1 break-all text-sm">{me.email}</p>
            {me.status_reason && (
              <p className="mt-3 border-t border-current/10 pt-3 text-sm leading-6">
                <strong>Reason:</strong> {me.status_reason}
              </p>
            )}
          </div>

          {me.status === 'pending' && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <ShieldCheck size={19} className="mt-0.5 shrink-0 text-indigo-600" />
              <p className="text-xs leading-5 text-slate-600">
                Account review helps maintain trust and quality across recruiter job postings.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut size={17} /> Log out
          </button>
        </div>
      </section>
    </main>
  );
}

export default function RecruiterLayout() {
  const [me, setMe] = useState(null);
  const [bad, setBad] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let active = true;

    if (!localStorage.getItem(REC_KEY)) {
      setBad(true);
      return () => {
        active = false;
      };
    }

    api('/recruiter/me', { recruiter: true })
      .then((data) => {
        if (active) setMe(data.recruiter);
      })
      .catch(() => {
        if (active) setBad(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  const logout = () => {
    localStorage.removeItem(REC_KEY);
    nav('/');
  };

  if (bad) return <Navigate to="/recruiter/login" replace />;
  if (!me) return <LoadingScreen />;

  if (me.status !== 'approved') {
    return <AccountStatus me={me} onLogout={logout} />;
  }

  const initials = (me.company_name || me.full_name || 'Recruiter')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  const sidebarLink = ({ isActive }) =>
    `group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${
      isActive
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/20'
        : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
    }`;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <div className="mx-auto flex w-full max-w-[1600px]">
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:translate-x-0 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-20 items-center justify-between border-b border-slate-100 px-5">
            <NavLink to="/recruiter/dashboard" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-600/20">
                <BriefcaseBusiness size={22} />
              </div>
              <div>
                <p className="text-lg font-black tracking-tight text-slate-950">TechAbhi</p>
                <p className="text-[11px] font-medium text-slate-500">Recruiter workspace</p>
              </div>
            </NavLink>

            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            >
              <X size={19} />
            </button>
          </div>

          <div className="border-b border-slate-100 p-4">
            <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 p-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-black text-white">
                {initials || 'R'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {me.company_name || me.full_name || 'Recruiter'}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{me.email}</p>
                <p className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                  <CheckCircle2 size={12} /> Approved account
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
            <p className="mb-3 px-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
              Workspace
            </p>

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={sidebarLink}
                >
                  <Icon size={19} className="shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.special && (
                    <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-bold">
                      NEW
                    </span>
                  )}
                  {!item.special && (
                    <ChevronRight size={15} className="ml-auto opacity-40" />
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-slate-100 p-4">
            <div className="mb-3 rounded-xl border border-indigo-100 bg-indigo-50/70 p-3">
              <div className="flex items-center gap-2 text-indigo-800">
                <ShieldCheck size={17} />
                <span className="text-xs font-bold">Recruiter access</span>
              </div>
              <p className="mt-1.5 text-xs leading-5 text-slate-600">
                Keep your company details and job listings accurate.
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-rose-50 hover:text-rose-700"
            >
              <LogOut size={18} />
              Log out
              <ArrowRight size={15} className="ml-auto" />
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
            <div className="flex min-h-[72px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  aria-label="Open navigation menu"
                  onClick={() => setMobileOpen(true)}
                  className="rounded-xl border border-slate-200 p-2.5 text-slate-700 transition hover:bg-slate-50 lg:hidden"
                >
                  <Menu size={20} />
                </button>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {NAV_ITEMS.find((item) =>
                      item.end
                        ? location.pathname === item.to
                        : location.pathname === item.to ||
                          location.pathname.startsWith(item.to + '/')
                    )?.label || 'Recruiter workspace'}
                  </p>
                  <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">
                    Manage your recruitment activity
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 sm:inline-flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Approved
                </span>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-xs font-black text-indigo-700">
                  {initials || 'R'}
                </div>
              </div>
            </div>
          </header>

          <main className="min-w-0 p-4 sm:p-6 lg:p-8">
            <Outlet context={{ me }} />
          </main>

          <footer className="px-4 pb-6 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-2 border-t border-slate-200 pt-4 text-xs text-slate-400 sm:flex-row">
              <p>© {new Date().getFullYear()} TechAbhi · Recruiter workspace</p>
              <p>Keep hiring fair, professional, and job-related.</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
