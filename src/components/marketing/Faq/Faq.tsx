'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const FAQS = [
  { q: 'Do I need to migrate my spreadsheets?', a: 'No. Create your properties, buildings and units in minutes, import residents, and attach existing leases as documents. CSV report exports keep your accountant happy.' },
  { q: 'How do online payments work?', a: 'Each payment gets a secure checkout link. Residents pay online, you download the PDF invoice, and overdue filters keep collection on track.' },
  { q: 'Can my team have different permissions?', a: 'Yes — 53 granular permissions across properties, leases, payments, maintenance and more. Gate every screen and action by role.' },
  { q: 'Is my data isolated from other organizations?', a: 'Fully multitenant: every record belongs to your organization, enforced server-side. The UI never sees other tenants.' },
  { q: 'Does it work in dark mode and on mobile?', a: 'Yes — dark mode from day one, and every screen is responsive from 360px phones to wide desktops.' },
];

export function Faq(): React.JSX.Element {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mx-auto max-w-3xl px-4 py-16" aria-label="Frequently asked questions">
      <h2 className="text-center text-3xl font-black tracking-tight">Questions, answered</h2>
      <div className="mt-8 divide-y rounded-xl border bg-card">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium cursor-pointer"
              >
                {f.q}
                <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', isOpen && 'rotate-180')} aria-hidden="true" />
              </button>
              {isOpen ? <p className="px-5 pb-5 text-sm text-muted-foreground">{f.a}</p> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
