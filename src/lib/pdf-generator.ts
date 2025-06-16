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
}

// Função auxiliar para converter hex para RGB
const hexToRgb = (hex: string) => {
  const cleanHex = hex.replace('#', '')
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex)
  
  if (result) {
    const rgb = {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    }
    return rgb
  } else {
    console.warn(`🎨 Erro ao converter ${hex}, usando fallback azul`)
    return { r: 59, g: 130, b: 246 }
  }
}

// Função auxiliar para parsear dados JSON do template
const parseTemplateData = (data: any) => {
  if (!data) return null
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data)
      return parsed
    } catch (e) {
      console.error('🎨 Erro ao parsear JSON:', e, 'Data:', data)
      return null
    }
  }
  return data
}

export function generateInvoicePDF(
  invoice: InvoiceWithDetails, 
  template?: InvoiceTemplate
): jsPDF {
  const doc = new jsPDF()

  
  // Configurações do template
  const templateColors = parseTemplateData(template?.colors)
  const templateFonts = parseTemplateData(template?.fonts)
  
  
  // Usar as cores do template ou fallback para cores padrão
  const colors = {
    primary: templateColors?.primary || '#7601ad',
    secondary: templateColors?.secondary || '#5f6772',
    accent: templateColors?.accent || '#34004d',
    background: templateColors?.background || '#ffffff',
    text: templateColors?.text || '#1f2937',
    textLight: templateColors?.textLight || templateColors?.secondary || '#6b7280',
    success: templateColors?.success || templateColors?.accent || '#10b981',
    warning: templateColors?.warning || '#f59e0b',
    error: templateColors?.error || '#ef4444'
  }
  
  
  const fonts = {
    heading: templateFonts?.heading || 'helvetica',
    body: templateFonts?.body || 'helvetica'
  }
  
  // Configurações da página OTIMIZADAS
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 15
  let yPosition = 10
  
  // Converter cores hex para RGB
  const primaryRgb = hexToRgb(colors.primary)
  const secondaryRgb = hexToRgb(colors.secondary)
  const accentRgb = hexToRgb(colors.accent)
  const textRgb = hexToRgb(colors.text)
  const textLightRgb = hexToRgb(colors.textLight)
  
  // Função para separador com cor do template
  const addThemedSeparator = (y: number, color: [number, number, number]) => {
    doc.setDrawColor(...color)
    doc.setLineWidth(0.3)
    doc.line(margin, y, pageWidth - margin, y)
  }
  
  // Função para adicionar sombra sutil (minimalista)
  const addSubtleShadow = (x: number, y: number, width: number, height: number) => {
    // Sombra única e sutil
    doc.setFillColor(240, 240, 240)
    doc.rect(x + 1, y + 1, width, height, 'F')
  }
  
  // Função auxiliar para adicionar texto com cores do template
  const addText = (text: string, x: number, y: number, options?: any) => {
    const textColor = options?.color ? hexToRgb(options.color) : textRgb
    doc.setTextColor(textColor.r, textColor.g, textColor.b)
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
  
  // HEADER LIMPO E PROFISSIONAL
  const headerHeight = 50
  
  // Fundo principal do header (sem gradiente)
  doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
  doc.rect(0, 0, pageWidth, headerHeight, 'F')
  
  // Linha superior sutil
  const darkerPrimary = {
    r: Math.max(0, primaryRgb.r - 15),
    g: Math.max(0, primaryRgb.g - 15),
    b: Math.max(0, primaryRgb.b - 15)
  }
  doc.setFillColor(darkerPrimary.r, darkerPrimary.g, darkerPrimary.b)
  doc.rect(0, 0, pageWidth, 2, 'F')
  
  // Nome da empresa (sem sombra)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont(fonts.heading, 'bold')
  doc.text(invoice.companies?.name || 'Empresa', margin, 25)
  
  // Informações da empresa em linha única (sem bullets)
  doc.setFontSize(9)
  doc.setFont(fonts.body, 'normal')
  const companyInfo = []
  if (invoice.companies?.cnpj) companyInfo.push(`CNPJ: ${invoice.companies.cnpj}`)
  if (invoice.companies?.email) companyInfo.push(invoice.companies.email)
  if (invoice.companies?.phone) companyInfo.push(invoice.companies.phone)
  doc.text(companyInfo.join(' • '), margin, 35)
  
  // Card do número da fatura (sombra sutil)
  const invoiceBoxWidth = 60
  const invoiceBoxHeight = 25
  const invoiceBoxX = pageWidth - margin - invoiceBoxWidth
  const invoiceBoxY = 15
  
  // Sombra sutil
  addSubtleShadow(invoiceBoxX, invoiceBoxY, invoiceBoxWidth, invoiceBoxHeight)
  
  // Card principal
  doc.setFillColor(255, 255, 255)
  doc.rect(invoiceBoxX, invoiceBoxY, invoiceBoxWidth, invoiceBoxHeight, 'F')
  doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
  doc.setLineWidth(0.5)
  doc.rect(invoiceBoxX, invoiceBoxY, invoiceBoxWidth, invoiceBoxHeight)
  
  // Status badge minimalista
  const statusColor = invoice.status === 'PAID' ? [34, 197, 94] : 
                     invoice.status === 'DRAFT' ? [156, 163, 175] : 
                     [primaryRgb.r, primaryRgb.g, primaryRgb.b]
  
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2])
  doc.rect(invoiceBoxX + 2, invoiceBoxY + 2, 10, 5, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(5)
  doc.text(invoice.status || 'DRAFT', invoiceBoxX + 7, invoiceBoxY + 5.5, { align: 'center' })
  
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
  doc.setFontSize(10)
  doc.setFont(fonts.heading, 'bold')
  doc.text('FATURA', invoiceBoxX + invoiceBoxWidth/2, invoiceBoxY + 15, { align: 'center' })
  doc.setFontSize(14)
  doc.text(`#${invoice.invoice_number || 'N/A'}`, invoiceBoxX + invoiceBoxWidth/2, invoiceBoxY + 23, { align: 'center' })
  
  yPosition = headerHeight + 10
  
  // CARDS DE INFORMAÇÕES MINIMALISTAS
  const cardHeight = 35
  const colWidth = (pageWidth - 3 * margin) / 2
  
  // Card esquerdo - Detalhes da Fatura
  addSubtleShadow(margin, yPosition, colWidth, cardHeight)
  
  doc.setFillColor(250, 250, 250)
  doc.rect(margin, yPosition, colWidth, cardHeight, 'F')
  doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
  doc.setLineWidth(0.3)
  doc.rect(margin, yPosition, colWidth, cardHeight)
  
  // Linha superior colorida sutil
  doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
  doc.rect(margin, yPosition, colWidth, 2, 'F')
  
  doc.setFontSize(10)
  doc.setFont(fonts.heading, 'bold')
  addText('Detalhes da Fatura', margin + 5, yPosition + 12, { color: colors.primary })
  
  doc.setFontSize(8)
  doc.setFont(fonts.body, 'normal')
  doc.setTextColor(textRgb.r, textRgb.g, textRgb.b)
  doc.text(`${invoice.title}`, margin + 5, yPosition + 18)
  doc.text(`Emissão: ${formatDate(invoice.issue_date)}`, margin + 5, yPosition + 24)
  doc.text(`Vencimento: ${formatDate(invoice.due_date)}`, margin + 5, yPosition + 30)
  
  // Card direito - Cliente
  const rightCardX = margin + colWidth + margin
  addSubtleShadow(rightCardX, yPosition, colWidth, cardHeight)
  
  doc.setFillColor(250, 250, 250)
  doc.rect(rightCardX, yPosition, colWidth, cardHeight, 'F')
  doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
  doc.setLineWidth(0.3)
  doc.rect(rightCardX, yPosition, colWidth, cardHeight)
  
  // Linha superior colorida sutil
  doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
  doc.rect(rightCardX, yPosition, colWidth, 2, 'F')
  
  doc.setFontSize(10)
  doc.setFont(fonts.heading, 'bold')
  addText('Cliente', rightCardX + 5, yPosition + 12, { color: colors.primary })
  
  doc.setFontSize(8)
  doc.setFont(fonts.body, 'normal')
  doc.setTextColor(textRgb.r, textRgb.g, textRgb.b)
  doc.text(invoice.clients?.name || 'Cliente não informado', rightCardX + 5, yPosition + 18)
  
  if (invoice.clients?.email) {
    doc.text(invoice.clients.email, rightCardX + 5, yPosition + 24)
  }
  if (invoice.clients?.phone) {
    doc.text(invoice.clients.phone, rightCardX + 5, yPosition + 30)
  }
  
  yPosition += cardHeight + 15
  
  // Separador minimalista
  addThemedSeparator(yPosition - 5, [primaryRgb.r, primaryRgb.g, primaryRgb.b])
  
  // TABELA DE ITENS LIMPA E PROFISSIONAL
  doc.setFontSize(12)
  doc.setFont(fonts.heading, 'bold')
  addText('Itens da Fatura', margin, yPosition, { color: colors.primary })
  yPosition += 12
  
  // Cabeçalho da tabela simples (sem gradiente)
  const tableHeaderHeight = 12
  doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
  doc.rect(margin, yPosition, pageWidth - 2 * margin, tableHeaderHeight, 'F')
  
  const tableHeaders = ['Descrição', 'Qtd', 'Valor Unit.', 'Total']
  const colWidths = [90, 25, 35, 35]
  let xPosition = margin + 5
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont(fonts.heading, 'bold')
  
  tableHeaders.forEach((header, index) => {
    doc.text(header, xPosition, yPosition + 8)
    xPosition += colWidths[index]
  })
  
  yPosition += tableHeaderHeight + 2
  
  // Itens da tabela com design minimalista
  doc.setFont(fonts.body, 'normal')
  invoice.invoice_items.forEach((item, index) => {
    const rowHeight = 12
    
    // Linhas alternadas sutis
    if (index % 2 === 0) {
      doc.setFillColor(252, 252, 252)
      doc.rect(margin, yPosition - 1, pageWidth - 2 * margin, rowHeight, 'F')
    }
    
    // Linha lateral colorida minimalista
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    doc.rect(margin, yPosition - 1, 1, rowHeight, 'F')
    
    xPosition = margin + 5
    doc.setTextColor(textRgb.r, textRgb.g, textRgb.b)
    doc.setFontSize(8)
    
    const maxDescLength = 40
    const description = item.description.length > maxDescLength ? 
      item.description.substring(0, maxDescLength) + '...' : item.description
    doc.text(description, xPosition, yPosition + 7)
    xPosition += colWidths[0]
    
    doc.text(item.quantity.toString(), xPosition + colWidths[1]/2, yPosition + 7, { align: 'center' })
    xPosition += colWidths[1]
    
    doc.text(formatCurrency(item.unit_price), xPosition + colWidths[2] - 5, yPosition + 7, { align: 'right' })
    xPosition += colWidths[2]
    
    doc.setFont(fonts.body, 'bold')
    doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b)
    doc.text(formatCurrency(item.total_price), xPosition + colWidths[3] - 5, yPosition + 7, { align: 'right' })
    doc.setFont(fonts.body, 'normal')
    
    yPosition += rowHeight
  })
  
  // CARD DE TOTAIS MINIMALISTA
  yPosition += 10
  const totalsX = pageWidth - margin - 75
  const totalsWidth = 75
  const totalsHeight = 35
  
  // Sombra sutil
  addSubtleShadow(totalsX - 5, yPosition - 5, totalsWidth, totalsHeight)
  
  // Fundo limpo
  doc.setFillColor(250, 250, 250)
  doc.rect(totalsX - 5, yPosition - 5, totalsWidth, totalsHeight, 'F')
  
  // Borda sutil
  doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b)
  doc.setLineWidth(0.3)
  doc.rect(totalsX - 5, yPosition - 5, totalsWidth, totalsHeight)
  
  // Linha superior colorida
  doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b)
  doc.rect(totalsX - 5, yPosition - 5, totalsWidth, 2, 'F')
  
  doc.setFontSize(8)
  doc.setTextColor(textLightRgb.r, textLightRgb.g, textLightRgb.b)
  
  if (invoice.subtotal && invoice.subtotal > 0) {
    doc.text('Subtotal:', totalsX, yPosition + 5)
    doc.setTextColor(textRgb.r, textRgb.g, textRgb.b)
    doc.text(formatCurrency(invoice.subtotal), totalsX + 60, yPosition + 5, { align: 'right' })
    yPosition += 8
  }
  
  // Linha separadora sutil
  doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b)
  doc.setLineWidth(0.3)
  doc.line(totalsX, yPosition, totalsX + 60, yPosition)
  
  // Total final
  yPosition += 8
  doc.setFontSize(12)
  doc.setFont(fonts.heading, 'bold')
  addText('TOTAL:', totalsX, yPosition, { color: colors.accent })
  doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b)
  doc.text(formatCurrency(invoice.subtotal || 0), totalsX + 60, yPosition, { align: 'right' })
  
  // FOOTER MINIMALISTA
  const footerY = pageHeight - 20
  
  // Linha separadora sutil
  addThemedSeparator(footerY - 5, [primaryRgb.r, primaryRgb.g, primaryRgb.b])
  
  doc.setTextColor(textRgb.r, textRgb.g, textRgb.b)
  doc.setFontSize(8)
  doc.setFont(fonts.body, 'normal')
  doc.text('Obrigado pela preferência!', margin, footerY)
  
  const now = new Date().toLocaleDateString('pt-BR')
  doc.text(`Gerado em ${now}`, pageWidth - margin, footerY, { align: 'right' })
  
  return doc
}
