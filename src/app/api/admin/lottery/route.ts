import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { setTrisCache, getTrisCache } from '@/lib/lottery-cache'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as { data: { role: string } | null }
  return profile?.role === 'admin' ? user : null
}

// GET — return current cached result
export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const cache = await getTrisCache()
  return NextResponse.json(cache ?? { digits: null, date: null })
}

// POST { digits: "XXX" } — admin sets today's Tris result manually
export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { digits: string }
  if (!body.digits || !/^\d{3}$/.test(body.digits)) {
    return NextResponse.json({ error: 'digits must be exactly 3 digits (0–9)' }, { status: 400 })
  }

  const date = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
  await setTrisCache(body.digits, date)

  // Also update the in-memory cache in the lottery route by calling it
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/lottery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ digits: body.digits }),
  }).catch(() => null)

  return NextResponse.json({ ok: true, digits: body.digits, date })
}
