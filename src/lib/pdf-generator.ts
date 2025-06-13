import jsPDF from 'jspdf'
import { Database } from '@/types/database'

type Invoice = Database['public']['Tables']['invoices']['Row']
type InvoiceItem = Database['public']['Tables']['invoice_items']['Row']
type Company = Database['public']['Tables']['companies']['Row']
type Client = Database['public']['Tables']['clients']['Row']

interface InvoiceWithDetails extends Invoice {
  companies: Company | null
  clients: Client | null
  invoice_items: InvoiceItem[]
}

export function generateInvoicePDF(invoice: InvoiceWithDetails): jsPDF {
  const doc = new jsPDF()
  
  // Configurações
  const pageWidth = doc.internal.pageSize.width
  const margin = 20
  let yPosition = margin
  
  // Função auxiliar para adicionar texto
  const addText = (text: string, x: number, y: number, options?: any) => {
    doc.text(text, x, y, options)
  }
  
  // Função auxiliar para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
  
  // Função auxiliar para formatar data
  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR')
  }
  
  // Cabeçalho da empresa
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  addText(invoice.companies?.name || 'Empresa', margin, yPosition)
  
  yPosition += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  if (invoice.companies?.cnpj) {
    addText(`CNPJ: ${invoice.companies.cnpj}`, margin, yPosition)
    yPosition += 5
  }
  
  if (invoice.companies?.email) {
    addText(`Email: ${invoice.companies.email}`, margin, yPosition)
    yPosition += 5
  }
  
  if (invoice.companies?.phone) {
    addText(`Telefone: ${invoice.companies.phone}`, margin, yPosition)
    yPosition += 5
  }
  
  // Linha separadora
  yPosition += 10
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 15
  
  // Título da fatura
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  addText('FATURA', pageWidth / 2, yPosition, { align: 'center' })
  
  yPosition += 15
  
  // Informações da fatura
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  addText(`Fatura: ${invoice.title}`, margin, yPosition)
  
  yPosition += 8
  doc.setFont('helvetica', 'normal')
  addText(`Número: ${invoice.invoice_number || 'N/A'}`, margin, yPosition)
  
  yPosition += 6
  addText(`Data de Emissão: ${formatDate(invoice.issue_date)}`, margin, yPosition)
  
  yPosition += 6
  addText(`Data de Vencimento: ${formatDate(invoice.due_date)}`, margin, yPosition)
  
  yPosition += 6
  addText(`Status: ${invoice.status?.toUpperCase()}`, margin, yPosition)
  
  // Informações do cliente
  yPosition += 15
  doc.setFont('helvetica', 'bold')
  addText('CLIENTE:', margin, yPosition)
  
  yPosition += 8
  doc.setFont('helvetica', 'normal')
  addText(invoice.clients?.name || 'Cliente não informado', margin, yPosition)
  
  if (invoice.clients?.email) {
    yPosition += 6
    addText(`Email: ${invoice.clients.email}`, margin, yPosition)
  }
  
  if (invoice.clients?.phone) {
    yPosition += 6
    addText(`Telefone: ${invoice.clients.phone}`, margin, yPosition)
  }
  
  // Descrição da fatura
  if (invoice.description) {
    yPosition += 15
    doc.setFont('helvetica', 'bold')
    addText('DESCRIÇÃO:', margin, yPosition)
    
    yPosition += 8
    doc.setFont('helvetica', 'normal')
    const splitDescription = doc.splitTextToSize(invoice.description, pageWidth - 2 * margin)
    doc.text(splitDescription, margin, yPosition)
    yPosition += splitDescription.length * 5
  }
  
  // Tabela de itens
  yPosition += 15
  doc.setFont('helvetica', 'bold')
  addText('ITENS:', margin, yPosition)
  
  yPosition += 10
  
  // Cabeçalho da tabela
  const tableHeaders = ['Descrição', 'Qtd', 'Valor Unit.', 'Total']
  const colWidths = [80, 25, 35, 35]
  let xPosition = margin
  
  tableHeaders.forEach((header, index) => {
    addText(header, xPosition, yPosition)
    xPosition += colWidths[index]
  })
  
  // Linha do cabeçalho
  yPosition += 2
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8
  
  // Itens da fatura
  doc.setFont('helvetica', 'normal')
  invoice.invoice_items.forEach((item) => {
    xPosition = margin
    
    // Descrição (pode quebrar linha)
    const splitDesc = doc.splitTextToSize(item.description, colWidths[0] - 5)
    doc.text(splitDesc, xPosition, yPosition)
    xPosition += colWidths[0]
    
    // Quantidade
    addText(item.quantity.toString(), xPosition, yPosition)
    xPosition += colWidths[1]
    
    // Valor unitário
    addText(formatCurrency(item.unit_price), xPosition, yPosition)
    xPosition += colWidths[2]
    
    // Total
    addText(formatCurrency(item.total_price), xPosition, yPosition)
    
    yPosition += Math.max(splitDesc.length * 5, 8)
  })
  
  // Linha separadora
  yPosition += 5
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10
  
  // Totais
  const totalsX = pageWidth - margin - 70
  
  if (invoice.subtotal) {
    addText('Subtotal:', totalsX - 30, yPosition)
    addText(formatCurrency(invoice.subtotal), totalsX, yPosition)
    yPosition += 6
  }
  
  if (invoice.discount_percentage && invoice.discount_percentage > 0) {
    addText(`Desconto (${invoice.discount_percentage}%):`, totalsX - 30, yPosition)
    const discountAmount = (invoice.subtotal || 0) * (invoice.discount_percentage / 100)
    addText(`-${formatCurrency(discountAmount)}`, totalsX, yPosition)
    yPosition += 6
  }
  
  if (invoice.tax_percentage && invoice.tax_percentage > 0) {
    addText(`Impostos (${invoice.tax_percentage}%):`, totalsX - 30, yPosition)
    const taxAmount = (invoice.subtotal || 0) * (invoice.tax_percentage / 100)
    addText(formatCurrency(taxAmount), totalsX, yPosition)
    yPosition += 6
  }
  
  // Total final
  yPosition += 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  addText('TOTAL:', totalsX - 30, yPosition)
  addText(formatCurrency(invoice.subtotal || 0), totalsX, yPosition)
  
  // Observações
  if (invoice.notes) {
    yPosition += 20
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    addText('OBSERVAÇÕES:', margin, yPosition)
    
    yPosition += 8
    doc.setFont('helvetica', 'normal')
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin)
    doc.text(splitNotes, margin, yPosition)
  }
  
  return doc
}