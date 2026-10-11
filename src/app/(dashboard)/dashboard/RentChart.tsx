'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function RentChart({ data, currency }: { data: Array<{ month: string; collected: number }>; currency: string }): React.JSX.Element {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No monthly breakdown returned by the API yet.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="month" fontSize={12} tickLine={false} />
        <YAxis fontSize={12} tickLine={false} tickFormatter={(v: number) => `${v >= 1000 ? `${Math.round(v / 100) / 10}k` : v}`} />
        <Tooltip formatter={(v) => [`${Number(v).toLocaleString('en-EG')} ${currency}`, 'Collected']} />
        <Bar dataKey="collected" fill="#10b981" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
