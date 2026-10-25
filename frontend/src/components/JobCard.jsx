import { Link } from 'react-router-dom';
import {
  MapPin,
  Clock3,
  IndianRupee,
  GraduationCap,
  BriefcaseBusiness,
  ArrowUpRight,
  CalendarDays,
  Laptop,
  Sparkles,
} from 'lucide-react';
import { TYPE_LABEL, MODE_LABEL, fmtDate } from '../lib/format';

export default function JobCard({ job }) {
  if (!job) return null;

  const skills = Array.isArray(job.skills) ? job.skills : [];
  const jobUrl = `/jobs/${job.id}`;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-950/10">
      <div className="h-1 w-full bg-gradient-to-r from-indigo-600 via-violet-500 to-fuchsia-400" />

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {/* Job title and company */}
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
            <BriefcaseBusiness size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="break-words text-base font-extrabold leading-6 tracking-tight text-slate-950 transition-colors group-hover:text-indigo-700 sm:text-lg">
              <Link
                to={jobUrl}
                className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {job.title || 'Untitled position'}
              </Link>
            </h3>

            <p className="mt-1 truncate text-sm font-medium text-slate-500">
              {job.company || 'Company not specified'}
            </p>
          </div>

          <Link
            to={jobUrl}
            aria-label={`View ${job.title || 'job'} details`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <ArrowUpRight size={17} />
          </Link>
        </div>

        {/* Employment type and work mode */}
        {(job.employment_type || job.work_mode) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {job.employment_type && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                <BriefcaseBusiness size={12} />
                {TYPE_LABEL[job.employment_type] || job.employment_type}
              </span>
            )}

            {job.work_mode && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                <Laptop size={12} />
                {MODE_LABEL[job.work_mode] || job.work_mode}
              </span>
            )}
          </div>
        )}

        {/* Job information */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoItem
            icon={MapPin}
            label="Location"
            value={job.location || 'Not specified'}
          />

          <InfoItem
            icon={IndianRupee}
            label="Salary"
            value={job.salary || 'Not disclosed'}
            variant="green"
          />

          {job.experience && (
            <InfoItem
              icon={GraduationCap}
              label="Experience"
              value={job.experience}
            />
          )}

          {job.published_at && (
            <InfoItem
              icon={CalendarDays}
              label="Posted"
              value={fmtDate(job.published_at)}
            />
          )}
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-500" />
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
                Skills & technologies
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {skills.slice(0, 4).map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="max-w-full truncate rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition group-hover:border-indigo-100"
                >
                  {skill}
                </span>
              ))}

              {skills.length > 4 && (
                <span className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-700">
                  +{skills.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action */}
        <div className="mt-auto pt-6">
          <div className="mb-4 border-t border-slate-100" />

          <Link
            to={jobUrl}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            View job details
            <ArrowUpRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
            <Clock3 size={12} />
            Check eligibility and application details
          </p>
        </div>
      </div>
    </article>
  );
}

function InfoItem({ icon: Icon, label, value, variant = 'default' }) {
  const styles =
    variant === 'green'
      ? {
          wrapper: 'bg-emerald-50/70',
          icon: 'text-emerald-700',
          label: 'text-emerald-700/70',
          value: 'text-emerald-800',
        }
      : {
          wrapper: 'bg-slate-50',
          icon: 'text-indigo-600',
          label: 'text-slate-400',
          value: 'text-slate-700',
        };

  return (
    <div
      className={`flex min-w-0 items-start gap-2.5 rounded-xl p-3 ${styles.wrapper}`}
    >
      <Icon size={16} className={`mt-0.5 shrink-0 ${styles.icon}`} />

      <div className="min-w-0">
        <p
          className={`text-[10px] font-bold uppercase tracking-wider ${styles.label}`}
        >
          {label}
        </p>

        <p
          className={`mt-1 break-words text-xs font-bold leading-5 ${styles.value}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}