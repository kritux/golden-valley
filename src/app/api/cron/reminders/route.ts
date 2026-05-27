import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendReminder24hEmail } from '@/lib/resend/receipt'

// Vercel Cron: run every hour
// vercel.json: { "crons": [{ "path": "/api/cron/reminders", "schedule": "0 * * * *" }] }
export async function GET(req: NextRequest) {
  // Secure with CRON_SECRET header
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()
  const now = new Date()
  const h24Ago = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const h72Ago = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString()
  const h25Ago = new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString() // upper bound for 24h window
  const h73Ago = new Date(now.getTime() - 73 * 60 * 60 * 1000).toISOString()

  // 24h reminder: pending payments created between 24-25h ago
  const { data: pending24 } = await supabase
    .from('payments')
    .select('id, buyer_id, profiles!payments_buyer_id_fkey(email, first_name, last_name)')
    .in('status', ['pending'])
    .gte('created_at', h25Ago)
    .lte('created_at', h24Ago)

  for (const payment of pending24 ?? []) {
    const profile = payment.profiles as { email: string; first_name: string; last_name: string } | null
    if (profile) {
      await sendReminder24hEmail({
        to: profile.email,
        buyerName: `${profile.first_name} ${profile.last_name}`,
        paymentId: payment.id,
      }).catch(() => null)
    }
  }

  // 72h reminder: pending payments created between 72-73h ago
  const { data: pending72 } = await supabase
    .from('payments')
    .select('id, buyer_id, profiles!payments_buyer_id_fkey(email, first_name, last_name)')
    .in('status', ['pending'])
    .gte('created_at', h73Ago)
    .lte('created_at', h72Ago)

  for (const payment of pending72 ?? []) {
    const profile = payment.profiles as { email: string; first_name: string; last_name: string } | null
    if (profile) {
      await sendReminder24hEmail({
        to: profile.email,
        buyerName: `${profile.first_name} ${profile.last_name}`,
        paymentId: payment.id,
      }).catch(() => null)
    }
  }

  return NextResponse.json({
    processed_24h: pending24?.length ?? 0,
    processed_72h: pending72?.length ?? 0,
  })
}
