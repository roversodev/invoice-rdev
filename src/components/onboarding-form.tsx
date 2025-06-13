"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { Loader2, Building2, User } from "lucide-react"
import { useAppContext } from "@/contexts/app-context"

export function OnboardingForm() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const { refreshData } = useAppContext()

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    phone: ""
  })

  const [companyData, setCompanyData] = useState({
    name: "",
    cnpj: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    website: ""
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        // Pre-fill with user metadata if available
        if (user.user_metadata) {
          setProfileData(prev => ({
            ...prev,
            firstName: user.user_metadata.first_name || "",
            lastName: user.user_metadata.last_name || ""
          }))
        }
      } else {
        router.push('/auth/login')
      }
    }
    getUser()
  }, [])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
  
    try {
      // Create or update user profile
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          full_name: `${profileData.firstName} ${profileData.lastName}`.trim(),
          phone: profileData.phone
        })
  
      if (error) {
        setError(error.message)
        return
      }
  
      setStep(2)
    } catch (err) {
      console.log(err)
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
  
    try {
      // Create company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyData.name,
          cnpj: companyData.cnpj, // Now using correct field name
          email: companyData.email,
          phone: companyData.phone,
          address: companyData.address,
          city: companyData.city,
          state: companyData.state,
          zip_code: companyData.zipCode, // Maps to zip_code in database
          country: companyData.country, // Added country field
          website: companyData.website // Added website field
        })
        .select()
        .single()

        await supabase
        .from('user_companies')
        .insert({
          user_id: user.id,
          company_id: company.id,
          role: 'member'
        })
        .select()
        .single()
  
      if (companyError) {
        setError(companyError.message)
        return
      }
  
      // Update user profile with current company
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          current_company_id: company.id
        })
        .eq('id', user.id)
  
      if (profileError) {
        setError(profileError.message)
        return
      }
  
      // Refresh app context and redirect
      await refreshData()
      router.push('/dashboard')
    } catch (err) {
      console.log(err)
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 1) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-full">
              <User className="size-6" />
            </div>
          </div>
          <CardTitle>Bem-vindo!</CardTitle>
          <CardDescription>
            Vamos começar configurando seu perfil
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Sobrenome</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continuar
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-full">
            <Building2 className="size-6" />
          </div>
        </div>
        <CardTitle>Criar sua empresa</CardTitle>
        <CardDescription>
          Agora vamos configurar os dados da sua empresa
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleCompanySubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Nome da Empresa</Label>
            <Input
              id="companyName"
              value={companyData.name}
              onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
              required
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="document">CNPJ/CPF</Label>
              <Input
                id="document"
                value={companyData.cnpj}
                onChange={(e) => setCompanyData(prev => ({ ...prev, document: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyEmail">Email da Empresa</Label>
              <Input
                id="companyEmail"
                type="email"
                value={companyData.email}
                onChange={(e) => setCompanyData(prev => ({ ...prev, email: e.target.value }))}
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyPhone">Telefone da Empresa</Label>
            <Input
              id="companyPhone"
              type="tel"
              value={companyData.phone}
              onChange={(e) => setCompanyData(prev => ({ ...prev, phone: e.target.value }))}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={companyData.address}
              onChange={(e) => setCompanyData(prev => ({ ...prev, address: e.target.value }))}
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={companyData.city}
                onChange={(e) => setCompanyData(prev => ({ ...prev, city: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={companyData.state}
                onChange={(e) => setCompanyData(prev => ({ ...prev, state: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">CEP</Label>
              <Input
                id="zipCode"
                value={companyData.zipCode}
                onChange={(e) => setCompanyData(prev => ({ ...prev, zipCode: e.target.value }))}
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">País</Label>
            <Input
              id="country"
              value={companyData.country}
              onChange={(e) => setCompanyData(prev => ({ ...prev, country: e.target.value }))}
              disabled={isLoading}
            />
          </div>
          <div className="flex gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setStep(1)}
              disabled={isLoading}
              className="flex-1"
            >
              Voltar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Finalizar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}