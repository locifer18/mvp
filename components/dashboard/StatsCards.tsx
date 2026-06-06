import {
  Users, MessageSquare, Inbox, Calendar,
  Gift, Trophy, XCircle, AlertCircle,
  TrendingUp, BarChart2, Target, Percent,
} from 'lucide-react';

interface Stats {
  total: number;
  contacted: number;
  awaiting: number;
  replied: number;
  interviews: number;
  offers: number;
  won: number;
  lost: number;
  needsFollowUp: number;
  replyRate: number;
  interviewRate: number;
  offerRate: number;
  successRate: number;
}

function StatCard({
  label, value, icon: Icon, color, sub, highlight,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`bg-[#111118] border rounded-xl p-4 flex flex-col gap-2 ${
      highlight ? 'border-yellow-800/60' : 'border-[#1e1e2e]'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 leading-tight">{label}</span>
        <Icon size={14} className={color} />
      </div>
      <div className="text-2xl font-bold text-slate-100 leading-none">{value}</div>
      {sub && <div className="text-[11px] text-slate-500 leading-tight">{sub}</div>}
    </div>
  );
}

function RateCard({
  label, value, description, color,
}: {
  label: string;
  value: number;
  description: string;
  color: string;
}) {
  return (
    <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-500">{label}</span>
        <Percent size={12} className="text-slate-600" />
      </div>
      <div className={`text-2xl font-bold leading-none ${color}`}>{value}%</div>
      <div className="text-[11px] text-slate-500 mt-1.5 leading-tight">{description}</div>
      {/* Progress bar */}
      <div className="mt-2.5 h-1 bg-[#1e1e2e] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color.replace('text-', 'bg-')}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function StatsCards({ stats }: { stats: Stats }) {
  return (
    <div className="space-y-4">
      {/* Pipeline counts */}
      <div>
        <p className="text-xs text-slate-600 uppercase tracking-wider mb-2 font-medium">Pipeline</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <StatCard
            label="Total"
            value={stats.total}
            icon={Users}
            color="text-slate-400"
            sub="All contacts"
          />
          <StatCard
            label="Contacted"
            value={stats.contacted}
            icon={MessageSquare}
            color="text-blue-400"
            sub={`${stats.total - stats.contacted} not yet`}
          />
          <StatCard
            label="Awaiting"
            value={stats.awaiting}
            icon={Inbox}
            color="text-yellow-400"
            sub="No reply yet"
          />
          <StatCard
            label="Replied"
            value={stats.replied}
            icon={TrendingUp}
            color="text-cyan-400"
            sub="Got response"
          />
          <StatCard
            label="Interviews"
            value={stats.interviews}
            icon={Calendar}
            color="text-purple-400"
            sub="In pipeline"
          />
          <StatCard
            label="Offers"
            value={stats.offers}
            icon={Gift}
            color="text-orange-400"
            sub="Received"
          />
          <StatCard
            label="Won"
            value={stats.won}
            icon={Trophy}
            color="text-green-400"
            sub="Accepted"
          />
          <StatCard
            label="Lost"
            value={stats.lost}
            icon={XCircle}
            color="text-red-400"
            sub="Closed out"
          />
        </div>
      </div>

      {/* Follow-up alert + rates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          label="Needs Follow-Up"
          value={stats.needsFollowUp}
          icon={AlertCircle}
          color="text-yellow-400"
          sub="Overdue today"
          highlight={stats.needsFollowUp > 0}
        />
        <RateCard
          label="Reply Rate"
          value={stats.replyRate}
          description={`${stats.replied} replied of ${stats.contacted} contacted`}
          color="text-cyan-400"
        />
        <RateCard
          label="Interview Rate"
          value={stats.interviewRate}
          description={`${stats.interviews} interviews from ${stats.replied} replies`}
          color="text-purple-400"
        />
        <RateCard
          label="Offer Rate"
          value={stats.offerRate}
          description={`${stats.offers} offers from ${stats.interviews} interviews`}
          color="text-orange-400"
        />
        <RateCard
          label="Success Rate"
          value={stats.successRate}
          description={`${stats.won} won of ${stats.total} total`}
          color="text-green-400"
        />
      </div>
    </div>
  );
}
