import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as { data: Record<string, unknown> | null }
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'))
  const limit = 50
  const offset = (page - 1) * limit

  const adminClient = await createAdminClient()

  let query = adminClient
    .from('commissions')
    .select(`
      id, level, amount, status, paid_at, created_at,
      seller:sellers(id, referral_code, profile:profiles(first_name, last_name, email)),
      ticket:tickets(ticket_number)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: 'Failed to fetch commissions' }, { status: 500 })

  return NextResponse.json({ data, total: count, page, limit })
}
