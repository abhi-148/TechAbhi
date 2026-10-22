
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, BriefcaseBusiness, Building2, CalendarDays, CheckCircle2,
  Clock3, Copy, Download, FileText, LoaderCircle, MessageSquare,
  RefreshCw, Send, ShieldCheck, UserRound, Users, XCircle,
} from 'lucide-react';
import { api, TOKEN_KEY } from '../../lib/api';
import { btnGhost, btnPrimary, inputCls, fmtDate } from '../../lib/format';

const TABS = ['submitted', 'in_review', 'in_progress', 'on_hold', 'closed', 'all'];

const NEXT_BTN = {
  candidate_approved: [['shared', 'Mark as shared']],
  shared: [['response_received', 'Company responded'], ['no_response', 'No response']],
  response_received: [['interview_scheduled', 'Record interview'], ['no_response', 'No response']],
  interview_scheduled: [],
  no_response: [],
};

const STATUS_STYLE = {
  submitted: 'bg-sky-50 text-sky-700 ring-sky-200',
  in_review: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  in_progress: 'bg-violet-50 text-violet-700 ring-violet-200',
  on_hold: 'bg-amber-50 text-amber-700 ring-amber-200',
  closed: 'bg-slate-100 text-slate-600 ring-slate-200',
  proposed: 'bg-amber-50 text-amber-700 ring-amber-200',
  candidate_approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  candidate_declined: 'bg-rose-50 text-rose-700 ring-rose-200',
  shared: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  response_received: 'bg-sky-50 text-sky-700 ring-sky-200',
  interview_scheduled: 'bg-violet-50 text-violet-700 ring-violet-200',
  no_response: 'bg-slate-100 text-slate-600 ring-slate-200',
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${STATUS_STYLE[status] || 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {(status || 'unknown').replace(/_/g, ' ')}
    </span>
  );
}

function Hero({ eyebrow, title, description, icon: Icon }) {
  return (
    <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-6 text-white shadow-xl shadow-indigo-950/10 sm:p-8">
      <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-indigo-100">
          <Icon size={15} /> {eyebrow}
        </div>
        <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100/85">{description}</p>
      </div>
    </div>
  );
}

function Panel({ title, icon: Icon, children, action }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <h2 className="flex items-center gap-2.5 font-bold text-slate-900">
          {Icon && <span className="rounded-lg bg-indigo-50 p-2 text-indigo-700"><Icon size={17} /></span>}
          {title}
        </h2>
        {action}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function ErrorBox({ message, onRetry }) {
  return (
    <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
      <p className="font-bold">Something went wrong</p>
      <p className="mt-1 break-words">{message}</p>
      {onRetry && <button type="button" onClick={onRetry} className="mt-3 inline-flex items-center gap-2 font-bold"><RefreshCw size={14} /> Try again</button>}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center">
      <LoaderCircle size={28} className="animate-spin text-indigo-600" />
      <p className="mt-3 text-sm font-semibold text-slate-700">Loading assistance data...</p>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color = 'indigo' }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-700',
    violet: 'bg-violet-50 text-violet-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-xl p-2.5 ${tones[color]}`}><Icon size={20} /></div>
        <div><p className="text-2xl font-black text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></div>
      </div>
    </div>
  );
}

/* -------------------- ASSISTANCE REQUEST LIST -------------------- */

