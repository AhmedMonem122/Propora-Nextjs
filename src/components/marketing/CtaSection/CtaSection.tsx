'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';

export function CtaSection(): React.JSX.Element {
  const reduce = useReducedMotion();
  return (
    <section className="px-4 pb-20" aria-label="Get started">
      <motion.div
        initial={reduce ? undefined : { opacity: 0, y: 24 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-emerald-900 px-6 py-14 text-center text-white md:py-20"
      >
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/25 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" aria-hidden="true" />
        <h2 className="relative text-balance text-3xl font-black md:text-4xl">Run your portfolio like a pro — from day one.</h2>
        <p className="relative mx-auto mt-3 max-w-xl text-slate-300">
          Create your organization in under a minute. No credit card, no migration headache.
        </p>
        <div className="relative mt-8 flex justify-center gap-3">
          <Button variant="accent" size="lg" asChild>
            <Link href="/register">
              Get started free <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
            <Link href="/contact">Talk to us</Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
