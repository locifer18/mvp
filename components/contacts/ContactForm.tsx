'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PLATFORMS, STATUSES, PRIORITIES, STATUS_LABELS } from '@/lib/utils';
import { Contact } from '@/types';

export default function ContactForm({ contact }: { contact?: Contact }) {
  const router = useRouter();
  const isEdit = Boolean(contact);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {};
    fd.forEach((v, k) => { body[k] = v; });
    body.tags = body.tags
      ? String(body.tags).split(',').map((t: string) => t.trim()).filter(Boolean)
      : [];
    body.followUpDate = body.followUpDate || null;
    body.lastContactedAt = body.lastContactedAt || null;
    body.email = body.email || '';
    body.profileLink = body.profileLink || '';

    const url = isEdit ? `/api/contacts/${contact!.id}` : '/api/contacts';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/contacts/${data.id}`);
      router.refresh();
    } else {
      const err = await res.json();
      setErrors(err.error?.fieldErrors || {});
    }
    setLoading(false);
  }

  function Field({
    label, name, type = 'text', required = false,
  }: { label: string; name: string; type?: string; required?: boolean }) {
    return (
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <input
          type={type}
          name={name}
          defaultValue={(contact?.[name as keyof Contact] as string) || ''}
          required={required}
          className="w-full px-3 py-2 text-sm bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        {errors[name]?.map(e => (
          <p key={e} className="text-xs text-red-400 mt-1">{e}</p>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5 space-y-4">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Basic Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name" name="name" required />
          <Field label="Email" name="email" type="email" />
          <Field label="Phone" name="phone" type="tel" />
          <Field label="Company" name="company" />
          <Field label="Job Profile / Role" name="jobProfile" />
          <Field label="Profile Link" name="profileLink" type="url" />
        </div>
      </div>

      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5 space-y-4">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outreach</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Platform</label>
            <select
              name="platform"
              defaultValue={contact?.platform || ''}
              className="w-full px-3 py-2 text-sm bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select platform</option>
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
            <select
              name="status"
              defaultValue={contact?.status || 'NEW'}
              className="w-full px-3 py-2 text-sm bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Priority</label>
            <select
              name="priority"
              defaultValue={contact?.priority || 'MEDIUM'}
              className="w-full px-3 py-2 text-sm bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Follow-Up Date</label>
            <input
              type="date"
              name="followUpDate"
              defaultValue={
                contact?.followUpDate
                  ? new Date(contact.followUpDate).toISOString().split('T')[0]
                  : ''
              }
              className="w-full px-3 py-2 text-sm bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Last Contacted</label>
            <input
              type="date"
              name="lastContactedAt"
              defaultValue={
                contact?.lastContactedAt
                  ? new Date(contact.lastContactedAt).toISOString().split('T')[0]
                  : ''
              }
              className="w-full px-3 py-2 text-sm bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              name="tags"
              defaultValue={contact?.tags?.join(', ') || ''}
              placeholder="recruiter, startup, urgent"
              className="w-full px-3 py-2 text-sm bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5 space-y-2">
        <label className="block text-xs font-medium text-slate-400">Notes</label>
        <textarea
          name="notes"
          defaultValue={contact?.notes || ''}
          rows={4}
          placeholder="Add notes about this contact..."
          className="w-full px-3 py-2 text-sm bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
        >
          {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Contact'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 text-sm bg-[#1e1e2e] hover:bg-[#2a2a3e] text-slate-300 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}