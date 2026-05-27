import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role, seller_id').eq('id', user.id).single() as { data: Record<string, unknown> | null }
  if (profile?.role !== 'seller' || !profile.seller_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const adminClient = await createAdminClient()

  const { data, error } = await adminClient
    .from('commissions')
    .select(`
      id, level, amount, status, paid_at, created_at,
      ticket:tickets(ticket_number)
    `)
    .eq('seller_id', profile.seller_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to fetch commissions' }, { status: 500 })

  return NextResponse.json(data)
}
