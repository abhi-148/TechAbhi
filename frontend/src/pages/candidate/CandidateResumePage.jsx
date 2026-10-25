
import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileCheck2,
  FileText,
  Lightbulb,
  LoaderCircle,
  LockKeyhole,
  Sparkles,
  Target,
  Trash2,
  Upload,
  WandSparkles,
} from 'lucide-react';

import { api, CAND_KEY } from '../../lib/api';
import { inputCls, fmtDate } from '../../lib/format';

const cx = (...classes) => classes.filter(Boolean).join(' ');

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
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
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

function Panel({ children, className = '' }) {
  return (
    <section
      className={cx(
        'rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7',
        className
      )}
    >
      {children}
    </section>
  );
}

function Message({ type = 'error', children, onClose }) {
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
      {success ? (
        <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
      ) : (
        <AlertCircle size={19} className="mt-0.5 shrink-0" />
      )}

      <div className="min-w-0 flex-1 leading-6">{children}</div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-xs font-bold opacity-70 hover:opacity-100"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}

function BulletGroup({ title, items, tone = 'slate', icon: Icon }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  const tones = {
    emerald: 'border-emerald-100 bg-emerald-50/70 text-emerald-800',
    amber: 'border-amber-100 bg-amber-50/70 text-amber-900',
    indigo: 'border-indigo-100 bg-indigo-50/70 text-indigo-800',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
    violet: 'border-violet-100 bg-violet-50/70 text-violet-800',
  };

  return (
    <section
      className={cx(
        'rounded-xl border p-4',
        tones[tone] || tones.slate
      )}
    >
      <h3 className="flex items-center gap-2 text-sm font-bold">
        {Icon && <Icon size={17} />}
        {title}

        <span className="ml-auto rounded-full bg-white/70 px-2 py-0.5 text-xs">
          {items.length}
        </span>
      </h3>

      <ul className="mt-3 space-y-2">
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="flex items-start gap-2 text-sm leading-6"
          >
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LoadingResume() {
  return (
    <div className="space-y-5">
      <div className="h-48 animate-pulse rounded-3xl bg-slate-200" />

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="h-5 w-48 animate-pulse rounded bg-slate-100" />
        <div className="mt-5 h-40 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

export default function CandidateResumePage() {
  const [searchParams] = useSearchParams();

  const [resume, setResume] = useState(null);
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState([]);
  const [jobId, setJobId] = useState(searchParams.get('job') || '');
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const loadResume = useCallback(async () => {
    const data = await api('/candidate/resume', {
      candidate: true,
    });

    setResume(data);
    setText(data.text || '');

    return data;
  }, []);

  const loadSavedJobs = useCallback(async () => {
    const data = await api('/candidate/saved', {
      candidate: true,
    });

    setSaved(
      (data.jobs || []).filter((job) => job.available)
    );
  }, []);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const data = await api('/candidate/resume', {
          candidate: true,
        });

        if (active) {
          setResume(data);
          setText(data.text || '');
        }
      } catch (error) {
        if (active) {
          setErr(error.message || 'Unable to load your resume.');
        }
      }

      try {
        const data = await api('/candidate/saved', {
          candidate: true,
        });

        if (active) {
          setSaved(
            (data.jobs || []).filter((job) => job.available)
          );
        }
      } catch {
        if (active) setSaved([]);
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, []);

  const run = async (operation, successMessage) => {
    if (busy) return;

    setBusy(true);
    setErr('');
    setMsg('');

    try {
      await operation();
      await loadResume();
      setMsg(successMessage);
    } catch (error) {
      setErr(
        error.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleFile = (file) => {
    if (!file || busy) return;

    setErr('');
    setMsg('');

    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setErr('Please select a PDF file.');
      return;
    }

    if (file.size === 0) {
      setErr('The selected file is empty. Please choose another PDF.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErr('PDF must be under 2 MB.');
      return;
    }

    run(
      () =>
        api(
          '/candidate/resume/upload?name=' +
            encodeURIComponent(file.name),
          {
            method: 'POST',
            file,
            candidate: true,
          }
        ),
      'Your resume was uploaded successfully.'
    );
  };

  const handleFileInput = (event) => {
    const file = event.target.files?.[0];

    // Allow the same file to be selected again.
    event.target.value = '';

    handleFile(file);
  };

  const saveText = () => {
    if (text.trim().length < 50) {
      setErr('Please enter at least 50 characters of resume text.');
      return;
    }

    run(
      () =>
        api('/candidate/resume/text', {
          method: 'POST',
          body: { text: text.trim() },
          candidate: true,
        }),
      'Resume text saved successfully.'
    );
  };

  const deleteResume = async () => {
    if (busy) return;

    const confirmed = window.confirm(
      'Delete your resume file and saved text? This cannot be undone.'
    );

    if (!confirmed) return;

    setBusy(true);
    setErr('');
    setMsg('');

    try {
      await api('/candidate/resume', {
        method: 'DELETE',
        candidate: true,
      });

      // Clear the local state immediately after successful deletion.
      setResume({
        has: false,
        has_file: false,
        text: '',
      });
      setText('');
      setResult(null);

      // Sync with the backend in case it returns additional metadata.
      try {
        const data = await loadResume();
        setResume(data);
        setText(data.text || '');
      } catch {
        // Keep the successful delete state if refreshing fails.
      }

      setMsg('Resume deleted successfully.');
    } catch (error) {
      setErr(error.message || 'Unable to delete your resume.');
    } finally {
      setBusy(false);
    }
  };

  const downloadResume = async () => {
    if (downloading) return;

    setDownloading(true);
    setErr('');
    setMsg('');

    let objectUrl;

    try {
      const token = localStorage.getItem(CAND_KEY);

      const response = await fetch('/api/candidate/resume/download', {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Resume file not found.');
        }

        if (response.status === 401 || response.status === 403) {
          throw new Error('Please sign in again to download your resume.');
        }

        throw new Error('Download failed. Please try again.');
      }

      const blob = await response.blob();
      objectUrl = URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = resume?.file_name || 'resume.pdf';

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      setMsg('Your resume download has started.');

      // Delay cleanup so the browser can begin the download.
      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 1000);

      objectUrl = null;
    } catch (error) {
      setErr(error.message || 'Unable to download your resume.');
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setDownloading(false);
    }
  };

  const analyzeResume = async () => {
    if (analyzing) return;

    setAnalyzing(true);
    setErr('');
    setMsg('');
    setResult(null);

    try {
      const data = await api('/candidate/resume/analyze', {
        method: 'POST',
        body: {
          job_id: jobId || undefined,
        },
        candidate: true,
      });

      setResult(data);
    } catch (error) {
      setErr(error.message || 'Unable to analyze your resume.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (!resume) {
    return err ? (
      <div className="rounded-2xl border border-rose-200 bg-white p-7 text-center">
        <AlertCircle size={28} className="mx-auto text-rose-500" />

        <h2 className="mt-3 text-lg font-bold text-slate-900">
          Couldn’t load your resume
        </h2>

        <p className="mt-2 text-sm text-rose-700">{err}</p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700"
        >
          Try again
        </button>
      </div>
    ) : (
      <LoadingResume />
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Hero */}
      <section className="relative isolate overflow-hidden rounded-3xl bg-[#111735] p-6 shadow-lg shadow-indigo-950/10 sm:p-8">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-indigo-500/25 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />

          <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:34px_34px]" />
        </div>

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-indigo-100">
            <FileText size={32} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-200">
              <Sparkles size={13} />
              Resume workspace
            </div>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Your resume, your next opportunity
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Upload a PDF, save searchable resume text, and explore
              insights to help prepare for your next application.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-xl border border-white/15 bg-white/[0.07] px-3 py-2.5 text-xs font-medium text-indigo-100 sm:self-center">
            <LockKeyhole size={15} />
            Private workspace
          </div>
        </div>
      </section>

      {err && (
        <Message type="error" onClose={() => setErr('')}>
          <p className="font-bold">Something needs your attention</p>
          <p className="mt-1">{err}</p>
        </Message>
      )}

      {msg && (
        <Message type="success" onClose={() => setMsg('')}>
          <p className="font-bold">{msg}</p>
        </Message>
      )}

      {/* Current resume */}
      <Panel>
        <SectionHeading
          icon={FileCheck2}
          title="Your current resume"
          description="Check your saved resume and manage your file."
          badge={resume.has ? 'Resume available' : 'Not uploaded yet'}
        />

        {resume.has ? (
          <div className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100">
              <FileCheck2 size={24} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-bold text-slate-900">
                {resume.file_name || 'Resume text'}
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Saved
                </span>

                {resume.uploaded_at && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 size={13} />
                    Updated {fmtDate(resume.uploaded_at)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {resume.has_file && (
                <button
                  type="button"
                  onClick={downloadResume}
                  disabled={downloading || busy}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-60"
                >
                  {downloading ? (
                    <LoaderCircle size={15} className="animate-spin" />
                  ) : (
                    <ArrowDownToLine size={15} />
                  )}
                  Download PDF
                </button>
              )}

              <button
                type="button"
                onClick={deleteResume}
                disabled={busy}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-3.5 py-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
              >
                {busy ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
              <FileText size={26} />
            </div>

            <h3 className="mt-4 font-bold text-slate-900">
              Your resume starts here
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Upload a PDF or paste your resume text below to get started.
            </p>
          </div>
        )}

        <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-400">
          <LockKeyhole size={14} className="mt-0.5 shrink-0" />
          Your resume access depends on your backend permissions and storage
          configuration.
        </p>
      </Panel>

      {/* PDF upload */}
      <Panel>
        <SectionHeading
          icon={Upload}
          title="Upload your resume"
          description="Add your resume as a PDF file. Maximum supported size: 2 MB."
        />

        <label
          onDragOver={(event) => {
            event.preventDefault();
            if (!busy) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);

            if (!busy) {
              handleFile(event.dataTransfer.files?.[0]);
            }
          }}
          className={cx(
            'group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-10 text-center transition sm:py-12',
            dragging
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-slate-200 bg-slate-50/60 hover:border-indigo-300 hover:bg-indigo-50/40',
            busy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
          )}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200 transition group-hover:scale-105">
            <Upload size={29} />
          </div>

          <h3 className="mt-5 text-base font-bold text-slate-900">
            {dragging ? 'Drop your PDF here' : 'Choose a resume PDF'}
          </h3>

          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Drag and drop your file here, or select a PDF from your device.
          </p>

          <span className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition group-hover:bg-indigo-700">
            <Upload size={16} />
            Browse files
          </span>

          <span className="mt-3 text-xs text-slate-400">
            PDF format · Up to 2 MB
          </span>

          <input
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            disabled={busy}
            onChange={handleFileInput}
          />
        </label>

        {busy && (
          <div className="mt-4 flex items-center gap-2 text-sm font-medium text-indigo-700">
            <LoaderCircle size={16} className="animate-spin" />
            Processing your request…
          </div>
        )}
      </Panel>

      {/* Resume text editor */}
      <Panel>
        <SectionHeading
          icon={FileText}
          title="Resume text"
          description="Paste the text from your resume. This text is used for resume analysis."
        />

        <label
          htmlFor="resume-text"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Resume content
        </label>

        <textarea
          id="resume-text"
          className="min-h-64 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-4 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
          rows={10}
          value={text}
          disabled={busy}
          onChange={(event) => {
            setText(event.target.value);
            setMsg('');
          }}
          placeholder={
            'Paste your resume text here…\n\nInclude your summary, skills, education, experience and projects.'
          }
        />

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-400">
            {text.length.toLocaleString('en-IN')} characters · Minimum 50
            characters to save
          </p>

          <button
            type="button"
            onClick={saveText}
            disabled={busy || text.trim().length < 50}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/15 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <FileCheck2 size={16} />
            )}
            Save resume text
          </button>
        </div>
      </Panel>

      {/* Resume analysis */}
      {resume.has && (
        <Panel>
          <SectionHeading
            icon={BrainCircuit}
            title="Resume insights"
            description="Review skills in your resume and get suggestions to prepare for opportunities."
            badge="Analysis"
          />

          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/80 p-4 sm:p-5">
            <label
              htmlFor="analysis-job"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Choose a job to compare with
            </label>

            <div className="relative">
              <select
                id="analysis-job"
                className={cx(
                  inputCls,
                  'h-12 appearance-none rounded-xl border-slate-200 bg-white pr-10 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10'
                )}
                value={jobId}
                disabled={analyzing}
                onChange={(event) => {
                  setJobId(event.target.value);
                  setResult(null);
                }}
              >
                <option value="">
                  General suggestions (no specific job)
                </option>

                {jobId &&
                  !saved.some((job) => String(job.id) === jobId) && (
                    <option value={jobId}>Job #{jobId}</option>
                  )}

                {saved.map((job) => (
                  <option key={job.id} value={String(job.id)}>
                    {job.title}
                    {job.company ? ` — ${job.company}` : ''}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Choose a saved job or request general resume suggestions.
            </p>

            <button
              type="button"
              onClick={analyzeResume}
              disabled={analyzing}
              className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {analyzing ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <WandSparkles size={17} />
              )}

              {analyzing ? 'Analyzing resume…' : 'Analyze my resume'}

              {!analyzing && <ArrowRight size={16} />}
            </button>
          </div>

          {analyzing && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
              <LoaderCircle
                size={25}
                className="mx-auto animate-spin text-indigo-600"
              />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                Analyzing your resume
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Please wait while the analysis is prepared.
              </p>
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-5">
              {result.job && (
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Target size={20} />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Compared with
                    </p>

                    <h3 className="mt-1 font-bold text-slate-900">
                      {result.job.title}
                    </h3>

                    {result.job.company && (
                      <p className="mt-1 text-sm text-slate-500">
                        {result.job.company}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {result.note && (
                <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  {result.note}
                </p>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                <BulletGroup
                  title="Skills found in your resume"
                  items={result.matching_skills}
                  tone="emerald"
                  icon={CheckCircle2}
                />

                <BulletGroup
                  title="Skills listed by the job but missing from your resume"
                  items={result.missing_skills}
                  tone="amber"
                  icon={Lightbulb}
                />
              </div>

              {result.ai && (
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 font-bold text-slate-900">
                    <Sparkles size={18} className="text-indigo-600" />
                    AI suggestions
                  </h3>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <BulletGroup
                      title="Resume improvements"
                      items={result.ai.improvement_suggestions}
                      tone="indigo"
                      icon={FileText}
                    />

                    <BulletGroup
                      title="Project ideas"
                      items={result.ai.project_ideas}
                      tone="violet"
                      icon={BrainCircuit}
                    />

                    <BulletGroup
                      title="Interview preparation"
                      items={result.ai.interview_tips}
                      tone="slate"
                      icon={Lightbulb}
                    />

                    <BulletGroup
                      
title="Claims needing evidence"

                      items={result.ai.unverifiable}
                      tone="amber"
                      icon={CircleHelp}
                    />
                  </div>
                </div>
              )}

              {result.ai_error && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-bold">AI suggestions unavailable</p>
                  <p className="mt-1 leading-6">{result.ai_error}</p>
                </div>
              )}

              {result.disclaimer && (
                <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-500">
                  {result.disclaimer}
                </p>
              )}
            </div>
          )}
        </Panel>
      )}

      {/* Jobs CTA */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-violet-50 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
            <Sparkles size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-900">
              Make your next application count
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Keep your resume current and explore roles that fit your skills.
            </p>

            <Link
              to="/jobs"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 transition hover:text-indigo-800"
            >
              Explore jobs
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
