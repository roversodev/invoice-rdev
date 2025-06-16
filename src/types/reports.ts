export interface ReportMetrics {
  totalRevenue: number
  currentMonthRevenue: number
  lastMonthRevenue: number
  revenueGrowth: number
  totalInvoices: number
  pendingInvoices: number
  overdueInvoices: number
  pendingAmount: number
}

export interface RevenueByMonth {
  month: string
  revenue: number
}

export interface StatusDistribution {
  status: string
  count: number
}

export interface TopClient {
  name: string
  revenue: number
}

export interface RecentInvoice {
  id: string
  number: string
  client: string
  total: number
  status: string
  created_at: string
}

export interface ReportCharts {
  revenueByMonth: RevenueByMonth[]
  statusDistribution: StatusDistribution[]
  topClients: TopClient[]
}

export interface ReportsData {
  metrics: ReportMetrics
  charts: ReportCharts
  recentInvoices: RecentInvoice[]
}