export function AdminAssistanceList() {
  const [tab, setTab] = useState('submitted');
  const [list, setList] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setErr('');
    setList(null);
    try {
      const data = await api('/admin/assistance' + (tab === 'all' ? '' : '?status=' + tab), { admin: true });
      setList(data.requests);
    } catch (error) {
      setErr(error.message || 'Unable to load assistance requests.');
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <Hero
        eyebrow="CANDIDATE SUPPORT"
        title="Career assistance"
        description="Review candidate requests, manage progress, and coordinate approved outreach with care."
        icon={Users}
      />

      {list && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Shown requests" value={list.length} icon={FileText} />
          <StatCard label="Submitted" value={list.filter((r) => r.status === 'submitted').length} icon={Clock3} color="amber" />
          <StatCard label="In progress" value={list.filter((r) => r.status === 'in_progress').length} icon={BriefcaseBusiness} color="violet" />
          <StatCard label="Closed" value={list.filter((r) => r.status === 'closed').length} icon={CheckCircle2} color="emerald" />
        </div>
      )}

      <Panel
        title="Assistance requests"
        icon={FileText}
        action={<span className="text-xs text-slate-400">Filter by status</span>}
      >
        <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
          {TABS.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setTab(item)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold capitalize transition ${tab === item ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'}`}
            >
              {item.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {err && <ErrorBox message={err} onRetry={load} />}
        {!list && !err && <Loading />}

        {list?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center">
            <Users size={28} className="mx-auto text-slate-400" />
            <h3 className="mt-3 font-bold text-slate-900">No requests in this view</h3>
            <p className="mt-1 text-sm text-slate-500">Choose another status or check again later.</p>
          </div>
        )}

        {list?.length > 0 && (
          <div className="space-y-3">
            {list.map((request) => (
              <Link
                key={request.id}
                to={`/admin/assistance/${request.id}`}
                className="group block rounded-2xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/30 hover:shadow-sm sm:p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <UserRound size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900 group-hover:text-indigo-700">{request.full_name}</h3>
                      <StatusBadge status={request.status} />
                    </div>
                    <p className="mt-2 text-sm leading-5 text-slate-600">{request.target_roles || 'No target roles specified'}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} /> {fmtDate(request.created_at)}</span>
                      <span className="inline-flex items-center gap-1.5"><MessageSquare size={13} /> {request.outreach_count} outreach</span>
                    </div>
                  </div>
                  <span className="mt-1 rounded-lg bg-slate-100 p-2 text-slate-500 transition group-hover:bg-indigo-100 group-hover:text-indigo-700">
                    <ArrowLeft size={16} className="rotate-180" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

/* -------------------- ASSISTANCE REQUEST DETAIL -------------------- */

export function AdminAssistanceDetail() {
  const { id } = useParams();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const [o, setO] = useState({
    company_name: '', hr_contact: '', job_id: '', message: '',
    email: false, profile: false, resume: false,
  });
  const [packet, setPacket] = useState(null);
  const [iv, setIv] = useState({ id: null, at: '', info: '' });

  const load = useCallback(async () => {
    setErr('');
    try {
      const data = await api('/admin/assistance/' + id, { admin: true });
      setD(data);
      setNote(data.request.admin_note || '');
    } catch (error) {
      setErr(error.message || 'Unable to load this request.');
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const act = async (fn) => {
    setErr('');
    setBusy(true);
    try {
      await fn();
      await load();
    } catch (error) {
      setErr([error.message, ...(error.details || [])].join(' '));
    } finally {
      setBusy(false);
    }
  };

  const setStatus = (status) => {
    let reason;
    if (status === 'closed') {
      reason = window.prompt('Reason for closing (the candidate will see this):');
      if (!reason?.trim()) return;
    }
    act(() => api(`/admin/assistance/${id}/status`, {
      method: 'PUT', body: { status, reason }, admin: true,
    }));
  };

  const post = () => {
    if (!msg.trim()) return;
    act(async () => {
      await api(`/admin/assistance/${id}/updates`, {
        method: 'POST', body: { message: msg }, admin: true,
      });
      setMsg('');
    });
  };

  const propose = () => {
    if (!o.company_name.trim() || !o.message.trim()) {
      setErr('Company name and candidate-facing message are required.');
      return;
    }
    act(async () => {
      await api(`/admin/assistance/${id}/outreach`, {
        method: 'POST',
        body: {
          company_name: o.company_name,
          hr_contact: o.hr_contact,
          job_id: o.job_id || null,
          message: o.message,
          shared_fields: ['email', 'profile', 'resume'].filter((key) => o[key]),
        },
        admin: true,
      });
      setO({ company_name: '', hr_contact: '', job_id: '', message: '', email: false, profile: false, resume: false });
    });
  };

  const move = (outreachId, status) =>
    act(() => api('/admin/assistance/outreach/' + outreachId, {
      method: 'PUT', body: { status }, admin: true,
    }));

  const schedule = () => {
    if (!iv.at || !iv.info.trim()) {
      setErr('Enter the confirmed interview date/time and details.');
      return;
    }
    act(async () => {
      await api('/admin/assistance/outreach/' + iv.id, {
        method: 'PUT',
        body: { status: 'interview_scheduled', interview_at: iv.at, interview_info: iv.info },
        admin: true,
      });
      setIv({ id: null, at: '', info: '' });
    });
  };

  const getPacket = (outreachId) => act(async () => {
    const data = await api(`/admin/assistance/outreach/${outreachId}/packet`, { admin: true });
    setPacket({ oid: outreachId, ...data });
  });

  const dl = async () => {
    setErr('');
    try {
      const response = await fetch(`/api/admin/assistance/${id}/resume`, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem(TOKEN_KEY) },
      });
      if (!response.ok) throw new Error('Resume download failed or no resume file is available.');
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'resume.pdf';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setErr(error.message);
    }
  };

  const saveNote = () => act(() => api(`/admin/assistance/${id}/note`, {
    method: 'PUT', body: { admin_note: note }, admin: true,
  }));

  if (!d && err) {
    return <div className="space-y-4"><Link className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700" to="/admin/assistance"><ArrowLeft size={16} /> All requests</Link><ErrorBox message={err} onRetry={load} /></div>;
  }
  if (!d) return <Loading />;

  const { request: rq, candidate: c, profile: p, resume } = d;
  const open = rq.status !== 'closed';

  return (
    <div className="space-y-6">
      <Link className="inline-flex items-center gap-2 text-sm font-bold text-indigo-700 hover:text-indigo-900" to="/admin/assistance">
        <ArrowLeft size={16} /> All assistance requests
      </Link>

      <Hero
        eyebrow="CANDIDATE CASE"
        title={c.name}
        description="Manage career assistance, candidate-approved company outreach, and progress updates."
        icon={UserRound}
      />

      {err && <ErrorBox message={err} />}
      {busy && <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700"><LoaderCircle size={14} className="animate-spin" /> Saving changes...</div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Request status" value={rq.status.replace(/_/g, ' ')} icon={FileText} />
        <StatCard label="Outreach records" value={d.outreach.length} icon={Building2} color="violet" />
        <StatCard label="Target roles" value={rq.target_roles ? 1 : 0} icon={BriefcaseBusiness} color="amber" />
        <StatCard label="Updates" value={d.updates.length} icon={MessageSquare} color="emerald" />
      </section>

      <Panel title="Request overview" icon={FileText}>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={rq.status} />
          {c.email && <span className="break-all text-sm text-slate-500">{c.email}</span>}
        </div>

        {open ? (
          <>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Target roles</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">{rq.target_roles || '-'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Preferred locations</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">{rq.preferred_locations || '-'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Availability</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">{rq.availability || '-'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Submitted</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">{fmtDate(rq.created_at)}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Candidate's challenges</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{rq.challenges || 'No challenges provided.'}</p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {[
                ['in_review', 'In review'],
                ['in_progress', 'In progress'],
                ['on_hold', 'On hold'],
              ].map(([status, label]) => (
                <button key={status} type="button" disabled={busy} className={btnGhost} onClick={() => setStatus(status)}>{label}</button>
              ))}
              <button type="button" disabled={busy} className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50" onClick={() => setStatus('closed')}>Close request</button>
            </div>
          </>
        ) : (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-bold text-slate-800">This request is closed.</p>
            <p className="mt-1 text-sm text-slate-600">Reason: {rq.closed_reason || 'No reason provided.'}</p>
            <p className="mt-2 text-xs text-slate-500">Personal candidate data is no longer available.</p>
          </div>
        )}
      </Panel>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <ShieldCheck size={19} className="mt-0.5 shrink-0" />
        <p><strong>Privacy and outreach rules:</strong> Never promise a job or interview. Record only contacts and responses that actually occurred. Do not share candidate information with a company until the candidate approves that company. Views of this data are logged.</p>
      </div>

      {open && p && (
        <Panel title="Candidate profile" icon={UserRound}>
          <p className="mb-4 text-xs text-slate-500">Information shared with you for this assistance request.</p>
          {p.headline && <h3 className="text-lg font-bold text-slate-900">{p.headline}</h3>}
          {p.summary && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{p.summary}</p>}

          <div className="mt-5 space-y-5">
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {(p.skills || []).length ? p.skills.map((skill, i) => <span key={i} className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800">{skill}</span>) : <span className="text-sm text-slate-400">Not provided</span>}
              </div>
            </div>
            {[
              { title: 'Education', icon: '🎓', items: p.education || [], format: (x) => [x.degree, x.institution, x.year].filter(Boolean).join(' · ') },
              { title: 'Experience', icon: '💼', items: p.experience || [], format: (x) => [x.title, x.company, x.period].filter(Boolean).join(' · ') },
              { title: 'Projects', icon: '🛠', items: p.projects || [], format: (x) => x.name || '-' },
            ].map((section) => (
              <div key={section.title}>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{section.title}</h3>
                {section.items.length ? (
                  <div className="space-y-2">
                    {section.items.map((item, index) => (
                      <div key={index} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
                        <span className="mr-2">{section.icon}</span>{section.format(item)}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-slate-400">Not provided</p>}
              </div>
            ))}
          </div>

          {resume && (
            <details className="mt-5 rounded-xl border border-slate-200">
              <summary className="cursor-pointer p-4 text-sm font-bold text-indigo-700 hover:bg-indigo-50">View resume text</summary>
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words border-t border-slate-100 p-4 text-xs leading-5 text-slate-600">{resume.text}</pre>
            </details>
          )}
          {resume?.has_file && (
            <button type="button" className={`${btnGhost} mt-4`} onClick={dl}><Download size={16} /> Download resume PDF</button>
          )}
        </Panel>
      )}

      {open && (
        <Panel title="Propose company outreach" icon={Building2}>
          <p className="mb-5 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs leading-5 text-indigo-900">
            The candidate sees the proposed company, your message, and the information you want to share. They must approve the proposal before you share their details. HR contact information is private to you.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Company name *</span>
              <input className={`${inputCls} w-full`} placeholder="Company name" value={o.company_name} onChange={(e) => setO({ ...o, company_name: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Private HR contact</span>
              <input className={`${inputCls} w-full`} placeholder="Name or email you actually have" value={o.hr_contact} onChange={(e) => setO({ ...o, hr_contact: e.target.value })} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">TechAbhi job ID <span className="font-normal text-slate-400">(optional)</span></span>
              <input className={`${inputCls} w-full`} placeholder="Job ID" value={o.job_id} onChange={(e) => setO({ ...o, job_id: e.target.value })} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Message to candidate *</span>
              <textarea className={`${inputCls} w-full`} rows={4} placeholder="Explain why this company may be relevant and what you propose to do..." value={o.message} onChange={(e) => setO({ ...o, message: e.target.value })} />
            </label>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-bold text-slate-800">Information proposed for sharing</p>
            <p className="mt-1 text-xs text-slate-500">Candidate name is always included.</p>
            <div className="mt-4 flex flex-wrap gap-4">
              {[
                ['email', 'Email address'],
                ['profile', 'Profile'],
                ['resume', 'Resume'],
              ].map(([key, label]) => (
                <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input className="h-4 w-4 accent-indigo-600" type="checkbox" checked={o[key]} onChange={(e) => setO({ ...o, [key]: e.target.checked })} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <button type="button" disabled={busy} className={`${btnPrimary} mt-5`} onClick={propose}><Send size={16} /> Send proposal to candidate</button>
        </Panel>
      )}

      <Panel title="Company outreach timeline" icon={BriefcaseBusiness}>
        {d.outreach.length === 0 ? (
          <div className="py-5 text-center">
            <Building2 size={28} className="mx-auto text-slate-300" />
            <p className="mt-3 font-semibold text-slate-700">No outreach yet</p>
            <p className="mt-1 text-sm text-slate-500">Proposed company contacts will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {d.outreach.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><Building2 size={20} /></div>
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words font-bold text-slate-900">{item.company_name}</h3>
                    {item.job_title && <p className="mt-1 text-sm text-slate-500">{item.job_title}</p>}
                    <div className="mt-2"><StatusBadge status={item.status} /></div>
                  </div>
                  <p className="text-xs text-slate-400">Shares: name{item.shared_fields.length ? ', ' + item.shared_fields.join(', ') : ''}</p>
                </div>

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
                  <p className="text-slate-600"><strong className="text-slate-800">Private HR contact:</strong> {item.hr_contact || '-'}</p>
                  {item.interview_at && (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-emerald-800">
                      <p className="font-bold">Interview recorded</p>
                      <p className="mt-1 text-sm">{new Date(item.interview_at).toLocaleString()} · {item.interview_info}</p>
                    </div>
                  )}
                  {item.status === 'proposed' && <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">Waiting for candidate approval. Do not share candidate details yet.</p>}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {['candidate_approved', 'shared', 'response_received', 'interview_scheduled', 'no_response'].includes(item.status) && open && (
                    <button type="button" disabled={busy} className={btnGhost} onClick={() => getPacket(item.id)}><FileText size={15} /> Get approved share packet</button>
                  )}
                  {open && (NEXT_BTN[item.status] || []).map(([status, label]) => status === 'interview_scheduled' ? (
                    <button key={status} type="button" className={btnGhost} onClick={() => setIv({ id: item.id, at: '', info: '' })}>{label}</button>
                  ) : (
                    <button key={status} type="button" disabled={busy} className={btnGhost} onClick={() => move(item.id, status)}>{label}</button>
                  ))}
                  {open && !['closed', 'candidate_declined'].includes(item.status) && (
                    <button type="button" disabled={busy} className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50" onClick={() => move(item.id, 'closed')}>Close outreach</button>
                  )}
                </div>

                {iv.id === item.id && (
                  <div className="mt-4 grid gap-3 rounded-xl border border-violet-100 bg-violet-50/50 p-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold text-slate-600">Confirmed interview date/time</span>
                      <input className={`${inputCls} w-full`} type="datetime-local" value={iv.at} onChange={(e) => setIv({ ...iv, at: e.target.value })} />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold text-slate-600">Confirmed details</span>
                      <input className={`${inputCls} w-full`} placeholder="Details confirmed by company" value={iv.info} onChange={(e) => setIv({ ...iv, info: e.target.value })} />
                    </label>
                    <div className="flex gap-2 sm:col-span-2">
                      <button type="button" disabled={busy} className={btnPrimary} onClick={schedule}>Save interview</button>
                      <button type="button" className={btnGhost} onClick={() => setIv({ id: null, at: '', info: '' })}>Cancel</button>
                    </div>
                  </div>
                )}

                {packet?.oid === item.id && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                    <p className="text-sm font-bold text-emerald-900">Approved share packet</p>
                    <p className="mt-1 text-xs leading-5 text-emerald-800">Send this to {packet.hr_contact || 'the company'} yourself, then mark the outreach as shared.</p>
                    <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-emerald-100 bg-white p-3 text-xs leading-5 text-slate-700">{packet.text}</pre>
                    <button type="button" className={`${btnGhost} mt-3`} onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(packet.text);
                      } catch {
                        window.prompt('Copy approved share packet:', packet.text);
                      }
                    }}><Copy size={15} /> Copy packet</button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </Panel>

      {open && (
        <Panel title="Candidate-facing update" icon={MessageSquare}>
          <p className="mb-4 text-xs leading-5 text-slate-500">This message is visible to the candidate. Share accurate progress only and do not promise outcomes.</p>
          <textarea className={`${inputCls} w-full`} rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Write a clear progress update for the candidate..." />
          <button type="button" disabled={busy || !msg.trim()} className={`${btnPrimary} mt-3`} onClick={post}><Send size={16} /> Post update</button>
        </Panel>
      )}

      <Panel title="Private admin note" icon={ShieldCheck}>
        <p className="mb-4 text-xs leading-5 text-slate-500">Only for internal administration. The candidate cannot see this note.</p>
        <textarea className={`${inputCls} w-full`} rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note..." />
        <button type="button" disabled={busy} className={`${btnGhost} mt-3`} onClick={saveNote}><CheckCircle2 size={16} /> Save private note</button>
      </Panel>

      <Panel title="Activity timeline" icon={Clock3}>
        {d.updates.length === 0 ? (
          <p className="py-4 text-sm text-slate-500">No updates have been recorded yet.</p>
        ) : (
          <div className="relative space-y-4 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-slate-200">
            {d.updates.map((update, index) => (
              <div key={index} className="relative flex gap-3 pl-1">
                <span className="relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-indigo-500 bg-white" />
                <div className="min-w-0 flex-1 rounded-xl bg-slate-50 p-3">
                  <p className="whitespace-pre-line break-words text-sm leading-6 text-slate-700">{update.message}</p>
                  <p className="mt-2 text-xs text-slate-400">{new Date(update.created_at).toLocaleString()} · {update.author}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
