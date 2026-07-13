'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, CheckSquare, Square, Mail, AlertCircle, CheckCircle, XCircle, Loader2, Plus, Upload, X, Trash2 } from 'lucide-react';
import { Contact } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const DEFAULT_SUBJECT = 'Software Developer Application';
const DEFAULT_TEMPLATE = `Hi [First Name],

Hope you're doing well.

I know you probably receive many emails daily, so I'll keep this brief.

I've 1 years of experience in Software Development, and I'm actively looking for opportunities as a Software Engineer.

A quick snapshot of my profile:
• Built an enterprise Employee Management System using Next.js, Node.js, TypeScript, and PostgreSQL, featuring biometric attendance, RBAC, WebSockets, and over 60 database models.
• Developed scalable backend systems with REST APIs, Prisma ORM, WebSockets, AI integrations, secure authentication, and payment gateway integrations.
• Actively contribute to open source projects via GitHub repositories.

I'm reaching out in case there's a suitable opening within your organization, either now or in the near future. If you feel my profile could be a good fit, I'd be grateful if you could consider my application.

I've attached my resume for your reference.

Thank you for your time. I truly appreciate it, and I hope to hear from you if there's an opportunity that matches my background.

Best Regards,
Ansh Rajveer
+91 6268844871
Portfolio: https://ansh-s-portfolio-six.vercel.app/
GitHub: https://github.com/locifer18`;

interface MailLog {
  id: string;
  toEmail: string;
  toName: string;
  subject: string;
  sentAt: string;
  contact: { name: string; company: string | null };
}

interface Props {
  contacts: Contact[];
  sentToday: number;
  remaining: number;
  limit: number;
  logs: MailLog[];
  sentContactIds: string[];
}

type SendResult = { id: string; name: string; success: boolean; error?: string };

