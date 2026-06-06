import { mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';

function write(filePath, content) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, 'utf8');
  console.log('✓', filePath);
}

// ─── prisma/schema.prisma ─────────────────────────────────────────────────────
write('prisma/schema.prisma', `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Contact {
  id              String         @id @default(cuid())
  name            String
  email           String?
  phone           String?
  company         String?
  jobProfile      String?
  platform        String?
  profileLink     String?
  status          Status         @default(NEW)
  responseStatus  ResponseStatus @default(NO_REPLY)
  priority        Priority       @default(MEDIUM)
  tags            String[]       @default([])
  notes           String?
  followUpDate    DateTime?
  lastContactedAt DateTime?
  deletedAt       DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  activities      Activity[]
}

model Activity {
  id          String       @id @default(cuid())
  contactId   String
  type        ActivityType
  description String
  createdAt   DateTime     @default(now())
  contact     Contact      @relation(fields: [contactId], references: [id], onDelete: Cascade)
}

enum Status {
  NEW
  CONTACTED
  AWAITING_RESPONSE
  REPLIED
  INTERVIEW_SCHEDULED
  OFFER_RECEIVED
  WON
  LOST
}

enum ResponseStatus {
  NO_REPLY
  REPLIED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}

enum ActivityType {
  CONTACT_CREATED
  MESSAGE_SENT
  STATUS_UPDATED
  FOLLOW_UP_SCHEDULED
  INTERVIEW_SCHEDULED
  OFFER_RECEIVED
  NOTE_ADDED
}`);

// ─── lib/prisma.ts ────────────────────────────────────────────────────────────
write('lib/prisma.ts', `import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;`);

// ─── lib/utils.ts ─────────────────────────────────────────────────────────────
write('lib/utils.ts', `export const STATUS_COLORS: Record<string, string> = {
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

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;`);

// ─── lib/validations.ts ───────────────────────────────────────────────────────
write('lib/validations.ts', `import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobProfile: z.string().optional(),
  platform: z.string().optional(),
  profileLink: z.string().url('Invalid URL').optional().or(z.literal('')),
  status: z
    .enum(['NEW', 'CONTACTED', 'AWAITING_RESPONSE', 'REPLIED', 'INTERVIEW_SCHEDULED', 'OFFER_RECEIVED', 'WON', 'LOST'])
    .default('NEW'),
  responseStatus: z.enum(['NO_REPLY', 'REPLIED']).default('NO_REPLY'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  followUpDate: z.string().optional().nullable(),
  lastContactedAt: z.string().optional().nullable(),
});

export type ContactInput = z.infer<typeof contactSchema>;`);

// ─── types/index.ts ───────────────────────────────────────────────────────────
write('types/index.ts', `export type Status =
  | 'NEW' | 'CONTACTED' | 'AWAITING_RESPONSE' | 'REPLIED'
  | 'INTERVIEW_SCHEDULED' | 'OFFER_RECEIVED' | 'WON' | 'LOST';

export type ResponseStatus = 'NO_REPLY' | 'REPLIED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type ActivityType =
  | 'CONTACT_CREATED' | 'MESSAGE_SENT' | 'STATUS_UPDATED'
  | 'FOLLOW_UP_SCHEDULED' | 'INTERVIEW_SCHEDULED' | 'OFFER_RECEIVED' | 'NOTE_ADDED';

export interface Contact {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  jobProfile?: string | null;
  platform?: string | null;
  profileLink?: string | null;
  status: Status;
  responseStatus: ResponseStatus;
  priority: Priority;
  tags: string[];
  notes?: string | null;
  followUpDate?: string | null;
  lastContactedAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  activities?: Activity[];
}

export interface Activity {
  id: string;
  contactId: string;
  type: ActivityType;
  description: string;
  createdAt: string;
}`);

// ─── app/globals.css ──────────────────────────────────────────────────────────
write('app/globals.css', `@import "tailwindcss";

* {
  box-sizing: border-box;
}

body {
  background: #0a0a0f;
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #0a0a0f; }
::-webkit-scrollbar-thumb { background: #2d2d3d; border-radius: 3px; }`);

// ─── app/layout.tsx ───────────────────────────────────────────────────────────
write('app/layout.tsx', `import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/ui/Sidebar';

export const metadata: Metadata = {
  title: 'OutreachCRM',
  description: 'Manage recruiter outreach, job applications, and networking',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex bg-[#0a0a0f] text-slate-200 min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </body>
    </html>
  );
}`);

