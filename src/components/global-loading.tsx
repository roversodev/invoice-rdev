"use client"

import { useAppContext } from '@/contexts/app-context'
import { Loader2 } from 'lucide-react'

export function GlobalLoading() {
  const { loading, user } = useAppContext()
  
  if (!loading || !user) return null
  
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Carregando dados...</p>
      </div>
    </div>
  )
}