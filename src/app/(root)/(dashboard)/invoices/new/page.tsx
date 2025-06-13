"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppContext } from "@/contexts/app-context"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/database"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { 
  invoiceSchema, 
  type InvoiceFormData,
  serviceSchema,
  type ServiceFormData,
  serviceCategorySchema,
  type ServiceCategoryFormData
} from "@/lib/validations"
import { ClientModal } from "@/components/client-modal"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Trash2, Save, ArrowLeft, UserPlus, Settings } from "lucide-react"
import Link from "next/link"

type Client = Database['public']['Tables']['clients']['Row']
type Service = Database['public']['Tables']['services']['Row']
type ServiceCategory = Database['public']['Tables']['service_categories']['Row']

export default function NewInvoicePage() {
  const { currentCompany } = useAppContext()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [showClientModal, setShowClientModal] = useState(false)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [creatingService, setCreatingService] = useState(false)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const supabase = createClientComponentClient<Database>()

    // Replace createClient function
    const handleClientSuccess = () => {
      // Recarregar lista de clientes
      loadInitialData()
    }
  
    // Remove the old createClient function completely

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      client_id: "",
      title: "",
      description: "",
      issue_date: new Date().toISOString().split('T')[0],
      due_date: "",
      discount_percentage: 0,
      tax_percentage: 0,
      notes: "",
      items: [{
        service_id: "",
        description: "",
        quantity: 1,
        unit_price: 0,
      }]
    }
  })

  // Remove clientForm completely

  const serviceForm = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      category_id: "",
      name: "",
      description: "",
      unit_price: 0,
      unit: ""
    }
  })

  const categoryForm = useForm<ServiceCategoryFormData>({
    resolver: zodResolver(serviceCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#3b82f6"
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  })

  useEffect(() => {
    if (currentCompany) {
      loadInitialData()
    }
  }, [currentCompany])

  const loadInitialData = async () => {
    if (!currentCompany) return

    try {
      setLoadingData(true)
      
      // Carregar clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('is_active', true)
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

      // Carregar categorias de serviços
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('service_categories')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('name')

      if (categoriesError) throw categoriesError
      setServiceCategories(categoriesData || [])

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleClientCreated = (newClient: Client) => {
    setClients(prev => [...prev, newClient])
    form.setValue('client_id', newClient.id)
    setShowClientModal(false)
  }

  const createService = async (data: ServiceFormData) => {
    if (!currentCompany) return

    try {
      setCreatingService(true)
      
      const { data: newService, error } = await supabase
        .from('services')
        .insert({
          company_id: currentCompany.id,
          category_id: data.category_id || null,
          name: data.name,
          description: data.description || null,
          unit_price: data.unit_price,
          unit: data.unit || null,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      // Atualizar lista de serviços
      setServices(prev => [...prev, newService])
      
      // Fechar modal e resetar formulário
      setShowServiceModal(false)
      serviceForm.reset()
      
    } catch (error) {
      console.error('Erro ao criar serviço:', error)
      alert('Erro ao criar serviço')
    } finally {
      setCreatingService(false)
    }
  }

  const createCategory = async (data: ServiceCategoryFormData) => {
    if (!currentCompany) return

    try {
      setCreatingCategory(true)
      
      const { data: newCategory, error } = await supabase
        .from('service_categories')
        .insert({
          company_id: currentCompany.id,
          name: data.name,
          description: data.description || null,
          color: data.color || null
        })
        .select()
        .single()

      if (error) throw error

      // Atualizar lista de categorias
      setServiceCategories(prev => [...prev, newCategory])
      
      // Selecionar a nova categoria no formulário de serviço
      serviceForm.setValue('category_id', newCategory.id)
      
      // Fechar modal e resetar formulário
      setShowCategoryModal(false)
      categoryForm.reset()
      
    } catch (error) {
      console.error('Erro ao criar categoria:', error)
      alert('Erro ao criar categoria')
    } finally {
      setCreatingCategory(false)
    }
  }

  const calculateItemTotal = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice
  }

  const calculateSubtotal = () => {
    const items = form.watch('items')
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const discount = form.watch('discount_percentage') || 0
    const tax = form.watch('tax_percentage') || 0
    return subtotal - discount + tax
  }

  const onSubmit = async (data: InvoiceFormData) => {
    if (!currentCompany) return

    try {
      setLoading(true)

      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Gerar número da fatura
      const { data: lastInvoice } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      let invoiceNumber = 'FAT-001'
      if (lastInvoice?.invoice_number) {
        const lastNumber = parseInt(lastInvoice.invoice_number.split('-')[1])
        invoiceNumber = `FAT-${String(lastNumber + 1).padStart(3, '0')}`
      }

      const subtotal = calculateSubtotal()
      const total = calculateTotal()

      // Criar fatura
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          company_id: currentCompany.id,
          client_id: data.client_id,
          created_by: user.id,
          invoice_number: invoiceNumber,
          title: data.title,
          description: data.description,
          issue_date: data.issue_date,
          due_date: data.due_date,
          subtotal,
          discount_percentage: data.discount_percentage,
          tax_percentage: data.tax_percentage,
          total_amount: total,
          currency: "BRL",
          notes: data.notes,
          status: 'draft'
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError

      // Criar itens da fatura
      const invoiceItems = data.items.map(item => ({
        invoice_id: invoice.id,
        service_id: item.service_id || null,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price
      }))

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems)

      if (itemsError) throw itemsError

      router.push(`/invoices/${invoice.id}`)
    } catch (error) {
      console.error('Erro ao criar fatura:', error)
      alert('Erro ao criar fatura')
    } finally {
      setLoading(false)
    }
  }

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
            <BreadcrumbPage>Nova Fatura</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Fatura</h1>
          <p className="text-muted-foreground">
            Crie uma nova fatura para seus clientes
          </p>
        </div>
        <Link href="/invoices">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>

      <Separator />

      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
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
                <div className="flex gap-2">
                  <Select
                    value={form.watch('client_id')}
                    onValueChange={(value) => form.setValue('client_id', value)}
                  >
                    <SelectTrigger className="flex-1">
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
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={() => setShowClientModal(true)}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>

                  <ClientModal
                isOpen={showClientModal}
                onClose={() => setShowClientModal(false)}
                onSuccess={handleClientSuccess}
                mode="create"
              />
                </div>
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Itens da Fatura</CardTitle>
                <CardDescription>
                  Adicione os serviços ou produtos desta fatura
                </CardDescription>
              </div>
              <Dialog open={showServiceModal} onOpenChange={setShowServiceModal}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Novo Serviço
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Novo Serviço</DialogTitle>
                    <DialogDescription>
                      Adicione um novo serviço ao sistema
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={serviceForm.handleSubmit(createService)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="service_category">Categoria</Label>
                      <div className="flex gap-2">
                        <Select
                          value={serviceForm.watch('category_id')}
                          onValueChange={(value) => serviceForm.setValue('category_id', value)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {serviceCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
                          <DialogTrigger asChild>
                            <Button type="button" variant="outline" size="icon">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Nova Categoria</DialogTitle>
                              <DialogDescription>
                                Crie uma nova categoria de serviços
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={categoryForm.handleSubmit(createCategory)} className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="category_name">Nome *</Label>
                                <Input
                                  id="category_name"
                                  {...categoryForm.register('name')}
                                  placeholder="Nome da categoria"
                                />
                                {categoryForm.formState.errors.name && (
                                  <p className="text-sm text-destructive">
                                    {categoryForm.formState.errors.name.message}
                                  </p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="category_description">Descrição</Label>
                                <Textarea
                                  id="category_description"
                                  {...categoryForm.register('description')}
                                  placeholder="Descrição da categoria"
                                  rows={3}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="category_color">Cor</Label>
                                <Input
                                  id="category_color"
                                  type="color"
                                  {...categoryForm.register('color')}
                                />
                              </div>
                              <DialogFooter>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setShowCategoryModal(false)}
                                >
                                  Cancelar
                                </Button>
                                <Button type="submit" disabled={creatingCategory}>
                                  {creatingCategory ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  ) : (
                                    <Plus className="mr-2 h-4 w-4" />
                                  )}
                                  Criar Categoria
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="service_name">Nome *</Label>
                      <Input
                        id="service_name"
                        {...serviceForm.register('name')}
                        placeholder="Nome do serviço"
                      />
                      {serviceForm.formState.errors.name && (
                        <p className="text-sm text-destructive">
                          {serviceForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="service_description">Descrição</Label>
                      <Textarea
                        id="service_description"
                        {...serviceForm.register('description')}
                        placeholder="Descrição do serviço"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="service_unit_price">Preço Unitário</Label>
                        <Input
                          id="service_unit_price"
                          type="number"
                          min="0"
                          step="0.01"
                          {...serviceForm.register('unit_price', { valueAsNumber: true })}
                          placeholder="0,00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="service_unit">Unidade</Label>
                        <Input
                          id="service_unit"
                          {...serviceForm.register('unit')}
                          placeholder="hora, peça, etc."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowServiceModal(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={creatingService}>
                        {creatingService ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Settings className="mr-2 h-4 w-4" />
                        )}
                        Criar Serviço
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
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
                unit_price: 0,
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
                <Label htmlFor="discount">Desconto</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  step="0.01"
                  {...form.register('discount_percentage', { valueAsNumber: true })}
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax">Impostos/Taxas</Label>
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
          <Link href="/invoices">
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
            Criar Fatura
          </Button>
        </div>
      </form>
    </div>
  )
}
