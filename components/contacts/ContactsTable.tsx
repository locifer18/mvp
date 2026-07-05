'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { format, isPast, isToday } from 'date-fns';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { Trash2, ChevronUp, ChevronDown, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';
import { STATUSES, PRIORITIES, PLATFORMS, STATUS_LABELS } from '@/lib/utils';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Contact } from '@/types';
import ImportButton from './ImportButton';

interface Props {
  data: {
    contacts: Contact[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  searchParams: Record<string, string | undefined>;
}

// ── Editable text cell ────────────────────────────────────────────────────────
function EditableCell({
  value, onSave, placeholder = '—', type = 'text', className = '',
}: {
  value: string | null | undefined;
  onSave: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  // draft is only used while editing; initialised on click, not via effect
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function startEdit() {
    setDraft(value || '');
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    if (draft !== (value || '')) onSave(draft);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
        className={`w-full px-1.5 py-0.5 text-xs bg-[#0d0d1a] border border-indigo-500 rounded text-slate-100 outline-none min-w-[80px] ${className}`}
      />
    );
  }
  return (
    <span
      onClick={startEdit}
      className={`block cursor-text px-1 py-0.5 rounded hover:bg-[#1e1e2e] transition-colors min-h-[22px] text-xs leading-5 ${className}`}
    >
      {value || <span className="text-slate-600 italic">{placeholder}</span>}
    </span>
  );
}

// ── Select dropdown cell ──────────────────────────────────────────────────────
function SelectCell({
  value, options, onSave, renderValue, emptyLabel,
}: {
  value: string;
  options: readonly string[] | string[];
  onSave: (v: string) => void;
  renderValue?: (v: string) => React.ReactNode;
  emptyLabel?: string;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  if (editing) {
    return (
      <select
        ref={ref}
        defaultValue={value}
        autoFocus
        onChange={e => { onSave(e.target.value); setEditing(false); }}
        onBlur={() => setEditing(false)}
        className="px-1.5 py-0.5 text-xs bg-[#0d0d1a] border border-indigo-500 rounded text-slate-200 outline-none cursor-pointer w-full"
      >
        {emptyLabel && <option value="">{emptyLabel}</option>}
        {options.map(o => (
          <option key={o} value={o}>{STATUS_LABELS[o] || o || emptyLabel || '—'}</option>
        ))}
      </select>
    );
  }
  return (
    <span
      onClick={() => setEditing(true)}
      className="cursor-pointer block min-h-[22px]"
    >
      {renderValue ? renderValue(value) : (
        <span className="text-xs text-slate-400 px-1 py-0.5 rounded hover:bg-[#1e1e2e] transition-colors block">
          {value || <span className="text-slate-600 italic">—</span>}
        </span>
      )}
    </span>
  );
}

// ── Date cell ─────────────────────────────────────────────────────────────────
function DateCell({ value, onSave, highlight }: {
  value: string | null | undefined;
  onSave: (v: string | null) => void;
  highlight?: 'overdue' | 'today' | null;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const dateVal = value ? new Date(value).toISOString().split('T')[0] : '';

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  const colorClass =
    highlight === 'overdue' ? 'text-red-400' :
    highlight === 'today'   ? 'text-yellow-400' :
                              'text-slate-400';

  if (editing) {
    return (
      <input
        ref={ref}
        type="date"
        defaultValue={dateVal}
        onBlur={e => { setEditing(false); onSave(e.target.value || null); }}
        onKeyDown={e => { if (e.key === 'Escape') setEditing(false); }}
        className="px-1.5 py-0.5 text-xs bg-[#0d0d1a] border border-indigo-500 rounded text-slate-200 outline-none"
      />
    );
  }
  return (
    <span
      onClick={() => setEditing(true)}
      className={`block cursor-text px-1 py-0.5 rounded hover:bg-[#1e1e2e] transition-colors min-h-[22px] text-xs ${colorClass}`}
    >
      {value
        ? format(new Date(value), 'MMM d, yy')
        : <span className="text-slate-600 italic">—</span>
      }
    </span>
  );
}

// ── Tags cell ─────────────────────────────────────────────────────────────────
function TagsCell({ value, onSave }: { value: string[]; onSave: (v: string[]) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  function startEdit() {
    setDraft(value.join(', '));
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    const tags = draft.split(/[,;]/).map(t => t.trim()).filter(Boolean);
    onSave(tags);
  }

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
        placeholder="tag1, tag2"
        className="w-full px-1.5 py-0.5 text-xs bg-[#0d0d1a] border border-indigo-500 rounded text-slate-100 outline-none min-w-[80px]"
      />
    );
  }
  return (
    <span
      onClick={startEdit}
      className="flex flex-wrap gap-1 cursor-text min-h-[22px] px-1 py-0.5 rounded hover:bg-[#1e1e2e] transition-colors"
    >
      {value.length > 0
        ? value.map(t => (
            <span key={t} className="px-1.5 py-0 text-[10px] bg-[#2a2a3e] text-slate-400 rounded leading-5">
              {t}
            </span>
          ))
        : <span className="text-slate-600 italic text-xs">—</span>
      }
    </span>
  );
}

// ── Follow-up count badge ─────────────────────────────────────────────────────
function FollowUpBadge({ count, status }: { count: number; status: string }) {
  if (count === 0) return <span className="text-slate-600 text-xs italic">—</span>;
  const isLost = status === 'LOST';
  const color =
    count >= 3   ? 'bg-red-900/60 text-red-300 border-red-700' :
    count === 2  ? 'bg-orange-900/60 text-orange-300 border-orange-700' :
                   'bg-blue-900/60 text-blue-300 border-blue-700';
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0 text-[10px] rounded border leading-5 ${color}`}>
      <RefreshCw size={9} />
      FU #{count}
      {count >= 3 && !isLost && <AlertCircle size={9} className="text-red-400" />}
    </span>
  );
}

// ── Main table ────────────────────────────────────────────────────────────────
export default function ContactsTable({ data, searchParams }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [rows, setRows] = useState<Contact[]>(data.contacts);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  // Sync local rows whenever server data changes (e.g. after navigation or refresh).
  // Using a ref to track the previous key avoids calling setRows inside a useEffect
  // (which triggers the ESLint "cascading render" warning).
  const prevKeyRef = useRef<string | null>(null);
  const contactsKey = data.contacts.map(c => `${c.id}:${c.updatedAt}`).join('|');
  if (prevKeyRef.current !== contactsKey) {
    prevKeyRef.current = contactsKey;
    // Safe: called during render before commit, React batches this correctly
    // (equivalent to getDerivedStateFromProps pattern)
    if (rows !== data.contacts) setRows(data.contacts);
  }

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { ...searchParams, ...overrides };
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v); });
    return `${pathname}?${params.toString()}`;
  }

  function SortIcon({ field }: { field: string }) {
    if (searchParams.sort !== field) return <ChevronUp size={11} className="text-slate-600" />;
    return searchParams.order === 'asc'
      ? <ChevronUp size={11} className="text-indigo-400" />
      : <ChevronDown size={11} className="text-indigo-400" />;
  }

  function sortUrl(field: string) {
    const order = searchParams.sort === field && searchParams.order === 'asc' ? 'desc' : 'asc';
    return buildUrl({ sort: field, order, page: '1' });
  }

  const updateField = useCallback(async (id: string, patch: Partial<Contact>) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    setSaving(id);
    const contact = rows.find(r => r.id === id)!;
    const updated = { ...contact, ...patch };

    const payload = {
      name:            updated.name,
      email:           updated.email || '',
      phone:           updated.phone || '',
      company:         updated.company || '',
      jobProfile:      updated.jobProfile || '',
      platform:        updated.platform || '',
      profileLink:     updated.profileLink || '',
      status:          updated.status,
      priority:        updated.priority,
      tags:            updated.tags || [],
      notes:           updated.notes || '',
      followUpDate:    updated.followUpDate
        ? new Date(updated.followUpDate).toISOString().split('T')[0]
        : null,
      lastContactedAt: updated.lastContactedAt
        ? new Date(updated.lastContactedAt).toISOString().split('T')[0]
        : null,
    };

    const res = await fetch(`/api/contacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const serverData = await res.json();
      setRows(prev => prev.map(r => r.id === id ? { ...r, ...serverData } : r));
    }
    setSaving(null);
    router.refresh();
  }, [rows, router]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this contact?')) return;
    setDeleting(id);
    await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
    setRows(prev => prev.filter(r => r.id !== id));
    setDeleting(null);
    router.refresh();
  }

