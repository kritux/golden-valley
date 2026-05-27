import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import type { UserRole } from '@/types'

const ROLE_ROUTES: Record<string, UserRole[]> = {
  '/admin': ['admin'],
  '/seller': ['seller'],
  '/api/admin': ['admin'],
  '/api/seller': ['seller'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware entirely if Supabase env vars are not configured (local dev without .env.local)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next()
  }

  const { supabaseResponse, user, supabase } = await updateSession(request)

  // Auth routes: redirect authenticated users to their dashboard
  if (pathname.startsWith('/login')) {
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const dest = profile?.role === 'admin' ? '/admin' : '/seller'
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return supabaseResponse
  }

  // Protected routes
  const requiredRoles = Object.entries(ROLE_ROUTES).find(([prefix]) =>
    pathname.startsWith(prefix)
  )?.[1]

  if (requiredRoles) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !requiredRoles.includes(profile.role as UserRole)) {
      // Wrong role — redirect to their own dashboard or home
      const dest = profile?.role === 'admin' ? '/admin' : profile?.role === 'seller' ? '/seller' : '/'
      return NextResponse.redirect(new URL(dest, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|assets).*)',
  ],
}
