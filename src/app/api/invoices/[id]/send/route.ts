import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Resend } from 'resend'
import { render } from '@react-email/render'
import { Database } from '@/types/database'
import { generateInvoicePDF } from '@/lib/pdf-generator'
import { InvoiceEmailTemplate } from '@/lib/email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(
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
    
    // Buscar dados da fatura
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        companies (*),
        clients (*),
        invoice_items (*)
      `)
      .eq('id', resolvedParams.id)
      .single()
    
    if (error || !invoice) {
      return NextResponse.json({ error: 'Fatura não encontrada' }, { status: 404 })
    }
    
    if (!invoice.clients?.email) {
      return NextResponse.json({ error: 'Cliente não possui email cadastrado' }, { status: 400 })
    }
    
    if (!invoice.companies?.email) {
      return NextResponse.json({ error: 'Empresa não possui email cadastrado' }, { status: 400 })
    }
    
    // Buscar template específico se definido, senão buscar o padrão
    let template = null
    if (invoice.template_id) {
      const { data: templateData } = await supabase
        .from('invoice_templates')
        .select('*')
        .eq('id', invoice.template_id)
        .single()
      
      template = templateData
    } else {
      // Buscar template padrão da empresa
      const { data: defaultTemplate } = await supabase
        .from('invoice_templates')
        .select('*')
        .eq('company_id', invoice.company_id)
        .eq('is_default', true)
        .single()
      
      template = defaultTemplate
    }
    
    // Gerar PDF com template correto
    const pdf = generateInvoicePDF(invoice, template)
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
    
    // Renderizar template de email (AGUARDAR a Promise)
    const emailHtml = await render(
      InvoiceEmailTemplate({
        invoice,
        company: invoice.companies,
        client: invoice.clients
      })
    )
    
    // Enviar email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Fatura <noreply@roversodev.com.br>',
      to: [invoice.clients.email],
      subject: `Fatura ${invoice.invoice_number || invoice.title} - ${invoice.companies.name}`,
      html: emailHtml,
      attachments: [
        {
          filename: `fatura-${invoice.invoice_number || invoice.id}.pdf`,
          content: pdfBuffer,
        },
      ],
    })
    
    if (emailError) {
      console.error('Erro ao enviar email:', emailError)
      return NextResponse.json({ error: 'Erro ao enviar email' }, { status: 500 })
    }
    
    // Atualizar status da fatura para 'sent' se ainda estiver como 'draft'
    if (invoice.status === 'draft') {
      await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', (await params).id)
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Email enviado com sucesso',
      emailId: emailData?.id
    })
    
  } catch (error) {
    console.error('Erro ao enviar fatura:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}