// ─── app/page.tsx ─────────────────────────────────────────────────────────────
write('app/page.tsx', `import { redirect } from 'next/navigation';
export default function Home() {
  redirect('/dashboard');
}`);

// ─── app/dashboard/page.tsx ───────────────────────────────────────────────────
write('app/dashboard/page.tsx', `import { prisma } from '@/lib/prisma';
import { isPast } from 'date-fns';
import StatsCards from '@/components/dashboard/StatsCards';
import StatusChart from '@/components/dashboard/StatusChart';
import RecentActivity from '@/components/dashboard/RecentActivity';
import FollowUpWidget from '@/components/dashboard/FollowUpWidget';
import UpcomingFollowUps from '@/components/dashboard/UpcomingFollowUps';

async function getDashboardData() {
  const [contacts, activities] = await Promise.all([
    prisma.contact.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } }),
    prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { contact: { select: { name: true, company: true } } },
    }),
  ]);

  const total = contacts.length;
  const contacted = contacts.filter(c => c.status !== 'NEW').length;
  const replied = contacts.filter(c =>
    ['REPLIED', 'INTERVIEW_SCHEDULED', 'OFFER_RECEIVED', 'WON'].includes(c.status)
  ).length;
  const interviews = contacts.filter(c =>
    ['INTERVIEW_SCHEDULED', 'OFFER_RECEIVED', 'WON'].includes(c.status)
  ).length;
  const offers = contacts.filter(c => ['OFFER_RECEIVED', 'WON'].includes(c.status)).length;
  const won = contacts.filter(c => c.status === 'WON').length;
  const lost = contacts.filter(c => c.status === 'LOST').length;

  const needsFollowUpContacts = contacts.filter(
    c => c.status === 'AWAITING_RESPONSE' && c.followUpDate && isPast(new Date(c.followUpDate))
  );

  const statusBreakdown = [
    'NEW', 'CONTACTED', 'AWAITING_RESPONSE', 'REPLIED',
    'INTERVIEW_SCHEDULED', 'OFFER_RECEIVED', 'WON', 'LOST',
  ].map(s => ({ status: s, count: contacts.filter(c => c.status === s).length }));

  const upcomingFollowUps = contacts
    .filter(c => c.followUpDate && !isPast(new Date(c.followUpDate)))
    .sort((a, b) => new Date(a.followUpDate!).getTime() - new Date(b.followUpDate!).getTime())
    .slice(0, 5);

  return {
    stats: {
      total, contacted, replied, interviews, offers, won, lost,
      needsFollowUp: needsFollowUpContacts.length,
      replyRate: contacted > 0 ? Math.round((replied / contacted) * 100) : 0,
      interviewRate: replied > 0 ? Math.round((interviews / replied) * 100) : 0,
      offerRate: interviews > 0 ? Math.round((offers / interviews) * 100) : 0,
      successRate: total > 0 ? Math.round((won / total) * 100) : 0,
    },
    statusBreakdown,
    activities,
    upcomingFollowUps,
    needsFollowUpContacts,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Your outreach overview</p>
      </div>
      <StatsCards stats={data.stats} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <StatusChart data={data.statusBreakdown} />
        </div>
        <FollowUpWidget contacts={data.needsFollowUpContacts} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity activities={data.activities} />
        <UpcomingFollowUps contacts={data.upcomingFollowUps} />
      </div>
    </div>
  );
}`);

// ─── app/contacts/page.tsx ────────────────────────────────────────────────────
write('app/contacts/page.tsx', `import { prisma } from '@/lib/prisma';
import ContactsTable from '@/components/contacts/ContactsTable';
import Link from 'next/link';
import { Plus, Download } from 'lucide-react';

interface SearchParams {
  search?: string; status?: string; priority?: string;
  platform?: string; page?: string; sort?: string; order?: string;
}

async function getContacts(params: SearchParams) {
  const page = parseInt(params.page || '1');
  const pageSize = 20;
  const where: Record<string, unknown> = { deletedAt: null };

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { company: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } },
    ];
  }
  if (params.status) where.status = params.status;
  if (params.priority) where.priority = params.priority;
  if (params.platform) where.platform = params.platform;

  const sortField = params.sort || 'createdAt';
  const sortOrder = (params.order || 'desc') as 'asc' | 'desc';

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.contact.count({ where }),
  ]);

  return { contacts, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const data = await getContacts(params);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Contacts</h1>
          <p className="text-sm text-slate-500 mt-1">{data.total} total contacts</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/contacts/export"
            className="flex items-center gap-2 px-3 py-2 text-sm bg-[#1e1e2e] hover:bg-[#2a2a3e] text-slate-300 rounded-lg border border-[#2d2d3d] transition-colors"
          >
            <Download size={14} /> Export CSV
          </a>
          <Link
            href="/contacts/new"
            className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
          >
            <Plus size={14} /> Add Contact
          </Link>
        </div>
      </div>
      <ContactsTable data={data} searchParams={params} />
    </div>
  );
}`);

