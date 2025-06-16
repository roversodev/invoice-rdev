import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // ✅ Adicionar timeout para evitar travamentos
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), 5000)
  )
  
  try {
    const supabase = createMiddlewareClient({ req, res })
    
    const sessionPromise = supabase.auth.getSession()
    const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any

    // Rotas que requerem autenticação
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      if (!session) {
        const loginUrl = new URL('/login', req.url)
        return NextResponse.redirect(loginUrl)
      }
    }

    // Redirecionar usuários logados da página de login
    if (req.nextUrl.pathname === '/login') {
      if (session) {
        const dashboardUrl = new URL('/dashboard', req.url)
        return NextResponse.redirect(dashboardUrl)
      }
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // Em caso de erro, permitir acesso (fallback)
    return res
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'
  ],
}