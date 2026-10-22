
import {
  ExternalLink,
  Mail,
  Info,
  MapPin,
  Clock3,
  IndianRupee,
  GraduationCap,
  BriefcaseBusiness,
  Laptop,
  Users,
  CalendarDays,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Building2,
  FileText,
  Gift,
  ListChecks,
  ArrowUpRight,
} from 'lucide-react';
import {
  TYPE_LABEL,
  MODE_LABEL,
  fmtDate,
  btnPrimary,
  safeHttp,
  emailLike,
} from '../lib/format';
import { track, markOpened } from '../lib/api';
import CandidateBox from './CandidateBox';
import SharePanel from './SharePanel';

const applyClick = (job, preview) => {
  if (!preview) {
    track(job.id, 'apply_click');
    markOpened(job.id);
  }
};

const Section = ({ title, icon: Icon, children, count }) => (
  <section className="mt-8 border-t border-slate-100 pt-6 first:mt-0 first:border-0 first:pt-0">
    <div className="mb-4 flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <Icon size={19} />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-black tracking-tight text-slate-950 sm:text-lg">
          {title}
        </h2>
        {count !== undefined && (
          <p className="mt-0.5 text-xs text-slate-400">
            {count} item{count === 1 ? '' : 's'}
          </p>
        )}
      </div>
    </div>
    {children}
  </section>
);

const Bullets = ({ items }) => (
  <ul className="space-y-3">
    {items.map((item, index) => (
      <li key={`${index}-${item}`} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
        <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={13} />
        </span>
        <span className="min-w-0 whitespace-pre-line">{item}</span>
      </li>
    ))}
  </ul>
);

const Fact = ({ label, value, icon: Icon }) => {
  if (value === undefined || value === null || value === '') return null;

  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
      <span className="mt-0.5 shrink-0 text-indigo-600">
        <Icon size={17} />
      </span>
      <div className="min-w-0">
        <dt className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-slate-400">
          {label}
        </dt>
        <dd className="mt-1 break-words text-sm font-bold leading-5 text-slate-800">
          {value}
        </dd>
      </div>
    </div>
  );
};

