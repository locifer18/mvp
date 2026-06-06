import { prisma } from '@/lib/prisma';
import ContactsTable from '@/components/contacts/ContactsTable';
import Link from 'next/link';
import { Plus, Download } from 'lucide-react';
import { Contact } from '@/types';

interface SearchParams extends Record<string, string | undefined> {
  search?: string;
  status?: string;
  priority?: string;
  platform?: string;
  responseStatus?: string;
  page?: string;
  sort?: string;
  order?: string;
}

async function getContacts(params: SearchParams) {
  const page = parseInt(params.page || '1');
  const pageSize = 50;
  const where: Record<string, unknown> = { deletedAt: null };

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { company: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } },
      { jobProfile: { contains: params.search, mode: 'insensitive' } },
    ];
  }
  if (params.status) where.status = params.status;
  if (params.priority) where.priority = params.priority;
  if (params.platform) where.platform = params.platform;
  if (params.responseStatus) where.responseStatus = params.responseStatus;

  const sortField = params.sort || 'createdAt';
  const sortOrder = (params.order || 'desc') as 'asc' | 'desc';

  const [raw, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.contact.count({ where }),
  ]);

  // Serialize all Date fields to ISO strings so they match the Contact type
  const contacts: Contact[] = raw.map(c => ({
    ...c,
    followUpDate:    c.followUpDate    ? c.followUpDate.toISOString()    : null,
    lastContactedAt: c.lastContactedAt ? c.lastContactedAt.toISOString() : null,
    deletedAt:       c.deletedAt       ? c.deletedAt.toISOString()       : null,
    createdAt:       c.createdAt.toISOString(),
    updatedAt:       c.updatedAt.toISOString(),
    followUpCount:   (c as Record<string, unknown>).followUpCount as number ?? 0,
  }));

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
}
