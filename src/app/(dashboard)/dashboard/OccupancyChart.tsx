'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export function OccupancyChart({ occupied, vacant }: { occupied: number; vacant: number }): React.JSX.Element {
  const data = [
    { name: 'Occupied', value: occupied },
    { name: 'Vacant', value: Math.max(vacant, 0) },
  ];
  if (occupied + vacant === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No occupancy data yet.</div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
          <Cell fill="#10b981" />
          <Cell fill="#0b3b5c" />
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