function ImportButton({ onDone }: { onDone: () => void }) {
  const ref = useRef<React.ElementRef<'input'>>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; errors: number; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true); setResult(null); setError(null);
    try {
      const text = await file.text();
      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: text,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Import failed'); }
      else { setResult(data); onDone(); }
    } catch { setError('Failed to read file'); }
    finally { setLoading(false); if (ref.current) ref.current.value = ''; }
  }

  return (
    <>
      <input ref={ref} type="file" accept=".csv" onChange={handleFile} className="hidden" />
      <button
        onClick={() => { setResult(null); setError(null); ref.current?.click(); }}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-[#1e1e2e] hover:bg-[#2a2a3e] text-slate-300 rounded-lg border border-[#2d2d3d] transition-colors disabled:opacity-50"
      >
        <Upload size={14} />
        {loading ? 'Importing...' : 'Import CSV'}
      </button>
      {result && (
        <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 bg-[#1a1a2e] border border-green-800 text-slate-200 rounded-xl shadow-2xl p-4 max-w-sm">
          <CheckCircle size={18} className="text-green-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-300">Import Complete</p>
            <p className="text-xs text-slate-400 mt-0.5">{result.message}</p>
          </div>
          <button onClick={() => setResult(null)}><X size={14} className="text-slate-500" /></button>
        </div>
      )}
      {error && (
        <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 bg-[#1a1a2e] border border-red-800 text-slate-200 rounded-xl shadow-2xl p-4 max-w-sm">
          <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-300">Import Failed</p>
            <p className="text-xs text-slate-400 mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError(null)}><X size={14} className="text-slate-500" /></button>
        </div>
      )}
    </>
  );
}

export default function MailPage({ contacts: initialContacts, sentToday, limit, logs: initialLogs, sentContactIds: initialSentContactIds }: Props) {
  const router = useRouter();
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState<string | null>(null);
  const [results, setResults] = useState<SendResult[]>([]);
  const [logs, setLogs] = useState<MailLog[]>(initialLogs);
  const [sentContactIds, setSentContactIds] = useState<Set<string>>(new Set(initialSentContactIds));
  const [todayCount, setTodayCount] = useState(sentToday);
  const [tab, setTab] = useState<'tosend' | 'sent'>('tosend');
  const [showTemplate, setShowTemplate] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const eligible = contacts.filter(c => c.email);
  const toSendContacts = eligible.filter(c => !sentContactIds.has(c.id));

  const allSelected = toSendContacts.length > 0 && toSendContacts.every(c => selected.has(c.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(toSendContacts.map(c => c.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function refreshData() {
    const res = await fetch('/api/mail/send');
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setTodayCount(data.sentToday);
      setSentContactIds(new Set(data.sentContactIds as string[]));
    }
  }

  async function deleteContacts(contactIds: string[]) {
    if (!confirm(`Delete ${contactIds.length} contact(s) permanently from the database?`)) return;
    await fetch('/api/mail/send', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactIds }),
    });
    setContacts(prev => prev.filter(c => !contactIds.includes(c.id)));
    setSelected(new Set());
  }

  async function deleteLogs(logIds: string[]) {
    if (!confirm(`Delete ${logIds.length} sent log(s)?`)) return;
    await fetch('/api/mail/send', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logIds }),
    });
    setLogs(prev => prev.filter(l => !logIds.includes(l.id)));
    setSelectedLogs(new Set());
  }

  async function sendMails(contactIds: string[], key: string) {
    const toSend = eligible
      .filter(c => contactIds.includes(c.id))
      .map(c => ({ id: c.id, name: c.name, email: c.email! }));

    if (!toSend.length) return;

    setSending(key);
    setResults([]);

    const res = await fetch('/api/mail/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacts: toSend, subject, template }),
    });

    const data = await res.json();
    if (!res.ok) {
      setResults([{ id: '', name: '', success: false, error: data.error }]);
      setSending(null);
      return;
    }

    // Optimistically mark these contact IDs as sent immediately
    const successIds = new Set<string>((data.results as { id: string; success: boolean }[]).filter(r => r.success).map(r => r.id));
    setSentContactIds(prev => new Set([...prev, ...successIds]));
    const now = new Date().toISOString();
    const newLogs: MailLog[] = toSend
      .filter(c => successIds.has(c.id))
      .map(c => ({
        id: `temp-${c.id}`,
        toEmail: c.email,
        toName: c.name,
        subject,
        sentAt: now,
        contact: { name: c.name, company: contacts.find(x => x.id === c.id)?.company ?? null },
      }));
    setLogs(prev => [...newLogs, ...prev]);
    setTodayCount(prev => prev + successIds.size);
    setResults(data.results);
    setSelected(new Set());
    setSending(null);

    // Sync real log IDs from server in background
    refreshData();
  }

  const remaining = limit - todayCount;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Mail</h1>
          <p className="text-sm text-slate-500 mt-1">Send outreach emails directly from your Gmail</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ImportButton onDone={() => router.refresh()} />
          <Link
            href="/contacts/new"
            className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
          >
            <Plus size={14} /> Add Contact
          </Link>
          <div className="flex items-center gap-3 bg-[#111118] border border-[#1e1e2e] rounded-xl px-4 py-2.5">
          <Mail size={14} className="text-indigo-400" />
          <div>
            <div className="text-xs text-slate-500">Sent today</div>
            <div className="text-sm font-semibold text-slate-100">{todayCount} / {limit}</div>
          </div>
          <div className="w-24 h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${Math.min((todayCount / limit) * 100, 100)}%` }}
            />
          </div>
          <span className="text-xs text-slate-500">{Math.max(remaining, 0)} left</span>
          </div>
        </div>
      </div>

      {/* Template editor toggle */}
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden">
        <button
          onClick={() => setShowTemplate(p => !p)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-300 hover:bg-[#13131e] transition-colors"
        >
          <span className="font-medium">Email Template</span>
          <span className="text-xs text-slate-500">{showTemplate ? 'Hide' : 'Edit template'}</span>
        </button>
        {showTemplate && (
          <div className="px-4 pb-4 space-y-3 border-t border-[#1e1e2e]">
            <div className="pt-3">
              <label className="text-xs text-slate-500 mb-1 block">Subject</label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#0d0d18] border border-[#2d2d3d] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Body — use <code className="text-indigo-400 bg-[#1e1e2e] px-1 rounded">[First Name]</code> for personalization
              </label>
              <textarea
                value={template}
                onChange={e => setTemplate(e.target.value)}
                rows={16}
                className="w-full px-3 py-2 text-sm bg-[#0d0d18] border border-[#2d2d3d] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 resize-none font-mono leading-relaxed"
              />
            </div>
          </div>
        )}
      </div>

      {/* Send results */}
      {results.length > 0 && (
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Last Send Results</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {r.success
                  ? <CheckCircle size={12} className="text-green-400 shrink-0" />
                  : <XCircle size={12} className="text-red-400 shrink-0" />
                }
                <span className={r.success ? 'text-slate-300' : 'text-red-400'}>
                  {r.name || 'Error'}{r.error ? ` — ${r.error}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[#111118] border border-[#1e1e2e] rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('tosend')}
          className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
            tab === 'tosend' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          To Send {mounted ? `(${toSendContacts.length})` : ''}
        </button>
        <button
          onClick={() => setTab('sent')}
          className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
            tab === 'sent' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Sent {mounted ? `(${logs.length})` : ''}
        </button>
      </div>

      {/* TO SEND TAB */}
      {tab === 'tosend' && (
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden">
          {/* Bulk bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2e]">
            <div className="flex items-center gap-3">
              <button onClick={toggleAll} className="text-slate-400 hover:text-slate-200 transition-colors">
                {allSelected
                  ? <CheckSquare size={15} className="text-indigo-400" />
                  : <Square size={15} />
                }
              </button>
              <span className="text-xs text-slate-500">
                {selected.size > 0 ? `${selected.size} selected` : `${toSendContacts.length} contacts pending`}
              </span>
            </div>
            {selected.size > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => sendMails([...selected], 'bulk')}
                  disabled={!!sending || remaining <= 0}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {sending === 'bulk' ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  Bulk Send to {selected.size}
                </button>
                <button
                  onClick={() => deleteContacts([...selected])}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs bg-red-900/40 hover:bg-red-900/70 text-red-400 rounded-lg border border-red-800 transition-colors"
                >
                  <Trash2 size={12} /> Delete {selected.size}
                </button>
              </div>
            )}
          </div>

          {/* Contact rows */}
          <div className="divide-y divide-[#1a1a26]">
            {toSendContacts.length === 0 && (
              <div className="px-4 py-10 text-center text-slate-500 text-sm">
                All contacts have been emailed 🎉
              </div>
            )}
            {toSendContacts.map(c => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#13131e] transition-colors">
                <button onClick={() => toggleOne(c.id)} className="text-slate-400 hover:text-slate-200 shrink-0">
                  {selected.has(c.id)
                    ? <CheckSquare size={14} className="text-indigo-400" />
                    : <Square size={14} />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-200 truncate">{c.name}</div>
                  <div className="text-xs text-slate-500 truncate">{c.email}</div>
                  {c.company && <div className="text-xs text-slate-600 truncate">{c.company}</div>}
                </div>
                <div className="shrink-0 text-xs text-slate-600">{c.status}</div>
                <button
                  onClick={() => sendMails([c.id], c.id)}
                  disabled={!!sending || remaining <= 0}
                  title={remaining <= 0 ? 'Daily limit reached' : `Send to ${c.name}`}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#1e1e2e] hover:bg-indigo-600/30 hover:text-indigo-300 text-slate-400 rounded-lg border border-[#2d2d3d] hover:border-indigo-700 transition-colors disabled:opacity-40"
                >
                  {sending === c.id ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                  Send
                </button>
                <button
                  onClick={() => deleteContacts([c.id])}
                  title="Delete contact"
                  className="shrink-0 p-1.5 text-slate-600 hover:text-red-400 hover:bg-[#1e1e2e] rounded-lg transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {remaining <= 0 && (
            <div className="px-4 py-2.5 border-t border-[#1e1e2e] flex items-center gap-2 bg-yellow-950/20">
              <AlertCircle size={12} className="text-yellow-500" />
              <span className="text-xs text-yellow-400">Daily limit of {limit} reached. Resets at midnight.</span>
            </div>
          )}
        </div>
      )}

      {/* SENT TAB */}
      {tab === 'sent' && (
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden">
          {/* Bulk bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2e]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const allLogIds = logs.map(l => l.id);
                  const allSelected = allLogIds.every(id => selectedLogs.has(id));
                  setSelectedLogs(allSelected ? new Set() : new Set(allLogIds));
                }}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                {logs.length > 0 && logs.every(l => selectedLogs.has(l.id))
                  ? <CheckSquare size={15} className="text-indigo-400" />
                  : <Square size={15} />}
              </button>
              <span className="text-xs text-slate-500">
                {selectedLogs.size > 0 ? `${selectedLogs.size} selected` : `${logs.length} sent`}
              </span>
            </div>
            {selectedLogs.size > 0 && (
              <button
                onClick={() => deleteLogs([...selectedLogs])}
                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-red-900/40 hover:bg-red-900/70 text-red-400 rounded-lg border border-red-800 transition-colors"
              >
                <Trash2 size={12} /> Delete {selectedLogs.size}
              </button>
            )}
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1e1e2e] bg-[#0d0d18]">
                <th className="px-4 py-3 w-8"></th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Email</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Company</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Subject</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Sent At</th>
                <th className="px-4 py-3 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a26]">
              {logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">No emails sent yet.</td>
                </tr>
              )}
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-[#13131e] transition-colors">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedLogs(prev => {
                        const next = new Set(prev);
                        next.has(log.id) ? next.delete(log.id) : next.add(log.id);
                        return next;
                      })}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      {selectedLogs.has(log.id)
                        ? <CheckSquare size={14} className="text-indigo-400" />
                        : <Square size={14} />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-200">{log.toName}</td>
                  <td className="px-4 py-3 text-slate-400">{log.toEmail}</td>
                  <td className="px-4 py-3 text-slate-500">{log.contact.company || '—'}</td>
                  <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">{log.subject}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(log.sentAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteLogs([log.id])}
                      className="text-slate-600 hover:text-red-400 transition-colors"
                      title="Delete log"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
