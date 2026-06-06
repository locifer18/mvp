import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { StatusBadge } from '@/components/ui/Badge';

interface Contact {
  id: string;
  name: string;
  company?: string | null;
  followUpDate?: string | Date | null;
  status: string;
  followUpCount?: number;
}

export default function UpcomingFollowUps({ contacts }: { contacts: Contact[] }) {
  return (
    <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4">
      <h2 className="text-sm font-medium text-slate-300 mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Calendar size={14} className="text-indigo-400" /> Upcoming Follow-Ups
        </span>
        {contacts.length > 0 && (
          <span className="text-xs bg-indigo-900/40 text-indigo-400 border border-indigo-800 px-2 py-0.5 rounded-full">
            {contacts.length}
          </span>
        )}
      </h2>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {contacts.length === 0 && (
          <div className="py-6 text-center">
            <Calendar size={20} className="text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No upcoming follow-ups.</p>
          </div>
        )}
        {contacts.map(c => {
          const date = c.followUpDate ? new Date(c.followUpDate) : null;
          const daysUntil = date
            ? formatDistanceToNowStrict(date, { addSuffix: false })
            : null;

          return (
            <Link
              key={c.id}
              href={`/contacts/${c.id}`}
              className="flex items-start justify-between p-2.5 rounded-lg hover:bg-[#1a1a2e] transition-colors group border border-transparent hover:border-[#2d2d3d]"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm text-slate-200 group-hover:text-white font-medium truncate">
                    {c.name}
                  </p>
                  <StatusBadge status={c.status} />
                </div>
                {c.company && (
                  <p className="text-xs text-slate-500 truncate mt-0.5">{c.company}</p>
                )}
              </div>
              <div className="ml-2 shrink-0 text-right">
                {date && (
                  <>
                    <p className="text-xs text-slate-300">{format(date, 'MMM d')}</p>
                    <p className="text-[11px] text-indigo-400">in {daysUntil}</p>
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {contacts.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#1e1e2e]">
          <Link
            href="/contacts?sort=followUpDate&order=asc"
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View all by follow-up date →
          </Link>
        </div>
      )}
    </div>
  );
}
