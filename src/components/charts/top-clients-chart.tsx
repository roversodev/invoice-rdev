'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TopClient } from '@/types/reports'

interface TopClientsChartProps {
  data: TopClient[]
}

export function TopClientsChart({ data }: TopClientsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="horizontal">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          type="number"
          tickFormatter={(value) => 
            new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value)
          }
        />
        <YAxis dataKey="name" type="category" width={100} />
        <Tooltip 
          formatter={(value: number) => [
            new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(value),
            'Receita'
          ]}
        />
        <Bar dataKey="revenue" fill="hsl(var(--primary))" />
      </BarChart>
    </ResponsiveContainer>
  )
}