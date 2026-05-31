import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getAuthenticatedCustomer } from '@/lib/auth-helpers'

const TICKET_PRICE = 500 // dollars

function buildReferralCode(ticketNumber: number | null, firstName: string, lastName: string): string | null {
  if (!ticketNumber) return null
  const num = String(ticketNumber).padStart(3, '0')
  const f = (firstName.trim()[0] ?? '').toUpperCase()
  const l = (lastName.trim()[0] ?? '').toUpperCase()
  return `GV${num}${f}${l}`
}

export async function GET() {
  const customer = await getAuthenticatedCustomer()
  if (!customer) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = await createClient()

  // Fetch tickets for this buyer
  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('id, ticket_number, status, payment_id, activated_at, created_at')
    .eq('buyer_id', customer.id)
    .order('created_at', { ascending: false })

  if (ticketsError) {
    console.error('[customer/me] tickets error:', ticketsError.message)
    return NextResponse.json({ error: 'Failed to load memberships.' }, { status: 500 })
  }

  // Fetch confirmed payments for this buyer
  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount, status, ticket_id')
    .eq('buyer_id', customer.id)
    .eq('status', 'confirmed')

  const totalPaid = (payments ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0)
  const balanceDue = Math.max(0, TICKET_PRICE - totalPaid)

  const firstTicket = (tickets ?? [])[0] ?? null

  const memberships = firstTicket
    ? [{
        id: firstTicket.id,
        number: firstTicket.ticket_number ?? null,
        payment_status: firstTicket.status === 'active' ? 'paid_full' : totalPaid > 0 ? 'partial' : 'pending',
        total_paid: totalPaid * 100,
        balance_due: balanceDue * 100,
        payment_deadline: null,
        referral_code: firstTicket.status === 'active'
          ? buildReferralCode(firstTicket.ticket_number, customer.first_name ?? '', customer.last_name ?? '')
          : null,
      }]
    : []

  return NextResponse.json({
    customer_id: customer.id,
    name: [customer.first_name, customer.last_name].filter(Boolean).join(' ') || null,
    email: customer.email ?? null,
    phone: customer.phone ?? null,
    memberships,
  })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let body: Record<string, string>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { first_name, last_name, email, signature_data } = body
  if (!first_name?.trim() || !last_name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const admin = await createAdminClient()

  // Build update — only include columns that exist in profiles
  const updates: Record<string, string> = {
    first_name: first_name.trim(),
    last_name: last_name.trim(),
  }
  if (email?.trim()) updates.email = email.trim()
  if (body.phone?.trim()) updates.phone = body.phone.trim()
  if (body.referred_by?.trim()) updates.referred_by = body.referred_by.trim()

  // Upload signature to Storage if provided (base64 data URL)
  if (signature_data?.startsWith('data:image')) {
    try {
      const base64 = signature_data.split(',')[1]
      const buf = Buffer.from(base64, 'base64')
      const path = `signatures/${user.id}.png`
      await admin.storage.from('receipts').upload(path, buf, { contentType: 'image/png', upsert: true })
    } catch { /* non-fatal */ }
  }

  const { error } = await admin
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    console.error('[customer/me PATCH]', error.message)
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
