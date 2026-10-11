import type { Metadata } from 'next';
import { ShieldCheck, Zap, HeartHandshake } from 'lucide-react';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/Card/Card';
import { Stats } from '@/components/marketing/Stats/Stats';
import { CtaSection } from '@/components/marketing/CtaSection/CtaSection';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Why Propora exists: better properties, happier communities — software that respects managers, residents and owners.',
};

const VALUES = [
  { icon: ShieldCheck, title: 'Trust by isolation', body: 'Multitenancy is not a feature — it is the architecture. Your data is yours, enforced server-side on every request.' },
  { icon: Zap, title: 'Speed is respect', body: 'Server search, pagination, skeletons and debounced inputs everywhere. No spinners that lie, no layout shift.' },
  { icon: HeartHandshake, title: 'People over paperwork', body: 'Every flow removes a spreadsheet, a phone call, or a queue — so teams spend time on residents, not admin.' },
];

export default function AboutPage(): React.JSX.Element {
  return (
    <>
      <section className="bg-[#0b1f3a] text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">About us</p>
          <h1 className="mt-2 max-w-2xl text-balance text-4xl font-black md:text-5xl">Property software that treats people like neighbors.</h1>
          <p className="mt-4 max-w-xl text-slate-300">
            Propora started from a simple frustration: managing buildings with spreadsheets, chat threads and
            paper receipts. We built the dashboard we wished existed.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {VALUES.map((v) => (
            <Card key={v.title} className="h-full">
              <CardContent className="space-y-2 p-5 pt-5">
                <span className="inline-flex rounded-lg bg-emerald-600/10 p-2 text-emerald-700 dark:text-emerald-400">
                  <v.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <CardTitle>{v.title}</CardTitle>
                <CardDescription>{v.body}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <Stats />
      <div className="pt-4">
        <CtaSection />
      </div>
    </>
  );
}
