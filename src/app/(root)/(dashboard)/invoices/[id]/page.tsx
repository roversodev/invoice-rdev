"use client"

import { toast } from "sonner"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAppContext } from "@/contexts/app-context"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/database"
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
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  ArrowLeft, 
  Edit, 
  Download, 
  Send, 
  Trash2, 
  MoreHorizontal,
  Building,
  User,
  Calendar,
  DollarSign
} from "lucide-react"
import Link from "next/link"
import { DeleteInvoiceModal } from "@/components/delete-invoice-modal"

type InvoiceWithDetails = Database['public']['Tables']['invoices']['Row'] & {
  clients: {
    name: string
    email: string | null
    phone: string | null
    address: string | null
  } | null
  companies: {
    name: string
    cnpj: string | null
    email: string | null
    phone: string | null
    address: string | null
  } | null
}

type InvoiceItem = Database['public']['Tables']['invoice_items']['Row'] & {
  services: {
    name: string
  } | null
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { currentCompany } = useAppContext()
  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null)
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient<Database>()
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (params.id && currentCompany) {
      loadInvoiceDetails()
    }
  }, [params.id, currentCompany])

  const loadInvoiceDetails = async () => {
    if (!params.id || !currentCompany) return

    try {
      setLoading(true)

      // Carregar dados da fatura
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (
            name,
            email,
            phone,
            address
          ),
          companies (
            name,
            cnpj,
            email,
            phone,
            address
          )
        `)
        .eq('id', params.id)
        .eq('company_id', currentCompany.id)
        .single()

      if (invoiceError) throw invoiceError
      setInvoice(invoiceData)

      // Carregar itens da fatura
      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select(`
          *,
          services (
            name
          )
        `)
        .eq('invoice_id', params.id)
        .order('created_at')

      if (itemsError) throw itemsError
      setInvoiceItems(itemsData || [])

    } catch (error) {
      console.error('Erro ao carregar fatura:', error)
      router.push('/invoices')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Rascunho</Badge>
      case 'sent':
        return <Badge variant="outline">Enviada</Badge>
      case 'paid':
        return <Badge variant="default">Paga</Badge>
      case 'overdue':
        return <Badge variant="destructive">Vencida</Badge>
      default:
        return <Badge variant="secondary">Rascunho</Badge>
    }
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const handleDownloadPDF = async () => {
    try {
      toast.loading("Gerando PDF...", { id: "download-pdf" })
      
      const response = await fetch(`/api/invoices/${invoice?.id}/pdf`)
      if (!response.ok) throw new Error('Erro ao gerar PDF')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fatura-${invoice?.invoice_number || invoice?.id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success("PDF baixado com sucesso!", { 
        id: "download-pdf",
        description: "O arquivo foi salvo em sua pasta de downloads."
      })
    } catch (error) {
      console.error('Erro ao baixar PDF:', error)
      toast.error("Erro ao baixar PDF", { 
        id: "download-pdf",
        description: "Ocorreu um erro ao gerar o PDF. Tente novamente."
      })
    }
  }
  
  const handleSendEmail = async () => {
    if (!invoice?.clients?.email) {
      toast.error('Cliente não possui email cadastrado', {
        description: "Adicione um email ao cliente para enviar a fatura."
      })
      return
    }
    
    try {
      toast.loading("Enviando email...", { 
        id: "send-email",
        description: `Enviando fatura para ${invoice.clients.email}`
      })
      
      const response = await fetch(`/api/invoices/${invoice?.id}/send`, {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar email')
      }
      
      toast.success("Email enviado com sucesso!", { 
        id: "send-email",
        description: `Fatura enviada para ${invoice.clients.email}`,
        duration: 5000
      })
      
      // Recarregar dados da fatura para atualizar status
      loadInvoiceDetails()
    } catch (error) {
      console.error('Erro ao enviar email:', error)
      toast.error("Erro ao enviar email", { 
        id: "send-email",
        description: error instanceof Error ? error.message : 'Erro ao enviar email'
      })
    }
  }

  const updateInvoiceStatus = async (newStatus: string) => {
    if (!invoice) return

    try {
      toast.loading("Atualizando status...", { id: "update-status" })
      
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoice.id)

      if (error) throw error
      
      setInvoice({ ...invoice, status: newStatus })
      
      const statusText = newStatus === 'sent' ? 'Enviada' : newStatus === 'paid' ? 'Paga' : newStatus
      toast.success("Status atualizado", { 
        id: "update-status",
        description: `Fatura marcada como: ${statusText}`
      })
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status', { 
        id: "update-status",
        description: "Não foi possível atualizar o status da fatura."
      })
    }
  }

  const handleDeleteInvoice = async () => {
    if (!invoice) return

    try {
      setDeleting(true)
      toast.loading("Excluindo fatura...", { id: "delete-invoice" })
      
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoice.id)

      if (error) throw error
      
      toast.success("Fatura excluída com sucesso!", { 
        id: "delete-invoice",
        description: "A fatura foi removida permanentemente."
      })
      
      router.push('/invoices')
    } catch (error) {
      console.error('Erro ao excluir fatura:', error)
      toast.error('Erro ao excluir fatura', { 
        id: "delete-invoice",
        description: "Não foi possível excluir a fatura. Tente novamente."
      })
    } finally {
      setDeleting(false)
      setDeleteModal(false)
    }
  }

  const openDeleteModal = () => {
    setDeleteModal(true)
  }

  const closeDeleteModal = () => {
    setDeleteModal(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold">Fatura não encontrada</h2>
          <p className="text-muted-foreground mt-2">A fatura solicitada não existe ou você não tem permissão para visualizá-la.</p>
          <Link href="/invoices" className="mt-4 inline-block">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Faturas
            </Button>
          </Link>
        </div>
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
            <BreadcrumbPage>{invoice.invoice_number}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Fatura {invoice.invoice_number}
          </h1>
          <p className="text-muted-foreground">
            {invoice.title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/invoices">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <MoreHorizontal className="mr-2 h-4 w-4" />
                Ações
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/invoices/${invoice.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadPDF}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSendEmail}>
                <Send className="mr-2 h-4 w-4" />
                Enviar por Email
              </DropdownMenuItem>
              {invoice.status === 'draft' && (
                <DropdownMenuItem onClick={() => updateInvoiceStatus('sent')}>
                  <Send className="mr-2 h-4 w-4" />
                  Marcar como Enviada
                </DropdownMenuItem>
              )}
              {invoice.status === 'sent' && (
                <DropdownMenuItem onClick={() => updateInvoiceStatus('paid')}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Marcar como Paga
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                className="text-destructive"
                onClick={openDeleteModal}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Separator />

      {/* Informações principais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações da empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="font-medium">{invoice.companies?.name}</p>
              {invoice.companies?.cnpj && (
                <p className="text-sm text-muted-foreground">CNPJ: {invoice.companies.cnpj}</p>
              )}
            </div>
            {invoice.companies?.email && (
              <p className="text-sm">{invoice.companies.email}</p>
            )}
            {invoice.companies?.phone && (
              <p className="text-sm">{invoice.companies.phone}</p>
            )}
            {invoice.companies?.address && (
              <p className="text-sm text-muted-foreground">{invoice.companies.address}</p>
            )}
          </CardContent>
        </Card>

        {/* Informações do cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="font-medium">{invoice.clients?.name}</p>
            </div>
            {invoice.clients?.email && (
              <p className="text-sm">{invoice.clients.email}</p>
            )}
            {invoice.clients?.phone && (
              <p className="text-sm">{invoice.clients.phone}</p>
            )}
            {invoice.clients?.address && (
              <p className="text-sm text-muted-foreground">{invoice.clients.address}</p>
            )}
          </CardContent>
        </Card>

        {/* Informações da fatura */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Detalhes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Status:</span>
              {getStatusBadge(invoice.status)}
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Emissão:</span>
              <span className="text-sm font-medium">{formatDate(invoice.issue_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Vencimento:</span>
              <span className="text-sm font-medium">{formatDate(invoice.due_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Moeda:</span>
              <span className="text-sm font-medium">{invoice.currency}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Descrição */}
      {invoice.description && (
        <Card>
          <CardHeader>
            <CardTitle>Descrição</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{invoice.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Itens da fatura */}
      <Card>
        <CardHeader>
          <CardTitle>Itens da Fatura</CardTitle>
          <CardDescription>
            {invoiceItems.length} item(s) nesta fatura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Valor Unitário</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoiceItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.services?.name || '-'}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.quantity * item.unit_price)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Resumo financeiro */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {invoice.notes || "Sem observações"}
            </p>
          </CardContent>
        </Card>
        

        {/* Totais */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discount_amount && invoice.discount_percentage || 0 > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Desconto:</span>
                <span>-{formatCurrency(invoice.discount_amount)}</span>
              </div>
            )}
            {invoice.tax_amount && invoice.tax_percentage || 0 > 0 && (
              <div className="flex justify-between">
                <span>Impostos/Taxas:</span>
                <span>{formatCurrency(invoice.tax_amount)}</span>
              </div>
            )}
            <Separator className="mt-2" />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(invoice.total_amount)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <DeleteInvoiceModal
  isOpen={deleteModal}
  onClose={closeDeleteModal}
  onConfirm={handleDeleteInvoice}
  invoiceTitle={invoice?.title || ''}
  isDeleting={deleting}
/>
    </div>

    
  )
}