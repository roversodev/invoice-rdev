"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Palette, Type, Layout, Eye, Save, RotateCcw } from "lucide-react"
import { Database } from "@/types/database"
import { DEFAULT_TEMPLATE_CONFIG } from '@/lib/template-defaults'

type InvoiceTemplate = Database['public']['Tables']['invoice_templates']['Row']

interface TemplateEditorProps {
  template: InvoiceTemplate
  onSave: (template: Partial<InvoiceTemplate>) => void
  saving?: boolean // Novo prop para mostrar loading
}

export function TemplateEditor({ template, onSave, saving = false }: TemplateEditorProps) {
  const [config, setConfig] = useState({
    colors: template.colors || DEFAULT_TEMPLATE_CONFIG.colors,
    fonts: template.fonts || DEFAULT_TEMPLATE_CONFIG.fonts,
    layout: {
      headerHeight: template.layout_config?.headerHeight || DEFAULT_TEMPLATE_CONFIG.layout.headerHeight,
      footerHeight: template.layout_config?.footerHeight || DEFAULT_TEMPLATE_CONFIG.layout.footerHeight,
      borderRadius: template.layout_config?.borderRadius || DEFAULT_TEMPLATE_CONFIG.layout.borderRadius,
      cardPadding: template.layout_config?.cardPadding || DEFAULT_TEMPLATE_CONFIG.layout.cardPadding,
      margins: {
        top: template.layout_config?.margins?.top || DEFAULT_TEMPLATE_CONFIG.layout.margins.top,
        right: template.layout_config?.margins?.right || DEFAULT_TEMPLATE_CONFIG.layout.margins.right,
        bottom: template.layout_config?.margins?.bottom || DEFAULT_TEMPLATE_CONFIG.layout.margins.bottom,
        left: template.layout_config?.margins?.left || DEFAULT_TEMPLATE_CONFIG.layout.margins.left
      }
    }
  })
  
  const handleColorChange = (colorType: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      colors: { ...prev.colors, [colorType]: value }
    }))
  }
  
  const handleFontChange = (fontType: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      fonts: { ...prev.fonts, [fontType]: value }
    }))
  }

  const handleLayoutChange = (field: string, value: number) => {
    setConfig(prev => ({
      ...prev,
      layout: { ...prev.layout, [field]: value }
    }))
  }

  const handleMarginChange = (side: string, value: number) => {
    setConfig(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        margins: { ...prev.layout.margins, [side]: value }
      }
    }))
  }

  const resetToDefaults = () => {
    setConfig(DEFAULT_TEMPLATE_CONFIG)
  }

    // Componente de Preview Realista
    const InvoicePreview = () => (
      <div className="w-full max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden border">
        {/* Header da Fatura - Design minimalista */}
        <div 
          className="px-6 py-4 text-white relative"
          style={{ 
            backgroundColor: config.colors.primary,
            height: `${Math.max(config.layout.headerHeight, 60)}px`
          }}
        >
          <div className="flex justify-between items-start h-full">
            <div className="flex-1">
              <h1 className="text-lg font-bold mb-1" style={{ fontFamily: config.fonts.heading }}>
                Empresa
              </h1>
              <p className="text-xs opacity-90">CNPJ: 00.000.000/0001-00 • exemplo@email.com.br</p>
              <p className="text-xs opacity-90">(11) 99999-9999</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded px-3 py-2 text-right border border-white/20">
              <p className="text-xs font-medium opacity-90">FATURA</p>
              <p className="text-sm font-bold">#FAT-001</p>
            </div>
          </div>
        </div>
  
        {/* Conteúdo da Fatura */}
        <div className="p-4 space-y-3">
          {/* Cards de Informações em duas colunas */}
          <div className="grid grid-cols-2 gap-3">
            {/* Card Detalhes */}
            <div 
              className="p-3 rounded border"
              style={{ 
                backgroundColor: config.colors.background,
                borderRadius: `${config.layout.borderRadius}px`,
                borderColor: config.colors.primary + '20',
                borderWidth: '1px'
              }}
            >
              <h3 
                className="font-semibold mb-2 text-xs"
                style={{ 
                  color: config.colors.primary,
                  fontFamily: config.fonts.heading 
                }}
              >
                Detalhes da Fatura
              </h3>
              <div className="space-y-1 text-xs">
                <p style={{ color: config.colors.text }}>Título: Serviços</p>
                <p style={{ color: config.colors.text }}>Emissão: 13/06/2025</p>
                <p style={{ color: config.colors.text }}>Vencimento: 13/06/2025</p>
              </div>
            </div>
  
            {/* Card Cliente */}
            <div 
              className="p-3 rounded border"
              style={{ 
                backgroundColor: config.colors.background,
                borderRadius: `${config.layout.borderRadius}px`,
                borderColor: config.colors.primary + '20',
                borderWidth: '1px'
              }}
            >
              <h3 
                className="font-semibold mb-2 text-xs"
                style={{ 
                  color: config.colors.primary,
                  fontFamily: config.fonts.heading 
                }}
              >
                Cliente
              </h3>
              <div className="space-y-1 text-xs">
                <p style={{ color: config.colors.text }}>Vitor Roverso</p>
                <p style={{ color: config.colors.text }}>exemplo@gmail.com</p>
                <p style={{ color: config.colors.text }}>(11) 99999-9172</p>
              </div>
            </div>
          </div>
  
          {/* Seção de Itens */}
          <div>
            <h3 
              className="font-semibold mb-2 text-sm"
              style={{ 
                color: config.colors.primary,
                fontFamily: config.fonts.heading 
              }}
            >
              Itens da Fatura
            </h3>
            
            {/* Header da Tabela */}
            <div 
              className="px-3 py-2 text-xs text-white font-medium rounded-t"
              style={{ backgroundColor: config.colors.primary }}
            >
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-6">Descrição</span>
                <span className="col-span-2 text-center">Qtd</span>
                <span className="col-span-2 text-right">Valor Unit.</span>
                <span className="col-span-2 text-right">Total</span>
              </div>
            </div>
            
            {/* Itens da Tabela */}
            <div className="border-x border-b rounded-b" style={{ borderColor: config.colors.primary + '20' }}>
              <div className="px-3 py-2 text-xs border-b" style={{ borderColor: config.colors.primary + '10' }}>
                <div className="grid grid-cols-12 gap-1 items-center">
                  <span className="col-span-6" style={{ color: config.colors.text }}>Criação de Landing Page focada em conver...</span>
                  <span className="col-span-2 text-center" style={{ color: config.colors.text }}>1</span>
                  <span className="col-span-2 text-right" style={{ color: config.colors.text }}>R$ 800,00</span>
                  <span 
                    className="col-span-2 text-right font-semibold"
                    style={{ color: config.colors.accent }}
                  >
                    R$ 800,00
                  </span>
                </div>
              </div>
              <div className="px-3 py-2 text-xs">
                <div className="grid grid-cols-12 gap-1 items-center">
                  <span className="col-span-6" style={{ color: config.colors.text }}>Consultoria em marketing...</span>
                  <span className="col-span-2 text-center" style={{ color: config.colors.text }}>2</span>
                  <span className="col-span-2 text-right" style={{ color: config.colors.text }}>R$ 800,00</span>
                  <span 
                    className="col-span-2 text-right font-semibold"
                    style={{ color: config.colors.accent }}
                  >
                    R$ 1.600,00
                  </span>
                </div>
              </div>
            </div>
          </div>
  
          {/* Totais */}
          <div className="flex justify-end">
            <div 
              className="p-3 rounded min-w-32"
              style={{ 
                backgroundColor: config.colors.background,
                borderRadius: `${config.layout.borderRadius}px`,
                border: `1px solid ${config.colors.primary}20`
              }}
            >
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span style={{ color: config.colors.textLight }}>Subtotal:</span>
                  <span style={{ color: config.colors.text }}>R$ 2.400,00</span>
                </div>
                <div className="border-t pt-1" style={{ borderColor: config.colors.primary + '20' }}>
                  <div className="flex justify-between font-semibold">
                    <span style={{ color: config.colors.primary }}>TOTAL:</span>
                    <span style={{ color: config.colors.accent }}>R$ 2.400,00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
  
          {/* Observações */}
          <div className="text-xs" style={{ color: config.colors.textLight }}>
            <p>Obrigado pela preferência!</p>
          </div>
        </div>
  
        {/* Footer minimalista */}
        <div 
          className="px-4 py-2 text-center border-t"
          style={{ 
            height: `${Math.max(config.layout.footerHeight, 25)}px`,
            backgroundColor: config.colors.background,
            borderColor: config.colors.primary + '20'
          }}
        >
          <p className="text-xs flex justify-between items-center" style={{ color: config.colors.textLight }}>
            <span>Gerado em 15/06/2025</span>
            <span>Gerado em 15/06/2025</span>
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


  const handleSave = () => {
    
    onSave({
      colors: config.colors,
      fonts: config.fonts,
      layout_config: config.layout
    })
  }
  
  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6 p-6 overflow-hidden min-h-0">
        {/* Painel de Configurações */}
        <div className="space-y-6 overflow-y-auto pr-2 min-h-0">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Configurações do Template</h2>
            <Badge variant="outline">Personalização Avançada</Badge>
          </div>

          <Tabs defaultValue="colors" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="colors" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Cores
              </TabsTrigger>
              <TabsTrigger value="typography" className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                Tipografia
              </TabsTrigger>
              <TabsTrigger value="layout" className="flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Layout
              </TabsTrigger>
            </TabsList>

          <TabsContent value="colors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Paleta de Cores</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Personalize as cores do seu template de fatura
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Cores Principais */}
                <div>
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    Cores Principais
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <ColorPicker 
                      label="Cor Primária" 
                      colorKey="primary" 
                      description="Header, títulos"
                    />
                    <ColorPicker 
                      label="Cor Secundária" 
                      colorKey="secondary" 
                      description="Tabelas, bordas"
                    />
                    <ColorPicker 
                      label="Cor de Destaque" 
                      colorKey="accent" 
                      description="Preços, valores"
                    />
                  </div>
                </div>

                <Separator />

                {/* Cores de Texto */}
                <div>
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                    Cores de Texto
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <ColorPicker 
                      label="Texto Principal" 
                      colorKey="text" 
                      description="Conteúdo geral"
                    />
                    <ColorPicker 
                      label="Texto Secundário" 
                      colorKey="textLight" 
                      description="Legendas, notas"
                    />
                    <ColorPicker 
                      label="Cor de Fundo" 
                      colorKey="background" 
                      description="Fundo dos cards"
                    />
                  </div>
                </div>

                <Separator />

                {/* Cores de Status */}
                <div>
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    Cores de Status
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <ColorPicker 
                      label="Sucesso" 
                      colorKey="success" 
                      description="Status pago"
                    />
                    <ColorPicker 
                      label="Aviso" 
                      colorKey="warning" 
                      description="Status pendente"
                    />
                    <ColorPicker 
                      label="Erro" 
                      colorKey="error" 
                      description="Status vencido"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="typography" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tipografia</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Escolha as fontes para títulos e conteúdo
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Fonte dos Títulos</Label>
                    <Select
                      value={config.fonts.heading}
                      onValueChange={(value) => handleFontChange('heading', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="Open Sans">Open Sans</SelectItem>
                        <SelectItem value="Lato">Lato</SelectItem>
                        <SelectItem value="Montserrat">Montserrat</SelectItem>
                        <SelectItem value="Poppins">Poppins</SelectItem>
                        <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                        <SelectItem value="Source Sans Pro">Source Sans Pro</SelectItem>
                      </SelectContent>
                    </Select>
                    <div 
                      className="p-3 border rounded text-lg font-semibold"
                      style={{ fontFamily: config.fonts.heading }}
                    >
                      Exemplo de Título
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Fonte do Corpo</Label>
                    <Select
                      value={config.fonts.body}
                      onValueChange={(value) => handleFontChange('body', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="Open Sans">Open Sans</SelectItem>
                        <SelectItem value="Lato">Lato</SelectItem>
                        <SelectItem value="Montserrat">Montserrat</SelectItem>
                        <SelectItem value="Poppins">Poppins</SelectItem>
                        <SelectItem value="Source Sans Pro">Source Sans Pro</SelectItem>
                      </SelectContent>
                    </Select>
                    <div 
                      className="p-3 border rounded text-sm"
                      style={{ fontFamily: config.fonts.body }}
                    >
                      Este é um exemplo de texto do corpo da fatura. Aqui você pode ver como ficará o conteúdo principal do documento.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="layout" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configurações de Layout</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Ajuste o espaçamento e dimensões do template
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dimensões */}
                <div>
                  <h4 className="font-medium mb-4">Dimensões</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Altura do Header (px)</Label>
                      <Input
                        type="number"
                        value={config.layout.headerHeight}
                        onChange={(e) => handleLayoutChange('headerHeight', parseInt(e.target.value) || 0)}
                        min="40"
                        max="150"
                        className="text-sm"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Altura do Footer (px)</Label>
                      <Input
                        type="number"
                        value={config.layout.footerHeight}
                        onChange={(e) => handleLayoutChange('footerHeight', parseInt(e.target.value) || 0)}
                        min="20"
                        max="100"
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Estilo */}
                <div>
                  <h4 className="font-medium mb-4">Estilo</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Raio da Borda (px)</Label>
                      <Input
                        type="number"
                        value={config.layout.borderRadius}
                        onChange={(e) => handleLayoutChange('borderRadius', parseInt(e.target.value) || 0)}
                        min="0"
                        max="20"
                        className="text-sm"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Padding dos Cards (px)</Label>
                      <Input
                        type="number"
                        value={config.layout.cardPadding}
                        onChange={(e) => handleLayoutChange('cardPadding', parseInt(e.target.value) || 0)}
                        min="4"
                        max="24"
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Margens */}
                <div>
                  <h4 className="font-medium mb-4">Margens (px)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Superior</Label>
                      <Input
                        type="number"
                        value={config.layout.margins?.top || 20}
                        onChange={(e) => handleMarginChange('top', parseInt(e.target.value) || 0)}
                        min="0"
                        max="50"
                        className="text-sm"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Direita</Label>
                      <Input
                        type="number"
                        value={config.layout.margins?.right || 20}
                        onChange={(e) => handleMarginChange('right', parseInt(e.target.value) || 0)}
                        min="0"
                        max="50"
                        className="text-sm"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Inferior</Label>
                      <Input
                        type="number"
                        value={config.layout.margins?.bottom || 20}
                        onChange={(e) => handleMarginChange('bottom', parseInt(e.target.value) || 0)}
                        min="0"
                        max="50"
                        className="text-sm"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Esquerda</Label>
                      <Input
                        type="number"
                        value={config.layout.margins?.left || 20}
                        onChange={(e) => handleMarginChange('left', parseInt(e.target.value) || 0)}
                        min="0"
                        max="50"
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botões de Ação */}
        <div className="flex justify-between gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => setConfig(DEFAULT_TEMPLATE_CONFIG)}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Resetar
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Visualizar PDF
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Salvando...' : 'Salvar Template'}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Realista */}
      <div className="overflow-y-auto min-h-0">
        <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 pb-4">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold">Preview em Tempo Real</h3>
            <Badge variant="secondary">Atualização automática</Badge>
          </div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg border">
          <InvoicePreview />
        </div>
        
        <div className="text-xs text-muted-foreground text-center mt-4">
          ✨ As mudanças aparecem instantaneamente no preview
        </div>

        <div className="text-xs text-muted-foreground text-center">
          A preview é apenas uma comididade recomendamos testar baixando um pdf real
        </div>
      </div>
    </div>
    </div>
  )
}