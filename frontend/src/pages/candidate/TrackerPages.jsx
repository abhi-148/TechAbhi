
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileText,
  Info,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Trash2,
  TrendingUp,
  UserRoundCheck,
  XCircle,
} from 'lucide-react';
import { api } from '../../lib/api';
import { btnGhost, inputCls, fmtDate } from '../../lib/format';

const STATUS = {
  link_opened: 'Opened employer link',
  applied: 'I applied',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

const SUB = {
  new: 'Received',
  in_review: 'In review',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  rejected: 'Not selected',
  hired: 'Hired',
  withdrawn: 'Withdrawn',
};

const statusStyles = {
  new: 'bg-sky-50 text-sky-700 ring-sky-200',
  in_review: 'bg-amber-50 text-amber-700 ring-amber-200',
  shortlisted: 'bg-violet-50 text-violet-700 ring-violet-200',
  interview: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  hired: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
  withdrawn: 'bg-slate-100 text-slate-600 ring-slate-200',
  link_opened: 'bg-sky-50 text-sky-700 ring-sky-200',
  applied: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  offer: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

function useList(path, key) {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    setErr('');
    return api(path, { candidate: true })
      .then((data) => setItems(data[key]))
      .catch((error) => setErr(error.message || 'Unable to load data.'));
  }, [path, key]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, err, load, setItems };
}

