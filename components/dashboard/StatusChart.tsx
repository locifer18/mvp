'use client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';
import { STATUS_LABELS } from '@/lib/utils';

const COLORS: Record<string, string> = {
  NEW:                '#475569',
  CONTACTED:          '#3b82f6',
  AWAITING_RESPONSE:  '#eab308',
  REPLIED:            '#06b6d4',
  INTERVIEW_SCHEDULED:'#a855f7',
  OFFER_RECEIVED:     '#f97316',
  WON:                '#22c55e',
  LOST:               '#ef4444',
};

interface Props {
  data: { status: string; count: number }[];
}

export default function StatusChart({ data }: Props) {
  const filtered = data.filter(d => d.count > 0);
  const total = filtered.reduce((s, d) => s + d.count, 0);

  if (filtered.length === 0) {
    return (
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 flex items-center justify-center h-64">
        <p className="text-sm text-slate-500">No contacts yet — add some to see the breakdown.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-slate-300">Status Breakdown</h2>
        <span className="text-xs text-slate-500">{total} total</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Bar chart */}
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={filtered} margin={{ top: 4, right: 4, left: -24, bottom: 48 }}>
            <XAxis
              dataKey="status"
              tick={{ fill: '#64748b', fontSize: 9 }}
              tickFormatter={s => STATUS_LABELS[s]?.split(' ')[0] || s}
              angle={-40}
              textAnchor="end"
              interval={0}
            />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: '#1e1e2e' }}
              contentStyle={{
                background: '#111118',
                border: '1px solid #2d2d3d',
                borderRadius: 8,
                fontSize: 12,
                color: '#e2e8f0',
              }}
              formatter={(v: number, _: string, props: { payload?: { status: string } }) => [
                `${v} contacts`,
                STATUS_LABELS[props.payload?.status || ''] || '',
              ]}
              labelFormatter={() => ''}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {filtered.map((entry) => (
                <Cell key={entry.status} fill={COLORS[entry.status] || '#475569'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Pie chart */}
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={filtered}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius={75}
              innerRadius={40}
              paddingAngle={2}
            >
              {filtered.map((entry) => (
                <Cell key={entry.status} fill={COLORS[entry.status] || '#475569'} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#111118',
                border: '1px solid #2d2d3d',
                borderRadius: 8,
                fontSize: 12,
                color: '#e2e8f0',
              }}
              formatter={(v: number, name: string) => [
                `${v} (${Math.round((v / total) * 100)}%)`,
                STATUS_LABELS[name] || name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
        {filtered.map(d => (
          <div key={d.status} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: COLORS[d.status] || '#475569' }}
            />
            <span className="text-[11px] text-slate-500">
              {STATUS_LABELS[d.status]} <span className="text-slate-400 font-medium">{d.count}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
