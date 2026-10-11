'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { Card, CardContent } from '@/components/ui/Card/Card';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export function Hero(): React.JSX.Element {
  const reduce = useReducedMotion();
  const anim = reduce ? {} : { initial: 'hidden', whileInView: 'show', viewport: { once: true } };
  return (
    <section className="relative overflow-hidden bg-[#0b1f3a] text-white">
      <div className="bg-grid-navy absolute inset-0" aria-hidden="true" />
      <div
        className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-emerald-500/25 blur-3xl"
        aria-hidden="true"
      />
      <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-2 md:py-28">
        <motion.div {...anim} variants={fadeUp} transition={{ duration: 0.6 }}>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Property management, reimagined
          </p>
          <h1 className="mt-5 text-balance text-4xl font-black leading-tight md:text-6xl">
            Better Properties. <span className="text-emerald-400">Happier Communities.</span>
          </h1>
          <p className="mt-5 max-w-lg text-slate-300">
            Propora unifies properties, leases, payments, maintenance and documents in one fast,
            multitenant dashboard — so managers spend time on people, not paperwork.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="accent" size="lg" asChild>
              <Link href="/register">
                Start free <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/services">Explore services</Link>
            </Button>
          </div>
        </motion.div>
        <motion.div {...anim} variants={fadeUp} transition={{ duration: 0.6, delay: 0.15 }} className="grid content-center gap-4">
          {[
            { k: 'Occupancy', v: '96.4%', d: 'Across 1,200+ managed units' },
            { k: 'Rent collected on time', v: '98.1%', d: 'Automated billing & reminders' },
            { k: 'Maintenance SLA', v: '< 24h', d: 'Median resolution time' },
          ].map((s) => (
            <Card key={s.k} className="border-white/10 bg-white/5 text-white backdrop-blur">
              <CardContent className="flex items-center justify-between p-4 pt-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">{s.k}</p>
                  <p className="text-2xl font-black text-emerald-400">{s.v}</p>
                  <p className="text-xs text-slate-400">{s.d}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
