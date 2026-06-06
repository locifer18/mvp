'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { Contact, Activity } from '@/types';
import {
  Pencil, Trash2, ExternalLink, Mail, Phone,
  Building, Briefcase, Tag, Calendar, Clock,
} from 'lucide-react';
import { useState } from 'react';
import LogActivityForm from './LogActivityForm';

export default function ContactDetail({
  contact,
}: {
  contact: Contact & { activities: Activity[] };
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('Delete this contact?')) return;
    setDeleting(true);
    await fetch(`/api/contacts/${contact.id}`, { method: 'DELETE' });
    router.push('/contacts');
    router.refresh();
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">{contact.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {contact.company && (
              <span className="text-sm text-slate-400">{contact.company}</span>
            )}
            {contact.jobProfile && (
              <span className="text-sm text-slate-500">· {contact.jobProfile}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/contacts/${contact.id}/edit`}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-[#1e1e2e] hover:bg-[#2a2a3e] text-slate-300 rounded-lg border border-[#2d2d3d] transition-colors"
          >
            <Pencil size={13} /> Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-[#1e1e2e] hover:bg-red-900/40 text-slate-300 hover:text-red-300 rounded-lg border border-[#2d2d3d] transition-colors disabled:opacity-50"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Contact Info
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div><StatusBadge status={contact.status} /></div>
              <div><PriorityBadge priority={contact.priority} /></div>
              {contact.email && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Mail size={13} className="text-slate-500" />
                  <a href={`mailto:${contact.email}`} className="hover:text-indigo-300">
                    {contact.email}
                  </a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Phone size={13} className="text-slate-500" /> {contact.phone}
                </div>
              )}
              {contact.company && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Building size={13} className="text-slate-500" /> {contact.company}
                </div>
              )}
              {contact.platform && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Briefcase size={13} className="text-slate-500" /> {contact.platform}
                </div>
              )}
              {contact.followUpDate && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Calendar size={13} className="text-slate-500" />
                  Follow-up: {format(new Date(contact.followUpDate), 'MMM d, yyyy')}
                </div>
              )}
              {contact.lastContactedAt && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Clock size={13} className="text-slate-500" />
                  Last contacted: {format(new Date(contact.lastContactedAt), 'MMM d, yyyy')}
                </div>
              )}
            </div>
            {contact.profileLink && (
              <a
                href={contact.profileLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 mt-3"
              >
                <ExternalLink size={12} /> View Profile
              </a>
            )}
            {contact.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mt-3">
                <Tag size={12} className="text-slate-500" />
                {contact.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 text-xs bg-[#1e1e2e] text-slate-400 rounded">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {contact.notes && (
            <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Notes
              </h2>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}

          <LogActivityForm contactId={contact.id} />
        </div>

        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Activity Timeline
          </h2>
          <div className="space-y-0">
            {contact.activities.length === 0 && (
              <p className="text-xs text-slate-500">No activity yet.</p>
            )}
            {contact.activities.map((a, i) => (
              <div key={a.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  {i < contact.activities.length - 1 && (
                    <div className="w-px flex-1 bg-[#2d2d3d] my-1" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="text-xs text-slate-300 leading-snug">{a.description}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}