'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

const TYPES = [
  { value: 'MESSAGE_SENT', label: 'Message Sent' },
  { value: 'FOLLOW_UP_SCHEDULED', label: 'Follow-Up Scheduled' },
  { value: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled' },
  { value: 'OFFER_RECEIVED', label: 'Offer Received' },
  { value: 'NOTE_ADDED', label: 'Note Added' },
];

export default function LogActivityForm({ contactId }: { contactId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('MESSAGE_SENT');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setLoading(true);
    await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId, type, description }),
    });
    setDescription('');
    setOpen(false);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Log Activity
        </h2>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
        >
          <Plus size={12} /> {open ? 'Cancel' : 'Add'}
        </button>
      </div>
      {open && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            placeholder="Describe what happened..."
            className="w-full px-3 py-2 text-sm bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
          />
          <button
            type="submit"
            disabled={loading || !description.trim()}
            className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging...' : 'Log Activity'}
          </button>
        </form>
      )}
    </div>
  );
}