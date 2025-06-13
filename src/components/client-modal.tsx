"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAppContext } from "@/contexts/app-context"
import { Database } from "@/types/database"
import { clientSchema, type ClientFormData } from "@/lib/validations"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, User, Plus } from "lucide-react"

type Client = Database['public']['Tables']['clients']['Row']

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  client?: Client | null
  mode: 'create' | 'edit'
}

export function ClientModal({
  isOpen,
  onClose,
  onSuccess,
  client,
  mode
}: ClientModalProps) {
  const { currentCompany } = useAppContext()
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient<Database>()

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      whatsapp: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: '',
      cpf_cnpj: '',
      notes: '',
    }
  })

  useEffect(() => {
    if (client && mode === 'edit') {
      form.reset({
        name: client.name,
        email: client.email || '',
        phone: client.phone || '',
        whatsapp: client.whatsapp || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        zip_code: client.zip_code || '',
        country: client.country || '',
        cpf_cnpj: client.cpf_cnpj || '',
        notes: client.notes || '',
      })
    } else {
      form.reset({
        name: '',
        email: '',
        phone: '',
        whatsapp: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: '',
        cpf_cnpj: '',
        notes: '',
      })
    }
  }, [client, mode, form])

  const handleClose = () => {
    if (loading) return
    form.reset()
    onClose()
  }

  const onSubmit = async (data: ClientFormData) => {
    if (!currentCompany) {
      toast.error('Empresa não selecionada')
      return
    }

    try {
      setLoading(true)

      if (mode === 'create') {
        const { error } = await supabase
          .from('clients')
          .insert({
            company_id: currentCompany.id,
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            whatsapp: data.whatsapp || null,
            address: data.address || null,
            city: data.city || null,
            state: data.state || null,
            zip_code: data.zip_code || null,
            country: data.country || null,
            cpf_cnpj: data.cpf_cnpj || null,
            notes: data.notes || null,
            is_active: true
          })

        if (error) throw error
        toast.success('Cliente criado com sucesso!')
      } else {
        if (!client) throw new Error('Cliente não encontrado')
        
        const { error } = await supabase
          .from('clients')
          .update({
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            whatsapp: data.whatsapp || null,
            address: data.address || null,
            city: data.city || null,
            state: data.state || null,
            zip_code: data.zip_code || null,
            country: data.country || null,
            cpf_cnpj: data.cpf_cnpj || null,
            notes: data.notes || null,
          })
          .eq('id', client.id)

        if (error) throw error
        toast.success('Cliente atualizado com sucesso!')
      }

      onSuccess()
      handleClose()
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
      toast.error(mode === 'create' ? 'Erro ao criar cliente' : 'Erro ao atualizar cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'create' ? (
              <>
                <Plus className="h-5 w-5" />
                Novo Cliente
              </>
            ) : (
              <>
                <User className="h-5 w-5" />
                Editar Cliente
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Preencha os dados do novo cliente'
              : 'Atualize os dados do cliente'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="Nome do cliente"
                disabled={loading}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="email@exemplo.com"
                disabled={loading}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                {...form.register('phone')}
                placeholder="(11) 99999-9999"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                {...form.register('whatsapp')}
                placeholder="(11) 99999-9999"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
              <Input
                id="cpf_cnpj"
                {...form.register('cpf_cnpj')}
                placeholder="000.000.000-00"
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                {...form.register('address')}
                placeholder="Rua, número, bairro"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                {...form.register('city')}
                placeholder="São Paulo"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                {...form.register('state')}
                placeholder="SP"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="zip_code">CEP</Label>
              <Input
                id="zip_code"
                {...form.register('zip_code')}
                placeholder="00000-000"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="country">País</Label>
              <Input
                id="country"
                {...form.register('country')}
                placeholder="Brasil"
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                {...form.register('notes')}
                placeholder="Observações sobre o cliente"
                disabled={loading}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button"
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'create' ? 'Criando...' : 'Salvando...'}
                </>
              ) : (
                mode === 'create' ? 'Criar Cliente' : 'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}