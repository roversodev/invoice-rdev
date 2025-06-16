'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarIcon, Download } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface MonthlyData {
  revenue: number
  invoicesCount: number
  paidInvoices: number
  pendingInvoices: number
  averageInvoiceValue: number
  topClient: {
    name: string
    revenue: number
  } | null
  invoices: Array<{
    id: string
    number: string
    client: string
    total: number
    status: string
    created_at: string
    due_date: string
  }>
}

export default function MonthlyReportsPage() {
  const [data, setData] = useState<MonthlyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  useEffect(() => {
    fetchMonthlyData()
  }, [selectedMonth])

  const fetchMonthlyData = async () => {
    try {
      const monthStart = startOfMonth(selectedMonth)
      const monthEnd = endOfMonth(selectedMonth)
      
      const response = await fetch(
        `/api/reports/monthly?start=${monthStart.toISOString()}&end=${monthEnd.toISOString()}`
      )
      
      if (response.ok) {
        const monthlyData = await response.json()
        setData(monthlyData)
      }
    } catch (error) {
      console.error('Error fetching monthly data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-[400px]">Carregando...</div>
  }

  if (!data) {
    return <div className="flex items-center justify-center h-[400px]">Erro ao carregar dados</div>
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatório Mensal</h1>
          <p className="text-muted-foreground">
            {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Métricas do mês */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Receita do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(data.revenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Faturas Criadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.invoicesCount}</div>
            <p className="text-sm text-muted-foreground">
              {data.paidInvoices} pagas, {data.pendingInvoices} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(data.averageInvoiceValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top cliente do mês */}
      {data.topClient && (
        <Card>
          <CardHeader>
            <CardTitle>Cliente Destaque do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-lg">{data.topClient.name}</p>
                <p className="text-muted-foreground">Maior receita do mês</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(data.topClient.revenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de faturas do mês */}
      <Card>
        <CardHeader>
          <CardTitle>Faturas do Mês</CardTitle>
          <CardDescription>Todas as faturas criadas neste período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{invoice.number}</p>
                  <p className="text-sm text-muted-foreground">{invoice.client}</p>
                  <p className="text-xs text-muted-foreground">
                    Criada em {format(new Date(invoice.created_at), 'dd/MM/yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(invoice.total)}
                  </p>
                  <Badge 
                    variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {invoice.status === 'paid' ? 'Pago' : 'Pendente'}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {invoice.due_date ? (
                      `Vence em ${format(new Date(invoice.due_date), 'dd/MM/yyyy')}`
                    ) : (
                      'Data de vencimento não definida'
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}