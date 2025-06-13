"use client"

import { useEffect, useState } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Users, DollarSign, TrendingUp, Plus } from "lucide-react"
import { useAppContext } from "@/contexts/app-context"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface DashboardStats {
  totalInvoices: number
  totalClients: number
  totalRevenue: number
  pendingInvoices: number
  recentInvoices: any[]
  monthlyRevenue: any[]
}

export default function DashboardPage() {
  const { currentCompany } = useAppContext()
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    totalClients: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    recentInvoices: [],
    monthlyRevenue: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentCompany) {
      loadDashboardData()
    }
  }, [currentCompany])

  const loadDashboardData = async () => {
    if (!currentCompany) return

    try {
      setLoading(true)

      // Buscar estatísticas das faturas
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('company_id', currentCompany.id)

      // Buscar clientes
      const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', currentCompany.id)

      // Buscar faturas recentes com dados do cliente
      const { data: recentInvoices } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (
            name
          )
        `)
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false })
        .limit(5)

      // Calcular estatísticas
      const totalInvoices = invoices?.length || 0
      const totalClients = clients?.length || 0
      const totalRevenue = invoices?.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0) || 0
      const pendingInvoices = invoices?.filter(invoice => invoice.status === 'pending').length || 0

      // Dados para o gráfico de receita mensal
      const monthlyRevenue = generateMonthlyRevenueData(invoices || [])

      setStats({
        totalInvoices,
        totalClients,
        totalRevenue,
        pendingInvoices,
        recentInvoices: recentInvoices || [],
        monthlyRevenue
      })
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateMonthlyRevenueData = (invoices: any[]) => {
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ]

    const currentYear = new Date().getFullYear()
    const monthlyData = months.map((month, index) => {
      const monthInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.created_at)
        return invoiceDate.getFullYear() === currentYear && 
               invoiceDate.getMonth() === index &&
               invoice.status === 'paid'
      })
      
      const receita = monthInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0)
      
      return {
        month,
        receita
      }
    })

    return monthlyData
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'draft': { label: 'Rascunho', variant: 'secondary' as const },
      'pending': { label: 'Pendente', variant: 'default' as const },
      'paid': { label: 'Paga', variant: 'default' as const },
      'overdue': { label: 'Vencida', variant: 'destructive' as const },
    }
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.draft
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <div className="flex flex-1 flex-col gap-4">
        {/* Métricas principais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Faturas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClients}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturas Pendentes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Receita Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Receita Mensal</CardTitle>
            <CardDescription>Evolução da receita ao longo do ano</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Receita']}
                  labelStyle={{ color: '#000' }}
                />
                <Bar dataKey="receita" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ações rápidas e Faturas recentes */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>Acesse as funcionalidades mais utilizadas</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Link href="/invoices/new">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Fatura
                </Button>
              </Link>
              <Link href="/clients/new">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Cliente
                </Button>
              </Link>
              <Link href="/invoices">
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Ver Todas as Faturas
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Faturas recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Faturas Recentes</CardTitle>
              <CardDescription>Últimas 5 faturas criadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentInvoices.length > 0 ? (
                  stats.recentInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{invoice.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {invoice.clients?.name || 'Cliente não encontrado'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatCurrency(invoice.total_amount || 0)}
                        </p>
                        {getStatusBadge(invoice.status || 'draft')}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma fatura encontrada</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