// ─── app/contacts/new/page.tsx ────────────────────────────────────────────────
write('app/contacts/new/page.tsx', `import ContactForm from '@/components/contacts/ContactForm';

export default function NewContactPage() {
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-100 mb-6">Add Contact</h1>
      <ContactForm />
    </div>
  );
}`);

// ─── app/contacts/[id]/page.tsx ───────────────────────────────────────────────
write('app/contacts/[id]/page.tsx', `import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ContactDetail from '@/components/contacts/ContactDetail';

export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: { activities: { orderBy: { createdAt: 'desc' } } },
  });
  if (!contact || contact.deletedAt) notFound();
  return <ContactDetail contact={JSON.parse(JSON.stringify(contact))} />;
}`);

// ─── app/contacts/[id]/edit/page.tsx ─────────────────────────────────────────
write('app/contacts/[id]/edit/page.tsx', `import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ContactForm from '@/components/contacts/ContactForm';

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact || contact.deletedAt) notFound();
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-100 mb-6">Edit Contact</h1>
      <ContactForm contact={JSON.parse(JSON.stringify(contact))} />
    </div>
  );
}`);

// ─── app/api/contacts/route.ts ────────────────────────────────────────────────
write('app/api/contacts/route.ts', `import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { contactSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = 20;
  const where: Record<string, unknown> = { deletedAt: null };

  const search = searchParams.get('search');
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
    ];
  }
  const status = searchParams.get('status');
  if (status) where.status = status;
  const priority = searchParams.get('priority');
  if (priority) where.priority = priority;

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.contact.count({ where }),
  ]);
  return NextResponse.json({ contacts, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const contact = await prisma.contact.create({
    data: {
      ...d,
      email: d.email || null,
      phone: d.phone || null,
      company: d.company || null,
      jobProfile: d.jobProfile || null,
      platform: d.platform || null,
      profileLink: d.profileLink || null,
      notes: d.notes || null,
      followUpDate: d.followUpDate ? new Date(d.followUpDate) : null,
      lastContactedAt: d.lastContactedAt ? new Date(d.lastContactedAt) : null,
      activities: {
        create: { type: 'CONTACT_CREATED', description: \`Contact \${d.name} created\` },
      },
    },
  });
  return NextResponse.json(contact, { status: 201 });
}`);

// ─── app/api/contacts/[id]/route.ts ──────────────────────────────────────────
write('app/api/contacts/[id]/route.ts', `import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { contactSchema } from '@/lib/validations';

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: { activities: { orderBy: { createdAt: 'desc' } } },
  });
  if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(contact);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const existing = await prisma.contact.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const d = parsed.data;
  const newActivities: { type: string; description: string }[] = [];

  if (existing.status !== d.status) {
    newActivities.push({
      type: 'STATUS_UPDATED',
      description: \`Status changed from \${existing.status} to \${d.status}\`,
    });
    if (d.status === 'INTERVIEW_SCHEDULED')
      newActivities.push({ type: 'INTERVIEW_SCHEDULED', description: 'Interview scheduled' });
    if (d.status === 'OFFER_RECEIVED')
      newActivities.push({ type: 'OFFER_RECEIVED', description: 'Offer received' });
  }
  if (
    d.followUpDate &&
    existing.followUpDate?.toISOString().split('T')[0] !== d.followUpDate.split('T')[0]
  ) {
    newActivities.push({
      type: 'FOLLOW_UP_SCHEDULED',
      description: \`Follow-up scheduled for \${d.followUpDate}\`,
    });
  }

  const contact = await prisma.contact.update({
    where: { id },
    data: {
      ...d,
      email: d.email || null,
      phone: d.phone || null,
      company: d.company || null,
      jobProfile: d.jobProfile || null,
      platform: d.platform || null,
      profileLink: d.profileLink || null,
      notes: d.notes || null,
      followUpDate: d.followUpDate ? new Date(d.followUpDate) : null,
      lastContactedAt: d.lastContactedAt ? new Date(d.lastContactedAt) : null,
      activities: newActivities.length > 0 ? { create: newActivities as never } : undefined,
    },
  });
  return NextResponse.json(contact);
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.contact.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ success: true });
}`);

