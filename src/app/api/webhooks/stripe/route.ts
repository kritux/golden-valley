import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { constructWebhookEvent } from '@/lib/stripe'
import { sendReceiptEmail } from '@/lib/resend/receipt'
import { notifyGHL } from '@/lib/ghl'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event
  try {
    event = constructWebhookEvent(body, signature)
  } catch (err) {
    console.error('[Stripe webhook] Invalid signature:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object
    const paymentId = intent.metadata?.payment_id

    if (!paymentId) {
      console.error('[Stripe webhook] No payment_id in metadata')
      return NextResponse.json({ error: 'Missing payment_id metadata' }, { status: 400 })
    }

    // Mark payment as confirmed
    const { data: payment } = await supabase
      .from('payments')
      .update({ status: 'confirmed' })
      .eq('id', paymentId)
      .select('id, buyer_id, profiles(email, first_name, last_name)')
      .single()

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Activate ticket + create commissions (atomic DB function)
    const { data: activationData, error: activationError } = await supabase
      .rpc('activate_ticket', { p_payment_id: paymentId })

    if (activationError) {
      console.error('[Stripe webhook] activate_ticket failed:', activationError)
      return NextResponse.json({ error: 'Ticket activation failed' }, { status: 500 })
    }

    const { ticket_number, ticket_id } = activationData as { ticket_number: number; ticket_id: string }

    // Send receipt email
    const profile = payment.profiles as { email: string; first_name: string; last_name: string } | null
    if (profile) {
      await sendReceiptEmail({
        to: profile.email,
        buyerName: `${profile.first_name} ${profile.last_name}`,
        ticketNumber: ticket_number,
        paymentId,
      }).catch((err) => console.error('[Stripe webhook] Email failed:', err))
    }

    // GHL notification
    notifyGHL('ticket_confirmed', {
      payment_id: paymentId,
      ticket_number,
      ticket_id,
      payment_method: 'stripe',
    })
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object
    const paymentId = intent.metadata?.payment_id
    if (paymentId) {
      await supabase.from('payments').update({ status: 'rejected', notes: intent.last_payment_error?.message ?? 'Payment failed' }).eq('id', paymentId)
      await supabase.from('tickets').update({ status: 'cancelled' }).eq('payment_id', paymentId)
    }
  }

  return NextResponse.json({ received: true })
}