export default function JobView({ job, preview = false }) {
  const applicationUrl = safeHttp(job.application_url);
  const applicationEmail = emailLike(job.application_email);
  const hasApply =
    applicationUrl ||
    applicationEmail ||
    job.application_instructions ||
    job.accepts_applications;

  const responsibilities = Array.isArray(job.responsibilities)
    ? job.responsibilities
    : [];
  const requirements = Array.isArray(job.requirements)
    ? job.requirements
    : [];
  const skills = Array.isArray(job.skills) ? job.skills : [];
  const benefits = Array.isArray(job.benefits) ? job.benefits : [];

  const facts = [
    { label: 'Location', value: job.location, icon: MapPin },
    { label: 'Salary', value: job.salary || 'Not disclosed', icon: IndianRupee },
    { label: 'Experience', value: job.experience, icon: GraduationCap },
    {
      label: 'Employment type',
      value: TYPE_LABEL[job.employment_type] || job.employment_type,
      icon: BriefcaseBusiness,
    },
    {
      label: 'Work mode',
      value: MODE_LABEL[job.work_mode] || job.work_mode,
      icon: Laptop,
    },
    { label: 'Openings', value: job.openings, icon: Users },
    { label: 'Education', value: job.education, icon: GraduationCap },
    { label: 'Posted on', value: fmtDate(job.published_at), icon: CalendarDays },
    { label: 'Apply before', value: fmtDate(job.expires_at), icon: Clock3 },
  ];

  return (
    <div className="grid items-start gap-6 lg:grid-cols-3 lg:gap-7">
      {/* Main job information */}
      <div className="min-w-0 space-y-6 lg:col-span-2">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Job heading */}
          <div className="relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-6 text-white sm:p-8">
            <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute bottom-0 right-1/4 h-32 w-32 rounded-full bg-violet-500/20 blur-3xl" />

            <div className="relative">
              {preview && (
                <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-amber-200/30 bg-amber-300/10 px-3 py-1.5 text-xs font-bold text-amber-100">
                  <EyeIcon /> Preview mode
                </span>
              )}

              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-lg backdrop-blur">
                  <Building2 size={26} />
                </div>

                <div className="min-w-0 flex-1">
                  <h1 className="break-words text-2xl font-black leading-tight tracking-tight sm:text-3xl">
                    {job.title || 'Untitled position'}
                  </h1>
                  <p className="mt-2 flex items-start gap-2 text-sm font-medium leading-6 text-indigo-100/90 sm:text-base">
                    <BriefcaseBusiness size={17} className="mt-1 shrink-0" />
                    <span>{job.company || 'Company not specified'}</span>
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {job.employment_type && (
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
                    {TYPE_LABEL[job.employment_type] || job.employment_type}
                  </span>
                )}
                {job.work_mode && (
                  <span className="rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold text-emerald-100">
                    {MODE_LABEL[job.work_mode] || job.work_mode}
                  </span>
                )}
                {job.location && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-indigo-100">
                    <MapPin size={12} />
                    {job.location}
                  </span>
                )}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-200/70">
                    Salary offered
                  </p>
                  <p className="mt-1 text-xl font-black text-white">
                    {job.salary || 'Not disclosed'}
                  </p>
                </div>

                {!preview && applicationUrl && (
                  <a
                    href={applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    onClick={() => applyClick(job, preview)}
                    className="ml-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-indigo-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50"
                  >
                    Apply now <ArrowUpRight size={17} />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Job facts */}
          <div className="p-5 sm:p-7">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-600" />
              <h2 className="text-base font-black text-slate-950">Job overview</h2>
            </div>

            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {facts.map((fact) => (
                <Fact
                  key={fact.label}
                  label={fact.label}
                  value={fact.value}
                  icon={fact.icon}
                />
              ))}
            </dl>

            {job.description && (
              <Section title="Job description" icon={FileText}>
                <p className="whitespace-pre-line break-words text-sm leading-7 text-slate-600">
                  {job.description}
                </p>
              </Section>
            )}

            {responsibilities.length > 0 && (
              <Section
                title="Responsibilities"
                icon={ListChecks}
                count={responsibilities.length}
              >
                <Bullets items={responsibilities} />
              </Section>
            )}

            {requirements.length > 0 && (
              <Section
                title="Requirements"
                icon={ShieldCheck}
                count={requirements.length}
              >
                <Bullets items={requirements} />
              </Section>
            )}

            {skills.length > 0 && (
              <Section title="Skills & technologies" icon={Sparkles} count={skills.length}>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-lg border border-indigo-100 bg-indigo-50/70 px-3 py-2 text-xs font-bold text-indigo-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {job.eligibility && (
              <Section title="Eligibility" icon={GraduationCap}>
                <p className="whitespace-pre-line break-words rounded-xl border border-amber-100 bg-amber-50/60 p-4 text-sm leading-6 text-slate-700">
                  {job.eligibility}
                </p>
              </Section>
            )}

            {benefits.length > 0 && (
              <Section title="Benefits" icon={Gift} count={benefits.length}>
                <Bullets items={benefits} />
              </Section>
            )}
          </div>
        </article>

        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 to-violet-50/70 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
              <ShieldCheck size={20} />
            </span>
            <div>
              <h2 className="font-black text-slate-950">Before you apply</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Review the eligibility criteria, required skills and application instructions carefully. Apply only through the listed employer channels.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Application and candidate sidebar */}
      <aside className="min-w-0 space-y-5 lg:sticky lg:top-24">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <BriefcaseBusiness size={21} />
              </div>
              <div>
                <h2 className="font-black text-slate-950">How to apply</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Follow the employer's instructions
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-5">
            {applicationUrl && (
              <a
                className={`${btnPrimary} flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5`}
                href={applicationUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                onClick={() => applyClick(job, preview)}
              >
                Apply on employer site <ExternalLink size={16} />
              </a>
            )}

            {applicationEmail && (
              <a
                className="flex items-start gap-2 break-all rounded-xl border border-slate-200 p-3.5 text-sm font-semibold text-indigo-700 transition hover:border-indigo-200 hover:bg-indigo-50"
                href={`mailto:${job.application_email}?subject=${encodeURIComponent('Application: ' + job.title)}`}
                onClick={() => applyClick(job, preview)}
              >
                <Mail size={17} className="mt-0.5 shrink-0" />
                <span>{job.application_email}</span>
              </a>
            )}

            {job.application_instructions && (
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Application instructions
                </p>
                <p className="whitespace-pre-line break-words text-sm leading-6 text-slate-700">
                  {job.application_instructions}
                </p>
              </div>
            )}

            {!hasApply && (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm leading-6 text-slate-500">
                No application details were provided for this job.
              </div>
            )}

            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs leading-5 text-amber-900">
              <Info size={17} className="mt-0.5 shrink-0" />
              <p>
                {job.accepts_applications
                  ? "This employer accepts applications through TechAbhi, subject to a free candidate account and your consent to share your details. External links belong to the employer."
                  : 'Applications are handled through the employer’s own website or email. TechAbhi does not submit applications on your behalf, and no TechAbhi account is needed for external applications.'}
              </p>
            </div>
          </div>
        </section>

        {!preview && <CandidateBox job={job} />}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <ArrowUpRight size={20} />
            </div>
            <div>
              <h2 className="font-black text-slate-950">Share this opportunity</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Help someone find their next role
              </p>
            </div>
          </div>
          <SharePanel job={job} count={!preview} />
        </section>
      </aside>
    </div>
  );
}

function EyeIcon() {
  return <ExternalLink size={13} />;
}
