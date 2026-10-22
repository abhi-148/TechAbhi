
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  Phone,
  LoaderCircle,
  FileText,
  Info,
} from 'lucide-react';
import { api, REC_KEY } from '../../lib/api';
import { inputCls, useMeta } from '../../lib/format';

export default function RecruiterAuthPage({ mode }) {
  const reg = mode === 'register';
  useMeta(reg ? 'Recruiter registration | TechAbhi' : 'Recruiter login | TechAbhi');

  const nav = useNavigate();
  const [f, setF] = useState({
    full_name: '',
    email: '',
    password: '',
    company_name: '',
    company_website: '',
    phone: '',
    company_description: '',
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (key) => (e) => {
    setF((previous) => ({ ...previous, [key]: e.target.value }));
    if (err) setErr('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setErr('');

    try {
      const data = await api('/recruiter/' + mode, {
        method: 'POST',
        body: f,
      });

      localStorage.setItem(REC_KEY, data.token);
      nav('/recruiter/dashboard');
    } catch (error) {
      setErr(error.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const fieldClass = `${inputCls} w-full rounded-xl border-slate-200 bg-white py-3 text-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100`;
  const labelClass = 'mb-2 block text-sm font-semibold text-slate-700';

  return (
    <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute -left-28 top-20 h-72 w-72 rounded-full bg-indigo-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-10 h-80 w-80 rounded-full bg-violet-100/70 blur-3xl" />

      <div className={`relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-indigo-950/5 lg:grid-cols-2 ${reg ? 'max-w-7xl' : ''}`}>
        <section className="relative isolate flex flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-7 text-white sm:p-10 lg:min-h-[680px] lg:p-12">
          <div className="pointer-events-none absolute -right-16 -top-10 h-64 w-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-2 top-6 h-44 w-44 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />

          <div className="relative">
            <Link to="/" className="inline-flex items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/70">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 shadow-lg">
                <BriefcaseBusiness size={23} />
              </span>
              <span>
                <span className="block text-lg font-black tracking-tight">TechAbhi</span>
                <span className="block text-xs text-indigo-200">Recruiter workspace</span>
              </span>
            </Link>

            <div className="mt-12 max-w-lg sm:mt-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-indigo-100">
                <Sparkles size={14} />
                {reg ? 'BUILD YOUR HIRING NETWORK' : 'WELCOME BACK'}
              </div>

              <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-4xl xl:text-5xl">
                {reg ? (
                  <>Meet your next <span className="text-violet-300">great hire.</span></>
                ) : (
                  <>Your next great hire starts <span className="text-violet-300">here.</span></>
                )}
              </h1>

              <p className="mt-5 max-w-md text-sm leading-7 text-indigo-100/85 sm:text-base">
                {reg
                  ? 'Create your recruiter account to start managing opportunities and reviewing applications through TechAbhi.'
                  : 'Sign in to manage your hiring workflow, review candidate applications, and keep your recruitment organized.'}
              </p>
            </div>

            <div className="mt-9 space-y-4">
              {[
                {
                  icon: Users,
                  title: 'Candidate applications',
                  description: 'Review applications submitted through TechAbhi.',
                },
                {
                  icon: BriefcaseBusiness,
                  title: 'Job management',
                  description: 'Keep your job opportunities organized.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Recruiter workspace',
                  description: 'Manage application status and private notes.',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-violet-200">
                      <Icon size={17} />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-indigo-100/70">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative mt-10 border-t border-white/10 pt-5">
            <p className="text-xs leading-5 text-indigo-200/80">
              A professional workspace for recruiters and hiring teams.
            </p>
          </div>
        </section>

        <section className="min-w-0 p-6 sm:p-10 lg:p-12">
          <div className="mx-auto max-w-xl">
            <div className="mb-7">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                {reg ? <Building2 size={24} /> : <LockKeyhole size={24} />}
              </div>

              <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                {reg ? 'Create recruiter account' : 'Welcome back'}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {reg
                  ? 'Share your professional details to submit your account for review.'
                  : 'Enter your credentials to access your recruiter dashboard.'}
              </p>
            </div>

            {reg && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <Info size={19} className="mt-0.5 shrink-0 text-amber-700" />
                <div>
                  <p className="text-sm font-bold text-amber-900">Account approval required</p>
                  <p className="mt-1 text-xs leading-5 text-amber-800">
                    New recruiter accounts are reviewed by the TechAbhi team before job posting access is granted. Use your work email and genuine company details.
                  </p>
                </div>
              </div>
            )}

            {err && (
              <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                <Info size={18} className="mt-0.5 shrink-0" />
                <p className="break-words">{err}</p>
              </div>
            )}

            <form onSubmit={submit} className="space-y-5">
              {reg && (
                <div>
                  <label className={labelClass} htmlFor="full_name">Full name</label>
                  <div className="relative">
                    <UserRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="full_name"
                      className={`${fieldClass} pl-10`}
                      placeholder="Your full name"
                      autoComplete="name"
                      required
                      value={f.full_name}
                      onChange={set('full_name')}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className={labelClass} htmlFor="email">Work email</label>
                <div className="relative">
                  <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    className={`${fieldClass} pl-10`}
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    required
                    value={f.email}
                    onChange={set('email')}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="password">Password</label>
                <div className="relative">
                  <LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    className={`${fieldClass} pl-10 pr-12`}
                    type={showPassword ? 'text' : 'password'}
                    placeholder={reg ? 'Create a password (8+ characters)' : 'Enter your password'}
                    autoComplete={reg ? 'new-password' : 'current-password'}
                    minLength={reg ? 8 : undefined}
                    required
                    value={f.password}
                    onChange={set('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {reg && (
                  <p className="mt-2 text-xs text-slate-500">
                    Choose a strong password that you don't use elsewhere.
                  </p>
                )}
              </div>

              {reg && (
                <>
                  <div className="border-t border-slate-100 pt-5">
                    <div className="mb-4 flex items-center gap-2">
                      <Building2 size={18} className="text-indigo-600" />
                      <h3 className="font-bold text-slate-900">Company information</h3>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label className={labelClass} htmlFor="company_name">Company name</label>
                        <div className="relative">
                          <Building2 size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            id="company_name"
                            className={`${fieldClass} pl-10`}
                            placeholder="Your company name"
                            autoComplete="organization"
                            required
                            value={f.company_name}
                            onChange={set('company_name')}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass} htmlFor="company_website">Company website <span className="font-normal text-slate-400">(optional)</span></label>
                        <div className="relative">
                          <Globe size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            id="company_website"
                            className={`${fieldClass} pl-10`}
                            type="url"
                            placeholder="https://company.com"
                            autoComplete="url"
                            value={f.company_website}
                            onChange={set('company_website')}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass} htmlFor="phone">Phone <span className="font-normal text-slate-400">(optional)</span></label>
                        <div className="relative">
                          <Phone size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            id="phone"
                            className={`${fieldClass} pl-10`}
                            type="tel"
                            placeholder="Contact number"
                            autoComplete="tel"
                            value={f.phone}
                            onChange={set('phone')}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass} htmlFor="company_description">About your company <span className="font-normal text-slate-400">(optional)</span></label>
                        <div className="relative">
                          <FileText size={17} className="pointer-events-none absolute left-3.5 top-4 text-slate-400" />
                          <textarea
                            id="company_description"
                            className={`${fieldClass} min-h-28 resize-y pl-10`}
                            rows={4}
                            placeholder="Briefly describe your company and what you do..."
                            value={f.company_description}
                            onChange={set('company_description')}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Please wait...
                  </>
                ) : (
                  <>
                    {reg ? 'Submit for approval' : 'Log in to dashboard'}
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">OR</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <p className="text-center text-sm text-slate-600">
              {reg ? 'Already have a recruiter account?' : 'New to TechAbhi recruiter workspace?'}
              {' '}
              <Link
                className="font-bold text-indigo-700 underline decoration-indigo-200 underline-offset-4 hover:text-indigo-900"
                to={reg ? '/recruiter/login' : '/recruiter/register'}
              >
                {reg ? 'Log in' : 'Create account'}
              </Link>
            </p>

            <div className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={15} />
              <span>Recruiter account access is protected</span>
            </div>
          </div>
        </section>
      </div>

      <p className="relative mt-6 text-center text-xs text-slate-400">
        <Link to="/" className="font-semibold text-slate-500 hover:text-indigo-700">
          ← Back to TechAbhi
        </Link>
      </p>
    </main>
  );
}
