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

export async function GET(req: NextRequest) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim() ?? ''
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'))
  const limit = 50
  const offset = (page - 1) * limit

  const admin = await createAdminClient()

  let query = admin
    .from('profiles')
    .select(`
      id, first_name, last_name, email, phone, phone_alt, role, referred_by, seller_id, created_at,
      tickets!tickets_buyer_id_fkey(id, ticket_number, status, activated_at),
      payments!payments_buyer_id_fkey(id, amount, status, method, created_at)
    `, { count: 'exact' })
    .neq('role', 'admin')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (q) {
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[admin/customers GET]', error.message)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }

  return NextResponse.json({ data, total: count, page, per_page: limit })
}
