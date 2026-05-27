import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as { data: Record<string, unknown> | null }
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const adminClient = await createAdminClient()
  const { data, error } = await adminClient.rpc('get_admin_stats')

  if (error) return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })

  return NextResponse.json(data)
}
