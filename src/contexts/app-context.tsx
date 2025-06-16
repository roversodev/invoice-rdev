"use client"

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
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

  const fetchUserData = useCallback(async () => {
    if (initialized) return // Evita múltiplas chamadas
    
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        setProfile(profile)

        // Fetch user's companies through user_companies relationship
        const { data: userCompaniesData } = await supabase
          .from('user_companies')
          .select('company_id, companies(*)')
          .eq('user_id', user.id)

        // Extract companies from the relationship data
        const userCompanies = userCompaniesData?.map(uc => uc.companies).filter(Boolean) || []
        setCompanies(userCompanies as unknown as Company[])

        // Set current company
        if (profile?.current_company_id && userCompanies.length > 0) {
          const currentComp = userCompanies.find((c: any) => c.id === profile.current_company_id)
          setCurrentCompany(currentComp as unknown as Company || null)
        } else if (userCompanies.length > 0) {
          // If no current company set, use the first one
          const firstCompany = userCompanies[0] as unknown as Company
          setCurrentCompany(firstCompany)
          if (profile) {
            // Update profile with first company as current
            await supabase
              .from('user_profiles')
              .update({ current_company_id: firstCompany.id })
              .eq('id', user.id)
          }
        } else {
          setCurrentCompany(null)
        }
      } else {
        // Limpar estados quando não há usuário
        setProfile(null)
        setCurrentCompany(null)
        setCompanies([])
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }, []) // Removido 'initialized' das dependências

  const switchCompany = useCallback(async (companyId: string) => {
    if (!user) return

    try {
      // Update current company in profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ current_company_id: companyId })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        return
      }

      // Update local state
      const company = companies.find(c => c.id === companyId)
      if (company) {
        setCurrentCompany(company)
        setProfile(prev => prev ? { ...prev, current_company_id: companyId } : null)
      } else {
        console.error('Company not found in companies list:', companyId)
      }
    } catch (error) {
      console.error('Error switching company:', error)
    }
  }, [user, companies])

  const refreshData = useCallback(async () => {
    setInitialized(false)
    await fetchUserData()
  }, [fetchUserData])

  useEffect(() => {
    let mounted = true
    
    const initializeApp = async () => {
      if (!initialized && mounted) {
        await fetchUserData()
      }
    }

    initializeApp()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        if (event === 'SIGNED_IN' && session?.user) {
          setInitialized(false)
          await fetchUserData()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setCurrentCompany(null)
          setCompanies([])
          setLoading(false)
          setInitialized(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // Dependências vazias para executar apenas uma vez

  const contextValue = useMemo(() => ({
    user,
    profile,
    currentCompany,
    companies,
    loading,
    switchCompany,
    refreshData,
  }), [user, profile, currentCompany, companies, loading, switchCompany, refreshData])

  return (
    <AppContext.Provider value={contextValue}>
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