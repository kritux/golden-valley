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

  const sellerId = profile.seller_id
  const adminClient = await createAdminClient()

  const [commissions, downlineCount, seller] = await Promise.all([
    adminClient.from('commissions').select('amount, status').eq('seller_id', sellerId),
    adminClient.from('sellers').select('id', { count: 'exact' }).eq('recruited_by', sellerId),
    adminClient.from('sellers').select('total_sales, referral_code').eq('id', sellerId).single(),
  ])

  const earned = (commissions.data ?? []).filter((c) => c.status !== 'pending').reduce((sum, c) => sum + c.amount, 0)
  const pending = (commissions.data ?? []).filter((c) => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://goldenvalleymembers.com'

  return NextResponse.json({
    tickets_sold: seller.data?.total_sales ?? 0,
    commissions_earned: earned,
    commissions_pending: pending,
    downline_count: downlineCount.count ?? 0,
    referral_link: `${appUrl}/?ref=${seller.data?.referral_code ?? ''}`,
  })
}
