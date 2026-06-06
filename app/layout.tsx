import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/ui/Sidebar';

export const metadata: Metadata = {
  title: 'OutreachCRM',
  description: 'Manage recruiter outreach, job applications, and networking',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex bg-[#0a0a0f] text-slate-200 min-h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto min-h-screen">{children}</main>
      </body>
    </html>
  );
}