// ─── app/api/contacts/export/route.ts ────────────────────────────────────────
write('app/api/contacts/export/route.ts', `import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const contacts = await prisma.contact.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  const headers = [
    'id', 'name', 'email', 'phone', 'company', 'jobProfile',
    'platform', 'profileLink', 'status', 'responseStatus', 'priority',
    'tags', 'notes', 'followUpDate', 'lastContactedAt', 'createdAt',
  ];

  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    if (Array.isArray(v)) return \`"\${v.join(',')}"\`;
    if (v instanceof Date) return v.toISOString();
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\\n') ? \`"\${s.replace(/"/g, '""')}"\` : s;
  };

  const rows = contacts.map(c =>
    headers.map(h => escape(c[h as keyof typeof c])).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="contacts.csv"',
    },
  });
}`);

// ─── app/api/contacts/import/route.ts ────────────────────────────────────────
write('app/api/contacts/import/route.ts', `import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const text = await req.text();
  const lines = text.trim().split('\\n');
  if (lines.length < 2) return NextResponse.json({ created: 0, errors: 0 });

  const headers = lines[0].split(',').map(h => h.trim());
  const results = { created: 0, errors: 0 };

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    try {
      const vals = line.split(',');
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = (vals[i] || '').trim().replace(/^"|"$/g, '');
      });
      if (!row.name) continue;
      await prisma.contact.create({
        data: {
          name: row.name,
          email: row.email || null,
          phone: row.phone || null,
          company: row.company || null,
          jobProfile: row.jobProfile || null,
          platform: row.platform || null,
          profileLink: row.profileLink || null,
          status: (row.status as never) || 'NEW',
          priority: (row.priority as never) || 'MEDIUM',
          notes: row.notes || null,
          activities: {
            create: { type: 'CONTACT_CREATED', description: \`Imported: \${row.name}\` },
          },
        },
      });
      results.created++;
    } catch {
      results.errors++;
    }
  }
  return NextResponse.json(results);
}`);

// ─── app/api/dashboard/stats/route.ts ────────────────────────────────────────
write('app/api/dashboard/stats/route.ts', `import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isPast } from 'date-fns';

export async function GET() {
  const contacts = await prisma.contact.findMany({ where: { deletedAt: null } });
  const total = contacts.length;
  const contacted = contacts.filter(c => c.status !== 'NEW').length;
  const replied = contacts.filter(c =>
    ['REPLIED', 'INTERVIEW_SCHEDULED', 'OFFER_RECEIVED', 'WON'].includes(c.status)
  ).length;
  const interviews = contacts.filter(c =>
    ['INTERVIEW_SCHEDULED', 'OFFER_RECEIVED', 'WON'].includes(c.status)
  ).length;
  const offers = contacts.filter(c => ['OFFER_RECEIVED', 'WON'].includes(c.status)).length;
  const won = contacts.filter(c => c.status === 'WON').length;
  const lost = contacts.filter(c => c.status === 'LOST').length;
  const needsFollowUp = contacts.filter(
    c => c.status === 'AWAITING_RESPONSE' && c.followUpDate && isPast(c.followUpDate)
  ).length;

  return NextResponse.json({
    total, contacted, replied, interviews, offers, won, lost, needsFollowUp,
    replyRate: contacted > 0 ? Math.round((replied / contacted) * 100) : 0,
    interviewRate: replied > 0 ? Math.round((interviews / replied) * 100) : 0,
    offerRate: interviews > 0 ? Math.round((offers / interviews) * 100) : 0,
    successRate: total > 0 ? Math.round((won / total) * 100) : 0,
  });
}`);

// ─── app/api/activities/route.ts ──────────────────────────────────────────────
write('app/api/activities/route.ts', `import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const contactId = req.nextUrl.searchParams.get('contactId');
  const activities = await prisma.activity.findMany({
    where: contactId ? { contactId } : {},
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { contact: { select: { name: true } } },
  });
  return NextResponse.json(activities);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const activity = await prisma.activity.create({ data: body });
  return NextResponse.json(activity, { status: 201 });
}`);

// ─── components/ui/Sidebar.tsx ────────────────────────────────────────────────
write('components/ui/Sidebar.tsx', `'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Plus, Activity } from 'lucide-react';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/contacts/new', label: 'Add Contact', icon: Plus },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-56 shrink-0 bg-[#111118] border-r border-[#1e1e2e] flex flex-col min-h-screen">
      <div className="p-4 border-b border-[#1e1e2e]">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-indigo-400" />
          <span className="font-semibold text-slate-100 text-sm">OutreachCRM</span>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
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
              className={\`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors \${
                active
                  ? 'bg-indigo-600/20 text-indigo-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e1e2e]'
              }\`}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}`);

