import ContactForm from '@/components/contacts/ContactForm';

export default function NewContactPage() {
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-100 mb-6">Add Contact</h1>
      <ContactForm />
    </div>
  );
}