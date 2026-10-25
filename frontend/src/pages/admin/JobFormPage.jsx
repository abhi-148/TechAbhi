
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  Globe,
  GraduationCap,
  Info,
  LoaderCircle,
  MapPin,
  Save,
  Send,
  Sparkles,
  Wallet,
  AlertTriangle,
  WandSparkles,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CircleHelp,
} from 'lucide-react';

import { api } from '../../lib/api';
import {
  inputCls,
  btnPrimary,
  btnGhost,
  TYPE_LABEL,
  MODE_LABEL,
} from '../../lib/format';

const EMPTY = {
  title: '',
  company: '',
  category: '',
  location: '',
  work_mode: '',
  employment_type: '',
  experience: '',
  salary: '',
  salary_min: '',
  salary_max: '',
  openings: '',
  education: '',
  description: '',
  responsibilities: '',
  requirements: '',
  eligibility: '',
  benefits: '',
  skills: '',
  application_url: '',
  application_email: '',
  application_instructions: '',
  expires_at: '',
};

const LIST_FIELDS = ['responsibilities', 'requirements', 'benefits'];

const FIELD_LABELS = {
  title: 'Job title',
  company: 'Company',
  category: 'Job category',
  location: 'Location',
  work_mode: 'Work mode',
  employment_type: 'Employment type',
  experience: 'Experience',
  salary: 'Salary',
  salary_min: 'Minimum salary',
  salary_max: 'Maximum salary',
  openings: 'Number of openings',
  education: 'Education',
  description: 'Job description',
  responsibilities: 'Responsibilities',
  requirements: 'Requirements',
  eligibility: 'Eligibility',
  benefits: 'Benefits',
  skills: 'Skills',
  application_url: 'Application URL',
  application_email: 'Application email',
  application_instructions: 'Application instructions',
  expires_at: 'Application deadline',
};

const REQUIRED_FOR_PUBLISH = [
  ['title', 'Job title'],
];

function normalizeValue(key, value) {
  if (value === null || value === undefined) return '';

  if (LIST_FIELDS.includes(key)) {
    return Array.isArray(value) ? value.join('\n') : String(value);
  }

  if (key === 'skills') {
    return Array.isArray(value) ? value.join(', ') : String(value);
  }

  if (key === 'expires_at') {
    return String(value).slice(0, 10);
  }

  return String(value);
}

function fromJob(job = {}) {
  return Object.fromEntries(
    Object.keys(EMPTY).map((key) => [
      key,
      normalizeValue(key, job[key]),
    ])
  );
}

function cleanText(value) {
  return String(value ?? '').trim();
}

