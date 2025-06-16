'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Database } from '@/types/database'

type Company = Database['public']['Tables']['companies']['Row']
type UserProfile = Database['public']['Tables']['user_profiles']['Row']

interface AppContextType {
  user: User | null
  profile: UserProfile | null
  currentCompany: Company | null
  companies: Company[]
  loading: boolean
  switchCompany: (companyId: string) => void
  refreshData: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Função simples para buscar dados
  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setUser(null)
        setProfile(null)
        setCurrentCompany(null)
        setCompanies([])
        setLoading(false)
        return
      }

      setUser(user)

      // Buscar perfil
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profile)

      // Buscar empresas
      const { data: userCompaniesData } = await supabase
        .from('user_companies')
        .select(`
          companies (
            id,
            name,
            cnpj,
            email,
            phone,
            address,
            logo_url,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id)

      const userCompanies = userCompaniesData?.map(uc => uc.companies).filter(Boolean) || []
      setCompanies(userCompanies as unknown as Company[])

      // Definir empresa atual
      if (profile?.current_company_id && userCompanies.length > 0) {
        const currentComp = userCompanies.find((c: any) => c.id === profile.current_company_id)
        setCurrentCompany(currentComp ? currentComp as unknown as Company : userCompanies[0] as unknown as Company)
      } else if (userCompanies.length > 0) {
        setCurrentCompany(userCompanies[0] as unknown as Company)
      }

    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Função para trocar empresa
  const switchCompany = async (companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    if (company) {
      setCurrentCompany(company)
      
      // Atualizar no banco
      if (profile) {
        await supabase
          .from('user_profiles')
          .update({ current_company_id: companyId })
          .eq('id', profile.id)
        
        setProfile({ ...profile, current_company_id: companyId })
      }
    }
  }

  // Função para refresh
  const refreshData = () => {
    setLoading(true)
    fetchUserData()
  }

  // Inicialização simples
  useEffect(() => {
    if (!initialized) {
      setInitialized(true)
      fetchUserData()
    }

    // Listener para mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          fetchUserData()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [initialized])

  const value = {
    user,
    profile,
    currentCompany,
    companies,
    loading,
    switchCompany,
    refreshData
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}