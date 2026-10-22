
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  ShieldAlert,
  LoaderCircle,
  BriefcaseBusiness,
  Sparkles,
} from 'lucide-react';
import { api, TOKEN_KEY } from '../../lib/api';
import { inputCls, useMeta } from '../../lib/format';

export default function AdminLoginPage() {
  useMeta('Admin Login | TechAbhi');

  const nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (key) => (e) => {
    setF((previous) => ({ ...previous, [key]: e.target.value }));
    if (err) setErr('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setErr('');

    try {
      const d = await api('/admin/login', {
        method: 'POST',
        body: f,
      });

      localStorage.setItem(TOKEN_KEY, d.token);
      nav('/admin/dashboard');
    } catch (error) {
      setErr(error.message || 'Unable to sign in. Please check your credentials.');
    } finally {
      setBusy(false);
    }
  };

  const fieldClass = `${inputCls} w-full rounded-xl border-slate-200 bg-white py-3.5 text-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100`;

  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-indigo-100/80 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-violet-100/80 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-indigo-950/10 md:grid-cols-2">
        {/* Branding panel */}
        <section className="relative isolate flex flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-7 text-white sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute -right-16 -top-12 h-64 w-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-1 top-4 h-44 w-44 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />

          <div className="relative">
            <Link to="/" className="inline-flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                <BriefcaseBusiness size={24} />
              </span>
              <span>
                <span className="block text-xl font-black tracking-tight">TechAbhi</span>
                <span className="block text-xs text-indigo-200">Admin workspace</span>
              </span>
            </Link>

            <div className="mt-12 sm:mt-16">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-indigo-100">
                <Sparkles size={14} /> ADMIN CONTROL CENTER
              </span>

              <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                Manage your platform.
                <span className="block text-violet-300">Make every job count.</span>
              </h1>

              <p className="mt-5 text-sm leading-7 text-indigo-100/80">
                Access platform statistics, job listings, recruiter approvals, and candidate career assistance from one secure workspace.
              </p>
            </div>

            <div className="mt-9 space-y-4">
              {[
                'Manage job listings and publishing',
                'Review recruiter registrations',
                'Coordinate candidate assistance',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-indigo-50">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <ShieldCheck size={14} />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-10 border-t border-white/10 pt-5">
            <p className="text-xs leading-5 text-indigo-200/75">
              Authorized administrators only. Keep your login credentials private.
            </p>
          </div>
        </section>

        {/* Login form */}
        <section className="flex items-center p-6 sm:p-10 lg:p-12">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-8">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                <LockKeyhole size={26} />
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                Secure access
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Admin login
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Sign in with your administrator credentials to continue.
              </p>
            </div>

            {err && (
              <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                <ShieldAlert size={19} className="mt-0.5 shrink-0" />
                <p className="break-words">{err}</p>
              </div>
            )}

            <form onSubmit={submit} className="space-y-5">
              <div>
                <label htmlFor="admin-email" className="mb-2 block text-sm font-bold text-slate-700">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="admin-email"
                    className={`${fieldClass} pl-11`}
                    type="email"
                    placeholder="admin@company.com"
                    autoComplete="username"
                    required
                    value={f.email}
                    onChange={updateField('email')}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="admin-password" className="text-sm font-bold text-slate-700">
                    Password
                  </label>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <ShieldCheck size={13} /> Protected
                  </span>
                </div>

                <div className="relative">
                  <LockKeyhole size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="admin-password"
                    className={`${fieldClass} pl-11 pr-12`}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    value={f.password}
                    onChange={updateField('password')}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in to dashboard
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-7 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Administrator access</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Only authorized admin accounts can access this area. Never share your password or authentication token.
                  </p>
                </div>
              </div>
            </div>

            <Link
              to="/"
              className="mt-6 block text-center text-sm font-semibold text-slate-500 transition hover:text-indigo-700"
            >
              ← Back to TechAbhi
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
