import { prisma } from '@/lib/prisma';
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
}