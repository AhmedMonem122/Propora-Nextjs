import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/Card/Card';

const PLANS = [
  { name: 'Starter', price: 'Free', body: 'For owners getting organized.', feats: ['Up to 25 units', 'Leases & payments', 'Documents vault'] },
  { name: 'Growth', price: 'EGP 499/mo', body: 'For managers scaling up.', feats: ['Unlimited units', 'Maintenance flow', 'Reports + CSV export', 'Webhooks & audit log'], hot: true },
  { name: 'Enterprise', price: 'Custom', body: 'For portfolios & groups.', feats: ['Roles & permissions', 'Realtime ops', 'Dedicated support'] },
];

export function PricingTeaser(): React.JSX.Element {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16" aria-label="Pricing">
      <h2 className="text-center text-3xl font-black tracking-tight">Simple pricing, serious value</h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-muted-foreground">Start free. Upgrade when your portfolio does.</p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <Card key={p.name} className={p.hot ? 'border-emerald-500 shadow-lg' : undefined}>
            <CardContent className="space-y-3 p-6 pt-6">
              <CardTitle>{p.name}</CardTitle>
              <p className="text-2xl font-black">{p.price}</p>
              <CardDescription>{p.body}</CardDescription>
              <ul className="space-y-2 text-sm">
                {p.feats.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" /> {f}
                  </li>
                ))}
              </ul>
              <Button variant={p.hot ? 'accent' : 'outline'} asChild className="w-full">
                <Link href="/register">Get started</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
