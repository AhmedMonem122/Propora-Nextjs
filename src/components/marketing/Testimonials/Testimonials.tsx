'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card/Card';

const QUOTES = [
  { name: 'Salma E.', role: 'Portfolio Manager, Cairo', body: 'Collection day used to take a week. With Propora billing and overdue filters, it takes an afternoon.' },
  { name: 'Omar K.', role: 'Operations Lead, Giza', body: 'The maintenance flow alone paid for the switch — residents see progress, technicians see priorities.' },
  { name: 'Nour A.', role: 'Owner, 3 buildings', body: 'Occupancy and financial reports finally agree with my accountant. The charts sold me in one demo.' },
];

export function Testimonials(): React.JSX.Element {
  const reduce = useReducedMotion();
  return (
    <section className="mx-auto max-w-6xl px-4 py-16" aria-label="Testimonials">
      <h2 className="text-center text-3xl font-black tracking-tight">Loved by managers & owners</h2>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {QUOTES.map((q, i) => (
          <motion.div
            key={q.name}
            initial={reduce ? undefined : { opacity: 0, y: 20 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
          >
            <Card className="h-full">
              <CardContent className="space-y-3 p-5 pt-5">
                <Quote className="h-6 w-6 text-emerald-600" aria-hidden="true" />
                <p className="text-sm leading-relaxed">{q.body}</p>
                <div className="flex items-center gap-1" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                  ))}
                </div>
                <p className="text-sm font-semibold">{q.name}</p>
                <p className="text-xs text-muted-foreground">{q.role}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