  function getFollowUpHighlight(c: Contact): 'overdue' | 'today' | null {
    if (!c.followUpDate) return null;
    const d = new Date(c.followUpDate);
    if (isToday(d)) return 'today';
    if (isPast(d)) return 'overdue';
    return null;
  }

  const needsFollowUp = (c: Contact) =>
    c.status === 'AWAITING_RESPONSE' &&
    c.followUpDate &&
    isPast(new Date(c.followUpDate));

  const cols = [
    { label: 'Name',         field: 'name' },
    { label: 'Email',        field: 'email' },
    { label: 'Phone',        field: 'phone' },
    { label: 'Company',      field: 'company' },
    { label: 'Role',         field: 'jobProfile' },
    { label: 'Platform',     field: 'platform' },
    { label: 'Profile',      field: 'profileLink' },
    { label: 'Status',       field: 'status' },
    { label: 'Priority',     field: 'priority' },
    { label: 'FU #',         field: 'followUpCount' },
    { label: 'Follow Up',    field: 'followUpDate' },
    { label: 'Last Contact', field: 'lastContactedAt' },
    { label: 'Tags',         field: 'tags' },
    { label: 'Notes',        field: 'notes' },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Search name, company, email..."
          defaultValue={searchParams.search || ''}
          onChange={e => {
            const w = window as unknown as Record<string, ReturnType<typeof setTimeout>>;
            clearTimeout(w.__searchTimer);
            w.__searchTimer = setTimeout(
              () => router.push(buildUrl({ search: e.target.value || undefined, page: '1' })),
              350
            );
          }}
          className="flex-1 min-w-48 px-3 py-2 text-sm bg-[#111118] border border-[#2d2d3d] rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <select
          value={searchParams.status || ''}
          onChange={e => router.push(buildUrl({ status: e.target.value || undefined, page: '1' }))}
          className="px-3 py-2 text-sm bg-[#111118] border border-[#2d2d3d] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select
          value={searchParams.priority || ''}
          onChange={e => router.push(buildUrl({ priority: e.target.value || undefined, page: '1' }))}
          className="px-3 py-2 text-sm bg-[#111118] border border-[#2d2d3d] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={searchParams.platform || ''}
          onChange={e => router.push(buildUrl({ platform: e.target.value || undefined, page: '1' }))}
          className="px-3 py-2 text-sm bg-[#111118] border border-[#2d2d3d] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Platforms</option>
          {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <ImportButton />
        <span className="text-xs text-slate-600 hidden lg:block">Click any cell to edit</span>
      </div>

      {/* Table */}
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1e1e2e] bg-[#0d0d18]">
                {cols.map(col => (
                  <th key={col.field} className="text-left px-3 py-2.5 font-medium text-slate-500 whitespace-nowrap">
                    <Link href={sortUrl(col.field)} className="flex items-center gap-1 hover:text-slate-300">
                      {col.label} <SortIcon field={col.field} />
                    </Link>
                  </th>
                ))}
                <th className="px-3 py-2.5 font-medium text-slate-500 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a26]">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={16} className="px-4 py-10 text-center text-slate-500">
                    No contacts found.
                  </td>
                </tr>
              )}
              {rows.map(c => {
                const fuHighlight = getFollowUpHighlight(c);
                const overdue = needsFollowUp(c);
                return (
                  <tr
                    key={c.id}
                    className={`transition-colors ${
                      overdue ? 'bg-yellow-950/20 hover:bg-yellow-950/30' : 'hover:bg-[#13131e]'
                    } ${saving === c.id ? 'opacity-60' : ''}`}
                  >
                    {/* Name */}
                    <td className="px-3 py-1.5 min-w-[130px]">
                      <div className="flex items-center gap-1">
                        {overdue && (
                          <span title="Needs follow-up">
                            <AlertCircle size={11} className="text-yellow-500 shrink-0" />
                          </span>
                        )}
                        <EditableCell
                          value={c.name}
                          onSave={v => v.trim() && updateField(c.id, { name: v.trim() })}
                          className="font-medium text-slate-200"
                        />
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-3 py-1.5 min-w-[150px]">
                      <EditableCell
                        value={c.email}
                        onSave={v => updateField(c.id, { email: v || null })}
                        placeholder="email"
                        type="email"
                        className="text-slate-400"
                      />
                    </td>

                    {/* Phone */}
                    <td className="px-3 py-1.5 min-w-[110px]">
                      <EditableCell
                        value={c.phone}
                        onSave={v => updateField(c.id, { phone: v || null })}
                        placeholder="phone"
                        type="tel"
                        className="text-slate-400"
                      />
                    </td>

                    {/* Company */}
                    <td className="px-3 py-1.5 min-w-[120px]">
                      <EditableCell
                        value={c.company}
                        onSave={v => updateField(c.id, { company: v || null })}
                        className="text-slate-300"
                      />
                    </td>

                    {/* Job Profile */}
                    <td className="px-3 py-1.5 min-w-[120px]">
                      <EditableCell
                        value={c.jobProfile}
                        onSave={v => updateField(c.id, { jobProfile: v || null })}
                        className="text-slate-400"
                      />
                    </td>

                    {/* Platform */}
                    <td className="px-3 py-1.5 min-w-[100px]">
                      <SelectCell
                        value={c.platform || ''}
                        options={PLATFORMS}
                        emptyLabel="— pick —"
                        onSave={v => updateField(c.id, { platform: v || null })}
                        renderValue={v => (
                          <span className="text-slate-400 px-1 py-0.5 rounded hover:bg-[#1e1e2e] cursor-pointer transition-colors block min-h-[22px] text-xs">
                            {v || <span className="text-slate-600 italic">—</span>}
                          </span>
                        )}
                      />
                    </td>

                    {/* Profile Link */}
                    <td className="px-3 py-1.5 min-w-[90px]">
                      {c.profileLink ? (
                        <div className="flex items-center gap-1">
                          <a
                            href={c.profileLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                          >
                            <ExternalLink size={11} /> Link
                          </a>
                        </div>
                      ) : (
                        <EditableCell
                          value={c.profileLink}
                          onSave={v => updateField(c.id, { profileLink: v || null })}
                          placeholder="add url"
                          className="text-slate-600"
                        />
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-1.5 min-w-[130px]">
                      <SelectCell
                        value={c.status}
                        options={STATUSES}
                        onSave={v => updateField(c.id, { status: v as Contact['status'] })}
                        renderValue={v => <StatusBadge status={v} />}
                      />
                    </td>

                    {/* Priority */}
                    <td className="px-3 py-1.5 min-w-[80px]">
                      <SelectCell
                        value={c.priority}
                        options={PRIORITIES}
                        onSave={v => updateField(c.id, { priority: v as Contact['priority'] })}
                        renderValue={v => <PriorityBadge priority={v} />}
                      />
                    </td>

                    {/* Follow-Up Count */}
                    <td className="px-3 py-1.5 min-w-[70px]">
                      <FollowUpBadge count={c.followUpCount} status={c.status} />
                    </td>

                    {/* Follow Up Date */}
                    <td className="px-3 py-1.5 min-w-[100px]">
                      <DateCell
                        value={c.followUpDate}
                        onSave={v => updateField(c.id, { followUpDate: v })}
                        highlight={fuHighlight}
                      />
                    </td>

                    {/* Last Contacted */}
                    <td className="px-3 py-1.5 min-w-[100px]">
                      <DateCell
                        value={c.lastContactedAt}
                        onSave={v => updateField(c.id, { lastContactedAt: v })}
                      />
                    </td>

                    {/* Tags */}
                    <td className="px-3 py-1.5 min-w-[120px]">
                      <TagsCell
                        value={c.tags}
                        onSave={v => updateField(c.id, { tags: v })}
                      />
                    </td>

                    {/* Notes */}
                    <td className="px-3 py-1.5 min-w-[160px] max-w-[220px]">
                      <EditableCell
                        value={c.notes}
                        onSave={v => updateField(c.id, { notes: v || null })}
                        placeholder="add note..."
                        className="text-slate-400 truncate"
                      />
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/contacts/${c.id}`}
                          className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-[#1e1e2e] rounded transition-colors"
                          title="View full details"
                        >
                          <ExternalLink size={12} />
                        </Link>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deleting === c.id}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-[#1e1e2e] rounded transition-colors disabled:opacity-50"
                          title="Delete contact"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[#1e1e2e] flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page {data.page} of {data.totalPages} · {data.total} total
            </span>
            <div className="flex gap-2">
              {data.page > 1 && (
                <Link href={buildUrl({ page: String(data.page - 1) })} className="px-3 py-1 text-xs bg-[#1e1e2e] text-slate-300 rounded hover:bg-[#2a2a3e]">
                  Prev
                </Link>
              )}
              {data.page < data.totalPages && (
                <Link href={buildUrl({ page: String(data.page + 1) })} className="px-3 py-1 text-xs bg-[#1e1e2e] text-slate-300 rounded hover:bg-[#2a2a3e]">
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