// ─── components/ui/Badge.tsx ──────────────────────────────────────────────────
write('components/ui/Badge.tsx', `import { STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS } from '@/lib/utils';

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={\`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium \${
        STATUS_COLORS[status] || 'bg-slate-700 text-slate-300'
      }\`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={\`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium \${
        PRIORITY_COLORS[priority] || 'bg-slate-700 text-slate-300'
      }\`}
    >
      {priority}
    </span>
  );
}`);

// ─── components/dashboard/StatsCards.tsx ─────────────────────────────────────
write('components/dashboard/StatsCards.tsx', `import {
  Users, MessageSquare, Reply, Calendar,
  Gift, Trophy, XCircle, AlertCircle,
} from 'lucide-react';

interface Stats {
  total: number; contacted: number; replied: number; interviews: number;
  offers: number; won: number; lost: number; needsFollowUp: number;
  replyRate: number; interviewRate: number; offerRate: number; successRate: number;
}

export default function StatsCards({ stats }: { stats: Stats }) {
  const cards = [
    { key: 'total', label: 'Total Contacts', icon: Users, color: 'text-slate-300' },
    { key: 'contacted', label: 'Contacted', icon: MessageSquare, color: 'text-blue-400' },
    { key: 'replied', label: 'Replies', icon: Reply, color: 'text-cyan-400' },
    { key: 'interviews', label: 'Interviews', icon: Calendar, color: 'text-purple-400' },
    { key: 'offers', label: 'Offers', icon: Gift, color: 'text-orange-400' },
    { key: 'won', label: 'Won', icon: Trophy, color: 'text-green-400' },
    { key: 'lost', label: 'Lost', icon: XCircle, color: 'text-red-400' },
    { key: 'needsFollowUp', label: 'Needs Follow-Up', icon: AlertCircle, color: 'text-yellow-400' },
  ];

  const rates = [
    { key: 'replyRate', label: 'Reply Rate' },
    { key: 'interviewRate', label: 'Interview Rate' },
    { key: 'offerRate', label: 'Offer Rate' },
    { key: 'successRate', label: 'Success Rate' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">{label}</span>
              <Icon size={14} className={color} />
            </div>
            <div className="text-2xl font-semibold text-slate-100">
              {stats[key as keyof Stats]}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {rates.map(({ key, label }) => (
          <div key={key} className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4">
            <div className="text-xs text-slate-500 mb-2">{label}</div>
            <div className="text-2xl font-semibold text-slate-100">
              {stats[key as keyof Stats]}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}`);

// ─── components/dashboard/StatusChart.tsx ────────────────────────────────────
write('components/dashboard/StatusChart.tsx', `'use client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { STATUS_LABELS } from '@/lib/utils';

const COLORS = [
  '#475569', '#3b82f6', '#eab308', '#06b6d4',
  '#a855f7', '#f97316', '#22c55e', '#ef4444',
];

interface Props {
  data: { status: string; count: number }[];
}

export default function StatusChart({ data }: Props) {
  const filtered = data.filter(d => d.count > 0);
  return (
    <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4">
      <h2 className="text-sm font-medium text-slate-300 mb-4">Status Breakdown</h2>
      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">No data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={filtered} margin={{ top: 0, right: 0, left: -20, bottom: 50 }}>
            <XAxis
              dataKey="status"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickFormatter={s => STATUS_LABELS[s]?.replace(' ', '\\n') || s}
              angle={-35}
              textAnchor="end"
              interval={0}
            />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: '#1e1e2e',
                border: '1px solid #2d2d3d',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: '#e2e8f0' }}
              formatter={(v: number, _n: string, props: { payload?: { status: string } }) => [
                v,
                STATUS_LABELS[props.payload?.status || ''] || '',
              ]}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {filtered.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}`);

// ─── components/dashboard/RecentActivity.tsx ─────────────────────────────────
write('components/dashboard/RecentActivity.tsx', `import { formatDistanceToNow } from 'date-fns';
import { Activity } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  createdAt: string | Date;
  contact: { name: string; company?: string | null };
}

export default function RecentActivity({ activities }: { activities: ActivityItem[] }) {
  return (
    <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4">
      <h2 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
        <Activity size={14} className="text-indigo-400" /> Recent Activity
      </h2>
      <div className="space-y-3">
        {activities.length === 0 && (
          <p className="text-sm text-slate-500">No activity yet.</p>
        )}
        {activities.map(a => (
          <div key={a.id} className="flex gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-300 leading-snug">{a.description}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {a.contact.name} ·{' '}
                {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}`);

