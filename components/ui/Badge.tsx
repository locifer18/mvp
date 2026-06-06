import { STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS } from '@/lib/utils';

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        STATUS_COLORS[status] || 'bg-slate-700 text-slate-300'
      }`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        PRIORITY_COLORS[priority] || 'bg-slate-700 text-slate-300'
      }`}
    >
      {priority}
    </span>
  );
}