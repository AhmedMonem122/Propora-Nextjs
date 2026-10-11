import type { Metadata } from 'next';
import { Mail, MapPin, Phone } from 'lucide-react';
import { ContactForm } from '@/components/marketing/ContactForm/ContactForm';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Tell us about your portfolio — the Propora team replies within one business day.',
};

export default function ContactPage(): React.JSX.Element {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Contact us</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Let&apos;s talk about your portfolio.</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">Tell us about your properties — we reply within one business day.</p>
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <ContactForm />
        <div className="space-y-4">
          {[
            { icon: Mail, label: 'Email', value: 'hello@propora.app' },
            { icon: Phone, label: 'Phone', value: '+20 100 123 4567' },
            { icon: MapPin, label: 'Office', value: 'Nile Corniche, Cairo, Egypt' },
          ].map((c) => (
            <div key={c.label} className="flex items-center gap-3 rounded-xl border bg-card p-4">
              <span className="rounded-lg bg-emerald-600/10 p-2 text-emerald-700 dark:text-emerald-400">
                <c.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</p>
                <p className="font-medium">{c.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
