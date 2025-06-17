import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { DEFAULT_TEMPLATE_CONFIG } from '@/lib/template-defaults'
import DownloadButton from './download-button'
import ToggleItemsButton from './toggle-items-button'
import ThemeToggleButton from '@/components/ui/theme-toggle-button'
import {
  User,
  Calendar,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Edit3,
  Receipt,
  Zap
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

interface PublicInvoicePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PublicInvoicePage({ params }: PublicInvoicePageProps) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      *,
      invoice_items(*),
      companies(*),
      clients(*),
      invoice_templates(*)
    `)
    .eq('id', id)
    .single()

  if (error || !invoice) {
    console.log('Erro ou fatura não encontrada:', error)
    notFound()
  }

  // Calcular valores
  const subtotal = invoice.subtotal || invoice.invoice_items?.reduce(
    (sum: number, item: any) => sum + (item.quantity * item.unit_price), 0
  ) || 0

  const discountAmount = invoice.discount_amount || (subtotal * ((invoice.discount_percentage || 0) / 100))
  const taxAmount = invoice.tax_amount || ((subtotal - discountAmount) * ((invoice.tax_percentage || 0) / 100))
  const totalAmount = invoice.total_amount || (subtotal - discountAmount + taxAmount)

  // Configurações do template
  const templateColors = invoice.invoice_templates?.colors
    ? (typeof invoice.invoice_templates.colors === 'string'
      ? JSON.parse(invoice.invoice_templates.colors)
      : invoice.invoice_templates.colors)
    : DEFAULT_TEMPLATE_CONFIG.colors

  const colors = {
    primary: templateColors.primary || DEFAULT_TEMPLATE_CONFIG.colors.primary,
    secondary: templateColors.secondary || DEFAULT_TEMPLATE_CONFIG.colors.secondary,
    accent: templateColors.accent || DEFAULT_TEMPLATE_CONFIG.colors.accent,
    background: templateColors.background || DEFAULT_TEMPLATE_CONFIG.colors.background,
    text: templateColors.text || DEFAULT_TEMPLATE_CONFIG.colors.text,
    textLight: templateColors.textLight || DEFAULT_TEMPLATE_CONFIG.colors.textLight
  }

  // Formatação de moeda em Real
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Formatação de data
  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR')
  }

  // Status da fatura
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return {
          icon: CheckCircle,
          label: 'Pago',
          variant: 'default' as const,
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
        }
      case 'sent':
        return {
          icon: Clock,
          label: 'Enviada',
          variant: 'secondary' as const,
          className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
        }
      case 'overdue':
        return {
          icon: AlertTriangle,
          label: 'Vencida',
          variant: 'destructive' as const,
          className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
        }
      default:
        return {
          icon: Edit3,
          label: 'Rascunho',
          variant: 'outline' as const,
          className: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800'
        }
    }
  }

  const statusConfig = getStatusConfig(invoice.status)
  const StatusIcon = statusConfig.icon

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header with Logo and Theme Toggle */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Invoice Roverso</h1>
                <p className="text-xs text-muted-foreground">Sistema de Faturas</p>
              </div>
            </Link>
            <ThemeToggleButton variant="circle-blur" start="top-right" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="py-8">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Receipt className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                      Fatura #{invoice.invoice_number}
                    </h1>
                    <p className="text-muted-foreground">
                      {invoice.companies?.name}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="text-3xl font-bold" style={{ color: colors.primary }}>
                  {formatCurrency(totalAmount)}
                </div>
                <Badge className={statusConfig.className}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <DownloadButton
              invoice={invoice}
              template={invoice.invoice_templates}
              primaryColor={colors.primary}
            />
          </div>

          <div className="grid gap-6">
            {/* Title and Description */}
            {(invoice.title || invoice.description) && (
              <Card>
                <CardContent className="pt-6">
                  {invoice.title && (
                    <h2 className="text-xl font-semibold mb-3">
                      {invoice.title}
                    </h2>
                  )}
                  {invoice.description && (
                    <p className="text-muted-foreground leading-relaxed">
                      {invoice.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Client and Date Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-medium">
                    {invoice.clients?.name || invoice.client_name}
                  </p>
                  {invoice.clients?.email && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {invoice.clients.email}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Date Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Datas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Emissão
                    </p>
                    <p className="font-medium">{formatDate(invoice.issue_date)}</p>
                  </div>
                  {invoice.due_date && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Vencimento
                      </p>
                      <p className="font-medium">{formatDate(invoice.due_date)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Items Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Itens da Fatura
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium text-muted-foreground">Descrição</th>
                        <th className="text-center p-4 font-medium text-muted-foreground w-20">Qtd</th>
                        <th className="text-right p-4 font-medium text-muted-foreground w-32">Valor Unit.</th>
                        <th className="text-right p-4 font-medium text-muted-foreground w-32">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.invoice_items?.map((item: any, index: number) => (
                        <tr key={index} className="border-b last:border-b-0 hover:bg-muted/50 transition-colors">
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{item.description}</p>
                              {item.details && (
                                <p className="text-sm text-muted-foreground mt-1">{item.details}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center font-medium">{item.quantity}</td>
                          <td className="p-4 text-right font-medium">{formatCurrency(item.unit_price)}</td>
                          <td className="p-4 text-right font-semibold" style={{ color: colors.primary }}>
                            {formatCurrency(item.quantity * item.unit_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Desconto ({invoice.discount_percentage}%)</span>
                      <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}

                  {taxAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Impostos/Taxas ({invoice.tax_percentage}%)</span>
                      <span className="font-medium">{formatCurrency(taxAmount)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span
                    className="text-2xl font-bold"
                    style={{ color: colors.primary }}
                  >
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            {invoice.companies && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Informações da Empresa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <p className="font-semibold">{invoice.companies.name}</p>
                      {invoice.companies.email && (
                        <p className="text-muted-foreground flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {invoice.companies.email}
                        </p>
                      )}
                      {invoice.companies.phone && (
                        <p className="text-muted-foreground flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {invoice.companies.phone}
                        </p>
                      )}
                    </div>
                    <div className="space-y-3">
                      {invoice.companies.address && (
                        <div className="text-muted-foreground">
                          <p className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>
                              {invoice.companies.address}
                              {invoice.companies.city && invoice.companies.state && (
                                <><br />{invoice.companies.city}, {invoice.companies.state}</>
                              )}
                              {invoice.companies.zip_code && (
                                <><br />CEP: {invoice.companies.zip_code}</>
                              )}
                            </span>
                          </p>
                        </div>
                      )}
                      {invoice.companies.cnpj && (
                        <p className="text-muted-foreground flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          CNPJ: {invoice.companies.cnpj}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {invoice.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Observações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-muted-foreground leading-relaxed">{invoice.notes}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-12 pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              Fatura gerada automaticamente • {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}