// ─── components/dashboard/FollowUpWidget.tsx ─────────────────────────────────
write('components/dashboard/FollowUpWidget.tsx', `import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Contact {
  id: string;
  name: string;
  company?: string | null;
  followUpDate?: string | Date | null;
}

export default function FollowUpWidget({ contacts }: { contacts: Contact[] }) {
  return (
    <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4">
      <h2 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
        <AlertCircle size={14} className="text-yellow-400" /> Needs Follow-Up
      </h2>
      <div className="space-y-2">
        {contacts.length === 0 && (
          <p className="text-sm text-slate-500">No overdue follow-ups.</p>
        )}
        {contacts.map(c => (
          <Link
            key={c.id}
            href={\`/contacts/\${c.id}\`}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1e1e2e] transition-colors group"
          >
            <div>
              <p className="text-sm text-slate-200 group-hover:text-white">{c.name}</p>
              <p className="text-xs text-slate-500">{c.company}</p>
            </div>
            {c.followUpDate && (
              <span className="text-xs text-yellow-500">
                {format(new Date(c.followUpDate), 'MMM d')}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}`);

// ─── components/dashboard/UpcomingFollowUps.tsx ───────────────────────────────
write('components/dashboard/UpcomingFollowUps.tsx', `import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Contact {
  id: string;
  name: string;
  company?: string | null;
  followUpDate?: string | Date | null;
}

export default function UpcomingFollowUps({ contacts }: { contacts: Contact[] }) {
  return (
    <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4">
      <h2 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
        <Calendar size={14} className="text-indigo-400" /> Upcoming Follow-Ups
      </h2>
      <div className="space-y-2">
        {contacts.length === 0 && (
          <p className="text-sm text-slate-500">No upcoming follow-ups.</p>
        )}
        {contacts.map(c => (
          <Link
            key={c.id}
            href={\`/contacts/\${c.id}\`}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1e1e2e] transition-colors group"
          >
            <div>
              <p className="text-sm text-slate-200 group-hover:text-white">{c.name}</p>
              <p className="text-xs text-slate-500">{c.company}</p>
            </div>
            {c.followUpDate && (
              <span className="text-xs text-slate-400">
                {format(new Date(c.followUpDate), 'MMM d')}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}`);

