import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await new Promise((resolve) => {
        resolve(cookies());
      });
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore as any });
    const { searchParams } = new URL(request.url)
    
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    
    if (!start || !end) {
      return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 })
    }

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

    // Get invoices for the specified month
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('company_id', companyId)
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false })

    if (invoicesError) throw invoicesError

    // Calculate metrics
    const paidInvoices = invoices.filter(inv => inv.status === 'paid')
    const pendingInvoices = invoices.filter(inv => inv.status === 'sent')
    
    const revenue = paidInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
    const averageInvoiceValue = invoices.length > 0 
      ? invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) / invoices.length 
      : 0

    // Find top client for the month
    const clientRevenue = new Map()
    paidInvoices.forEach(inv => {
      const clientName = inv.client?.name || 'Cliente Desconhecido'
      const current = clientRevenue.get(clientName) || 0
      clientRevenue.set(clientName, current + (inv.total_amount || 0))
    })

    const topClientEntry = clientRevenue.size > 0 
      ? Array.from(clientRevenue.entries())
          .sort((a, b) => b[1] - a[1])[0]
      : null
    
    const topClient = topClientEntry 
      ? { name: topClientEntry[0], revenue: topClientEntry[1] }
      : null

    // Format invoices for response
    const formattedInvoices = invoices.map(inv => ({
      id: inv.id,
      number: inv.invoice_number,
      client: inv.client?.name || 'Cliente Desconhecido',
      total: inv.total_amount || 0,
      status: inv.status,
      created_at: inv.created_at,
      due_date: inv.due_date
    }))

    return NextResponse.json({
      revenue,
      invoicesCount: invoices.length,
      paidInvoices: paidInvoices.length,
      pendingInvoices: pendingInvoices.length,
      averageInvoiceValue,
      topClient,
      invoices: formattedInvoices
    })
  } catch (error) {
    console.error('Error fetching monthly reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}