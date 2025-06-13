"use client"

import { useState, useEffect } from 'react'
import { useAppContext } from '@/contexts/app-context'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { toast } from 'sonner'
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
import { Input } from "@/components/ui/input"
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  User, 
  Mail, 
  Phone,
  MapPin,
  FileText,
  Filter
} from "lucide-react"
import { ClientModal } from '@/components/client-modal'
import { DeleteClientModal } from '@/components/delete-client-modal'
import Link from 'next/link'

type Client = Database['public']['Tables']['clients']['Row']

interface ClientWithInvoiceCount extends Client {
  invoice_count: number
}

export default function ClientsPage() {
  const { currentCompany } = useAppContext()
  const [clients, setClients] = useState<ClientWithInvoiceCount[]>([])
  const [filteredClients, setFilteredClients] = useState<ClientWithInvoiceCount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  
  // Modal states
  const [showClientModal, setShowClientModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [deleting, setDeleting] = useState(false)
  
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    if (currentCompany) {
      loadClients()
    }
  }, [currentCompany])

  useEffect(() => {
    filterClients()
  }, [clients, searchTerm, statusFilter])

  const loadClients = async () => {
    if (!currentCompany) return

    try {
      setLoading(true)
      
      // Buscar clientes com contagem de faturas
      const { data: clientsData, error } = await supabase
        .from('clients')
        .select(`
          *,
          invoices(count)
        `)
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transformar os dados para incluir a contagem de faturas
      const clientsWithCount = clientsData?.map(client => ({
        ...client,
        invoice_count: client.invoices?.[0]?.count || 0
      })) || []

      setClients(clientsWithCount)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      toast.error('Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }

  const filterClients = () => {
    let filtered = clients

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.cpf_cnpj?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => 
        statusFilter === 'active' ? client.is_active : !client.is_active
      )
    }

    setFilteredClients(filtered)
  }

  const handleCreateClient = () => {
    setSelectedClient(null)
    setModalMode('create')
    setShowClientModal(true)
  }

  const handleEditClient = (client: Client) => {
    setSelectedClient(client)
    setModalMode('edit')
    setShowClientModal(true)
  }

  const handleDeleteClient = async (client: Client) => {
    // Verificar se o cliente tem faturas ativas
    try {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('id, status')
        .eq('client_id', client.id)
        .neq('status', 'cancelled')

      if (error) throw error

      const hasActiveInvoices = invoices && invoices.length > 0
      
      setSelectedClient({
        ...client,
        hasActiveInvoices,
        activeInvoicesCount: invoices?.length || 0
      } as any)
      setShowDeleteModal(true)
    } catch (error) {
      console.error('Erro ao verificar faturas:', error)
      toast.error('Erro ao verificar faturas do cliente')
    }
  }

  const confirmDeleteClient = async () => {
    if (!selectedClient) return

    try {
      setDeleting(true)
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', selectedClient.id)

      if (error) throw error

      toast.success('Cliente excluído com sucesso!')
      loadClients()
      setShowDeleteModal(false)
      setSelectedClient(null)
    } catch (error) {
      console.error('Erro ao excluir cliente:', error)
      toast.error('Erro ao excluir cliente')
    } finally {
      setDeleting(false)
    }
  }

  const toggleClientStatus = async (client: Client) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_active: !client.is_active })
        .eq('id', client.id)

      if (error) throw error

      toast.success(`Cliente ${!client.is_active ? 'ativado' : 'desativado'} com sucesso!`)
      loadClients()
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast.error('Erro ao alterar status do cliente')
    }
  }

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Selecione uma empresa para ver os clientes</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4 p-4 pt-0">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Clientes</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
            <p className="text-muted-foreground">
              Gerencie os clientes da sua empresa
            </p>
          </div>
          <Button onClick={handleCreateClient}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>

        <Separator />

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome, email ou CPF/CNPJ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  Todos
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('active')}
                >
                  Ativos
                </Button>
                <Button
                  variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('inactive')}
                >
                  Inativos
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Clientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Clientes ({filteredClients.length})
            </CardTitle>
            <CardDescription>
              Lista de todos os clientes cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">Carregando clientes...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Nenhum cliente encontrado com os filtros aplicados'
                    : 'Nenhum cliente cadastrado'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button onClick={handleCreateClient} variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar primeiro cliente
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Faturas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{client.name}</p>
                            {client.cpf_cnpj && (
                              <p className="text-sm text-muted-foreground">
                                {client.cpf_cnpj}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {client.email && (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3" />
                                {client.email}
                              </div>
                            )}
                            {client.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                {client.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.city || client.state ? (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              {[client.city, client.state].filter(Boolean).join(', ')}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            <span className="text-sm">{client.invoice_count}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={client.is_active ? 'default' : 'secondary'}>
                            {client.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEditClient(client)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleClientStatus(client)}>
                                <User className="mr-2 h-4 w-4" />
                                {client.is_active ? 'Desativar' : 'Ativar'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClient(client)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <ClientModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        onSuccess={loadClients}
        client={selectedClient}
        mode={modalMode}
      />

      <DeleteClientModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteClient}
        clientName={selectedClient?.name || ''}
        isDeleting={deleting}
        hasActiveInvoices={(selectedClient as any)?.hasActiveInvoices || false}
        activeInvoicesCount={(selectedClient as any)?.activeInvoicesCount || 0}
      />
    </>
  )
}
