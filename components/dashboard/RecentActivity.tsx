import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  UserPlus, MessageSquare, RefreshCw,
  Calendar, Gift, FileText, Activity,
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  createdAt: string | Date;
  contact: { name: string; company?: string | null; deletedAt?: Date | null };
  contactId: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  CONTACT_CREATED:    { icon: UserPlus,       color: 'text-indigo-400' },
  MESSAGE_SENT:       { icon: MessageSquare,  color: 'text-blue-400'   },
  STATUS_UPDATED:     { icon: RefreshCw,      color: 'text-yellow-400' },
  FOLLOW_UP_SCHEDULED:{ icon: Calendar,       color: 'text-cyan-400'   },
  INTERVIEW_SCHEDULED:{ icon: Calendar,       color: 'text-purple-400' },
  OFFER_RECEIVED:     { icon: Gift,           color: 'text-orange-400' },
  NOTE_ADDED:         { icon: FileText,       color: 'text-slate-400'  },
};

export default function RecentActivity({ activities }: { activities: ActivityItem[] }) {
  return (
    <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4">
      <h2 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
        <Activity size={14} className="text-indigo-400" /> Recent Activity
      </h2>

      <div className="space-y-0">
        {activities.length === 0 && (
          <div className="py-6 text-center">
            <Activity size={20} className="text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No activity yet.</p>
          </div>
        )}
        {activities.map((a, i) => {
          const cfg = TYPE_CONFIG[a.type] || { icon: Activity, color: 'text-slate-400' };
          const Icon = cfg.icon;
          return (
            <div key={a.id} className="flex gap-3">
              {/* Timeline line + icon */}
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full bg-[#1a1a2e] border border-[#2d2d3d] flex items-center justify-center shrink-0 ${cfg.color}`}>
                  <Icon size={11} />
                </div>
                {i < activities.length - 1 && (
                  <div className="w-px flex-1 bg-[#1e1e2e] my-1" />
                )}
              </div>

              {/* Content */}
              <div className={`pb-3 flex-1 min-w-0 ${i < activities.length - 1 ? '' : ''}`}>
                <p className="text-xs text-slate-300 leading-snug">{a.description}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <Link
                    href={`/contacts/${a.contactId}`}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 truncate max-w-[140px]"
                  >
                    {a.contact.name}
                  </Link>
                  {a.contact.company && (
                    <span className="text-[11px] text-slate-600">· {a.contact.company}</span>
                  )}
                  <span className="text-[11px] text-slate-600 ml-auto shrink-0">
                    {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activities.length > 0 && (
        <div className="mt-1 pt-3 border-t border-[#1e1e2e]">
          <Link
            href="/contacts"
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View all contacts →
          </Link>
        </div>
      )}
    </div>
  );
}
