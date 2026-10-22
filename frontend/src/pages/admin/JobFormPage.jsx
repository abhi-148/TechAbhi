
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
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
  Eye,
} from 'lucide-react';
import { api } from '../../lib/api';
import { inputCls, btnPrimary, btnGhost, TYPE_LABEL, MODE_LABEL } from '../../lib/format';

const EMPTY = {
  title: '', company: '', category: '', location: '', work_mode: '',
  employment_type: '', experience: '', salary: '', salary_min: '',
  salary_max: '', openings: '', education: '', description: '',
  responsibilities: '', requirements: '', eligibility: '', benefits: '',
  skills: '', application_url: '', application_email: '',
  application_instructions: '', expires_at: '',
};

const LINES = ['responsibilities', 'requirements', 'benefits'];

const fromJob = (job) => {
  const form = { ...EMPTY };

  for (const key of Object.keys(EMPTY)) {
    const value = job[key];
    if (value === null || value === undefined) continue;

    form[key] = LINES.includes(key)
      ? (Array.isArray(value) ? value.join('\n') : String(value))
      : key === 'skills'
        ? (Array.isArray(value) ? value.join(', ') : String(value))
        : key === 'expires_at'
          ? String(value).slice(0, 10)
          : String(value);
  }

  return form;
};

function Field({ label, children, wide = false, hint, required = false }) {
  return (
    <label className={`block min-w-0 ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="mb-2 flex flex-wrap items-center gap-1 text-sm font-bold text-slate-700">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-xs leading-5 text-slate-400">{hint}</span>}
    </label>
  );
}

function Section({ number, title, description, icon: Icon, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Section {number}</span>
          </div>
          <h2 className="mt-1 text-base font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
      </div>
      <div className="grid gap-x-5 gap-y-5 p-5 sm:grid-cols-2 sm:p-6">
        {children}
      </div>
    </section>
  );
}

function ErrorPanel({ errors }) {
  if (!errors.length) return null;

  return (
    <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-rose-600" />
        <div>
          <h2 className="font-bold text-rose-900">Please review the following</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-rose-800">
            {errors.map((error, index) => <li key={index}>{error}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function JobFormPage({ scope = 'admin' }) {
  const P = '/' + scope;
  const A = scope === 'admin' ? { admin: true } : { recruiter: true };
  const { id } = useParams();
  const nav = useNavigate();

  const [f, setF] = useState({ ...EMPTY });
  const [status, setStatus] = useState(null);
  const [raw, setRaw] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNote, setAiNote] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errs, setErrs] = useState([]);
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!id) return;

    let active = true;

    api(P + '/jobs/' + id, { ...A })
      .then((data) => {
        if (!active) return;
        setF(fromJob(data.job));
        setStatus(data.job.status);
      })
      .catch((error) => {
        if (active) setErrs([error.message || 'Unable to load this job.']);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [id, scope]);

  const set = (key) => (event) => {
    setF((current) => ({ ...current, [key]: event.target.value }));
  };

  const extract = async () => {
    if (raw.trim().length < 30 || aiBusy) return;

    setAiBusy(true);
    setErrs([]);
    setAiNote(null);

    try {
      const data = await api(P + '/jobs/parse', {
        method: 'POST',
        body: { text: raw },
        ...A,
      });

      const extracted = fromJob(data.job);

      setF((current) => ({
        ...current,
        ...Object.fromEntries(
          Object.entries(extracted).filter(([, value]) => value !== '')
        ),
        ...(scope === 'recruiter' ? { company: current.company } : {}),
      }));

      setAiNote(data.warnings || []);
    } catch (error) {
      setErrs([error.message || 'AI extraction failed. Please try again.']);
    } finally {
      setAiBusy(false);
    }
  };

  const payload = () => ({
    ...f,
    salary_min: f.salary_min || null,
    salary_max: f.salary_max || null,
    openings: f.openings || null,
    expires_at: f.expires_at || null,
  });

  const persist = async () => {
    const data = id
      ? await api(P + '/jobs/' + id, { method: 'PUT', body: payload(), ...A })
      : await api(P + '/jobs', { method: 'POST', body: payload(), ...A });

    return data.job;
  };

  const run = (after) => async () => {
    if (busy) return;

    setBusy(true);
    setErrs([]);

    try {
      const job = await persist();
      setStatus(job.status);
      await after(job);
    } catch (error) {
      setErrs([error.message, ...(error.details || [])]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setBusy(false);
    }
  };

  const save = run(async (job) => {
    if (!id) {
      nav(`${P}/jobs/${job.id}/edit`, { replace: true });
    } else {
      setAiNote(null);
      window.alert('Job details saved successfully.');
    }
  });

  const preview = run(async (job) => {
    nav(`${P}/jobs/${job.id}/preview`);
  });

  const publish = run(async (job) => {
    await api(`${P}/jobs/${job.id}/status`, {
      method: 'POST',
      body: { status: 'published' },
      ...A,
    });

    nav(`${P}/jobs/${job.id}/preview?published=1`);
  });

  if (loading) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <LoaderCircle size={28} className="animate-spin text-indigo-600" />
        <p className="mt-3 text-sm font-bold text-slate-700">Loading job details...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <button
        type="button"
        onClick={() => nav(-1)}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-indigo-700"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header */}
      <header className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-6 text-white shadow-xl shadow-indigo-950/10 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-14 h-56 w-56 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-20 right-1/3 h-44 w-44 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-indigo-100">
              <BriefcaseBusiness size={14} />
              {scope === 'recruiter' ? 'RECRUITER WORKSPACE' : 'ADMIN WORKSPACE'}
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              {id ? 'Edit job listing' : 'Create a job listing'}
              <span className="text-violet-300">.</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100/80">
              Add clear, accurate job information so candidates can understand the role and application process.
            </p>
          </div>

          {status && (
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold capitalize text-white">
              <span className="h-2 w-2 rounded-full bg-violet-300" />
              {status.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      </header>

      <ErrorPanel errors={errs} />

      {/* AI extraction */}
      <section className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
        <div className="flex items-start gap-3 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-5 sm:p-6">
          <div className="rounded-xl bg-white p-3 text-indigo-700 shadow-sm">
            <Sparkles size={22} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-600">AI-assisted entry</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">Extract job details</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Paste an existing job description to prefill the form. Review the extracted fields before saving or publishing.
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <label htmlFor="job-source" className="mb-2 block text-sm font-bold text-slate-700">
            Original job posting
          </label>
          <textarea
            id="job-source"
            className={`${inputCls} min-h-36 w-full`}
            rows={6}
            placeholder="Paste the complete job description here..."
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-400">{raw.length} characters</p>
            <button
              type="button"
              className={btnPrimary}
              disabled={aiBusy || raw.trim().length < 30}
              onClick={extract}
            >
              {aiBusy ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {aiBusy ? 'Extracting details...' : 'Extract details with AI'}
            </button>
          </div>

          {aiNote && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="flex items-center gap-2 font-bold"><Info size={16} /> Review AI results</p>
              <p className="mt-1 leading-6">AI can make mistakes. Verify every field before publishing; missing details may be left blank.</p>
              {aiNote.length > 0 && (
                <ul className="mt-2 list-inside list-disc space-y-1">
                  {aiNote.map((warning, index) => <li key={index}>{warning}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Basic information */}
      <Section
        number="01"
        title="Basic information"
        description="Set the job title, company, location and work arrangement."
        icon={BriefcaseBusiness}
      >
        <Field label="Job title" required>
          <input className={`${inputCls} w-full`} value={f.title} onChange={set('title')} placeholder="e.g. Software Engineer" required />
        </Field>

        <Field label={scope === 'recruiter' ? 'Company' : 'Company name'} hint={scope === 'recruiter' ? 'Managed through your recruiter profile.' : undefined}>
          <div className="relative">
            <Building2 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${inputCls} w-full pl-9`} value={f.company} onChange={set('company')} disabled={scope === 'recruiter'} placeholder={scope === 'recruiter' ? 'Set from your profile' : 'Company name'} />
          </div>
        </Field>

        <Field label="Job category">
          <input className={`${inputCls} w-full`} value={f.category} onChange={set('category')} placeholder="e.g. Software Development" />
        </Field>

        <Field label="Location">
          <div className="relative">
            <MapPin size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${inputCls} w-full pl-9`} value={f.location} onChange={set('location')} placeholder="e.g. Ahmedabad, India" />
          </div>
        </Field>

        <Field label="Work mode">
          <select className={`${inputCls} w-full`} value={f.work_mode} onChange={set('work_mode')}>
            <option value="">Select work mode</option>
            {Object.entries(MODE_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </Field>

        <Field label="Employment type">
          <select className={`${inputCls} w-full`} value={f.employment_type} onChange={set('employment_type')}>
            <option value="">Select employment type</option>
            {Object.entries(TYPE_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </Field>
      </Section>

      {/* Eligibility and compensation */}
      <Section
        number="02"
        title="Experience and compensation"
        description="Help candidates understand the role's requirements and salary."
        icon={Wallet}
      >
        <Field label="Experience level" hint="Be specific about fresher or experienced eligibility.">
          <input className={`${inputCls} w-full`} value={f.experience} onChange={set('experience')} placeholder="e.g. Fresher, 0–1 years, 2+ years" />
        </Field>

        <Field label="Education">
          <div className="relative">
            <GraduationCap size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${inputCls} w-full pl-9`} value={f.education} onChange={set('education')} placeholder="e.g. Bachelor's degree" />
          </div>
        </Field>

        <Field label="Salary as stated by employer" hint="Use the employer's actual stated compensation.">
          <input className={`${inputCls} w-full`} value={f.salary} onChange={set('salary')} placeholder="e.g. ₹6–8 LPA or Not disclosed" />
        </Field>

        <Field label="Number of openings">
          <input className={`${inputCls} w-full`} type="number" min="0" value={f.openings} onChange={set('openings')} placeholder="e.g. 5" />
        </Field>

        <Field label="Minimum yearly salary (₹)" hint="Optional; used for sorting and filtering.">
          <input className={`${inputCls} w-full`} type="number" min="0" value={f.salary_min} onChange={set('salary_min')} placeholder="Annual amount in INR" />
        </Field>

        <Field label="Maximum yearly salary (₹)" hint="Optional; keep consistent with the salary above.">
          <input className={`${inputCls} w-full`} type="number" min="0" value={f.salary_max} onChange={set('salary_max')} placeholder="Annual amount in INR" />
        </Field>

        <Field label="Eligibility criteria" wide hint="Mention graduation year, degree, marks, or other confirmed requirements.">
          <textarea className={`${inputCls} w-full`} rows={3} value={f.eligibility} onChange={set('eligibility')} placeholder="Who can apply for this role?" />
        </Field>
      </Section>

      {/* Job description */}
      <Section
        number="03"
        title="Job description"
        description="Describe the role, responsibilities, skills and benefits clearly."
        icon={ClipboardList}
      >
        <Field label="Description" wide hint="A concise overview of the role and its purpose.">
          <textarea className={`${inputCls} w-full`} rows={5} value={f.description} onChange={set('description')} placeholder="Describe the role and what the candidate will work on..." />
        </Field>

        <Field label="Responsibilities" hint="Enter one responsibility per line.">
          <textarea className={`${inputCls} w-full`} rows={6} value={f.responsibilities} onChange={set('responsibilities')} placeholder={'Develop and maintain applications\nCollaborate with the team\nReview code'} />
        </Field>

        <Field label="Requirements" hint="Enter one requirement per line.">
          <textarea className={`${inputCls} w-full`} rows={6} value={f.requirements} onChange={set('requirements')} placeholder={'Required programming skills\nRelevant experience\nCommunication skills'} />
        </Field>

        <Field label="Skills" wide hint="Separate individual skills with commas.">
          <input className={`${inputCls} w-full`} value={f.skills} onChange={set('skills')} placeholder="JavaScript, React, Node.js, SQL" />
        </Field>

        <Field label="Benefits" wide hint="Enter one benefit per line.">
          <textarea className={`${inputCls} w-full`} rows={3} value={f.benefits} onChange={set('benefits')} placeholder={'Health insurance\nLearning opportunities\nFlexible work options'} />
        </Field>
      </Section>

      {/* Application */}
      <Section
        number="04"
        title="Application details"
        description="Choose where candidates apply and include any important instructions."
        icon={Send}
      >
        <Field
          label={scope === 'recruiter' ? 'External application URL' : 'Employer application URL'}
          wide
          hint={scope === 'recruiter' ? 'Optional. Candidates may also apply through TechAbhi.' : 'Use a valid HTTP or HTTPS employer application link.'}
        >
          <div className="relative">
            <Globe size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${inputCls} w-full pl-9`} type="url" value={f.application_url} onChange={set('application_url')} placeholder="https://company.com/careers/job-id" />
          </div>
        </Field>

        <Field label="Application email" hint="Optional contact or application email.">
          <input className={`${inputCls} w-full`} type="email" value={f.application_email} onChange={set('application_email')} placeholder="careers@company.com" />
        </Field>

        <Field label="Last date to apply">
          <div className="relative">
            <CalendarDays size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${inputCls} w-full pl-9`} type="date" value={f.expires_at} onChange={set('expires_at')} />
          </div>
        </Field>

        <Field label="Application instructions" wide hint="Explain the actual application steps, documents needed or assessment process.">
          <textarea className={`${inputCls} w-full`} rows={3} value={f.application_instructions} onChange={set('application_instructions')} placeholder="How should candidates apply?" />
        </Field>
      </Section>

      {/* Footer actions */}
      <div className="sticky bottom-3 z-10 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl shadow-slate-950/10 backdrop-blur sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-xs leading-5 text-slate-500">
            <Info size={15} className="mt-0.5 shrink-0 text-indigo-600" />
            <p>Review salary, eligibility and application details before publishing.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnGhost} disabled={busy} onClick={save}>
              {busy ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}
              {id ? 'Save changes' : 'Save draft'}
            </button>

            <button type="button" className={btnGhost} disabled={busy} onClick={preview}>
              <Eye size={15} /> Preview
            </button>

            {status !== 'published' && (
              <button type="button" className={btnPrimary} disabled={busy} onClick={publish}>
                {busy ? <LoaderCircle size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
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
