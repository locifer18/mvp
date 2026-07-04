'use client';
import { useState, useCallback, useRef } from 'react';
import {
  Send, CheckSquare, Square, Mail, AlertCircle,
  CheckCircle, XCircle, Loader2, FileText, X,
  Upload, ChevronDown, ChevronUp, Trash2,
} from 'lucide-react';
import { Contact } from '@/types';
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
}

type SendResult = { id: string; name: string; success: boolean; error?: string };

// ── Template Modal ────────────────────────────────────────────────────────────
function TemplateModal({
  subject, template, onSave, onClose,
}: {
  subject: string;
  template: string;
  onSave: (s: string, t: string) => void;
  onClose: () => void;
}) {
  const [s, setS] = useState(subject);
  const [t, setT] = useState(template);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111118] border border-[#2d2d3d] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e2e]">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-indigo-400" />
            <span className="text-sm font-medium text-slate-200">Edit Mail Template</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Subject</label>
            <input
              value={s}
              onChange={e => setS(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#0d0d18] border border-[#2d2d3d] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">
              Body — use <code className="text-indigo-400 bg-[#1e1e2e] px-1 rounded">[First Name]</code> for personalization
            </label>
            <textarea
              value={t}
              onChange={e => setT(e.target.value)}
              rows={20}
              className="w-full px-3 py-2 text-sm bg-[#0d0d18] border border-[#2d2d3d] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 resize-none font-mono leading-relaxed"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#1e1e2e]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(s, t); onClose(); }}
            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
          >
            Save Template
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Import Button (inline, same as contacts tab) ──────────────────────────────
function ImportButton() {
  const ref = useRef<HTMLInputElement>(null);
  const router = useRouter();
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
      if (!res.ok) setError(data.error || 'Import failed.');
      else { setResult(data); router.refresh(); }
    } catch { setError('Failed to read or upload the file.'); }
    finally { setLoading(false); if (ref.current) ref.current.value = ''; }
  }

  return (
    <>
      <input ref={ref} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
      <button
        onClick={() => { setResult(null); setError(null); ref.current?.click(); }}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-[#1e1e2e] hover:bg-[#2a2a3e] text-slate-300 rounded-lg border border-[#2d2d3d] transition-colors disabled:opacity-50"
      >
        <Upload size={14} />
        {loading ? (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 border-2 border-slate-500 border-t-indigo-400 rounded-full animate-spin" />
            Importing...
          </span>
        ) : 'Import CSV'}
      </button>

      {result && (
        <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 bg-[#1a1a2e] border border-green-800 text-slate-200 rounded-xl shadow-2xl p-4 max-w-sm">
          <CheckCircle size={18} className="text-green-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-300">Import Complete</p>
            <p className="text-xs text-slate-400 mt-0.5">{result.message}</p>
          </div>
          <button onClick={() => setResult(null)} className="text-slate-500 hover:text-slate-300"><X size={14} /></button>
        </div>
      )}
      {error && (
        <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 bg-[#1a1a2e] border border-red-800 text-slate-200 rounded-xl shadow-2xl p-4 max-w-sm">
          <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-300">Import Failed</p>
            <p className="text-xs text-slate-400 mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-slate-500 hover:text-slate-300"><X size={14} /></button>
        </div>
      )}
    </>
  );
}

// ── Add Email Modal ──────────────────────────────────────────────────────────
function AddEmailModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (name: string, email: string, company: string) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), company: company.trim() || undefined }),
    });
    if (res.ok) {
      const data = await res.json();
      onAdd(data.name, data.email, data.company);
      onClose();
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111118] border border-[#2d2d3d] rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e2e]">
          <span className="text-sm font-medium text-slate-200">Add Email Contact</span>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe"
              className="w-full px-3 py-2 text-sm bg-[#0d0d18] border border-[#2d2d3d] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Email *</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="john@company.com"
              className="w-full px-3 py-2 text-sm bg-[#0d0d18] border border-[#2d2d3d] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Company</label>
            <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Corp"
              className="w-full px-3 py-2 text-sm bg-[#0d0d18] border border-[#2d2d3d] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#1e1e2e]">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || !email.trim()}
            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {saving && <Loader2 size={12} className="animate-spin" />} Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MailPageComponent({ contacts, sentToday, remaining, limit, logs: initialLogs }: Props) {
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState<string | null>(null);
  const [results, setResults] = useState<SendResult[]>([]);
  const [logs, setLogs] = useState<MailLog[]>(initialLogs);
  const [todayCount, setTodayCount] = useState(sentToday);
  const [sentExpanded, setSentExpanded] = useState(false);
  const [localContacts, setLocalContacts] = useState<Contact[]>(contacts);

  const eligible = localContacts.filter(c => c.email);
  const sentEmailSet = new Set(logs.map(l => l.toEmail));

  const unsent = eligible.filter(c => !sentEmailSet.has(c.email!));
  const sent   = eligible.filter(c => sentEmailSet.has(c.email!));

  const allUnsentSelected = unsent.length > 0 && unsent.every(c => selected.has(c.id));

  function toggleAll() {
    if (allUnsentSelected) setSelected(new Set());
    else setSelected(new Set(unsent.map(c => c.id)));
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function refreshLogs() {
    const res = await fetch('/api/mail/send');
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setTodayCount(data.sentToday);
    }
  }

  const [deleting, setDeleting] = useState<Set<string>>(new Set());

  async function deleteOne(id: string) {
    setDeleting(prev => { const n = new Set(prev); n.add(id); return n; });
    if (!id.startsWith('local-')) await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
    setLocalContacts(prev => prev.filter(c => c.id !== id));
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    setDeleting(prev => { const n = new Set(prev); n.delete(id); return n; });
  }

  async function deleteSelected() {
    await Promise.all([...selected].map(id => deleteOne(id)));
  }

  const sendMails = useCallback(async (contactIds: string[], key: string) => {
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
    if (!res.ok) setResults([{ id: '', name: '', success: false, error: data.error }]);
    else { setResults(data.results); setTodayCount(prev => prev + data.sent); await refreshLogs(); }
    setSending(null);
    setSelected(new Set());
  }, [eligible, subject, template]);

  return (
    <div className="p-6 space-y-5">
      {showTemplateModal && (
        <TemplateModal
          subject={subject}
          template={template}
          onSave={(s, t) => { setSubject(s); setTemplate(t); }}
          onClose={() => setShowTemplateModal(false)}
        />
      )}
      {showAddModal && (
        <AddEmailModal
          onClose={() => setShowAddModal(false)}
          onAdd={(name, email, company) => {
            const fake: Contact = {
              id: `local-${Date.now()}`, name, email, company: company || null,
              status: 'NEW', priority: 'MEDIUM', tags: [], followUpCount: 0,
              createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            };
            setLocalContacts(prev => [fake, ...prev]);
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Mail</h1>
          <p className="text-sm text-slate-500 mt-1">Send outreach emails directly from your Gmail</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Import CSV */}
          <ImportButton />

          {/* Add single email */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
          >
            + Add Email
          </button>

          {/* Template button */}
          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-[#1e1e2e] hover:bg-[#2a2a3e] text-slate-300 rounded-lg border border-[#2d2d3d] transition-colors"
          >
            <FileText size={14} /> Mail Template
          </button>

          {/* Daily quota */}
          <div className="flex items-center gap-3 bg-[#111118] border border-[#1e1e2e] rounded-xl px-4 py-2">
            <Mail size={14} className="text-indigo-400" />
            <div>
              <div className="text-xs text-slate-500">Sent today</div>
              <div className="text-sm font-semibold text-slate-100">{todayCount} / {limit}</div>
            </div>
            <div className="w-16 h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${Math.min((todayCount / limit) * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs text-slate-500">{Math.max(limit - todayCount, 0)} left</span>
          </div>
        </div>
      </div>

      {/* Send results */}
      {results.length > 0 && (
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Last Send Results</h3>
          <div className="space-y-1 max-h-36 overflow-y-auto">
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

      {/* Unsent contacts */}
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden">
        {/* Bulk bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2e]">
          <div className="flex items-center gap-3">
            <button onClick={toggleAll} className="text-slate-400 hover:text-slate-200 transition-colors">
              {allUnsentSelected
                ? <CheckSquare size={15} className="text-indigo-400" />
                : <Square size={15} />
              }
            </button>
            <span className="text-xs text-slate-400 font-medium">
              Contacts to Send ({unsent.length})
            </span>
            {selected.size > 0 && (
              <span className="text-xs text-slate-500">{selected.size} selected</span>
            )}
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => sendMails([...selected], 'bulk')}
                disabled={sending === 'bulk' || todayCount >= limit}
                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {sending === 'bulk' ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                Send to {selected.size}
              </button>
              <button
                onClick={deleteSelected}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-900/40 hover:bg-red-900/70 text-red-400 rounded-lg border border-red-800 transition-colors"
              >
                <Trash2 size={12} /> Delete {selected.size}
              </button>
            </div>
          )}
        </div>

        <div className="divide-y divide-[#1a1a26] max-h-[480px] overflow-y-auto">
          {unsent.length === 0 && (
            <div className="px-4 py-10 text-center text-slate-500 text-sm">
              {eligible.length === 0
                ? 'No contacts with email addresses. Import a CSV to get started.'
                : 'All contacts have been sent emails! 🎉'
              }
            </div>
          )}
          {unsent.map(c => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#13131e] transition-colors">
              <button onClick={() => toggleOne(c.id)} className="text-slate-400 hover:text-slate-200 shrink-0">
                {selected.has(c.id)
                  ? <CheckSquare size={14} className="text-indigo-400" />
                  : <Square size={14} />
                }
              </button>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-slate-200 truncate block">{c.name}</span>
                <span className="text-xs text-slate-500 truncate block">{c.email}</span>
                {c.company && <span className="text-xs text-slate-600 truncate block">{c.company}</span>}
              </div>
              <button
                onClick={() => sendMails([c.id], c.id)}
                disabled={!!sending || todayCount >= limit}
                title={todayCount >= limit ? 'Daily limit reached' : `Send to ${c.name}`}
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#1e1e2e] hover:bg-indigo-600/30 hover:text-indigo-300 text-slate-400 rounded-lg border border-[#2d2d3d] hover:border-indigo-700 transition-colors disabled:opacity-40"
              >
                {sending === c.id ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                Send
              </button>
              <button
                onClick={() => deleteOne(c.id)}
                disabled={deleting.has(c.id)}
                title="Delete contact"
                className="shrink-0 p-1.5 text-slate-600 hover:text-red-400 hover:bg-[#1e1e2e] rounded transition-colors disabled:opacity-40"
              >
                {deleting.has(c.id) ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
              </button>
            </div>
          ))}
        </div>

        {todayCount >= limit && (
          <div className="px-4 py-2.5 border-t border-[#1e1e2e] flex items-center gap-2 bg-yellow-950/20">
            <AlertCircle size={12} className="text-yellow-500" />
            <span className="text-xs text-yellow-400">Daily limit of {limit} reached. Resets at midnight.</span>
          </div>
        )}
      </div>

      {/* Sent section */}
      {sent.length > 0 && (
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden">
          <button
            onClick={() => setSentExpanded(p => !p)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#13131e] transition-colors"
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-green-400" />
              <span className="text-sm font-medium text-slate-300">Sent ({sent.length})</span>
              <span className="text-xs text-slate-500">— already emailed</span>
            </div>
            {sentExpanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
          </button>

          {sentExpanded && (
            <div className="divide-y divide-[#1a1a26] border-t border-[#1e1e2e] max-h-72 overflow-y-auto">
              {sent.map(c => {
                const log = logs.find(l => l.toEmail === c.email);
                return (
                  <div key={c.id} className="flex items-center gap-3 px-4 py-2.5 opacity-70">
                    <CheckCircle size={13} className="text-green-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-300 truncate">{c.name}</span>
                        <span className="text-[10px] px-1.5 py-0 bg-green-900/40 text-green-400 border border-green-800 rounded leading-5 shrink-0">Sent</span>
                      </div>
                      <span className="text-xs text-slate-500 truncate block">{c.email}</span>
                      {c.company && <span className="text-xs text-slate-600 truncate block">{c.company}</span>}
                    </div>
                    {log && (
                      <span className="text-[11px] text-slate-600 shrink-0">
                        {new Date(log.sentAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
