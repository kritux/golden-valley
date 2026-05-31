import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// POST { phone: "5551234567" } → { email: "user@example.com" }
// Uses service role to bypass RLS — safe because we only return email, not full profile
export async function POST(req: NextRequest) {
  let body: { phone?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const raw = (body.phone ?? '').replace(/\D/g, '')
  if (raw.length < 10) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
  }

  // Try multiple E.164 formats to find a match
  const candidates = raw.startsWith('1')
    ? [`+${raw}`, `+1${raw.slice(1)}`]
    : [`+1${raw}`, `+${raw}`]

  const admin = await createAdminClient()

  for (const e164 of candidates) {
    const { data } = await admin
      .from('profiles')
      .select('email')
      .eq('phone', e164)
      .maybeSingle() as { data: { email: string } | null }

    if (data?.email) {
      return NextResponse.json({ email: data.email })
    }
  }

  return NextResponse.json({ error: 'No account found with that phone number' }, { status: 404 })
}
