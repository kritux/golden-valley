import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedCustomer } from '@/lib/auth-helpers'

export async function GET() {
  const customer = await getAuthenticatedCustomer()
  if (!customer) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = await createClient()

  const { data: payments, error } = await supabase
    .from('payments')
    .select('id, amount, status, method, created_at, updated_at, zelle_receipt_url, stripe_payment_intent_id, zelle_confirmed_at, notes, ticket_id')
    .eq('buyer_id', customer.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[customer/payments] DB error:', error.message)
    return NextResponse.json({ error: 'Failed to load payment history.' }, { status: 500 })
  }

  const formatted = (payments ?? []).map((p) => ({
    id: p.id,
    amount: (p.amount ?? 0) * 100, // convert to cents for dashboard compatibility
    status: p.status,
    method: p.method ?? 'zelle',
    created_at: p.created_at,
    verified_at: p.zelle_confirmed_at ?? (p.status === 'confirmed' ? p.updated_at : null),
    zelle_receipt_url: p.zelle_receipt_url ?? null,
    stripe_payment_intent_id: p.stripe_payment_intent_id ?? null,
    notes: p.notes ?? null,
    ticket_id: p.ticket_id ?? null,
  }))

  return NextResponse.json(formatted)
}
