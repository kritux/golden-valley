import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthenticatedCustomer } from '@/lib/auth-helpers'

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

  const admin = await createAdminClient()

  // Get the customer's active ticket to build their referral code
  const { data: ticket } = await admin
    .from('tickets')
    .select('ticket_number, status')
    .eq('buyer_id', customer.id)
    .eq('status', 'active')
    .maybeSingle()

  const refCode = buildReferralCode(
    ticket?.ticket_number ?? null,
    customer.first_name ?? '',
    customer.last_name ?? ''
  )

  if (!refCode) {
    return NextResponse.json({
      referral_code: null,
      referred_count: 0,
      total_earned_cents: 0,
      referrals: [],
    })
  }

  // Find profiles who registered using this referral code
  const { data: referred } = await admin
    .from('profiles')
    .select('id, first_name, created_at')
    .eq('referred_by', refCode)
    .order('created_at', { ascending: false })

  // Check if they're a seller to get commission data
  const { data: sellerData } = await admin
    .from('sellers')
    .select('id, total_commissions_earned')
    .eq('profile_id', customer.id)
    .maybeSingle() as { data: { id: string; total_commissions_earned: number } | null }

  const totalEarnedCents = sellerData ? Math.round((sellerData.total_commissions_earned ?? 0) * 100) : 0

  const referralList = (referred ?? []).map((r) => ({
    name: r.first_name ?? 'Member',
    joined_at: r.created_at,
    commission_cents: 0,
  }))

  return NextResponse.json({
    referral_code: refCode,
    referred_count: referralList.length,
    total_earned_cents: totalEarnedCents,
    referrals: referralList,
  })
}
