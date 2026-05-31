import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthenticatedCustomer } from '@/lib/auth-helpers'

const schema = z.object({
  ticket_number: z.number().int().min(1).max(1000),
  referral_code: z.string().min(1).max(32),
})

export async function POST(req: NextRequest) {
  const customer = await getAuthenticatedCustomer()
  if (!customer) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid input' }, { status: 400 })
  }

  const { ticket_number, referral_code } = parsed.data
  const code = referral_code.toUpperCase().trim()
  const admin = await createAdminClient()

  // 1. User must not already have an active/pending ticket
  const { data: existing } = await admin
    .from('tickets')
    .select('id')
    .eq('buyer_id', customer.id)
    .neq('status', 'cancelled')
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'You already have a membership number.' }, { status: 400 })
  }

  // 2. Number must be available
  const { data: taken } = await admin
    .from('tickets')
    .select('id')
    .eq('ticket_number', ticket_number)
    .neq('status', 'cancelled')
    .maybeSingle()

  if (taken) {
    return NextResponse.json(
      { error: 'This number is already taken. Please choose another.' },
      { status: 409 }
    )
  }

  // 3. Look up seller by referral code (null = direct sale)
  let sellerId: string | null = null
  if (code !== 'DIRECTO') {
    const { data: seller } = await admin
      .from('sellers')
      .select('id')
      .eq('referral_code', code)
      .eq('is_active', true)
      .maybeSingle()
    sellerId = seller?.id ?? null
  }

  // 4. Create ticket record
  const { data: ticket, error } = await admin
    .from('tickets')
    .insert({
      ticket_number,
      buyer_id: customer.id,
      seller_id: sellerId,
      status: 'pending_payment',
    })
    .select('id')
    .single()

  if (error || !ticket) {
    console.error('[tickets/claim] insert error:', error?.message)
    return NextResponse.json({ error: 'Failed to claim this number. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ ticket_id: ticket.id, ticket_number })
}
