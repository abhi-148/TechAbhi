
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';

import { api, CAND_KEY } from '../../lib/api';
import { inputCls, useMeta, safeNext } from '../../lib/format';

export default function CandidateAuthPage({ mode }) {
  const reg = mode === 'register';

  useMeta(reg ? 'Create account | TechAbhi' : 'Log in | TechAbhi');

  const nav = useNavigate();
  const [sp] = useSearchParams();

  const [f, setF] = useState({
    full_name: '',
    email: '',
    password: '',
  });

  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (key) => (event) => {
    setF((previous) => ({
      ...previous,
      [key]: event.target.value,
    }));

    setErr('');
  };

  const submit = async (event) => {
    event.preventDefault();

    if (busy) return;

    setBusy(true);
    setErr('');

    try {
      const body = {
        email: f.email.trim().toLowerCase(),
        password: f.password,
        ...(reg ? { full_name: f.full_name.trim() } : {}),
      };

      const d = await api(`/candidate/${mode}`, {
        method: 'POST',
        body,
      });

      if (!d?.token) {
        throw new Error('Authentication succeeded without a session token. Please try again.');
      }

      localStorage.setItem(CAND_KEY, d.token);

      nav(safeNext(sp.get('next'), '/candidate/dashboard'), {
        replace: true,
      });
    } catch (error) {
      setErr(error.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative isolate min-h-[calc(100vh-64px)] overflow-hidden bg-[#f7f8fc] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute -right-32 top-40 h-96 w-96 rounded-full bg-violet-200/35 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sky-100/50 blur-3xl" />
      </div>

      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_25px_90px_-35px_rgba(31,41,91,0.25)] lg:grid-cols-[0.95fr_1.05fr]">
        {/* Brand panel */}
        <aside className="relative isolate hidden overflow-hidden bg-[#111735] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-12">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:36px_36px]" />
          </div>

          <Link to="/" className="inline-flex w-fit items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-indigo-200 ring-1 ring-white/15">
              <BriefcaseBusiness size={22} />
            </div>

            <span className="text-xl font-extrabold tracking-tight">
              Tech<span className="text-indigo-300">Abhi</span>
            </span>
          </Link>

          <div className="py-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-2 text-xs font-semibold text-indigo-100">
              <Sparkles size={14} className="text-violet-300" />
              YOUR CAREER, YOUR NEXT CHAPTER
            </div>

            <h1 className="mt-7 text-4xl font-extrabold leading-tight tracking-tight xl:text-5xl">
              {reg
                ? 'Make room for your next big move.'
                : 'Your next opportunity is waiting.'}
            </h1>

            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">
              {reg
                ? 'Create your account and take a step towards discovering opportunities that fit your ambitions.'
                : 'Sign in to continue your career journey and access your candidate dashboard.'}
            </p>

            <div className="mt-8 space-y-4">
              {[
                'Explore opportunities in one place',
                'Keep track of your job applications',
                'Take control of your career journey',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-sm text-slate-200"
                >
                  <CheckCircle2
                    size={18}
                    className="shrink-0 text-indigo-300"
                  />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-white/10 pt-5 text-xs text-slate-400">
            <ShieldCheck size={15} className="text-indigo-300" />
            A dedicated space for your career journey
          </div>
        </aside>

        {/* Authentication form */}
        <section className="p-5 sm:p-9 lg:p-10 xl:p-12">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <BriefcaseBusiness size={20} />
              </div>

              <span className="text-lg font-extrabold tracking-tight text-slate-900">
                Tech<span className="text-indigo-600">Abhi</span>
              </span>
            </Link>

            <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
              Candidate portal
            </span>
          </div>

          <div className="mb-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              {reg ? <UserRound size={23} /> : <LockKeyhole size={22} />}
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.17em] text-indigo-600">
              {reg ? 'GET STARTED' : 'WELCOME BACK'}
            </p>

            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
              {reg ? 'Create your account' : 'Welcome back'}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {reg
                ? 'Join TechAbhi and get started with your career journey.'
                : 'Enter your details to sign in to your candidate account.'}
            </p>
          </div>

          {err && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
            >
              <div className="mt-0.5 shrink-0">
                <ShieldCheck size={17} />
              </div>

              <div className="min-w-0">
                <p className="font-bold">
                  Unable to {reg ? 'create account' : 'log in'}
                </p>
                <p className="mt-1 break-words leading-6">{err}</p>
              </div>
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            {reg && (
              <div>
                <label
                  htmlFor="candidate-name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Full name
                </label>

                <div className="relative">
                  <UserRound
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="candidate-name"
                    name="full_name"
                    className={`${inputCls} h-12 rounded-xl border-slate-200 bg-slate-50/70 pl-11 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10`}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    required
                    maxLength={120}
                    value={f.full_name}
                    onChange={set('full_name')}
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="candidate-email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="candidate-email"
                  name="email"
                  className={`${inputCls} h-12 rounded-xl border-slate-200 bg-slate-50/70 pl-11 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10`}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={f.email}
                  onChange={set('email')}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label
                  htmlFor="candidate-password"
                  className="text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                {reg && (
                  <span className="text-xs text-slate-400">
                    At least 8 characters
                  </span>
                )}
              </div>

              <div className="relative">
                <LockKeyhole
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="candidate-password"
                  name="password"
                  className={`${inputCls} h-12 rounded-xl border-slate-200 bg-slate-50/70 pl-11 pr-12 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10`}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={
                    reg ? 'Create a strong password' : 'Enter your password'
                  }
                  autoComplete={reg ? 'new-password' : 'current-password'}
                  required
                  minLength={reg ? 8 : undefined}
                  value={f.password}
                  onChange={set('password')}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-indigo-600/30 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {busy
                ? 'Please wait…'
                : reg
                  ? 'Create free account'
                  : 'Sign in to your account'}

              {!busy && <ArrowRight size={17} />}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-xs text-slate-400">
              YOUR CAREER JOURNEY
            </span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <p className="text-center text-sm leading-6 text-slate-500">
            {reg ? 'Already have an account?' : 'New to TechAbhi?'}{' '}
            {reg ? (
              <Link
                className="font-bold text-indigo-600 underline-offset-4 hover:text-indigo-800 hover:underline"
                to="/candidate/login"
              >
                Sign in
              </Link>
            ) : (
              <Link
                className="font-bold text-indigo-600 underline-offset-4 hover:text-indigo-800 hover:underline"
                to="/candidate/register"
              >
                Create an account
              </Link>
            )}
          </p>

          <p className="mt-5 text-center text-xs leading-5 text-slate-400">
            An account is optional for browsing available job listings.
          </p>
        </section>
      </div>
    </main>
  );
}
