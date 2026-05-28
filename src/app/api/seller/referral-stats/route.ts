import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, seller_id')
    .eq('id', user.id)
    .single() as { data: Record<string, unknown> | null }

  if (profile?.role !== 'seller' || !profile.seller_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const adminClient = await createAdminClient()

  // Fetch commissions joined with ticket and buyer profile
  const { data: rows, error } = await adminClient
    .from('commissions')
    .select(`
      id,
      level,
      amount,
      status,
      created_at,
      ticket:tickets(
        id,
        ticket_number,
        buyer:profiles!tickets_buyer_id_fkey(first_name, last_name)
      )
    `)
    .eq('seller_id', profile.seller_id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch referral stats' }, { status: 500 })
  }

  // Shape commissions into flat response objects
  const commissions = (rows ?? []).map((row: Record<string, unknown>) => {
    const ticket = row.ticket as Record<string, unknown> | null
    const buyer = ticket?.buyer as Record<string, unknown> | null
    const firstName = (buyer?.first_name as string) ?? ''
    const lastInitial = buyer?.last_name
      ? (buyer.last_name as string).charAt(0).toUpperCase() + '.'
      : ''
    return {
      id: row.id as string,
      ticket_id: (ticket?.id as string) ?? null,
      ticket_number: (ticket?.ticket_number as number | null) ?? null,
      buyer_name: firstName ? `${firstName} ${lastInitial}`.trim() : 'Unknown',
      level: row.level as number,
      amount: row.amount as number,
      status: row.status as string,
      created_at: row.created_at as string,
    }
  })

  const total_referrals = commissions.length
  const total_pending = commissions
    .filter((c) => c.status === 'pending')
    .reduce((sum, c) => sum + c.amount, 0)
  const total_earned = commissions
    .filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + c.amount, 0)

  return NextResponse.json({
    total_referrals,
    total_pending,
    total_earned,
    commissions,
  })
}
