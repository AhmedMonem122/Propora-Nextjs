import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, FileText, CreditCard, Wrench, FolderOpen, BarChart3, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/Card/Card';
import { CtaSection } from '@/components/marketing/CtaSection/CtaSection';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Portfolio hierarchy, leases, billing, maintenance, documents and reports — everything Propora manages for you.',
};

const SERVICES = [
  { icon: Building2, title: 'Portfolio management', body: 'Properties, buildings and units in one hierarchy with search, filters and pagination. Unit-type catalog keeps listings consistent.' },
  { icon: FileText, title: 'Leasing', body: 'Create leases with overlap protection, track statuses from upcoming to terminated, and link every lease to its unit and resident.' },
  { icon: CreditCard, title: 'Payments & billing', body: 'Rent, deposits and fees with online checkout, PDF invoices, overdue detection and per-lease payment history.' },
  { icon: Wrench, title: 'Maintenance operations', body: 'Requests with priorities, assignment, and a clear open → resolved flow — with realtime updates for the whole team.' },
  { icon: FolderOpen, title: 'Documents vault', body: 'Leases, IDs, inspections and financials attached to the right entity, with type and size checks before upload.' },
  { icon: BarChart3, title: 'Reports & audit', body: 'Financial and occupancy reports with charts and CSV export, plus a full audit log and webhooks for integrations.' },
];

export default function ServicesPage(): React.JSX.Element {
  return (
    <>
      <section className="bg-[#052e22] text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Services</p>
          <h1 className="mt-2 max-w-2xl text-balance text-4xl font-black md:text-5xl">One platform for the entire tenant lifecycle.</h1>
          <p className="mt-4 max-w-xl text-emerald-100">From listing a unit to collecting rent to fixing the AC — Propora covers it end to end.</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <Card key={s.title} className="h-full">
              <CardContent className="space-y-2 p-5 pt-5">
                <span className="inline-flex rounded-lg bg-emerald-600/10 p-2 text-emerald-700 dark:text-emerald-400">
                  <s.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <CardTitle>{s.title}</CardTitle>
                <CardDescription>{s.body}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button variant="accent" size="lg" asChild>
            <Link href="/register">
              Start free <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
      <CtaSection />
    </>
  );
}
