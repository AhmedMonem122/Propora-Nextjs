'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Building2, FileText, CreditCard, Wrench, FolderOpen, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/Card/Card';

const FEATURES = [
  { icon: Building2, title: 'Portfolio hierarchy', body: 'Properties → buildings → units with server search and pagination at every level.' },
  { icon: FileText, title: 'Leases without overlaps', body: 'Date-conflict detection, statuses and renewals — overlap errors surface instantly.' },
  { icon: CreditCard, title: 'Billing & invoices', body: 'Online checkout, PDF invoices, overdue tracking and CSV-ready reports.' },
  { icon: Wrench, title: 'Maintenance flow', body: 'Open → in progress → resolved with assignment, priorities and realtime updates.' },
  { icon: FolderOpen, title: 'Documents vault', body: 'Typed uploads per entity with progress, previews and strict size checks.' },
  { icon: BarChart3, title: 'Reports that pay off', body: 'Financial and occupancy analytics with charts and one-click CSV export.' },
];

export function FeatureGrid(): React.JSX.Element {
  const reduce = useReducedMotion();
  return (
    <section className="mx-auto max-w-6xl px-4 py-16" aria-label="Features">
      <h2 className="text-center text-3xl font-black tracking-tight">Everything a tenant operation needs</h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-muted-foreground">
        Six modules, one dashboard — built API-first and multitenant from day one.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={reduce ? undefined : { opacity: 0, y: 20 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
          >
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="space-y-2 p-5 pt-5">
                <span className="inline-flex rounded-lg bg-emerald-600/10 p-2 text-emerald-700 dark:text-emerald-400">
                  <f.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <CardTitle>{f.title}</CardTitle>
                <CardDescription>{f.body}</CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