function PageShell({ eyebrow, title, description, icon: Icon, children, count }) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-7 pb-10">
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 px-6 py-8 text-white shadow-xl shadow-indigo-950/10 sm:px-9 sm:py-10">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-10 h-44 w-44 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-indigo-100">
              <Icon size={15} />
              {eyebrow}
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100/85 sm:text-base">
              {description}
            </p>
          </div>

          {count !== undefined && (
            <div className="flex min-w-28 items-center gap-3 self-start rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur sm:self-auto">
              <div className="rounded-xl bg-white/10 p-2">
                <Icon size={21} />
              </div>
              <div>
                <p className="text-2xl font-black">{count}</p>
                <p className="text-xs text-indigo-100">Total records</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {children}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center sm:px-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <Icon size={29} />
      </div>
      <h2 className="mt-5 text-lg font-bold text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {action && (
        <Link
          to="/jobs"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
        >
          Browse jobs <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
      <div className="flex items-start gap-3">
        <XCircle className="mt-0.5 shrink-0 text-rose-600" size={20} />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-rose-900">We couldn't load this section</p>
          <p className="mt-1 break-words text-sm text-rose-700">{message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
          >
            <RefreshCw size={15} /> Try again
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white text-center">
      <LoaderCircle className="animate-spin text-indigo-600" size={30} />
      <p className="mt-4 font-semibold text-slate-800">Loading your information...</p>
      <p className="mt-1 text-sm text-slate-500">Just a moment</p>
    </div>
  );
}

function StatusPill({ status, label }) {
  const style = statusStyles[status] || 'bg-slate-100 text-slate-700 ring-slate-200';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${style}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function JobTitle({ job }) {
  return job.available ? (
    <Link
      className="text-base font-bold leading-6 text-slate-900 transition hover:text-indigo-700"
      to={`/jobs/${job.id}`}
    >
      {job.title}
    </Link>
  ) : (
    <span className="text-base font-bold leading-6 text-slate-500">{job.title}</span>
  );
}

function JobIdentity({ job }) {
  return (
    <div className="flex min-w-0 items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-700">
        <Building2 size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <JobTitle job={job} />
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
          <span>{job.company || 'Company not specified'}</span>
          {job.location && (
            <>
              <span className="text-slate-300">•</span>
              <span>{job.location}</span>
            </>
          )}
        </p>
        {!job.available && job.status_note && (
          <p className="mt-2 text-xs font-medium text-amber-700">{job.status_note}</p>
        )}
      </div>
    </div>
  );
}

function ActionButton({ children, onClick, disabled, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        danger
          ? 'border-rose-200 bg-white text-rose-700 hover:bg-rose-50'
          : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700'
      }`}
    >
      {children}
    </button>
  );
}

export function SavedJobsPage() {
  const { items, err, load, setItems } = useList('/candidate/saved', 'jobs');
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');

  const remove = async (id) => {
    if (busyId !== null) return;
    setActionError('');
    setBusyId(id);

    try {
      await api('/candidate/saved/' + id, {
        method: 'DELETE',
        candidate: true,
      });
      setItems((previous) => previous?.filter((job) => job.id !== id) ?? previous);
    } catch (error) {
      setActionError(error.message || 'Could not remove this saved job.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageShell
      eyebrow="YOUR SHORTLIST"
      title="Saved jobs"
      description="Keep promising opportunities in one place and return to them whenever you're ready."
      icon={Bookmark}
      count={items?.length ?? 0}
    >
      {err && <ErrorState message={err} onRetry={load} />}

      {actionError && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {actionError}
        </div>
      )}

      {!items && !err && <LoadingState />}

      {items?.length === 0 && !err && (
        <EmptyState
          icon={Bookmark}
          title="Your shortlist starts here"
          description="Save jobs that match your goals. They'll appear here so you can revisit them without searching again."
          action
        />
      )}

      {items?.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Your shortlist</h2>
              <p className="mt-1 text-sm text-slate-500">
                {items.length} {items.length === 1 ? 'opportunity' : 'opportunities'} saved
              </p>
            </div>
            <Link to="/jobs" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-700 hover:text-indigo-900">
              Find more jobs <ChevronRight size={16} />
            </Link>
          </div>

          <div className="space-y-3">
            {items.map((job) => (
              <article
                key={job.id}
                className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-950/5 sm:p-5"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <JobIdentity job={job} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {job.available && (
                      <Link
                        to={`/jobs/${job.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                      >
                        View job <ExternalLink size={15} />
                      </Link>
                    )}
                    <ActionButton
                      danger
                      disabled={busyId === job.id}
                      onClick={() => remove(job.id)}
                    >
                      {busyId === job.id ? (
                        <LoaderCircle className="animate-spin" size={16} />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      Remove
                    </ActionButton>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
}

export function ApplicationsPage() {
  const { items, err, load, setItems } = useList('/candidate/applications', 'applications');
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const setStatus = async (id, status) => {
    setActionError('');
    setBusyId(id);

    try {
      await api('/candidate/applications/' + id, {
        method: 'PUT',
        body: { status },
        candidate: true,
      });
      await load();
    } catch (error) {
      setActionError(error.message || 'Could not update the application status.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id) => {
    if (busyId !== null) return;
    setActionError('');
    setBusyId(id);

    try {
      await api('/candidate/applications/' + id, {
        method: 'DELETE',
        candidate: true,
      });
      setItems((previous) => previous?.filter((application) => application.id !== id) ?? previous);
    } catch (error) {
      setActionError(error.message || 'Could not remove this record.');
    } finally {
      setBusyId(null);
    }
  };

  const withdraw = async (id) => {
    if (!window.confirm('Withdraw this application? The employer will no longer hold your details on TechAbhi.')) {
      return;
    }

    if (busyId !== null) return;
    setActionError('');
    setBusyId(id);

    try {
      await api(`/candidate/applications/${id}/withdraw`, {
        method: 'POST',
        candidate: true,
      });
      await load();
    } catch (error) {
      setActionError(error.message || 'Could not withdraw this application.');
    } finally {
      setBusyId(null);
    }
  };

  const submittedCount = items?.filter((job) => Boolean(job.sub_status)).length ?? 0;
  const trackedCount = items?.filter((job) => !job.sub_status).length ?? 0;

  return (
    <PageShell
      eyebrow="YOUR JOB SEARCH"
      title="My applications"
      description="Follow your job-search journey, review application updates, and keep your next step clear."
      icon={FileText}
      count={items?.length ?? 0}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700"><BriefcaseBusiness size={19} /></div>
            <div>
              <p className="text-sm text-slate-500">Total tracked</p>
              <p className="text-2xl font-black text-slate-900">{items?.length ?? '—'}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-sky-50 p-2.5 text-sky-700"><ExternalLink size={19} /></div>
            <div>
              <p className="text-sm text-slate-500">Employer-site activity</p>
              <p className="text-2xl font-black text-slate-900">{items ? trackedCount : '—'}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><ShieldCheck size={19} /></div>
            <div>
              <p className="text-sm text-slate-500">Through TechAbhi</p>
              <p className="text-2xl font-black text-slate-900">{items ? submittedCount : '—'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <Info className="mt-0.5 shrink-0" size={19} />
        <p>
          <strong>About application tracking:</strong> Employer-site activity means you opened an external application link. Any later status you select is self-reported, not verified by the employer. For applications submitted through TechAbhi, the employer sets the status shown here.
        </p>
      </div>

      {err && <ErrorState message={err} onRetry={load} />}

      {actionError && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {actionError}
        </div>
      )}

      {!items && !err && <LoadingState />}

      {items?.length === 0 && !err && (
        <EmptyState
          icon={FileText}
          title="Your application journey starts here"
          description="Open a job and select Apply Now while signed in. Your tracked activity and submitted applications will show up here."
          action
        />
      )}

      {items?.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Application activity</h2>
            <p className="mt-1 text-sm text-slate-500">Your tracked opportunities and latest status information.</p>
          </div>

          <div className="space-y-4">
            {items.map((job) => (
              <article
                key={job.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-indigo-200 hover:shadow-md"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1">
                      <JobIdentity job={job} />
                      <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                        <CalendarDays size={14} />
                        Updated {fmtDate(job.updated_at)}
                      </p>
                    </div>

                    {job.sub_status ? (
                      <StatusPill
                        status={job.sub_status}
                        label={SUB[job.sub_status] || job.sub_status}
                      />
                    ) : (
                      <StatusPill
                        status={job.app_status}
                        label={STATUS[job.app_status] || job.app_status || 'Tracking'}
                      />
                    )}
                  </div>

                  {!job.sub_status && (
                    <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-end">
                      <label className="block w-full sm:max-w-xs">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                          Update your status
                        </span>
                        <select
                          className={`${inputCls} w-full`}
                          value={job.app_status}
                          disabled={busyId === job.id}
                          onChange={(event) => setStatus(job.id, event.target.value)}
                        >
                          {Object.entries(STATUS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </label>

                      <div className="flex flex-wrap gap-2 sm:ml-auto">
                        <ActionButton
                          disabled={busyId === job.id}
                          onClick={() => remove(job.id)}
                          danger
                        >
                          {busyId === job.id ? (
                            <LoaderCircle className="animate-spin" size={16} />
                          ) : (
                            <Trash2 size={16} />
                          )}
                          Remove record
                        </ActionButton>
                      </div>
                    </div>
                  )}

                  {job.sub_status && (
                    <div className="mt-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-violet-50/70 p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-white p-2.5 text-indigo-700 shadow-sm">
                          {job.sub_status === 'hired' ? (
                            <CheckCircle2 size={20} />
                          ) : job.sub_status === 'rejected' ? (
                            <XCircle size={20} />
                          ) : (
                            <UserRoundCheck size={20} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900">
                            Application submitted through TechAbhi
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            Submitted on {fmtDate(job.submitted_at)}. Employer status:{' '}
                            <strong>{SUB[job.sub_status] || job.sub_status}</strong>.
                          </p>

                          {job.viewed_at && job.sub_status !== 'withdrawn' && (
                            <p className="mt-2 flex items-center gap-2 text-sm text-indigo-800">
                              <CheckCircle2 size={15} />
                              Employer opened your application on {fmtDate(job.viewed_at)}
                            </p>
                          )}

                          {job.sub_status !== 'withdrawn' && (
                            <button
                              type="button"
                              disabled={busyId === job.id}
                              onClick={() => withdraw(job.id)}
                              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                            >
                              {busyId === job.id ? (
                                <LoaderCircle className="animate-spin" size={16} />
                              ) : (
                                <XCircle size={16} />
                              )}
                              Withdraw application
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-6">
                  <span className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock3 size={14} />
                    Last updated {fmtDate(job.updated_at)}
                  </span>
                  {job.available && (
                    <Link
                      to={`/jobs/${job.id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-700 hover:text-indigo-900"
                    >
                      View job <ChevronRight size={16} />
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-emerald-900">
        <TrendingUp className="mt-0.5 shrink-0" size={19} />
        <p>
          <strong>Small tip:</strong> Keep your resume up to date and check each opportunity's requirements before applying. Consistent, relevant applications help you manage your search.
        </p>
      </div>
    </PageShell>
  );
}
