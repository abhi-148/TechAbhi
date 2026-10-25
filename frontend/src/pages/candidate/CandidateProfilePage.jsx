
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  FileText,
  GraduationCap,
  Heart,
  Lightbulb,
  LoaderCircle,
  MapPin,
  Plus,
  Save,
  Sparkles,
  Trash2,
  UserRound,
  WandSparkles,
} from 'lucide-react';

import { api } from '../../lib/api';
import { inputCls, TYPE_LABEL, MODE_LABEL } from '../../lib/format';

const cx = (...classes) => classes.filter(Boolean).join(' ');

const EMPTY_PROFILE = {
  headline: '',
  summary: '',
  skills: '',
  education: [],
  experience: [],
  projects: [],
  preferred_location: '',
  preferred_employment_type: '',
  preferred_work_mode: '',
  career_interests: '',
};

function Field({ label, children, wide = false, hint }) {
  return (
    <label className={cx('block min-w-0', wide && 'sm:col-span-2')}>
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1.5 block text-xs leading-5 text-slate-400">
          {hint}
        </span>
      )}
    </label>
  );
}

function SectionHeading({ icon: Icon, title, description, badge }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
        <Icon size={21} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
            {title}
          </h2>
          {badge && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {badge}
            </span>
          )}
        </div>

        {description && (
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function ProfileSection({ children, className = '' }) {
  return (
    <section
      className={cx(
        'rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-7',
        className
      )}
    >
      {children}
    </section>
  );
}

function Rows({
  title,
  description,
  rows = [],
  setRows,
  fields,
  icon: Icon,
}) {
  const updateRow = (index, key, value) => {
    setRows(
      rows.map((row, i) =>
        i === index ? { ...row, [key]: value } : row
      )
    );
  };

  const removeRow = (index) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const addRow = () => {
    setRows([...rows, {}]);
  };

  return (
    <div className="sm:col-span-2">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Icon size={18} />
            </div>
          )}

          <div>
            <h3 className="text-sm font-bold text-slate-800">{title}</h3>
            {description && (
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {description}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={addRow}
          className="inline-flex min-h-9 items-center justify-center gap-1.5 self-start rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:self-center"
        >
          <Plus size={15} />
          Add {title.replace(/s$/, '')}
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
            {Icon ? <Icon size={19} /> : <Plus size={19} />}
          </div>

          <p className="mt-3 text-sm font-semibold text-slate-600">
            Nothing added yet
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Add details to build a more complete profile.
          </p>

          <button
            type="button"
            onClick={addRow}
            className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 focus:outline-none focus:underline"
          >
            + Add your first entry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-indigo-100 sm:p-5"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                    {index + 1}
                  </span>
                  Entry {index + 1}
                </span>

                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  aria-label={`Remove ${title} entry ${index + 1}`}
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {fields.map(([key, placeholder, wide]) => (
                  <label
                    key={key}
                    className={cx('block min-w-0', wide && 'sm:col-span-2')}
                  >
                    <span className="mb-1.5 block text-xs font-semibold capitalize text-slate-600">
                      {key.replaceAll('_', ' ')}
                    </span>

                    {key === 'details' ? (
                      <textarea
                        className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                        rows={3}
                        maxLength={3000}
                        placeholder={placeholder}
                        value={row[key] || ''}
                        onChange={(event) =>
                          updateRow(index, key, event.target.value)
                        }
                      />
                    ) : (
                      <input
                        className={cx(
                          inputCls,
                          'h-11 rounded-xl border-slate-200 bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10'
                        )}
                        maxLength={250}
                        placeholder={placeholder}
                        value={row[key] || ''}
                        onChange={(event) =>
                          updateRow(index, key, event.target.value)
                        }
                      />
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AlertMessage({ type, children, onClose }) {
  const success = type === 'success';

  return (
    <div
      role={success ? 'status' : 'alert'}
      className={cx(
        'flex items-start gap-3 rounded-2xl border p-4 text-sm',
        success
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-rose-200 bg-rose-50 text-rose-800'
      )}
    >
      <div className="mt-0.5 shrink-0">
        {success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      </div>

      <div className="min-w-0 flex-1 leading-6">{children}</div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold opacity-70 hover:opacity-100"
          aria-label="Dismiss message"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}

function LoadingProfile() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading profile">
      <div className="h-48 animate-pulse rounded-3xl bg-slate-200" />

      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6"
        >
          <div className="h-5 w-44 animate-pulse rounded bg-slate-100" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
      ))}

      <span className="sr-only">Loading your profile…</span>
    </div>
  );
}

export default function CandidateProfilePage() {
  const [f, setF] = useState(null);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    setErr('');

    api('/candidate/profile', { candidate: true })
      .then((data) => {
        if (!active) return;

        const profile = data.profile || {};

        setName(data.full_name || '');

        setF({
          ...EMPTY_PROFILE,
          ...profile,
          skills: Array.isArray(profile.skills)
            ? profile.skills.join(', ')
            : profile.skills || '',
          education: Array.isArray(profile.education)
            ? profile.education
            : [],
          experience: Array.isArray(profile.experience)
            ? profile.experience
            : [],
          projects: Array.isArray(profile.projects)
            ? profile.projects
            : [],
        });
      })
      .catch((error) => {
        if (active) {
          setErr(error.message || 'Unable to load your profile.');
        }
      });

    return () => {
      active = false;
    };
  }, [loadAttempt]);

  const set = (key) => (event) => {
    const value = event.target.value;

    setF((previous) => ({ ...previous, [key]: value }));
    setMsg('');
    setErr('');
  };

  const updateRows = (key, rows) => {
    setF((previous) => ({ ...previous, [key]: rows }));
    setMsg('');
    setErr('');
  };

  const completeness = useMemo(() => {
    if (!f) return 0;

    const checks = [
      Boolean(name.trim()),
      Boolean(f.headline?.trim()),
      Boolean(f.summary?.trim()),
      Boolean(f.skills?.trim()),
      f.education.length > 0,
      f.experience.length > 0,
      f.projects.length > 0,
      Boolean(f.preferred_location?.trim()),
      Boolean(f.career_interests?.trim()),
    ];

    return Math.round(
      (checks.filter(Boolean).length / checks.length) * 100
    );
  }, [f, name]);

  const save = async (event) => {
    event?.preventDefault();

    if (busy || aiBusy || !f) return;

    if (!name.trim()) {
      setErr('Please enter your full name before saving your profile.');
      return;
    }

    setBusy(true);
    setErr('');
    setMsg('');

    try {
      await api('/candidate/profile', {
        method: 'PUT',
        body: {
          ...f,
          full_name: name.trim(),
          skills: f.skills
            .split(',')
            .map((skill) => skill.trim())
            .filter(Boolean),
        },
        candidate: true,
      });

      setMsg('Your profile has been saved successfully.');
    } catch (error) {
      setErr(error.message || 'Unable to save your profile.');
    } finally {
      setBusy(false);
    }
  };

  const extract = async () => {
    if (aiBusy || busy || !f) return;

    setAiBusy(true);
    setErr('');
    setMsg('');
    setAi(null);

    try {
      const data = await api('/candidate/profile/extract', {
        method: 'POST',
        candidate: true,
      });

      const profile = data.profile || {};

      setF((current) => ({
        ...current,
        headline: profile.headline || current.headline,
        summary: profile.summary || current.summary,
        career_interests:
          profile.career_interests || current.career_interests,
        skills: profile.skills?.length
          ? Array.isArray(profile.skills)
            ? profile.skills.join(', ')
            : profile.skills
          : current.skills,
        education:
          profile.education?.length > 0
            ? profile.education
            : current.education,
        experience:
          profile.experience?.length > 0
            ? profile.experience
            : current.experience,
        projects:
          profile.projects?.length > 0
            ? profile.projects
            : current.projects,
      }));

      setAi(Array.isArray(data.warnings) ? data.warnings : []);
      setMsg('Resume details drafted. Review them before saving.');
    } catch (error) {
      setErr(error.message || 'Could not extract details from your resume.');
    } finally {
      setAiBusy(false);
    }
  };

  if (!f) {
    if (err) {
      return (
        <div className="rounded-2xl border border-rose-200 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
            <AlertCircle size={26} />
          </div>

          <h2 className="mt-3 text-lg font-bold text-slate-900">
            Couldn’t load your profile
          </h2>

          <p className="mt-2 text-sm leading-6 text-rose-700">{err}</p>

          <button
            type="button"
            onClick={() => {
              setF(null);
              setErr('');
              setLoadAttempt((attempt) => attempt + 1);
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
          >
            <ArrowRight size={16} />
            Try again
          </button>
        </div>
      );
    }

    return <LoadingProfile />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      {/* Profile hero */}
      <section className="relative isolate overflow-hidden rounded-3xl bg-[#111735] p-6 shadow-lg shadow-indigo-950/10 sm:p-8">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-indigo-500/25 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:34px_34px]" />
        </div>

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-indigo-100 shadow-lg">
            <UserRound size={32} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-200">
              <Sparkles size={13} />
              Candidate profile
            </div>

            <h1 className="mt-3 break-words text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Build your professional story
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Keep your experience, skills and career preferences organized
              in one place.
            </p>

            {name.trim() && (
              <p className="mt-3 text-sm font-medium text-indigo-200">
                Welcome, {name.trim()}
              </p>
            )}
          </div>

          <div className="shrink-0 rounded-2xl border border-white/15 bg-white/[0.07] p-4 sm:min-w-36">
            <p className="text-xs font-medium text-slate-300">
              Profile progress
            </p>

            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white">
                {completeness}%
              </span>
            </div>

            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={completeness}
              aria-label="Profile completion"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-300 to-violet-300 transition-all duration-500"
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Alerts */}
      {err && (
        <AlertMessage type="error" onClose={() => setErr('')}>
          <p className="font-bold">Something needs your attention</p>
          <p className="mt-1">{err}</p>

          {err.toLowerCase().includes('resume') && (
            <Link
              className="mt-2 inline-flex items-center gap-1 font-bold underline underline-offset-4"
              to="/candidate/resume"
            >
              Add your resume
              <ArrowRight size={14} />
            </Link>
          )}
        </AlertMessage>
      )}

      {msg && (
        <AlertMessage type="success" onClose={() => setMsg('')}>
          <p className="font-bold">{msg}</p>
        </AlertMessage>
      )}

      {/* AI resume assistant */}
      <section className="relative isolate overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-12 -top-12 -z-10 h-44 w-44 rounded-full bg-violet-200/30 blur-3xl" />

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100">
            <WandSparkles size={24} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                Resume-to-profile assistant
              </h2>

              <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                AI assisted
              </span>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Use your saved resume to draft your headline, summary, skills,
              education, experience and projects into this form.
            </p>

            <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500">
              <CircleHelp
                size={15}
                className="mt-0.5 shrink-0 text-indigo-500"
              />
              Review the extracted details carefully. Nothing is saved until
              you click Save profile.
            </div>

            <button
              type="button"
              onClick={extract}
              disabled={aiBusy || busy}
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {aiBusy ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Sparkles size={17} />
              )}

              {aiBusy ? 'Reading your resume…' : 'Fill profile from resume'}

              {!aiBusy && <ArrowRight size={16} />}
            </button>

            {ai && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="flex items-center gap-2 font-bold">
                  <Lightbulb size={17} />
                  Draft prepared — please review
                </p>

                <p className="mt-1 leading-6">
                  AI can make mistakes. Check all extracted fields before
                  saving your profile.
                </p>

                {ai.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {ai.map((warning, index) => (
                      <li
                        key={`${warning}-${index}`}
                        className="flex gap-2 leading-5"
                      >
                        <span aria-hidden="true">•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <form onSubmit={save} className="space-y-5">
        {/* Basic details */}
        <ProfileSection>
          <SectionHeading
            icon={UserRound}
            title="Basic information"
            description="Start with your name and a clear professional introduction."
            badge="Essential"
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name">
              <input
                className={cx(
                  inputCls,
                  'h-12 rounded-xl border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10'
                )}
                autoComplete="name"
                maxLength={120}
                required
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setMsg('');
                  setErr('');
                }}
                placeholder="Enter your full name"
              />
            </Field>

            <Field
              label="Professional headline"
              hint="Example: Computer Science Graduate | React Developer"
            >
              <input
                className={cx(
                  inputCls,
                  'h-12 rounded-xl border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10'
                )}
                maxLength={200}
                value={f.headline || ''}
                onChange={set('headline')}
                placeholder="Your role or career focus"
              />
            </Field>

            <Field
              label="Professional summary"
              wide
              hint="Briefly describe your background, strengths and career goals."
            >
              <textarea
                className="min-h-32 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                rows={4}
                maxLength={3000}
                value={f.summary || ''}
                onChange={set('summary')}
                placeholder="Tell employers about your experience, skills and goals…"
              />

              <span className="mt-1 block text-right text-xs text-slate-400">
                {(f.summary || '').length}/3000
              </span>
            </Field>

            <Field
              label="Skills"
              wide
              hint="Separate skills with commas, for example: React, JavaScript, Node.js, MySQL"
            >
              <textarea
                className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                rows={3}
                value={f.skills || ''}
                onChange={set('skills')}
                placeholder="JavaScript, React, Node.js, SQL…"
              />
            </Field>
          </div>
        </ProfileSection>

        {/* Education */}
        <ProfileSection>
          <SectionHeading
            icon={GraduationCap}
            title="Education"
            description="Add your degrees, institutions and graduation years."
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Rows
              title="Education entries"
              description="Add each degree or qualification separately."
              rows={f.education || []}
              setRows={(rows) => updateRows('education', rows)}
              icon={BookOpen}
              fields={[
                ['degree', 'e.g. B.Tech Computer Science'],
                ['institution', 'University or institution'],
                ['year', 'Graduation year'],
              ]}
            />
          </div>
        </ProfileSection>

        {/* Experience */}
        <ProfileSection>
          <SectionHeading
            icon={BriefcaseBusiness}
            title="Work experience"
            description="Show internships, employment and other relevant experience."
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Rows
              title="Experience entries"
              description="Include your role, company, dates and key contributions."
              rows={f.experience || []}
              setRows={(rows) => updateRows('experience', rows)}
              icon={BriefcaseBusiness}
              fields={[
                ['title', 'Job title or role'],
                ['company', 'Company name'],
                ['period', 'e.g. Jan–Jun 2025'],
                ['details', 'Responsibilities and achievements', true],
              ]}
            />
          </div>
        </ProfileSection>

        {/* Projects */}
        <ProfileSection>
          <SectionHeading
            icon={FileText}
            title="Projects"
            description="Highlight projects that demonstrate your practical skills."
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Rows
              title="Project entries"
              description="Mention what you built and the technologies you used."
              rows={f.projects || []}
              setRows={(rows) => updateRows('projects', rows)}
              icon={FileText}
              fields={[
                ['name', 'Project name', true],
                ['details', 'Description, technologies and outcomes', true],
              ]}
            />
          </div>
        </ProfileSection>

        {/* Career preferences */}
        <ProfileSection>
          <SectionHeading
            icon={Heart}
            title="Career preferences"
            description="Tell us what kind of opportunities you want to explore."
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Preferred location"
              hint="You can enter a city, region or Remote."
            >
              <div className="relative">
                <MapPin
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  className={cx(
                    inputCls,
                    'h-12 rounded-xl border-slate-200 pl-10 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10'
                  )}
                  value={f.preferred_location || ''}
                  onChange={set('preferred_location')}
                  placeholder="e.g. Ahmedabad, Pune"
                />
              </div>
            </Field>

            <Field label="Preferred employment type">
              <div className="relative">
                <select
                  className={cx(
                    inputCls,
                    'h-12 appearance-none rounded-xl border-slate-200 pr-10 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10'
                  )}
                  value={f.preferred_employment_type || ''}
                  onChange={set('preferred_employment_type')}
                >
                  <option value="">Any employment type</option>
                  {Object.entries(TYPE_LABEL).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </Field>

            <Field label="Preferred work arrangement">
              <div className="relative">
                <select
                  className={cx(
                    inputCls,
                    'h-12 appearance-none rounded-xl border-slate-200 pr-10 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10'
                  )}
                  value={f.preferred_work_mode || ''}
                  onChange={set('preferred_work_mode')}
                >
                  <option value="">Any work arrangement</option>
                  {Object.entries(MODE_LABEL).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </Field>

            <Field
              label="Career interests"
              wide
              hint="Describe the roles, industries or technologies you want to work with."
            >
              <textarea
                className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                rows={3}
                maxLength={2000}
                value={f.career_interests || ''}
                onChange={set('career_interests')}
                placeholder="e.g. Frontend development, MERN stack, software engineering…"
              />
            </Field>
          </div>
        </ProfileSection>

        {/* Save area */}
        <div className="sticky bottom-3 z-20 rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-[0_12px_40px_-15px_rgba(15,23,42,0.25)] backdrop-blur-xl sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5 px-1">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Check size={17} />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800">
                  Keep your profile up to date
                </p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">
                  Review your changes before saving.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy || aiBusy}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}

              {busy ? 'Saving profile…' : 'Save profile'}
            </button>
          </div>
        </div>
      </form>

      <p className="flex items-start gap-2 px-1 text-xs leading-5 text-slate-400">
        <CircleHelp size={15} className="mt-0.5 shrink-0" />
        Keep your profile details accurate and review your privacy settings
        before sharing personal information.
      </p>
    </div>
  );
}
