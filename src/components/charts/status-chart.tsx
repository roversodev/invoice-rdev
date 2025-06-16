'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { StatusDistribution } from '@/types/reports'

interface StatusChartProps {
  data: StatusDistribution[]
}

const COLORS = {
  'Pago': 'hsl(var(--chart-1))',
  'Pendente': 'hsl(var(--chart-2))',
  'Vencido': 'hsl(var(--chart-3))'
}

export function StatusChart({ data }: StatusChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ status, count }) => `${status}: ${count}`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="count"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.status as keyof typeof COLORS]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}