// ─── components/contacts/ContactsTable.tsx ────────────────────────────────────
write('components/contacts/ContactsTable.tsx', `'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { format } from 'date-fns';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { STATUSES, PRIORITIES, PLATFORMS } from '@/lib/utils';
import { useState } from 'react';
import { Contact } from '@/types';
import ImportButton from './ImportButton';

interface Props {
  data: {
    contacts: Contact[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  searchParams: Record<string, string | undefined>;
}

export default function ContactsTable({ data, searchParams }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [deleting, setDeleting] = useState<string | null>(null);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { ...searchParams, ...overrides };
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v); });
    return \`\${pathname}?\${params.toString()}\`;
  }

  function SortIcon({ field }: { field: string }) {
    if (searchParams.sort !== field) return <ChevronUp size={12} className="text-slate-600" />;
    return searchParams.order === 'asc'
      ? <ChevronUp size={12} className="text-indigo-400" />
      : <ChevronDown size={12} className="text-indigo-400" />;
  }

  function sortUrl(field: string) {
    const order =
      searchParams.sort === field && searchParams.order === 'asc' ? 'desc' : 'asc';
    return buildUrl({ sort: field, order, page: '1' });
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this contact?')) return;
    setDeleting(id);
    await fetch(\`/api/contacts/\${id}\`, { method: 'DELETE' });
    setDeleting(null);
    router.refresh();
  }

  const cols = [
    { label: 'Name', field: 'name' },
    { label: 'Company', field: 'company' },
    { label: 'Platform', field: 'platform' },
    { label: 'Status', field: 'status' },
    { label: 'Priority', field: 'priority' },
    { label: 'Follow Up', field: 'followUpDate' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search name, company, email..."
          defaultValue={searchParams.search || ''}
          onChange={e => {
            const w = window as unknown as Record<string, ReturnType<typeof setTimeout>>;
            clearTimeout(w.__searchTimer);
            w.__searchTimer = setTimeout(
              () => router.push(buildUrl({ search: e.target.value || undefined, page: '1' })),
              350
            );
          }}
          className="flex-1 min-w-48 px-3 py-2 text-sm bg-[#111118] border border-[#2d2d3d] rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <select
          value={searchParams.status || ''}
          onChange={e => router.push(buildUrl({ status: e.target.value || undefined, page: '1' }))}
          className="px-3 py-2 text-sm bg-[#111118] border border-[#2d2d3d] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select
          value={searchParams.priority || ''}
          onChange={e => router.push(buildUrl({ priority: e.target.value || undefined, page: '1' }))}
          className="px-3 py-2 text-sm bg-[#111118] border border-[#2d2d3d] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={searchParams.platform || ''}
          onChange={e => router.push(buildUrl({ platform: e.target.value || undefined, page: '1' }))}
          className="px-3 py-2 text-sm bg-[#111118] border border-[#2d2d3d] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Platforms</option>
          {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <ImportButton />
      </div>

      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e2e]">
                {cols.map(col => (
                  <th key={col.field} className="text-left px-4 py-3 text-xs font-medium text-slate-500">
                    <Link href={sortUrl(col.field)} className="flex items-center gap-1 hover:text-slate-300">
                      {col.label} <SortIcon field={col.field} />
                    </Link>
                  </th>
                ))}
                <th className="px-4 py-3 text-xs font-medium text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e2e]">
              {data.contacts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No contacts found.
                  </td>
                </tr>
              )}
              {data.contacts.map(c => (
                <tr key={c.id} className="hover:bg-[#1a1a28] transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={\`/contacts/\${c.id}\`}
                      className="text-slate-200 hover:text-indigo-300 font-medium"
                    >
                      {c.name}
                    </Link>
                    {c.email && (
                      <div className="text-xs text-slate-500 mt-0.5">{c.email}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{c.company || '—'}</td>
                  <td className="px-4 py-3 text-slate-400">{c.platform || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {c.followUpDate
                      ? format(new Date(c.followUpDate), 'MMM d, yyyy')
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={\`/contacts/\${c.id}/edit\`}
                        className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-[#1e1e2e] rounded transition-colors"
                      >
                        <Pencil size={13} />
                      </Link>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deleting === c.id}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-[#1e1e2e] rounded transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[#1e1e2e] flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page {data.page} of {data.totalPages} · {data.total} total
            </span>
            <div className="flex gap-2">
              {data.page > 1 && (
                <Link
                  href={buildUrl({ page: String(data.page - 1) })}
                  className="px-3 py-1 text-xs bg-[#1e1e2e] text-slate-300 rounded hover:bg-[#2a2a3e]"
                >
                  Prev
                </Link>
              )}
              {data.page < data.totalPages && (
                <Link
                  href={buildUrl({ page: String(data.page + 1) })}
                  className="px-3 py-1 text-xs bg-[#1e1e2e] text-slate-300 rounded hover:bg-[#2a2a3e]"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}`);

// ─── components/contacts/ContactForm.tsx ─────────────────────────────────────
write('components/contacts/ContactForm.tsx', `'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PLATFORMS, STATUSES, PRIORITIES, STATUS_LABELS } from '@/lib/utils';
import { Contact } from '@/types';

export default function ContactForm({ contact }: { contact?: Contact }) {
  const router = useRouter();
  const isEdit = Boolean(contact);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {};
    fd.forEach((v, k) => { body[k] = v; });
    body.tags = body.tags
      ? String(body.tags).split(',').map((t: string) => t.trim()).filter(Boolean)
      : [];
    body.followUpDate = body.followUpDate || null;
    body.lastContactedAt = body.lastContactedAt || null;
    body.email = body.email || '';
    body.profileLink = body.profileLink || '';

    const url = isEdit ? \`/api/contacts/\${contact!.id}\` : '/api/contacts';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(\`/contacts/\${data.id}\`);
      router.refresh();
    } else {
      const err = await res.json();
      setErrors(err.error?.fieldErrors || {});
    }
    setLoading(false);
  }

  function Field({
    label, name, type = 'text', required = false,
  }: { label: string; name: string; type?: string; required?: boolean }) {
    return (
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <input
          type={type}
          name={name}
          defaultValue={(contact?.[name as keyof Contact] as string) || ''}
          required={required}
          className="w-full px-3 py-2 text-sm bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        {errors[name]?.map(e => (
          <p key={e} className="text-xs text-red-400 mt-1">{e}</p>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5 space-y-4">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Basic Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name" name="name" required />
          <Field label="Email" name="email" type="email" />
          <Field label="Phone" name="phone" type="tel" />
          <Field label="Company" name="company" />
          <Field label="Job Profile / Role" name="jobProfile" />
          <Field label="Profile Link" name="profileLink" type="url" />
        </div>
      </div>

      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5 space-y-4">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outreach</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Platform</label>
            <select
              name="platform"
              defaultValue={contact?.platform || ''}
              className="w-full px-3 py-2 text-sm bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select platform</option>
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
            <select
              name="status"
              defaultValue={contact?.status || 'NEW'}
              className="w-full px-3 py-2 text-sm bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Priority</label>
            <select
              name="priority"
              defaultValue={contact?.priority || 'MEDIUM'}
              className="w-full px-3 py-2 text-sm bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Follow-Up Date</label>
            <input
              type="date"
              name="followUpDate"
              defaultValue={
                contact?.followUpDate
                  ? new Date(contact.followUpDate).toISOString().split('T')[0]
                  : ''
              }
              className="w-full px-3 py-2 text-sm bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Last Contacted</label>
            <input
              type="date"
              name="lastContactedAt"
              defaultValue={
                contact?.lastContactedAt
                  ? new Date(contact.lastContactedAt).toISOString().split('T')[0]
                  : ''
              }
              className="w-full px-3 py-2 text-sm bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              name="tags"
              defaultValue={contact?.tags?.join(', ') || ''}
              placeholder="recruiter, startup, urgent"
              className="w-full px-3 py-2 text-sm bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5 space-y-2">
        <label className="block text-xs font-medium text-slate-400">Notes</label>
        <textarea
          name="notes"
          defaultValue={contact?.notes || ''}
          rows={4}
          placeholder="Add notes about this contact..."
          className="w-full px-3 py-2 text-sm bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
        >
          {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Contact'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 text-sm bg-[#1e1e2e] hover:bg-[#2a2a3e] text-slate-300 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}`);

