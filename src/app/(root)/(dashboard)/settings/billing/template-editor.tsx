'use client'

import { useState, useEffect } from 'react'
import { Eye, Palette, Save, RotateCcw, FileDown, Receipt, User, Calendar, FileText, Building2, Mail, Phone, MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface TemplateConfig {
  colors: {
    primary: string
    accent: string
  }
}

interface TemplateEditorProps {
  template?: any
  onSave: (config: any) => Promise<void> | void
}

const defaultConfig: TemplateConfig = {
  colors: {
    primary: '#1F2A44',    // Navy Blue
    accent: '#D4AF37'      // Gold Accent
  }
}

export default function TemplateEditor({ template, onSave }: TemplateEditorProps) {
  const [config, setConfig] = useState<TemplateConfig>(defaultConfig)
  const [isLoading, setIsLoading] = useState(false)

  // Carregar cores do template quando disponível
  useEffect(() => {
    if (template) {
      // Parse das cores do campo JSON 'colors'
      let templateColors = defaultConfig.colors
      
      if (template.colors) {
        try {
          // Se colors é uma string JSON, fazer parse
          const parsedColors = typeof template.colors === 'string' 
            ? JSON.parse(template.colors) 
            : template.colors
          
          templateColors = {
            primary: parsedColors.primary || defaultConfig.colors.primary,
            accent: parsedColors.accent || defaultConfig.colors.accent
          }
        } catch (error) {
          console.error('Erro ao fazer parse das cores:', error)
        }
      }
      
      setConfig({
        colors: templateColors
      })
    }
  }, [template])

  const handleColorChange = (colorKey: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value
      }
    }))
  }

  const handleReset = () => {
    setConfig(defaultConfig)
    toast.success('Configurações resetadas para o padrão')
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Salvar no formato correto - colors como objeto
      await onSave({
        ...template,
        colors: config.colors // Salvar como objeto, não como primary_color/accent_color separados
      })
      toast.success('Template salvo com sucesso!')
    } catch (error) {
      toast.error('Erro ao salvar template')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  // Dados de exemplo para o preview
  const mockInvoice = {
    invoice_number: 'INV-2024-001',
    title: 'Desenvolvimento de Sistema Web',
    description: 'Desenvolvimento completo de sistema de gestão empresarial com dashboard administrativo e área do cliente.',
    issue_date: '2024-01-15',
    due_date: '2024-02-15',
    status: 'paid',
    client_name: 'João Silva',
    client_email: 'joao.silva@empresa.com',
    company_name: 'Roverso Tech',
    company_email: 'contato@roverso.tech',
    company_phone: '(11) 99999-9999',
    company_address: 'Rua das Flores, 123',
    company_city: 'São Paulo',
    company_state: 'SP',
    company_zip_code: '01234-567',
    company_cnpj: '12.345.678/0001-90',
    items: [
      {
        description: 'Desenvolvimento Frontend React',
        details: 'Interface moderna e responsiva com Next.js',
        quantity: 1,
        unit_price: 5000
      },
      {
        description: 'Desenvolvimento Backend Node.js',
        details: 'API REST com autenticação e banco de dados',
        quantity: 1,
        unit_price: 4000
      },
      {
        description: 'Deploy e Configuração',
        details: 'Configuração de servidor e domínio',
        quantity: 1,
        unit_price: 1000
      }
    ],
    discount_percentage: 10,
    tax_percentage: 5,
    notes: 'Projeto desenvolvido com as melhores práticas de mercado. Inclui documentação técnica e suporte por 30 dias após a entrega.'
  }

  // Cálculos
  const subtotal = mockInvoice.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  const discountAmount = subtotal * (mockInvoice.discount_percentage / 100)
  const taxAmount = (subtotal - discountAmount) * (mockInvoice.tax_percentage / 100)
  const totalAmount = subtotal - discountAmount + taxAmount

  const InvoicePreview = () => (
    <div className="bg-background border rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Receipt className="h-8 w-8 text-muted-foreground" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Fatura #{mockInvoice.invoice_number}
                </h1>
                <p className="text-muted-foreground">
                  {mockInvoice.company_name}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right space-y-2">
            <div className="text-3xl font-bold" style={{ color: config.colors.primary }}>
              {formatCurrency(totalAmount)}
            </div>
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-1" />
              Pago
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Title and Description */}
        {(mockInvoice.title || mockInvoice.description) && (
          <Card>
            <CardContent className="pt-6">
              {mockInvoice.title && (
                <h2 className="text-xl font-semibold mb-3">
                  {mockInvoice.title}
                </h2>
              )}
              {mockInvoice.description && (
                <p className="text-muted-foreground leading-relaxed">
                  {mockInvoice.description}
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
                {mockInvoice.client_name}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="h-3 w-3" />
                {mockInvoice.client_email}
              </p>
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
                <p className="font-medium">{formatDate(mockInvoice.issue_date)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Vencimento
                </p>
                <p className="font-medium">{formatDate(mockInvoice.due_date)}</p>
              </div>
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
                  {mockInvoice.items.map((item, index) => (
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
                      <td className="p-4 text-right font-semibold" style={{ color: config.colors.primary }}>
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
                  <span className="text-muted-foreground">Desconto ({mockInvoice.discount_percentage}%)</span>
                  <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              {taxAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Impostos/Taxas ({mockInvoice.tax_percentage}%)</span>
                  <span className="font-medium">{formatCurrency(taxAmount)}</span>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total</span>
              <span
                className="text-2xl font-bold"
                style={{ color: config.colors.primary }}
              >
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
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
                <p className="font-semibold">{mockInvoice.company_name}</p>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {mockInvoice.company_email}
                </p>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {mockInvoice.company_phone}
                </p>
              </div>
              <div className="space-y-3">
                <div className="text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      {mockInvoice.company_address}
                      <br />{mockInvoice.company_city}, {mockInvoice.company_state}
                      <br />CEP: {mockInvoice.company_zip_code}
                    </span>
                  </p>
                </div>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  CNPJ: {mockInvoice.company_cnpj}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Observações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-muted-foreground leading-relaxed">{mockInvoice.notes}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center p-6 border-t">
        <p className="text-sm text-muted-foreground">
          Fatura gerada automaticamente • {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>
    </div>
  )

  const ColorPicker = ({ label, colorKey, description }: { label: string, colorKey: string, description?: string }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <Badge variant="secondary" className="text-xs">{description}</Badge>
        )}
      </div>
      <div className="flex gap-2">
        <div className="relative">
          <Input
            type="color"
            value={config.colors[colorKey as keyof typeof config.colors]}
            onChange={(e) => handleColorChange(colorKey, e.target.value)}
            className="w-12 h-10 p-1 border rounded cursor-pointer"
          />
        </div>
        <Input
          value={config.colors[colorKey as keyof typeof config.colors]}
          onChange={(e) => handleColorChange(colorKey, e.target.value)}
          placeholder="#000000"
          className="flex-1 font-mono text-sm"
        />
      </div>
    </div>
  )

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 overflow-hidden min-h-0">
        {/* Painel de Configurações */}
        <div className="space-y-6 overflow-y-auto pr-2 min-h-0">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Configurações do Template</h2>
            <Badge variant="outline">Simplificado</Badge>
          </div>

          {/* Cores */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="w-5 h-5" />
                Cores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ColorPicker 
                label="Cor Primária" 
                colorKey="primary" 
                description="Títulos e destaques"
              />
              <ColorPicker 
                label="Cor de Destaque" 
                colorKey="accent" 
                description="Valores e totais"
              />
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleReset} 
              variant="outline" 
              className="flex-1"
              disabled={isLoading}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Resetar
            </Button>
            
            <Button 
              onClick={handleSave} 
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Template
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="overflow-y-auto pr-2 min-h-0">
          <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b pb-4 mb-6 z-10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Preview da Fatura</h3>
              <Badge variant="secondary">Tempo Real</Badge>
            </div>
          </div>
          
          <div className="space-y-4">
            <InvoicePreview />
          </div>
        </div>
      </div>
    </div>
  )
}