
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  BookmarkCheck,
  FileSearch,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  LoaderCircle,
  CircleAlert,
  UserRound,
} from 'lucide-react';
import { api, isCandidate } from '../lib/api';
import { btnGhost } from '../lib/format';
import SubmitApplication from './SubmitApplication';

function Inner({ job }) {
  const logged = isCandidate();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    let active = true;

    if (!logged) {
      setSaved(false);
      setChecking(false);
      return () => {
        active = false;
      };
    }

    setChecking(true);

    api('/candidate/saved/ids', { candidate: true })
      .then((data) => {
        if (active) setSaved(data.ids.includes(job.id));
      })
      .catch(() => {
        // Saving remains available even if saved-job lookup fails.
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [job.id, logged]);

  const toggle = async () => {
    if (busy) return;

    setBusy(true);
    setErr('');

    try {
      if (saved) {
        await api('/candidate/saved/' + job.id, {
          method: 'DELETE',
          candidate: true,
        });
        setSaved(false);
      } else {
        await api('/candidate/saved', {
          method: 'POST',
          body: { job_id: job.id },
          candidate: true,
        });
        setSaved(true);
      }
    } catch (e) {
      setErr(e.message || 'Unable to update your saved jobs. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const next = encodeURIComponent('/jobs/' + job.id);

  if (!logged) {
    return (
      <section className="relative isolate overflow-hidden rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-100/70 blur-3xl" />

        <div className="relative">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <UserRound size={23} />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-indigo-600">
                <Sparkles size={12} /> Your career toolkit
              </span>
              <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">
                Make your job search smarter
              </h2>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-600">
            Create a free account to save interesting jobs, track applications and check how your resume matches this opportunity.
          </p>

          <ul className="mt-4 space-y-2.5">
            {[
              'Save jobs for later',
              'Keep track of your applications',
              'Review your resume against a job',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-slate-600">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <ShieldCheck size={13} />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/15 transition hover:-translate-y-0.5 hover:bg-indigo-700"
              to={`/candidate/register?next=${next}`}
            >
              Create free account <ArrowRight size={16} />
            </Link>

            <Link
              className={`${btnGhost} inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3`}
              to={`/candidate/login?next=${next}`}
            >
              Already a member? Log in
            </Link>
          </div>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
            <ShieldCheck size={13} />
            An account is optional. You can still apply without signing up.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Sparkles size={21} />
        </div>
        <div>
          <h2 className="font-black text-slate-950">Your job toolkit</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Keep this opportunity handy
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <button
          type="button"
          onClick={toggle}
          disabled={busy || checking}
          aria-pressed={saved}
          className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
            saved
              ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
              : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/60'
          }`}
        >
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            saved ? 'bg-white text-emerald-600' : 'bg-slate-100 text-slate-600'
          }`}>
            {busy || checking ? (
              <LoaderCircle size={19} className="animate-spin" />
            ) : saved ? (
              <BookmarkCheck size={19} />
            ) : (
              <Bookmark size={19} />
            )}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-slate-900">
              {checking ? 'Checking saved status...' : saved ? 'Job saved' : 'Save this job'}
            </span>
            <span className="mt-0.5 block text-xs leading-5 text-slate-500">
              {saved ? 'Remove it from your saved list anytime.' : 'Keep it handy for later.'}
            </span>
          </span>

          {!busy && !checking && saved && (
            <span className="text-xs font-bold text-emerald-700">Saved</span>
          )}
        </button>

        <Link
          to={`/candidate/resume?job=${job.id}`}
          className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-violet-200 hover:bg-violet-50/60"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition group-hover:bg-violet-100">
            <FileSearch size={19} />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-slate-900">Check your resume</span>
            <span className="mt-0.5 block text-xs leading-5 text-slate-500">
              Review its match with this job.
            </span>
          </span>

          <ArrowRight size={17} className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-violet-600" />
        </Link>
      </div>

      {err && (
        <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <CircleAlert size={17} className="mt-0.5 shrink-0" />
          <span>{err}</span>
        </div>
      )}

      <div className="mt-4 flex items-start gap-2 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-400">
        <ShieldCheck size={14} className="mt-0.5 shrink-0" />
        <p>Your saved jobs are linked to your candidate account.</p>
      </div>
    </section>
  );
}

export default function CandidateBox({ job }) {
  return (
    <div className="space-y-4">
      {job.accepts_applications && <SubmitApplication job={job} />}
      <Inner job={job} />
    </div>
  );
}
