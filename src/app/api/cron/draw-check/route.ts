import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

// Called by DB trigger (via pg_notify → Supabase Webhooks → this endpoint)
// OR by Vercel Cron as a fallback check
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()

  // Check if ticket #1000 is confirmed
  const { data: ticket1000 } = await supabase
    .from('tickets')
    .select('id, status, buyer:profiles!tickets_buyer_id_fkey(first_name, last_name, email)')
    .eq('ticket_number', 1000)
    .eq('status', 'active')
    .single()

  if (!ticket1000) {
    return NextResponse.json({ draw_triggered: false, message: 'Ticket #1000 not yet confirmed' })
  }

  // Check no draw_result exists yet
  const { data: existingDraw } = await supabase.from('draw_result').select('id').limit(1).single()
  if (existingDraw) {
    return NextResponse.json({ draw_triggered: false, message: 'Draw already recorded' })
  }

  // Calculate total prize pool
  const { data: poolTotal } = await supabase.rpc('get_prize_pool_total')

  // Notify admin
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'tickets@goldenvalleymembers.com',
    to: process.env.ADMIN_NOTIFICATION_EMAIL ?? 'admin@goldenvalleymembers.com',
    subject: '🏆 [URGENT] Golden Valley — Ticket #1,000 Sold! Draw Required!',
    html: `
      <h1 style="color: #C9A84C;">Ticket #1,000 Has Been Sold!</h1>
      <p>All 1,000 tickets are now confirmed. You must conduct the draw immediately.</p>
      <p><strong>Prize Pool Total:</strong> $${(poolTotal ?? 0).toFixed(2)}</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/admin">Go to Admin Dashboard →</a></p>
    `,
  }).catch(() => null)

  return NextResponse.json({
    draw_triggered: true,
    prize_pool: poolTotal ?? 0,
    ticket_1000_buyer: ticket1000.buyer,
  })
}
