"use client"

import { useState, useEffect } from "react"
import { useAppContext } from "@/contexts/app-context"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/database"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Save, Building2, Upload, X, Trash2, AlertTriangle } from "lucide-react"
import Image from "next/image"

const companySchema = z.object({
  name: z.string().min(1, "Nome da empresa é obrigatório"),
  cnpj: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  country: z.string().optional(),
  description: z.string().optional()
})

type CompanyFormData = z.infer<typeof companySchema>

export default function CompanySettingsPage() {
  const { currentCompany, companies, switchCompany, refreshData } = useAppContext()
  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  
  const supabase = createClientComponentClient<Database>()
  
  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      cnpj: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'Brasil',
      description: ''
    }
  })

  useEffect(() => {
    if (currentCompany) {
      form.reset({
        name: currentCompany.name,
        cnpj: currentCompany.cnpj || '',
        email: currentCompany.email || '',
        phone: currentCompany.phone || '',
        website: currentCompany.website || '',
        address: currentCompany.address || '',
        city: currentCompany.city || '',
        state: currentCompany.state || '',
        zip_code: currentCompany.zip_code || '',
        country: currentCompany.country || 'Brasil',
        description: currentCompany.description || ''
      })
      
      if (currentCompany.logo_url) {
        setLogoPreview(currentCompany.logo_url)
      }
    }
  }, [currentCompany, form])

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
  }

  const onSubmit = async (data: CompanyFormData) => {
    if (!currentCompany) return
  
    try {
      setLoading(true)
      
      let logoUrl = currentCompany.logo_url
      
      // Upload da logo se houver arquivo
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `${currentCompany.id}/logo.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('company-logos')
          .upload(fileName, logoFile, { upsert: true })
          
        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage
          .from('company-logos')
          .getPublicUrl(fileName)
          
        logoUrl = publicUrl
      }
      
      // Atualizar dados da empresa
      const { error } = await supabase
        .from('companies')
        .update({
          name: data.name,
          cnpj: data.cnpj || null,
          email: data.email || null,
          phone: data.phone || null,
          website: data.website || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          zip_code: data.zip_code || null,
          country: data.country || null,
          logo_url: logoUrl
        })
        .eq('id', currentCompany.id)
        
      if (error) throw error
      
      await refreshData()
      toast.success('Dados da empresa atualizados com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar empresa:', {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        error: error,
        stack: error instanceof Error ? error.stack : undefined
      })
      
      // Mostrar mensagem de erro mais específica
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao atualizar empresa'
      toast.error(`Erro ao atualizar dados da empresa: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCompany = async () => {
    if (!currentCompany || deleteConfirmation !== currentCompany.name) {
      toast.error('Digite o nome da empresa corretamente para confirmar')
      return
    }
  
    // Verificar se há outras empresas disponíveis
    if (companies.length <= 1) {
      toast.error('Não é possível excluir a única empresa. Você deve ter pelo menos uma empresa ativa.')
      return
    }
  
    try {
      setDeleteLoading(true)
  
      // Verificar se há faturas associadas
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('id')
        .eq('company_id', currentCompany.id)
        .limit(1)
  
      if (invoicesError) {
        console.error('Erro ao verificar faturas:', invoicesError)
        throw invoicesError
      }
  
      if (invoices && invoices.length > 0) {
        toast.error('Não é possível excluir a empresa pois há faturas associadas')
        return
      }
  
      // Verificar se há clientes associados
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id')
        .eq('company_id', currentCompany.id)
        .limit(1)
  
      if (clientsError) {
        console.error('Erro ao verificar clientes:', clientsError)
        throw clientsError
      }
  
      if (clients && clients.length > 0) {
        toast.error('Não é possível excluir a empresa pois há clientes associados')
        return
      }
  
      // Encontrar outra empresa para selecionar automaticamente
      const otherCompany = companies.find(company => company.id !== currentCompany.id)
      
      if (!otherCompany) {
        toast.error('Erro: Não foi possível encontrar outra empresa para ativar')
        return
      }
  
      // 1. Primeiro, trocar para outra empresa ANTES de excluir
      await switchCompany(otherCompany.id)
      
      // Aguardar um pouco para garantir que a troca foi processada
      await new Promise(resolve => setTimeout(resolve, 500))
  
      // 3. Excluir relacionamento user_companies
      const { error: userCompanyError, count: userCompanyCount } = await supabase
        .from('user_companies')
        .delete({ count: 'exact' })
        .eq('company_id', currentCompany.id)
  
      if (userCompanyError) {
        console.error('Erro ao excluir user_companies:', userCompanyError)
        throw userCompanyError
      }
  
      // 4. Excluir empresa da tabela companies
      const { error: companyError, count: companyCount } = await supabase
        .from('companies')
        .delete({ count: 'exact' })
        .eq('id', currentCompany.id)
  
      if (companyError) {
        console.error('Erro ao excluir empresa:', companyError)
        throw companyError
      }
  
      // 5. Atualizar dados do contexto
      await refreshData()
  
      toast.success(`Empresa "${currentCompany.name}" excluída com sucesso! Agora você está usando: ${otherCompany.name}`)
      setDeleteModalOpen(false)
      setDeleteConfirmation('')
      
    } catch (error) {
      console.error('Erro ao excluir empresa:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(`Erro ao excluir empresa: ${errorMessage}`)
      
      // Em caso de erro, tentar voltar para a empresa original
      try {
        await switchCompany(currentCompany.id)
        await refreshData()
      } catch (rollbackError) {
        console.error('Erro ao fazer rollback:', rollbackError)
      }
    } finally {
      setDeleteLoading(false)
    }
  }

  const isDeleteDisabled = deleteConfirmation !== currentCompany?.name
  const canDeleteCompany = companies.length > 1

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Configurações da Empresa</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie as informações da sua empresa.
        </p>
      </div>
      
      <Separator />
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Logo da Empresa */}
        <Card>
          <CardHeader>
            <CardTitle>Logo da Empresa</CardTitle>
            <CardDescription>
              Faça upload da logo da sua empresa. Recomendamos uma imagem quadrada de pelo menos 200x200px.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              {logoPreview ? (
                <div className="relative">
                  <Image
                    src={logoPreview}
                    alt="Logo da empresa"
                    width={100}
                    height={100}
                    className="rounded-lg border object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={removeLogo}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex h-[100px] w-[100px] items-center justify-center rounded-lg border border-dashed">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              
              <div>
                <Label htmlFor="logo" className="cursor-pointer">
                  <Button type="button" variant="outline" asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Fazer Upload
                    </span>
                  </Button>
                </Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  PNG, JPG ou SVG até 5MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Dados principais da sua empresa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="name">Nome da Empresa *</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="Nome da sua empresa"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  {...form.register('cnpj')}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  placeholder="contato@empresa.com"
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
                />
              </div>
              
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  {...form.register('website')}
                  placeholder="https://www.empresa.com"
                />
                {form.formState.errors.website && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.website.message}
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Breve descrição da sua empresa"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
            <CardDescription>
              Endereço da sede da empresa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  {...form.register('address')}
                  placeholder="Rua, número, bairro"
                />
              </div>
              
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  {...form.register('city')}
                  placeholder="São Paulo"
                />
              </div>
              
              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  {...form.register('state')}
                  placeholder="SP"
                />
              </div>
              
              <div>
                <Label htmlFor="zip_code">CEP</Label>
                <Input
                  id="zip_code"
                  {...form.register('zip_code')}
                  placeholder="00000-000"
                />
              </div>
              
              <div>
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  {...form.register('country')}
                  placeholder="Brasil"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar Alterações
          </Button>
        </div>
      </form>

      {/* Zona de Perigo */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Zona de Perigo
          </CardTitle>
          <CardDescription>
            Ações irreversíveis que afetam permanentemente sua empresa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-destructive">Excluir Empresa</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Esta ação excluirá permanentemente sua empresa e todos os dados associados. 
                Esta ação não pode ser desfeita.
              </p>
              {!canDeleteCompany && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
                  <p className="text-sm text-yellow-800">
                    <strong>Atenção:</strong> Você não pode excluir esta empresa pois é a única empresa em sua conta. 
                    Crie outra empresa primeiro para poder excluir esta.
                  </p>
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                <strong>Nota:</strong> Não será possível excluir se houver faturas ou clientes associados.
              </p>
            </div>
            
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="mt-2" 
                  disabled={!canDeleteCompany}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Empresa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center text-destructive">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Confirmar Exclusão da Empresa
                  </DialogTitle>
                  <DialogDescription>
                    Esta ação é <strong>irreversível</strong>. Todos os dados da empresa serão 
                    permanentemente excluídos.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <h4 className="font-medium text-destructive mb-2">O que será excluído:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Todas as informações da empresa</li>
                      <li>• Logo da empresa</li>
                      <li>• Configurações personalizadas</li>
                      <li>• Histórico de atividades</li>
                    </ul>
                  </div>
                  
                  {companies.length > 1 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Após a exclusão:</strong> Você será automaticamente redirecionado para outra empresa: 
                        <strong>{companies.find(c => c.id !== currentCompany?.id)?.name}</strong>
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="delete-confirmation">
                      Digite <strong>{currentCompany?.name}</strong> para confirmar:
                    </Label>
                    <Input
                      id="delete-confirmation"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder={currentCompany?.name}
                      className="mt-2"
                      autoComplete="off"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDeleteModalOpen(false)
                      setDeleteConfirmation('')
                    }}
                    disabled={deleteLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteCompany}
                    disabled={isDeleteDisabled || deleteLoading}
                  >
                    {deleteLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Excluir Permanentemente
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}