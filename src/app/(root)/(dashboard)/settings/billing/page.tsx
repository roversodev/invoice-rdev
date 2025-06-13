"use client"

import { useState, useEffect } from "react"
import { useAppContext } from "@/contexts/app-context"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/database"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Save, FileText, Hash, Eye } from "lucide-react"

type InvoiceTemplate = Database['public']['Tables']['invoice_templates']['Row']

export default function BillingSettingsPage() {
  const { currentCompany } = useAppContext()
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [settings, setSettings] = useState({
    invoicePrefix: 'INV',
    nextInvoiceNumber: 1,
    dueDays: 30,
    autoSend: false,
    sendReminders: true,
    reminderDays: [7, 3, 1],
    defaultNotes: '',
    defaultTerms: ''
  })
  
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    if (currentCompany) {
      loadTemplates()
      loadSettings()
    }
  }, [currentCompany])

  const loadTemplates = async () => {
    if (!currentCompany) return

    try {
      const { data, error } = await supabase
        .from('invoice_templates')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
      
      // Selecionar template padrão
      const defaultTemplate = data?.find(t => t.is_default)
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate.id)
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    }
  }

  const loadSettings = async () => {
    // Aqui você carregaria as configurações do banco de dados
    // Por enquanto, vamos usar valores padrão
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      
      // Aqui você salvaria as configurações no banco de dados
      
      toast.success('Configurações de faturamento salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setLoading(false)
    }
  }

  const createNewTemplate = async () => {
    if (!currentCompany) return

    try {
      const { data, error } = await supabase
        .from('invoice_templates')
        .insert({
          company_id: currentCompany.id,
          name: `Template ${templates.length + 1}`,
          is_default: templates.length === 0,
          colors: {
            primary: '#3b82f6',
            secondary: '#64748b',
            accent: '#10b981'
          },
          fonts: {
            heading: 'Inter',
            body: 'Inter'
          }
        })
        .select()
        .single()

      if (error) throw error
      
      setTemplates(prev => [data, ...prev])
      setSelectedTemplate(data.id)
      toast.success('Novo template criado!')
    } catch (error) {
      console.error('Erro ao criar template:', error)
      toast.error('Erro ao criar template')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Configurações de Faturamento</h3>
        <p className="text-sm text-muted-foreground">
          Configure templates, numeração e preferências de faturas.
        </p>
      </div>
      
      <Separator />
      
      <div className="grid gap-6">
        {/* Templates de Fatura */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Templates de Fatura
            </CardTitle>
            <CardDescription>
              Gerencie os templates visuais das suas faturas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Template Ativo</Label>
                <p className="text-sm text-muted-foreground">
                  Selecione o template padrão para novas faturas.
                </p>
              </div>
              <Button onClick={createNewTemplate} variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Novo Template
              </Button>
            </div>
            
            {templates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedTemplate === template.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{template.name}</h4>
                      {template.is_default && (
                        <Badge variant="secondary">Padrão</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      Visualizar
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum template encontrado</p>
                <p className="text-sm">Crie seu primeiro template para começar.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Numeração */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Numeração de Faturas
            </CardTitle>
            <CardDescription>
              Configure como as faturas são numeradas automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoicePrefix">Prefixo</Label>
                <Input
                  id="invoicePrefix"
                  value={settings.invoicePrefix}
                  onChange={(e) => setSettings(prev => ({ ...prev, invoicePrefix: e.target.value }))}
                  placeholder="INV"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nextInvoiceNumber">Próximo Número</Label>
                <Input
                  id="nextInvoiceNumber"
                  type="number"
                  value={settings.nextInvoiceNumber}
                  onChange={(e) => setSettings(prev => ({ ...prev, nextInvoiceNumber: parseInt(e.target.value) || 1 }))}
                  min="1"
                />
              </div>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Exemplo:</p>
              <p className="text-sm text-muted-foreground">
                {settings.invoicePrefix}-{String(settings.nextInvoiceNumber).padStart(4, '0')}
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Configurações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações Gerais</CardTitle>
            <CardDescription>
              Configurações padrão para novas faturas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dueDays">Prazo de Vencimento (dias)</Label>
              <Input
                id="dueDays"
                type="number"
                value={settings.dueDays}
                onChange={(e) => setSettings(prev => ({ ...prev, dueDays: parseInt(e.target.value) || 30 }))}
                min="1"
                max="365"
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoSend">Envio Automático</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar faturas automaticamente por email após criação.
                </p>
              </div>
              <Switch
                id="autoSend"
                checked={settings.autoSend}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoSend: checked }))}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sendReminders">Lembretes Automáticos</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar lembretes automáticos antes do vencimento.
                </p>
              </div>
              <Switch
                id="sendReminders"
                checked={settings.sendReminders}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, sendReminders: checked }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="defaultNotes">Observações Padrão</Label>
              <Textarea
                id="defaultNotes"
                value={settings.defaultNotes}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultNotes: e.target.value }))}
                placeholder="Observações que aparecerão em todas as faturas por padrão"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="defaultTerms">Termos e Condições Padrão</Label>
              <Textarea
                id="defaultTerms"
                value={settings.defaultTerms}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultTerms: e.target.value }))}
                placeholder="Termos e condições que aparecerão em todas as faturas"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar Configurações
        </Button>
      </div>
    </div>
  )
}