import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

export async function GET() {
  try {
    const cookieStore = await new Promise((resolve) => {
      resolve(cookies());
    });
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore as any });
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to find current company
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('current_company_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.current_company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 400 })
    }

    const companyId = profile.current_company_id

    const now = new Date()
    const currentMonthStart = startOfMonth(now)
    const currentMonthEnd = endOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))

    // Get all invoices for the company
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (invoicesError) throw invoicesError

    // Calculate metrics
    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)

    const currentMonthRevenue = invoices
      .filter(inv => 
        inv.status === 'paid' && 
        new Date(inv.created_at) >= currentMonthStart && 
        new Date(inv.created_at) <= currentMonthEnd
      )
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)

    const lastMonthRevenue = invoices
      .filter(inv => 
        inv.status === 'paid' && 
        new Date(inv.created_at) >= lastMonthStart && 
        new Date(inv.created_at) <= lastMonthEnd
      )
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)

    const pendingInvoices = invoices.filter(inv => inv.status === 'sent')
    const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
    
    const overdueInvoices = invoices.filter(inv => 
      inv.status === 'sent' && 
      inv.due_date && 
      new Date(inv.due_date) < now && 
      !isNaN(new Date(inv.due_date).getTime())
    )

    // Revenue by month (last 6 months)
    const revenueByMonth = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i)
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)
      
      const monthRevenue = invoices
        .filter(inv => 
          inv.status === 'paid' && 
          new Date(inv.created_at) >= monthStart && 
          new Date(inv.created_at) <= monthEnd
        )
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
      
      revenueByMonth.push({
        month: format(monthDate, 'MMM yyyy'),
        revenue: monthRevenue
      })
    }

    // Invoice status distribution
    const statusDistribution = [
      { status: 'Pago', count: invoices.filter(inv => inv.status === 'paid').length },
      { status: 'Pendente', count: invoices.filter(inv => inv.status === 'pending').length },
      { status: 'Vencido', count: overdueInvoices.length },
    ]

    // Top clients by revenue
    const clientRevenue = new Map()
    invoices
      .filter(inv => inv.status === 'paid')
      .forEach(inv => {
        const clientName = inv.client?.name || 'Cliente Desconhecido'
        const current = clientRevenue.get(clientName) || 0
        clientRevenue.set(clientName, current + (inv.total_amount || 0))
      })

    const topClients = Array.from(clientRevenue.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, revenue]) => ({ name, revenue }))

    // Recent invoices
    const recentInvoices = invoices
      .slice(0, 5)
      .map(inv => ({
        id: inv.id,
        number: inv.invoice_number,
        client: inv.client?.name || 'Cliente Desconhecido',
        total: inv.total_amount || 0,
        status: inv.status
      }))

    return NextResponse.json({
      metrics: {
        totalRevenue,
        currentMonthRevenue,
        lastMonthRevenue,
        revenueGrowth: lastMonthRevenue > 0 
          ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
          : 0,
        totalInvoices: invoices.length,
        pendingInvoices: pendingInvoices.length,
        overdueInvoices: overdueInvoices.length,
        pendingAmount: pendingInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
      },
      charts: {
        revenueByMonth,
        statusDistribution,
        topClients
      },
      recentInvoices
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}