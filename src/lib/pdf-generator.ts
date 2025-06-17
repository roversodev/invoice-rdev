import jsPDF from 'jspdf'
import { Database } from '@/types/database'

type Invoice = Database['public']['Tables']['invoices']['Row']
type InvoiceItem = Database['public']['Tables']['invoice_items']['Row']
type Company = Database['public']['Tables']['companies']['Row']
type Client = Database['public']['Tables']['clients']['Row']
type InvoiceTemplate = Database['public']['Tables']['invoice_templates']['Row']

interface InvoiceWithDetails extends Invoice {
  companies: Company | null
  clients: Client | null
  invoice_items: InvoiceItem[]
  invoice_templates?: InvoiceTemplate | null
}

// Função auxiliar para converter hex para RGB
const hexToRgb = (hex: string) => {
  const cleanHex = hex.replace('#', '')
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex)
  
  if (result) {
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    }
  }
  return { r: 0, g: 0, b: 0 } // fallback para preto
}

export function generateInvoicePDF(
  invoice: InvoiceWithDetails,
  template: InvoiceTemplate | null,
): jsPDF {
  const doc = new jsPDF()
  
  // Configurações minimalistas
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 20
  let yPosition = margin
  
  // Usar cores do template ou cores padrão
  const templateColors = invoice.invoice_templates?.colors
  const colors = {
    primary: templateColors?.primary || '#18181b',     // zinc-900 como fallback
    secondary: '#71717a',   // zinc-500 (mantém fixo para texto secundário)
    muted: '#a1a1aa',      // zinc-400 (mantém fixo para texto muted)
    border: '#e4e4e7',     // zinc-200 (mantém fixo para bordas)
    accent: templateColors?.accent || '#3b82f6',      // Cor de destaque do template
    destructive: '#ef4444' // red-500 (mantém fixo para erros)
  }
  
  const primaryRgb = hexToRgb(colors.primary)
  const secondaryRgb = hexToRgb(colors.secondary)
  const mutedRgb = hexToRgb(colors.muted)
  const borderRgb = hexToRgb(colors.border)
  const accentRgb = hexToRgb(colors.accent)
  const destructiveRgb = hexToRgb(colors.destructive)
  
  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
  
  // Função para formatar data
  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR')
  }
  
  // Calcular valores (igual à página pública)
  const subtotal = invoice.subtotal || invoice.invoice_items?.reduce(
    (sum: number, item: any) => sum + (item.quantity * item.unit_price), 0
  ) || 0
  
  const discountAmount = invoice.discount_amount || (subtotal * ((invoice.discount_percentage || 0) / 100))
  const taxAmount = invoice.tax_amount || ((subtotal - discountAmount) * ((invoice.tax_percentage || 0) / 100))
  const totalAmount = invoice.total_amount || (subtotal - discountAmount + taxAmount)
  
  // HEADER MINIMALISTA
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('Fatura', margin, yPosition + 5)
  
  // Número da fatura
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b)
  doc.text(`Número da fatura: ${invoice.invoice_number || '1'}`, margin, yPosition + 15)
  
  // Data de emissão
  doc.text(`Data de emissão: ${formatDate(invoice.issue_date)}`, margin, yPosition + 25)
  
  yPosition += 45
  
  // SEÇÃO DE INFORMAÇÕES (duas colunas)
  const colWidth = (pageWidth - 3 * margin) / 2
  
  // Informações da empresa (coluna esquerda)
  if (invoice.companies) {
    doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('De:', margin, yPosition)
    
    doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    let companyY = yPosition + 10
    doc.text(invoice.companies.name, margin, companyY)
    
    if (invoice.companies.email) {
      companyY += 8
      doc.text(invoice.companies.email, margin, companyY)
    }
    
    if (invoice.companies.phone) {
      companyY += 8
      doc.text(invoice.companies.phone, margin, companyY)
    }
    
    if (invoice.companies.address) {
      companyY += 8
      doc.text(invoice.companies.address, margin, companyY)
    }
  }
  
  // Informações do cliente (coluna direita)
  if (invoice.clients) {
    const clientX = margin + colWidth + margin
    
    doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Para:', clientX, yPosition)
    
    doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    let clientY = yPosition + 10
    doc.text(invoice.clients.name, clientX, clientY)
    
    if (invoice.clients.email) {
      clientY += 8
      doc.text(invoice.clients.email, clientX, clientY)
    }
    
    if (invoice.clients.phone) {
      clientY += 8
      doc.text(invoice.clients.phone, clientX, clientY)
    }
  }
  
  yPosition += 80
  
  // TABELA DE ITENS
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Itens da Fatura', margin, yPosition)
  
  yPosition += 15
  
  // Cabeçalho da tabela
  const tableStartY = yPosition
  const tableHeaders = ['Descrição', 'Qtd', 'Valor Unit.', 'Total']
  const colWidths = [90, 25, 35, 35]
  let currentX = margin
  
  // Fundo do cabeçalho
  doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
  doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 15, 'F')
  
  // Texto do cabeçalho
  doc.setTextColor(255, 255, 255) // Branco
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  
  tableHeaders.forEach((header, index) => {
    const textAlign = index === 0 ? 'left' : index === 1 ? 'center' : 'right'
    if (textAlign === 'center') {
      doc.text(header, currentX + colWidths[index] / 2, yPosition + 5, { align: 'center' })
    } else if (textAlign === 'right') {
      doc.text(header, currentX + colWidths[index] - 5, yPosition + 5, { align: 'right' })
    } else {
      doc.text(header, currentX + 5, yPosition + 5)
    }
    currentX += colWidths[index]
  })
  
  yPosition += 15
  
  // Itens da tabela
  doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b)
  doc.setFont('helvetica', 'normal')
  
  invoice.invoice_items?.forEach((item, index) => {
    const isEven = index % 2 === 0
    
    // Fundo alternado
    if (isEven) {
      doc.setFillColor(250, 250, 250)
      doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 12, 'F')
    }
    
    currentX = margin
    const itemTotal = item.quantity * item.unit_price
    
    // Descrição
    doc.text(item.description || 'Item', currentX + 5, yPosition + 3)
    currentX += colWidths[0]
    
    // Quantidade
    doc.text(item.quantity.toString(), currentX + colWidths[1] / 2, yPosition + 3, { align: 'center' })
    currentX += colWidths[1]
    
    // Valor unitário
    doc.text(formatCurrency(item.unit_price), currentX + colWidths[2] - 5, yPosition + 3, { align: 'right' })
    currentX += colWidths[2]
    
    // Total do item (usando cor de destaque)
    doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b)
    doc.setFont('helvetica', 'bold')
    doc.text(formatCurrency(itemTotal), currentX + colWidths[3] - 5, yPosition + 3, { align: 'right' })
    
    // Resetar cor e fonte
    doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b)
    doc.setFont('helvetica', 'normal')
    
    yPosition += 12
  })
  
  yPosition += 20
  
  // SEÇÃO DE TOTAIS
  const totalsX = pageWidth - margin - 80
  
  // Subtotal
  doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b)
  doc.setFontSize(10)
  doc.text('Subtotal:', totalsX, yPosition)
  doc.text(formatCurrency(subtotal), totalsX + 60, yPosition, { align: 'right' })
  yPosition += 12
  
  // Desconto (se houver)
  if (discountAmount > 0) {
    doc.text('Desconto:', totalsX, yPosition)
    doc.text(`-${formatCurrency(discountAmount)}`, totalsX + 60, yPosition, { align: 'right' })
    yPosition += 12
  }
  
  // Imposto (se houver)
  if (taxAmount > 0) {
    doc.text('Imposto:', totalsX, yPosition)
    doc.text(formatCurrency(taxAmount), totalsX + 60, yPosition, { align: 'right' })
    yPosition += 12
  }
  
  // Linha separadora
  doc.setDrawColor(borderRgb.r, borderRgb.g, borderRgb.b)
  doc.line(totalsX, yPosition, totalsX + 60, yPosition)
  yPosition += 8
  
  // Total final (usando cor primária e de destaque)
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL:', totalsX, yPosition)
  
  doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b)
  doc.text(formatCurrency(totalAmount), totalsX + 60, yPosition, { align: 'right' })
  
  yPosition += 30
  
  // RODAPÉ
  doc.setTextColor(mutedRgb.r, mutedRgb.g, mutedRgb.b)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Obrigado pela preferência!', margin, yPosition)
  
  // Data de geração no rodapé
  const currentDate = new Date().toLocaleDateString('pt-BR')
  doc.text(`Gerado em ${currentDate}`, pageWidth - margin, yPosition, { align: 'right' })
  
  return doc
}
