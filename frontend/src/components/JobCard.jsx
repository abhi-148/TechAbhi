
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
} from 'lucide-react';
import { TYPE_LABEL, MODE_LABEL, fmtDate } from '../lib/format';

export default function JobCard({ job }) {
  const skills = Array.isArray(job.skills) ? job.skills : [];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-950/5">
      {/* Accent line */}
      <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-400 opacity-70 transition group-hover:opacity-100" />

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {/* Company and job icon */}
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-700 ring-1 ring-indigo-100 transition group-hover:from-indigo-600 group-hover:to-violet-600 group-hover:text-white group-hover:ring-transparent">
            <BriefcaseBusiness size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-extrabold leading-6 tracking-tight text-slate-950 transition group-hover:text-indigo-700 sm:text-lg">
              <Link
                to={`/jobs/${job.id}`}
                className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {job.title || 'Untitled position'}
              </Link>
            </h3>
            <p className="mt-1 truncate text-sm font-medium text-slate-500">
              {job.company || 'Company not specified'}
            </p>
          </div>

          <Link
            to={`/jobs/${job.id}`}
            aria-label={`View ${job.title || 'job'} details`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <ArrowUpRight size={17} />
          </Link>
        </div>

        {/* Job details */}
        <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div className="flex min-w-0 items-start gap-2.5 rounded-xl bg-slate-50 p-3">
            <MapPin size={16} className="mt-0.5 shrink-0 text-indigo-600" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Location
              </p>
              <p className="mt-1 break-words text-xs font-semibold text-slate-700">
                {job.location || 'Not specified'}
              </p>
            </div>
          </div>

          <div className="flex min-w-0 items-start gap-2.5 rounded-xl bg-emerald-50/70 p-3">
            <IndianRupee size={16} className="mt-0.5 shrink-0 text-emerald-700" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/70">
                Salary
              </p>
              <p className="mt-1 break-words text-xs font-bold text-emerald-800">
                {job.salary || 'Not disclosed'}
              </p>
            </div>
          </div>

          {job.experience && (
            <div className="flex min-w-0 items-start gap-2.5 rounded-xl bg-slate-50 p-3">
              <GraduationCap size={16} className="mt-0.5 shrink-0 text-violet-600" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Experience
                </p>
                <p className="mt-1 break-words text-xs font-semibold text-slate-700">
                  {job.experience}
                </p>
              </div>
            </div>
          )}

          {job.published_at && (
            <div className="flex min-w-0 items-start gap-2.5 rounded-xl bg-slate-50 p-3">
              <CalendarDays size={16} className="mt-0.5 shrink-0 text-slate-500" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Posted
                </p>
                <p className="mt-1 break-words text-xs font-semibold text-slate-700">
                  {fmtDate(job.published_at)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Employment type and work mode */}
        {(job.employment_type || job.work_mode) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {job.employment_type && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-100">
                <BriefcaseBusiness size={12} />
                {TYPE_LABEL[job.employment_type] || job.employment_type}
              </span>
            )}

            {job.work_mode && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-100">
                <Laptop size={12} />
                {MODE_LABEL[job.work_mode] || job.work_mode}
              </span>
            )}
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
              Skills & technologies
            </p>
            <div className="flex flex-wrap gap-1.5">
              {skills.slice(0, 4).map((skill) => (
                <span
                  key={skill}
                  className="max-w-full truncate rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition group-hover:border-indigo-100"
                >
                  {skill}
                </span>
              ))}
              {skills.length > 4 && (
                <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-500">
                  +{skills.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto pt-5">
          <div className="mb-4 border-t border-slate-100" />
          <Link
            to={`/jobs/${job.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            View job details
            <ArrowUpRight size={16} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
            <Clock3 size={12} />
            Review eligibility and application details
          </p>
        </div>
      </div>
    </article>
  );
}
