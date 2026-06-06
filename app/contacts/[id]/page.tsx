import { prisma } from '@/lib/prisma';
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
}