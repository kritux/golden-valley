import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDownline } from '@/lib/referrals'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role, seller_id').eq('id', user.id).single() as { data: Record<string, unknown> | null }
  if (profile?.role !== 'seller' || !profile.seller_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const downline = await getDownline(profile.seller_id, 2)
  return NextResponse.json(downline)
}