// ─── components/contacts/ContactDetail.tsx ────────────────────────────────────
write('components/contacts/ContactDetail.tsx', `'use client';
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
    await fetch(\`/api/contacts/\${contact.id}\`, { method: 'DELETE' });
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
            href={\`/contacts/\${contact.id}/edit\`}
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
                  <a href={\`mailto:\${contact.email}\`} className="hover:text-indigo-300">
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
}`);

// ─── components/contacts/LogActivityForm.tsx ─────────────────────────────────
write('components/contacts/LogActivityForm.tsx', `'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

const TYPES = [
  { value: 'MESSAGE_SENT', label: 'Message Sent' },
  { value: 'FOLLOW_UP_SCHEDULED', label: 'Follow-Up Scheduled' },
  { value: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled' },
  { value: 'OFFER_RECEIVED', label: 'Offer Received' },
  { value: 'NOTE_ADDED', label: 'Note Added' },
];

export default function LogActivityForm({ contactId }: { contactId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('MESSAGE_SENT');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setLoading(true);
    await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId, type, description }),
    });
    setDescription('');
    setOpen(false);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Log Activity
        </h2>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
        >
          <Plus size={12} /> {open ? 'Cancel' : 'Add'}
        </button>
      </div>
      {open && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            placeholder="Describe what happened..."
            className="w-full px-3 py-2 text-sm bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
          />
          <button
            type="submit"
            disabled={loading || !description.trim()}
            className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging...' : 'Log Activity'}
          </button>
        </form>
      )}
    </div>
  );
}`);

// ─── components/contacts/ImportButton.tsx ────────────────────────────────────
write('components/contacts/ImportButton.tsx', `'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';

export default function ImportButton() {
  const ref = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const text = await file.text();
    const res = await fetch('/api/contacts/import', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: text,
    });
    const data = await res.json();
    alert(\`Imported \${data.created} contacts. Errors: \${data.errors}\`);
    setLoading(false);
    router.refresh();
    if (ref.current) ref.current.value = '';
  }

  return (
    <>
      <input ref={ref} type="file" accept=".csv" onChange={handleFile} className="hidden" />
      <button
        onClick={() => ref.current?.click()}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-[#1e1e2e] hover:bg-[#2a2a3e] text-slate-300 rounded-lg border border-[#2d2d3d] transition-colors disabled:opacity-50"
      >
        <Upload size={14} /> {loading ? 'Importing...' : 'Import CSV'}
      </button>
    </>
  );
}`);

// ─── .env.local ───────────────────────────────────────────────────────────────
write('.env.local', `DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/outreach_crm?schema=public"`);

// ─── .env.example ─────────────────────────────────────────────────────────────
write('.env.example', `DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/outreach_crm?schema=public"`);

console.log('\nAll files written successfully. Run: npm install && npx prisma db push && npm run dev');
