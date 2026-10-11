'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const STATS = [
  { value: 1200, suffix: '+', label: 'Units managed' },
  { value: 98, suffix: '%', label: 'On-time collection' },
  { value: 24, suffix: 'h', label: 'Median maintenance SLA', prefix: '< ' },
  { value: 53, suffix: '', label: 'Granular permissions' },
];

function Counter({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }): React.JSX.Element {
  const reduce = useReducedMotion();
  const [n, setN] = useState(() => (reduce ? value : 0));
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number): void => {
      const p = Math.min((t - start) / 1200, 1);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduce]);
  return (
    <span ref={ref}>
      {prefix}
      {n.toLocaleString('en-EG')}
      {suffix}
    </span>
  );
}

export function Stats(): React.JSX.Element {
  const reduce = useReducedMotion();
  return (
    <section className="border-y bg-muted/50" aria-label="Propora in numbers">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-12 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            className="text-center"
            initial={reduce ? undefined : { opacity: 0, y: 16 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.07 }}
          >
            <p className="text-3xl font-black text-[#0b3b5c] dark:text-emerald-400 md:text-4xl">
              <Counter value={s.value} prefix={s.prefix} suffix={s.suffix} />
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>
      <div className="overflow-hidden pb-8" aria-hidden="true">
        <div className="flex justify-center gap-3 text-xs font-semibold text-muted-foreground">
          {['SUNRISE RESIDENCES', 'NILE GARDENS', 'PALM COURTS', 'OASIS TOWERS', 'CEDAR HEIGHTS'].map((b) => (
            <span key={b} className="rounded-full border px-4 py-1.5">
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
