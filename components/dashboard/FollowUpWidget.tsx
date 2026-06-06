import Link from 'next/link';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { format, formatDistanceToNowStrict, isToday } from 'date-fns';

interface Contact {
  id: string;
  name: string;
  company?: string | null;
  followUpDate?: string | Date | null;
  followUpCount?: number;
  status: string;
}

export default function FollowUpWidget({ contacts }: { contacts: Contact[] }) {
  return (
    <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4">
      <h2 className="text-sm font-medium text-slate-300 mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <AlertCircle size={14} className="text-yellow-400" /> Needs Follow-Up
        </span>
        {contacts.length > 0 && (
          <span className="text-xs bg-yellow-900/50 text-yellow-400 border border-yellow-800 px-2 py-0.5 rounded-full">
            {contacts.length}
          </span>
        )}
      </h2>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {contacts.length === 0 && (
          <div className="py-6 text-center">
            <AlertCircle size={20} className="text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">All caught up.</p>
          </div>
        )}
        {contacts.map(c => {
          const date = c.followUpDate ? new Date(c.followUpDate) : null;
          const overdueTxt = date
            ? isToday(date)
              ? 'Today'
              : `${formatDistanceToNowStrict(date, { addSuffix: false })} ago`
            : null;

          return (
            <Link
              key={c.id}
              href={`/contacts/${c.id}`}
              className="flex items-start justify-between p-2.5 rounded-lg hover:bg-[#1a1a2e] transition-colors group border border-transparent hover:border-[#2d2d3d]"
            >
              <div className="min-w-0">
                <p className="text-sm text-slate-200 group-hover:text-white font-medium truncate">
                  {c.name}
                </p>
                {c.company && (
                  <p className="text-xs text-slate-500 truncate">{c.company}</p>
                )}
                {date && (
                  <p className="text-xs text-yellow-600 mt-0.5">
                    Due {format(date, 'MMM d')} · {overdueTxt}
                  </p>
                )}
              </div>
              {(c.followUpCount ?? 0) > 0 && (
                <span className={`ml-2 shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] rounded border leading-4 ${
                  (c.followUpCount ?? 0) >= 2
                    ? 'bg-orange-900/50 text-orange-300 border-orange-700'
                    : 'bg-blue-900/50 text-blue-300 border-blue-700'
                }`}>
                  <RefreshCw size={8} /> FU #{c.followUpCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {contacts.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#1e1e2e]">
          <Link
            href="/contacts?status=AWAITING_RESPONSE"
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View all awaiting →
          </Link>
        </div>
      )}
    </div>
  );
}
