import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as { data: { role: string } | null }
  if (profile?.role !== 'admin') return null
  return user
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select(`
      id, first_name, last_name, email, phone, phone_alt, role, referred_by, seller_id, created_at,
      tickets!tickets_buyer_id_fkey(id, ticket_number, status, activated_at, created_at),
      payments!payments_buyer_id_fkey(id, amount, status, method, created_at, zelle_receipt_url)
    `)
    .eq('id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: Record<string, string>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const allowed = ['first_name', 'last_name', 'email', 'phone', 'phone_alt', 'referred_by', 'role']
  const updates: Record<string, string> = {}
  for (const k of allowed) {
    if (body[k] !== undefined) updates[k] = body[k]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  if (updates.role === 'admin') {
    return NextResponse.json({ error: 'Cannot assign admin role via this endpoint' }, { status: 400 })
  }

  const { error } = await admin.from('profiles').update(updates).eq('id', params.id)
  if (error) {
    console.error('[admin/customers PATCH]', error.message)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = await createAdminClient()
  const userId = params.id

  // Delete in FK-safe order to avoid RESTRICT violations:
  // commissions + prize_pool cascade automatically when tickets/payments are deleted

  const { error: ticketsErr } = await admin
    .from('tickets')
    .delete()
    .eq('buyer_id', userId)

  if (ticketsErr) {
    console.error('[DELETE customer] tickets:', ticketsErr.message)
    return NextResponse.json({ error: 'Failed to delete customer tickets' }, { status: 500 })
  }

  const { error: paymentsErr } = await admin
    .from('payments')
    .delete()
    .eq('buyer_id', userId)

  if (paymentsErr) {
    console.error('[DELETE customer] payments:', paymentsErr.message)
    return NextResponse.json({ error: 'Failed to delete customer payments' }, { status: 500 })
  }

  // Delete profile explicitly (no delete trigger exists)
  await admin.from('profiles').delete().eq('id', userId)

  // Delete auth user
  const { error: authErr } = await admin.auth.admin.deleteUser(userId)
  if (authErr) {
    console.error('[DELETE customer] auth:', authErr.message)
    return NextResponse.json({ error: 'Failed to delete auth user: ' + authErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
