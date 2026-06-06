'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Plus, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/contacts/new', label: 'Add Contact', icon: Plus },
];

export default function Sidebar() {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`shrink-0 bg-[#111118] border-r border-[#1e1e2e] flex flex-col min-h-screen transition-all duration-200 ${
        collapsed ? 'w-14' : 'w-56'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#1e1e2e] h-14">
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <Activity size={16} className="text-indigo-400 shrink-0" />
            <span className="font-semibold text-slate-100 text-sm truncate">OutreachCRM</span>
          </div>
        )}
        {collapsed && (
          <div className="flex items-center justify-center w-full">
            <Activity size={16} className="text-indigo-400" />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-[#1e1e2e] transition-colors shrink-0"
            title="Collapse sidebar"
          >
            <ChevronLeft size={15} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            path === href ||
            (href === '/contacts' &&
              path.startsWith('/contacts') &&
              path !== '/contacts/new');
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors ${
                collapsed ? 'justify-center' : ''
              } ${
                active
                  ? 'bg-indigo-600/20 text-indigo-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e1e2e]'
              }`}
            >
              <Icon size={15} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Expand button at bottom when collapsed */}
      {collapsed && (
        <div className="p-2 border-t border-[#1e1e2e]">
          <button
            onClick={() => setCollapsed(false)}
            className="flex items-center justify-center w-full p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-[#1e1e2e] transition-colors"
            title="Expand sidebar"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </aside>
  );
}
