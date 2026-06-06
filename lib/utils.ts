export const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-slate-700 text-slate-200',
  CONTACTED: 'bg-blue-900 text-blue-200',
  AWAITING_RESPONSE: 'bg-yellow-900 text-yellow-200',
  REPLIED: 'bg-cyan-900 text-cyan-200',
  INTERVIEW_SCHEDULED: 'bg-purple-900 text-purple-200',
  OFFER_RECEIVED: 'bg-orange-900 text-orange-200',
  WON: 'bg-green-900 text-green-200',
  LOST: 'bg-red-900 text-red-200',
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-slate-700 text-slate-300',
  MEDIUM: 'bg-yellow-900 text-yellow-300',
  HIGH: 'bg-red-900 text-red-300',
};

export const STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  AWAITING_RESPONSE: 'Awaiting Response',
  REPLIED: 'Replied',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  OFFER_RECEIVED: 'Offer Received',
  WON: 'Won',
  LOST: 'Lost',
};

export const PLATFORMS = [
  'LinkedIn', 'Email', 'Twitter', 'GitHub', 'AngelList',
  'Indeed', 'Glassdoor', 'Referral', 'Other',
];

export const STATUSES = [
  'NEW', 'CONTACTED', 'AWAITING_RESPONSE', 'REPLIED',
  'INTERVIEW_SCHEDULED', 'OFFER_RECEIVED', 'WON', 'LOST',
] as const;

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;