function Field({
  label,
  children,
  wide = false,
  hint,
  required = false,
  status,
}) {
  return (
    <label className={`block min-w-0 ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="mb-2 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-700">
        {label}
        {required && <span className="text-rose-500">*</span>}

        {status === 'filled' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            <CheckCircle2 size={11} />
            Filled
          </span>
        )}

        {status === 'missing' && (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
            Review
          </span>
        )}
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

function Section({
  number,
  title,
  description,
  icon: Icon,
  children,
  defaultOpen = true,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-5 text-left transition hover:bg-slate-50/70 sm:px-6"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
          <Icon size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
            Section {number}
          </p>
          <h2 className="mt-1 text-base font-black text-slate-950">
            {title}
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>

        {open ? (
          <ChevronUp size={18} className="mt-2 shrink-0 text-slate-400" />
        ) : (
          <ChevronDown size={18} className="mt-2 shrink-0 text-slate-400" />
        )}
      </button>

      {open && (
        <div className="grid gap-x-5 gap-y-5 border-t border-slate-100 p-5 sm:grid-cols-2 sm:p-6">
          {children}
        </div>
      )}
    </section>
  );
}

function Notice({ type = 'info', children, onClose }) {
  const styles = {
    info: 'border-indigo-100 bg-indigo-50 text-indigo-950',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-950',
    error: 'border-rose-200 bg-rose-50 text-rose-950',
  };

  const Icon =
    type === 'success'
      ? CheckCircle2
      : type === 'warning'
        ? AlertTriangle
        : type === 'error'
          ? AlertTriangle
          : Info;

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${styles[type]}`}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1 leading-6">{children}</div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss message"
          className="rounded-md p-1 opacity-70 hover:bg-black/5 hover:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  );
}

function ErrorPanel({ errors }) {
  if (!errors.length) return null;

  return (
    <Notice type="error">
      <p className="font-bold">Please review the following</p>
      <ul className="mt-2 list-inside list-disc space-y-1">
        {errors.map((error, index) => (
          <li key={`${error}-${index}`}>{error}</li>
        ))}
      </ul>
    </Notice>
  );
}

export default function JobFormPage({ scope = 'admin' }) {
  const prefix = `/${scope}`;
  const auth = scope === 'recruiter' ? { recruiter: true } : { admin: true };
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ ...EMPTY });
  const [status, setStatus] = useState(null);

  const [sourceText, setSourceText] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNote, setAiNote] = useState(null);
  const [aiApplied, setAiApplied] = useState(false);

  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [notice, setNotice] = useState(null);
  const [showAllFields, setShowAllFields] = useState(false);

  const filledCount = useMemo(
    () => Object.values(form).filter((value) => cleanText(value)).length,
    [form]
  );

  const missingImportant = useMemo(
    () =>
      REQUIRED_FOR_PUBLISH.filter(([key]) => !cleanText(form[key])).map(
        ([, label]) => label
      ),
    [form]
  );

  const completion = Math.round((filledCount / Object.keys(EMPTY).length) * 100);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return undefined;
    }

    let active = true;

    setLoading(true);

    api(`${prefix}/jobs/${id}`, { ...auth })
      .then((data) => {
        if (!active) return;

        const job = data?.job;

        if (!job) {
          throw new Error('The requested job was not returned by the server.');
        }

        setForm(fromJob(job));
        setStatus(job.status || null);
      })
      .catch((error) => {
        if (active) {
          setErrors([error.message || 'Unable to load this job.']);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, prefix, scope]);

  const updateField = (key) => (event) => {
    const value = event.target.value;

    setForm((current) => ({ ...current, [key]: value }));
    setErrors([]);
    setNotice(null);
  };

  const extractWithAI = async () => {
    if (sourceText.trim().length < 30 || aiBusy) return;

    setAiBusy(true);
    setErrors([]);
    setNotice(null);
    setAiNote(null);

    try {
      const data = await api(`${prefix}/jobs/parse`, {
        method: 'POST',
        body: { text: sourceText.trim() },
        ...auth,
      });

      if (!data?.job || typeof data.job !== 'object') {
        throw new Error('AI did not return job fields. Please try again.');
      }

      const extracted = fromJob(data.job);
      let changedCount = 0;

      setForm((current) => {
        const next = { ...current };

        for (const key of Object.keys(EMPTY)) {
          const incoming = cleanText(extracted[key]);

          // Never replace existing form values with blank AI output.
          if (incoming) {
            next[key] = extracted[key];
            changedCount += 1;
          }
        }

        // A recruiter should not accidentally change their company profile.
        if (scope === 'recruiter') {
          next.company = current.company;
        }

        return next;
      });

      const warnings = Array.isArray(data.warnings)
        ? data.warnings
        : data.warnings
          ? [String(data.warnings)]
          : [];

      setAiNote({
        warnings,
        fieldsFound: Object.keys(EMPTY).filter((key) =>
          cleanText(extracted[key])
        ),
      });

      setAiApplied(true);
      setNotice({
        type: 'success',
        text: 'AI extraction completed. Review the extracted information before saving or publishing.',
      });
    } catch (error) {
      setErrors([
        error.message || 'AI extraction failed. Please try again.',
      ]);
    } finally {
      setAiBusy(false);
    }
  };

  const resetSource = () => {
    setSourceText('');
    setAiNote(null);
    setAiApplied(false);
    setNotice(null);
  };

  const buildPayload = () => ({
    ...form,
    title: cleanText(form.title),
    company: cleanText(form.company),
    salary_min: form.salary_min === '' ? null : Number(form.salary_min),
    salary_max: form.salary_max === '' ? null : Number(form.salary_max),
    openings: form.openings === '' ? null : Number(form.openings),
    expires_at: form.expires_at || null,
  });

  const persist = async () => {
    const payload = buildPayload();

    if (
      payload.salary_min !== null &&
      payload.salary_max !== null &&
      payload.salary_min > payload.salary_max
    ) {
      throw new Error('Minimum salary cannot exceed maximum salary.');
    }

    const response = id
      ? await api(`${prefix}/jobs/${id}`, {
          method: 'PUT',
          body: payload,
          ...auth,
        })
      : await api(`${prefix}/jobs`, {
          method: 'POST',
          body: payload,
          ...auth,
        });

    if (!response?.job?.id) {
      throw new Error('The server did not return a valid saved job.');
    }

    return response.job;
  };

  const execute = async (action) => {
    if (busy) return;

    setBusy(true);
    setErrors([]);
    setNotice(null);

    try {
      const job = await persist();

      if (action === 'save') {
        if (!id) {
          navigate(`${prefix}/jobs/${job.id}/edit`, { replace: true });
        } else {
          setStatus(job.status || status);
          setNotice({
            type: 'success',
            text: 'Job details saved successfully.',
          });
        }
        return;
      }

      if (action === 'preview') {
        navigate(`${prefix}/jobs/${job.id}/preview`);
        return;
      }

      if (action === 'publish') {
        if (missingImportant.length) {
          setNotice({
            type: 'warning',
            text: `Please add the following before publishing: ${missingImportant.join(', ')}.`,
          });
          return;
        }

        await api(`${prefix}/jobs/${job.id}/status`, {
          method: 'POST',
          body: { status: 'published' },
          ...auth,
        });

        navigate(`${prefix}/jobs/${job.id}/preview?published=1`);
      }
    } catch (error) {
      const details = Array.isArray(error.details) ? error.details : [];
      setErrors([
        error.message || 'Unable to save the job.',
        ...details,
      ]);

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div
        role="status"
        className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white"
      >
        <LoaderCircle size={30} className="animate-spin text-indigo-600" />
        <p className="mt-4 font-bold text-slate-800">Loading job details...</p>
      </div>
    );
  }

  const input = `${inputCls} w-full`;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-indigo-700"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Page header */}
      <header className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-6 text-white shadow-xl shadow-indigo-950/10 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-14 h-56 w-56 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-20 right-1/3 h-44 w-44 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-indigo-100">
              <Sparkles size={14} />
              AI-POWERED JOB MANAGEMENT
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              {id ? 'Edit job listing' : 'Create a job listing'}
              <span className="text-violet-300">.</span>
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100/80">
              Start with the job description. AI fills in the details so you
              spend less time typing and more time verifying accuracy.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
            <p className="text-xs text-indigo-100/75">Form completion</p>
            <p className="mt-1 text-2xl font-black">{completion}%</p>
            <div className="mt-3 h-1.5 w-36 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-violet-300 transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-indigo-100/75">
              {filledCount} of {Object.keys(EMPTY).length} fields filled
            </p>
          </div>
        </div>
      </header>

      <ErrorPanel errors={errors} />

      {notice && (
        <Notice type={notice.type} onClose={() => setNotice(null)}>
          {notice.text}
        </Notice>
      )}

      {/* AI input — primary workflow */}
      <section className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
        <div className="flex items-start gap-3 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-violet-50 p-5 sm:p-6">
          <div className="rounded-xl bg-indigo-600 p-3 text-white shadow-lg shadow-indigo-600/20">
            <WandSparkles size={23} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-indigo-600">
                Start here
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-extrabold text-emerald-800">
                AI assisted
              </span>
            </div>

            <h2 className="mt-1 text-xl font-black text-slate-950">
              Generate job details automatically
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Paste the job description from an employer or careers page.
              AI will extract the available information and prefill the form.
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <label
            htmlFor="job-source"
            className="mb-2 block text-sm font-bold text-slate-700"
          >
            Original job posting
          </label>

          <textarea
            id="job-source"
            className={`${input} min-h-44 resize-y leading-6`}
            rows={7}
            placeholder={`Paste the complete job description here...\n\nExample:\nCompany: Example Technologies\nRole: Software Engineer\nLocation: Ahmedabad\nResponsibilities, requirements, eligibility and application details...`}
            value={sourceText}
            onChange={(event) => setSourceText(event.target.value)}
            disabled={aiBusy}
          />

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-400">
              {sourceText.length.toLocaleString('en-IN')} characters · More
              source details generally produce better extraction.
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={resetSource}
                disabled={aiBusy || !sourceText}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RotateCcw size={15} />
                Clear source
              </button>

              <button
                type="button"
                onClick={extractWithAI}
                disabled={aiBusy || sourceText.trim().length < 30}
                className={`${btnPrimary} inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {aiBusy ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Sparkles size={17} />
                )}
                {aiBusy ? 'Generating details...' : 'Generate with AI'}
                {!aiBusy && <ArrowRight size={16} />}
              </button>
            </div>
          </div>

          {aiBusy && (
            <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <div className="flex items-center gap-3">
                <LoaderCircle size={20} className="animate-spin text-indigo-600" />
                <div>
                  <p className="text-sm font-bold text-indigo-950">
                    AI is extracting the job details
                  </p>
                  <p className="mt-1 text-xs leading-5 text-indigo-800">
                    Please wait while the existing extraction service processes
                    the source text.
                  </p>
                </div>
              </div>
            </div>
          )}

          {aiNote && (
            <div className="mt-5 space-y-3">
              <Notice type="success">
                AI returned {aiNote.fieldsFound.length} field(s). Review the
                results below; the extraction service may not identify every
                detail.
              </Notice>

              {aiNote.warnings.length > 0 && (
                <Notice type="warning">
                  <p className="font-bold">AI extraction notes</p>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    {aiNote.warnings.map((warning, index) => (
                      <li key={`${warning}-${index}`}>{warning}</li>
                    ))}
                  </ul>
                </Notice>
              )}
            </div>
          )}

          <div className="mt-5 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-indigo-600" />
            <p>
              AI must not invent salary, eligibility, employer details, deadlines
              or application links. Verify extracted information before
              publishing.
            </p>
          </div>
        </div>
      </section>

      {/* Only essential details at first */}
      <Section
        number="01"
        title="Essential job details"
        description="Check these key details first. Most should already be filled after AI extraction."
        icon={BriefcaseBusiness}
      >
        <Field
          label="Job title"
          required
          status={form.title ? 'filled' : 'missing'}
        >
          <input
            className={input}
            value={form.title}
            onChange={updateField('title')}
            placeholder="e.g. Software Engineer"
            required
          />
        </Field>

        <Field
          label="Company"
          status={form.company ? 'filled' : 'missing'}
          hint={
            scope === 'recruiter'
              ? 'Your recruiter account may provide the company name.'
              : 'Use the employer name shown in the source.'
          }
        >
          <div className="relative">
            <Building2
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className={`${input} pl-9`}
              value={form.company}
              onChange={updateField('company')}
              placeholder="Company name"
              disabled={scope === 'recruiter'}
            />
          </div>
        </Field>

        <Field
          label="Location"
          status={form.location ? 'filled' : 'missing'}
        >
          <div className="relative">
            <MapPin
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className={`${input} pl-9`}
              value={form.location}
              onChange={updateField('location')}
              placeholder="e.g. Ahmedabad, Remote"
            />
          </div>
        </Field>

        <Field label="Work mode" status={form.work_mode ? 'filled' : 'missing'}>
          <select
            className={input}
            value={form.work_mode}
            onChange={updateField('work_mode')}
          >
            <option value="">Not specified</option>
            {Object.entries(MODE_LABEL).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Employment type"
          status={form.employment_type ? 'filled' : 'missing'}
        >
          <select
            className={input}
            value={form.employment_type}
            onChange={updateField('employment_type')}
          >
            <option value="">Not specified</option>
            {Object.entries(TYPE_LABEL).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Application link"
          wide
          status={form.application_url ? 'filled' : 'missing'}
          hint="Keep this blank if the original source does not contain a confirmed application link."
        >
          <div className="relative">
            <Globe
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className={`${input} pl-9`}
              type="url"
              value={form.application_url}
              onChange={updateField('application_url')}
              placeholder="https://company.com/careers/..."
            />
          </div>
        </Field>
      </Section>

      {/* Secondary fields */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-violet-50 p-2.5 text-violet-700">
            <ClipboardList size={20} />
          </div>
          <div>
            <h2 className="font-black text-slate-950">
              Additional job details
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Review compensation, eligibility, responsibilities and application
              instructions when needed.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAllFields((value) => !value)}
          aria-expanded={showAllFields}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
        >
          {showAllFields ? 'Hide details' : 'Review all fields'}
          {showAllFields ? (
            <ChevronUp size={16} />
          ) : (
            <ChevronDown size={16} />
          )}
        </button>
      </div>

      {showAllFields && (
        <div className="space-y-5">
          <Section
            number="02"
            title="Experience and compensation"
            description="Keep these values aligned with the employer's original posting."
            icon={Wallet}
          >
            <Field label="Job category">
              <input
                className={input}
                value={form.category}
                onChange={updateField('category')}
                placeholder="e.g. Software Development"
              />
            </Field>

            <Field label="Experience">
              <input
                className={input}
                value={form.experience}
                onChange={updateField('experience')}
                placeholder="e.g. Fresher, 0–2 years"
              />
            </Field>

            <Field label="Education">
              <div className="relative">
                <GraduationCap
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  className={`${input} pl-9`}
                  value={form.education}
                  onChange={updateField('education')}
                  placeholder="Degree or qualification"
                />
              </div>
            </Field>

            <Field label="Salary as stated by employer">
              <input
                className={input}
                value={form.salary}
                onChange={updateField('salary')}
                placeholder="e.g. ₹6–8 LPA"
              />
            </Field>

            <Field label="Minimum annual salary (₹)">
              <input
                className={input}
                type="number"
                min="0"
                value={form.salary_min}
                onChange={updateField('salary_min')}
                placeholder="Optional"
              />
            </Field>

            <Field label="Maximum annual salary (₹)">
              <input
                className={input}
                type="number"
                min="0"
                value={form.salary_max}
                onChange={updateField('salary_max')}
                placeholder="Optional"
              />
            </Field>

            <Field label="Number of openings">
              <input
                className={input}
                type="number"
                min="0"
                value={form.openings}
                onChange={updateField('openings')}
                placeholder="Optional"
              />
            </Field>

            <Field label="Application deadline">
              <div className="relative">
                <CalendarDays
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  className={`${input} pl-9`}
                  type="date"
                  value={form.expires_at}
                  onChange={updateField('expires_at')}
                />
              </div>
            </Field>

            <Field label="Eligibility criteria" wide>
              <textarea
                className={input}
                rows={3}
                value={form.eligibility}
                onChange={updateField('eligibility')}
                placeholder="Confirmed graduation year, degree or other criteria"
              />
            </Field>
          </Section>

          <Section
            number="03"
            title="Description and requirements"
            description="Edit the AI-generated summary and role details as needed."
            icon={FileText}
          >
            <Field label="Description" wide>
              <textarea
                className={input}
                rows={5}
                value={form.description}
                onChange={updateField('description')}
                placeholder="Job overview and purpose"
              />
            </Field>

            <Field label="Responsibilities">
              <textarea
                className={input}
                rows={5}
                value={form.responsibilities}
                onChange={updateField('responsibilities')}
                placeholder="One responsibility per line"
              />
            </Field>

            <Field label="Requirements">
              <textarea
                className={input}
                rows={5}
                value={form.requirements}
                onChange={updateField('requirements')}
                placeholder="One requirement per line"
              />
            </Field>

            <Field label="Skills" wide>
              <input
                className={input}
                value={form.skills}
                onChange={updateField('skills')}
                placeholder="JavaScript, React, Node.js"
              />
            </Field>

            <Field label="Benefits" wide>
              <textarea
                className={input}
                rows={3}
                value={form.benefits}
                onChange={updateField('benefits')}
                placeholder="Confirmed benefits, one per line"
              />
            </Field>
          </Section>

          <Section
            number="04"
            title="Application instructions"
            description="Optional contact and application-process information."
            icon={Send}
          >
            <Field label="Application email">
              <input
                className={input}
                type="email"
                value={form.application_email}
                onChange={updateField('application_email')}
                placeholder="careers@company.com"
              />
            </Field>

            <Field label="Application instructions" wide>
              <textarea
                className={input}
                rows={4}
                value={form.application_instructions}
                onChange={updateField('application_instructions')}
                placeholder="Confirmed application steps"
              />
            </Field>
          </Section>
        </div>
      )}

      {/* Footer actions */}
      <div className="sticky bottom-3 z-10 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl shadow-slate-950/10 backdrop-blur sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-xs leading-5 text-slate-500">
            <CircleHelp size={16} className="mt-0.5 shrink-0 text-indigo-600" />
            <p>
              Verify the AI results before publishing. Unknown information
              should remain blank.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={btnGhost}
              disabled={busy || aiBusy}
              onClick={() => execute('save')}
            >
              {busy ? (
                <LoaderCircle size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              {id ? 'Save changes' : 'Save draft'}
            </button>

            <button
              type="button"
              className={btnGhost}
              disabled={busy || aiBusy || !cleanText(form.title)}
              onClick={() => execute('preview')}
            >
              <Eye size={15} />
              Preview
            </button>

            {status !== 'published' && (
              <button
                type="button"
                className={`${btnPrimary} inline-flex items-center gap-2`}
                disabled={busy || aiBusy || !cleanText(form.title)}
                onClick={() => execute('publish')}
              >
                {busy ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={15} />
                )}
                Save &amp; publish
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
