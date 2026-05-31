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
  const method = url.searchParams.get('method')
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'))
  const limit = 50
  const offset = (page - 1) * limit

  const adminClient = await createAdminClient()

  let query = adminClient
    .from('payments')
    .select(`
      id, amount, method, status, created_at, updated_at, zelle_receipt_url, notes,
      ticket:tickets!fk_payments_ticket_id(id, ticket_number),
      buyer:profiles!payments_buyer_id_fkey(id, first_name, last_name, email),
      confirmed_by:profiles!payments_zelle_confirmed_by_fkey(first_name, last_name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)
  if (method) query = query.eq('method', method)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })

  return NextResponse.json({ data, total: count, page, per_page: limit })
}
