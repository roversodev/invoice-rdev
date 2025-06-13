"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAppContext } from "@/contexts/app-context"
import { Database } from "@/types/database"
import { invoiceSchema, type InvoiceFormData } from "@/lib/validations"
import Link from "next/link"
import { toast } from "sonner"

// Importar componentes UI necessários
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react"

type Client = Database['public']['Tables']['clients']['Row']
type Service = Database['public']['Tables']['services']['Row']

export default function EditInvoicePage() {
  const params = useParams()
  const router = useRouter()
  const { currentCompany } = useAppContext()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const supabase = createClientComponentClient<Database>()

  // Configuração do formulário com React Hook Form
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      client_id: "",
      title: "",
      description: "",
      issue_date: "",
      due_date: "",
      items: [{
        service_id: "",
        description: "",
        quantity: 1,
        unit_price: 0
      }],
      discount_percentage: 0,
      tax_percentage: 0,
      notes: ""
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  })

  // Carregar dados iniciais
  useEffect(() => {
    if (currentCompany) {
      loadInitialData()
    }
  }, [currentCompany])

  // Carregar dados da fatura
  useEffect(() => {
    if (params.id && currentCompany) {
      loadInvoiceData()
    }
  }, [params.id, currentCompany])

  const loadInitialData = async () => {
    if (!currentCompany) return

    try {
      // Carregar clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('name')

      if (clientsError) throw clientsError
      setClients(clientsData || [])

      // Carregar serviços
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('name')

      if (servicesError) throw servicesError
      setServices(servicesData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    }
  }

  const loadInvoiceData = async () => {
    if (!params.id || !currentCompany) return

    try {
      setLoadingData(true)

      // Carregar dados da fatura
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_items (*)
        `)
        .eq('id', params.id)
        .eq('company_id', currentCompany.id)
        .single()

      if (invoiceError) throw invoiceError

      // Preencher o formulário com os dados existentes
      if (invoice) {
        form.reset({
          client_id: invoice.client_id,
          title: invoice.title,
          description: invoice.description || "",
          issue_date: invoice.issue_date || "",
          due_date: invoice.due_date || "",
          items: invoice.invoice_items.length > 0 
            ? invoice.invoice_items.map((item: any) => ({
                service_id: item.service_id || "",
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price
              }))
            : [{
                service_id: "",
                description: "",
                quantity: 1,
                unit_price: 0
              }],
          discount_percentage: invoice.discount_percentage || 0,
          tax_percentage: invoice.tax_percentage || 0,
          notes: invoice.notes || ""
        })
      }
    } catch (error) {
      console.error('Erro ao carregar fatura:', error)
      toast.error('Erro ao carregar fatura')
      router.push('/invoices')
    } finally {
      setLoadingData(false)
    }
  }

  // Função para atualizar a fatura
  const onSubmit = async (data: InvoiceFormData) => {
    if (!currentCompany || !params.id) return

    const loadingToast = toast.loading('Atualizando fatura...')

    try {
      setLoading(true)

      // Calcular total da fatura
      const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
      const discountAmount = subtotal * ((data.discount_percentage ?? 0) / 100)
      const taxAmount = (subtotal - discountAmount) * ((data.tax_percentage ?? 0) / 100)
      const totalAmount = subtotal - discountAmount + taxAmount

      // Atualizar a fatura
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          client_id: data.client_id,
          title: data.title,
          description: data.description,
          issue_date: data.issue_date,
          due_date: data.due_date,
          discount_percentage: data.discount_percentage,
          tax_percentage: data.tax_percentage,
          notes: data.notes,
          total_amount: totalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (invoiceError) throw invoiceError

      // Atualizar os itens da fatura
      // Primeiro, excluir todos os itens existentes
      const { error: deleteError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', params.id)

      if (deleteError) throw deleteError

      // Depois, inserir os novos itens
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(
          data.items.map((item, index) => ({
            invoice_id: params.id,
            service_id: item.service_id || null,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.quantity * item.unit_price,
            sort_order: index
          }))
        )

      if (itemsError) throw itemsError

      toast.success('Fatura atualizada com sucesso!', { id: loadingToast })
      router.push(`/invoices/${params.id}`)
    } catch (error) {
      console.error('Erro ao atualizar fatura:', error)
      toast.error('Erro ao atualizar fatura', { id: loadingToast })
    } finally {
      setLoading(false)
    }
  }

  // Funções de cálculo
  const calculateItemTotal = (quantity: number, unitPrice: number) => {
    return (quantity || 0) * (unitPrice || 0)
  }

  const calculateSubtotal = () => {
    return form.watch('items').reduce((sum, item) => {
      return sum + calculateItemTotal(item.quantity, item.unit_price)
    }, 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const discount = subtotal * ((form.watch('discount_percentage') || 0) / 100)
    const tax = (subtotal - discount) * ((form.watch('tax_percentage') || 0) / 100)
    return subtotal - discount + tax
  }

  // Renderizar loading state
  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/invoices">Faturas</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/invoices/${params.id}`}>{form.watch('title')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Editar</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Fatura</h1>
          <p className="text-muted-foreground">
            Atualize os dados da fatura conforme necessário
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/invoices/${params.id}`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>
      </div>

      <Separator />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Fatura</CardTitle>
            <CardDescription>
              Dados básicos da fatura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Cliente *</Label>
                <Select
                  value={form.watch('client_id')}
                  onValueChange={(value) => form.setValue('client_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.client_id && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.client_id.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  {...form.register('title')}
                  placeholder="Título da fatura"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="issue_date">Data de Emissão *</Label>
                <Input
                  id="issue_date"
                  type="date"
                  {...form.register('issue_date')}
                />
                {form.formState.errors.issue_date && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.issue_date.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Data de Vencimento *</Label>
                <Input
                  id="due_date"
                  type="date"
                  {...form.register('due_date')}
                />
                {form.formState.errors.due_date && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.due_date.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Descrição da fatura"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Itens da fatura */}
        <Card>
          <CardHeader>
            <CardTitle>Itens da Fatura</CardTitle>
            <CardDescription>
              Edite os serviços ou produtos desta fatura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-24">Qtd</TableHead>
                  <TableHead className="w-32">Valor Unit.</TableHead>
                  <TableHead className="w-32">Total</TableHead>
                  <TableHead className="w-12">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                  const quantity = form.watch(`items.${index}.quantity`)
                  const unitPrice = form.watch(`items.${index}.unit_price`)
                  const total = calculateItemTotal(quantity, unitPrice)

                  return (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Select
                          value={form.watch(`items.${index}.service_id`)}
                          onValueChange={(value) => {
                            form.setValue(`items.${index}.service_id`, value)
                            const service = services.find(s => s.id === value)
                            if (service) {
                              form.setValue(`items.${index}.description`, service.description || service.name)
                              form.setValue(`items.${index}.unit_price`, service.unit_price || 0)
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map((service) => (
                              <SelectItem key={service.id} value={service.id}>
                                {service.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          {...form.register(`items.${index}.description`)}
                          placeholder="Descrição do item"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          {...form.register(`items.${index}.quantity`, {
                            valueAsNumber: true
                          })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...form.register(`items.${index}.unit_price`, {
                            valueAsNumber: true
                          })}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(total)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            <Button
              type="button"
              variant="outline"
              onClick={() => append({
                service_id: "",
                description: "",
                quantity: 1,
                unit_price: 0
              })}
              className="mt-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Item
            </Button>
          </CardContent>
        </Card>

        {/* Totais e observações */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                {...form.register('notes')}
                placeholder="Observações adicionais"
                rows={4}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(calculateSubtotal())}
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount">Desconto (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  {...form.register('discount_percentage', { valueAsNumber: true })}
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax">Impostos/Taxas (%)</Label>
                <Input
                  id="tax"
                  type="number"
                  min="0"
                  step="0.01"
                  {...form.register('tax_percentage', { valueAsNumber: true })}
                  placeholder="0,00"
                />
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(calculateTotal())}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end gap-4">
          <Link href={`/invoices/${params.id}`}>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Atualizar Fatura
          </Button>
        </div>
      </form>
    </div>
  )
}