import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { normalisePhone } from '@/lib/auth-helpers'

const schema = z.object({
  phone: z.string().min(7).max(20).trim(),
  token: z.string().min(4).max(10).trim(),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const phone = normalisePhone(parsed.data.phone)
  if (!phone) {
    return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
    phone,
    token: parsed.data.token,
    type: 'sms',
  })

  if (verifyError || !authData.user) {
    return NextResponse.json(
      { error: 'Invalid or expired verification code.' },
      { status: 401 }
    )
  }

  const userId = authData.user.id

  // Use admin client to read/write customers table without RLS restrictions
  const admin = await createAdminClient()

  const { data: existing } = await admin
    .from('customers')
    .select('*')
    .eq('phone', phone)
    .maybeSingle()

  let customer: Record<string, unknown>
  let isNew = false

  if (!existing) {
    // First time this phone has verified — create customer record
    isNew = true
    const { data: created, error: createError } = await admin
      .from('customers')
      .insert({ user_id: userId, phone })
      .select('*')
      .single()

    if (createError || !created) {
      console.error('[verify-otp] Failed to create customer:', createError?.message)
      return NextResponse.json(
        { error: 'Account setup failed. Please contact support.' },
        { status: 500 }
      )
    }

    customer = created as Record<string, unknown>
  } else {
    customer = existing as Record<string, unknown>

    // Backfill user_id if the row was created before the first auth
    if (!existing.user_id) {
      const { data: updated } = await admin
        .from('customers')
        .update({ user_id: userId })
        .eq('id', existing.id)
        .select('*')
        .single()

      if (updated) customer = updated as Record<string, unknown>
    }
  }

  return NextResponse.json({
    success: true,
    isNew,
    customer,
  })
}
