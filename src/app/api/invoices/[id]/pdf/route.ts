import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { generateInvoicePDF } from '@/lib/pdf-generator'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    // Buscar dados da fatura com template
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        companies (*),
        clients (*),
        invoice_items (*)
      `)
      .eq('id', resolvedParams.id)
      .single()
    
    if (invoiceError || !invoiceData) {
      return NextResponse.json(
        { error: 'Fatura não encontrada' },
        { status: 404 }
      )
    }
    
    // Buscar template específico se definido, senão buscar o padrão
    let template = null
    if (invoiceData.template_id) {
      console.log('🎨 Buscando template específico:', invoiceData.template_id)
      const { data: templateData } = await supabase
        .from('invoice_templates')
        .select('*')
        .eq('id', invoiceData.template_id)
        .single()
      
      template = templateData
      console.log('🎨 Template específico encontrado:', template)
    } else {
      console.log('🎨 Buscando template padrão para empresa:', invoiceData.company_id)
      // Buscar template padrão da empresa
      const { data: defaultTemplate } = await supabase
        .from('invoice_templates')
        .select('*')
        .eq('company_id', invoiceData.company_id)
        .eq('is_default', true)
        .single()
      
      template = defaultTemplate
      console.log('🎨 Template padrão encontrado:', template)
    }
    
    console.log('🎨 Template final para PDF:', {
      templateId: template?.id,
      templateName: template?.name,
      isDefault: template?.is_default,
      hasColors: !!template?.colors,
      colorsRaw: template?.colors,
      colorsType: typeof template?.colors
    })
    
    // Gerar PDF com template correto
    const pdf = generateInvoicePDF(invoiceData, template)
    const pdfBuffer = pdf.output('arraybuffer')
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="fatura-${invoiceData.invoice_number || invoiceData.id}.pdf"`
      }
    })
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}