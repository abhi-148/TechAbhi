
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
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
  CheckCircle2,
  Fingerprint,
} from 'lucide-react';

import { api, TOKEN_KEY } from '../../lib/api';
import { inputCls, useMeta } from '../../lib/format';

const FEATURES = [
  'Manage job listings and publishing',
  'Review recruiter registrations',
  'Support candidates with career assistance',
];

export default function AdminLoginPage() {
  useMeta('Admin Login | TechAbhi');

  const nav = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (key) => (event) => {
    const value = event.target.value;

    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));

    if (error) setError('');
  };

  const submit = async (event) => {
    event.preventDefault();

    if (busy) return;

    setBusy(true);
    setError('');

    try {
      const response = await api('/admin/login', {
        method: 'POST',
        body: {
          email: form.email.trim(),
          password: form.password,
        },
      });

      if (!response?.token) {
        throw new Error(
          'Login response did not contain an authentication token.'
        );
      }

      localStorage.setItem(TOKEN_KEY, response.token);
      nav('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(
        err.message || 'Unable to sign in. Please check your credentials.'
      );
    } finally {
      setBusy(false);
    }
  };

  const fieldClass = [
    inputCls,
    'w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3.5',
    'text-sm text-slate-900 placeholder:text-slate-400',
    'transition duration-200',
    'hover:border-slate-300',
    'focus:border-indigo-500 focus:bg-white focus:outline-none',
    'focus:ring-4 focus:ring-indigo-500/10',
    'disabled:cursor-not-allowed disabled:opacity-60',
  ].join(' ');

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#f6f7fb] px-4 py-8 sm:px-6 lg:py-12">
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-200/35 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-violet-200/35 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-100/40 blur-3xl" />
      </div>

      <div className="w-full max-w-6xl">
        {/* Top branding */}
        <div className="mb-6 flex items-center justify-between gap-4 px-1 sm:mb-8">
          <Link to="/" className="group inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 transition group-hover:-translate-y-0.5 group-hover:bg-indigo-700">
              <BriefcaseBusiness size={22} />
            </span>

            <span>
              <span className="block text-lg font-black tracking-tight text-slate-950">
                TechAbhi
              </span>
              <span className="block text-xs font-medium text-slate-500">
                Career platform
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm sm:inline-flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Admin portal
          </div>
        </div>

        {/* Main card */}
        <div className="grid overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_24px_100px_-30px_rgba(30,41,90,0.25)] lg:min-h-[650px] lg:grid-cols-[1.02fr_0.98fr]">
          {/* Left branding panel */}
          <section className="relative isolate hidden overflow-hidden bg-[#10112b] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 via-transparent to-violet-600/30" />

              <div className="absolute -right-28 -top-24 h-96 w-96 rounded-full border border-white/10" />
              <div className="absolute -right-12 -top-8 h-64 w-64 rounded-full border border-white/10" />

              <div className="absolute -bottom-28 -left-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

              <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)',
                  backgroundSize: '38px 38px',
                }}
              />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-2 text-xs font-bold tracking-wide text-indigo-100">
                <Sparkles size={15} className="text-violet-300" />
                YOUR PLATFORM, ONE WORKSPACE
              </div>

              <h1 className="mt-8 max-w-lg text-4xl font-black leading-[1.15] tracking-tight xl:text-5xl">
                Everything under control.
                <span className="mt-2 block bg-gradient-to-r from-indigo-300 via-violet-300 to-sky-300 bg-clip-text text-transparent">
                  Every opportunity matters.
                </span>
              </h1>

              <p className="mt-6 max-w-md text-sm leading-7 text-slate-300">
                Your central workspace for managing jobs, recruiters,
                candidate accounts, and career assistance on TechAbhi.
              </p>

              <div className="mt-9 space-y-4">
                {FEATURES.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 text-sm text-slate-200"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-400/10 text-emerald-300">
                      <CheckCircle2 size={15} />
                    </span>
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            {/* Security panel */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-white/10 p-2.5 text-indigo-200">
                  <Fingerprint size={22} />
                </div>

                <div>
                  <p className="text-sm font-bold text-white">
                    Secure administrator access
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    This area is intended for authorized administrators.
                    Keep your credentials confidential.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
              <span>© {new Date().getFullYear()} TechAbhi</span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={14} />
                Admin workspace
              </span>
            </div>
          </section>

          {/* Right login panel */}
          <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-14">
            <div className="w-full max-w-md">
              {/* Mobile branding */}
              <div className="mb-8 flex items-center gap-2.5 lg:hidden">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <BriefcaseBusiness size={21} />
                </span>
                <span className="text-lg font-black tracking-tight text-slate-950">
                  TechAbhi
                </span>
              </div>

              <div className="mb-8">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-700 shadow-sm">
                  <LockKeyhole size={25} />
                </div>

                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-600">
                  Welcome back
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  Admin sign in
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Enter your administrator credentials to access your
                  dashboard.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
                >
                  <ShieldAlert size={19} className="mt-0.5 shrink-0" />
                  <p className="break-words">{error}</p>
                </div>
              )}

              <form onSubmit={submit} className="space-y-5">
                {/* Email */}
                <div>
                  <label
                    htmlFor="admin-email"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Email address
                  </label>

                  <div className="group relative">
                    <Mail
                      size={18}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-indigo-600"
                    />

                    <input
                      id="admin-email"
                      name="email"
                      className={`${fieldClass} pl-11`}
                      type="email"
                      placeholder="admin@techabhi.com"
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      required
                      disabled={busy}
                      value={form.email}
                      onChange={updateField('email')}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label
                      htmlFor="admin-password"
                      className="text-sm font-bold text-slate-700"
                    >
                      Password
                    </label>

                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                      <ShieldCheck size={13} />
                      Protected
                    </span>
                  </div>

                  <div className="group relative">
                    <LockKeyhole
                      size={18}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-indigo-600"
                    />

                    <input
                      id="admin-password"
                      name="password"
                      className={`${fieldClass} pl-11 pr-12`}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      disabled={busy}
                      value={form.password}
                      onChange={updateField('password')}
                    />

                    <button
                      type="button"
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                      aria-pressed={showPassword}
                      onClick={() =>
                        setShowPassword((previous) => !previous)
                      }
                      disabled={busy}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50"
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={busy}
                  className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-indigo-600 px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-indigo-600/20 transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/25 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                  {busy ? (
                    <>
                      <LoaderCircle
                        size={18}
                        className="animate-spin"
                      />
                      Signing you in...
                    </>
                  ) : (
                    <>
                      Sign in to dashboard
                      <ArrowRight
                        size={18}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>

              {/* Trust notice */}
              <div className="mt-7 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />

                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Authorized access only
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Never share your password or authentication token.
                    Sign in only from a trusted device.
                  </p>
                </div>
              </div>

              <Link
                to="/"
                className="mt-7 inline-flex w-full items-center justify-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-700"
              >
                <ArrowLeft size={16} />
                Back to TechAbhi
              </Link>

              <p className="mt-8 text-center text-[11px] leading-5 text-slate-400">
                © {new Date().getFullYear()} TechAbhi. All rights reserved.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
