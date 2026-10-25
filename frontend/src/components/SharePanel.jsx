import { useEffect, useState } from 'react';
import {
  Copy,
  Share2,
  Check,
  MessageCircle,
  Send,
  Link2,
  CheckCircle2,
  LoaderCircle,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

import { publicUrl, shareMessage } from '../lib/format';
import { track } from '../lib/api';

export default function SharePanel({
  job,
  showMessage = false,
  count = true,
}) {
  const [copied, setCopied] = useState('');
  const [sharing, setSharing] = useState(false);
  const [copyError, setCopyError] = useState('');

  useEffect(() => {
    if (!copied) return undefined;

    const timer = window.setTimeout(() => {
      setCopied('');
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [copied]);

  if (!job) return null;

  const url = publicUrl(job);
  const msg = shareMessage(job, url);

  const hit = () => {
    if (!count || !job.id) return;

    try {
      const result = track(job.id, 'share');

      if (result && typeof result.catch === 'function') {
        result.catch(() => {});
      }
    } catch {
      // Analytics failure should not interrupt sharing.
    }
  };

  const copy = async (text, key) => {
    setCopyError('');

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error('Clipboard unavailable');
      }

      setCopied(key);
      hit();
    } catch {
      const result = window.prompt('Copy this text:', text);

      if (result !== null) {
        setCopied(key);
        hit();
      } else {
        setCopyError('Copy cancelled. You can select the text and copy it manually.');
      }
    }
  };

  const native = async () => {
    if (!navigator.share || sharing) return;

    setSharing(true);
    setCopyError('');

    try {
      await navigator.share({
        title: job.title || 'Job opportunity',
        text: msg,
        url,
      });

      hit();
    } catch (error) {
      if (error?.name !== 'AbortError') {
        setCopyError('Unable to open the sharing menu. Try copying the job link instead.');
      }
    } finally {
      setSharing(false);
    }
  };

  const actionClass =
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60';

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(msg)}`;

  return (
    <div className="space-y-4">
      {/* Share introduction */}
      <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
          <Share2 size={20} />
        </span>

        <div className="min-w-0">
          <p className="text-sm font-extrabold text-slate-900">
            Know someone who fits?
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Share this opportunity with friends and help them discover their
            next role.
          </p>

          {job.title && (
            <p className="mt-2 break-words text-sm font-bold text-indigo-800">
              {job.title}
              {job.company ? ` · ${job.company}` : ''}
            </p>
          )}
        </div>
      </div>

      {/* Share actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className={actionClass}
          onClick={() => copy(url, 'link')}
        >
          {copied === 'link' ? (
            <Check size={16} className="text-emerald-600" />
          ) : (
            <Link2 size={16} />
          )}

          {copied === 'link' ? 'Link copied' : 'Copy link'}
        </button>

        <a
          className={`${actionClass} no-underline`}
          target="_blank"
          rel="noopener noreferrer"
          href={whatsappUrl}
          onClick={hit}
        >
          <MessageCircle size={16} className="text-emerald-600" />
          WhatsApp
          <ExternalLink size={12} className="text-slate-400" />
        </a>

        <a
          className={`${actionClass} no-underline`}
          target="_blank"
          rel="noopener noreferrer"
          href={telegramUrl}
          onClick={hit}
        >
          <Send size={16} className="text-sky-600" />
          Telegram
          <ExternalLink size={12} className="text-slate-400" />
        </a>

        {typeof navigator !== 'undefined' &&
          typeof navigator.share === 'function' && (
            <button
              type="button"
              className={actionClass}
              onClick={native}
              disabled={sharing}
            >
              {sharing ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Share2 size={16} />
              )}

              {sharing ? 'Opening...' : 'More options'}
            </button>
          )}
      </div>

      {/* Copy confirmation */}
      {copied && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm font-semibold text-emerald-800"
        >
          <CheckCircle2 size={17} />

          {copied === 'link'
            ? 'Job link copied successfully.'
            : 'Share message copied successfully.'}
        </div>
      )}

      {copyError && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm leading-5 text-amber-800"
        >
          {copyError}
        </div>
      )}

      {/* Ready-to-share message */}
      {showMessage && (
        <div className="border-t border-slate-100 pt-4">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-600" />

            <h3 className="text-sm font-extrabold text-slate-900">
              Ready-to-share message
            </h3>
          </div>

          <textarea
            readOnly
            value={msg}
            rows={7}
            aria-label="Share message"
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm leading-6 text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            onClick={(event) => event.currentTarget.select()}
            onFocus={(event) => event.currentTarget.select()}
          />

          <button
            type="button"
            className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/15 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            onClick={() => copy(msg, 'msg')}
          >
            {copied === 'msg' ? (
              <Check size={16} />
            ) : (
              <Copy size={16} />
            )}

            {copied === 'msg' ? 'Message copied' : 'Copy share message'}
          </button>
        </div>
      )}

      <p className="text-center text-[11px] leading-5 text-slate-400">
        Share the original job listing so others can review the opportunity
        and application details.
      </p>
    </div>
  );
}