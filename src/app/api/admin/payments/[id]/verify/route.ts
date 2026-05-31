import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendReceiptEmail } from '@/lib/resend/receipt'
import { notifyGHL } from '@/lib/ghl'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as { data: Record<string, unknown> | null }
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const paymentId = params.id
  const adminClient = await createAdminClient()

  // Confirm the payment
  const { data: payment, error } = await adminClient
    .from('payments')
    .update({
      status: 'confirmed',
      zelle_confirmed_by: user.id,
      zelle_confirmed_at: new Date().toISOString(),
    })
    .eq('id', paymentId)
    .in('status', ['pending', 'under_review'])
    .select('id, buyer_id')
    .single()

  if (error || !payment) {
    return NextResponse.json({ error: 'Payment not found or already processed' }, { status: 404 })
  }

  // Fetch buyer profile separately
  const { data: profileData } = await adminClient
    .from('profiles')
    .select('email, first_name, last_name')
    .eq('id', payment.buyer_id)
    .single() as { data: { email: string; first_name: string; last_name: string } | null }

  // Activate ticket atomically via DB function
  const { data: activationData, error: activationError } = await adminClient
    .rpc('activate_ticket', { p_payment_id: paymentId })

  if (activationError) {
    return NextResponse.json({ error: `Ticket activation failed: ${activationError.message}` }, { status: 500 })
  }

  const { ticket_number } = activationData as { ticket_number: number; ticket_id: string }

  // Send receipt email
  if (profileData) {
    await sendReceiptEmail({
      to: profileData.email,
      buyerName: `${profileData.first_name} ${profileData.last_name}`,
      ticketNumber: ticket_number,
      paymentId,
    }).catch(() => null)
  }

  notifyGHL('ticket_confirmed', { payment_id: paymentId, ticket_number, payment_method: 'zelle' })

  return NextResponse.json({ success: true, ticket_number })
}
