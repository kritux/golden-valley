import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getAuthenticatedCustomer } from '@/lib/auth-helpers'
import Stripe from 'stripe'

const TICKET_PRICE = 500      // dollars
const FIRST_PAYMENT_MIN = 200 // dollars

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
    return null
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-09-30.acacia', typescript: true })
}

export async function POST(req: NextRequest) {
  const customer = await getAuthenticatedCustomer()
  if (!customer) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const contentType = req.headers.get('content-type') ?? ''
  let ticket_id: string
  let amountCents: number
  let payment_method: string
  let receiptFile: File | null = null

  // ── Parse body (FormData for Zelle+file, JSON for Stripe) ────────────────
  if (contentType.includes('multipart/form-data')) {
    let fd: FormData
    try { fd = await req.formData() } catch {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
    }
    ticket_id = (fd.get('ticket_id') as string) ?? ''
    amountCents = parseInt((fd.get('amount') as string) ?? '0', 10)
    payment_method = (fd.get('payment_method') as string) ?? 'zelle'
    receiptFile = fd.get('receipt') as File | null
  } else {
    let body: Record<string, unknown>
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    ticket_id = (body.ticket_id as string) ?? ''
    amountCents = (body.amount as number) ?? 0
    payment_method = (body.payment_method as string) ?? 'stripe'
  }

  if (!ticket_id) return NextResponse.json({ error: 'ticket_id is required' }, { status: 400 })
  if (!amountCents || amountCents < 1) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  if (!['zelle', 'stripe'].includes(payment_method)) return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })

  const amountDollars = amountCents / 100

  const supabase = await createClient()

  // ── 1. Verify ticket belongs to this customer ────────────────────────────
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('id, buyer_id, status, payment_id')
    .eq('id', ticket_id)
    .single()

  if (ticketError || !ticket) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 })
  if (ticket.buyer_id !== customer.id) return NextResponse.json({ error: 'Ticket does not belong to your account.' }, { status: 403 })
  if (ticket.status === 'cancelled') return NextResponse.json({ error: 'This ticket has been cancelled.' }, { status: 400 })

  // ── 2. Calculate already paid ────────────────────────────────────────────
  const { data: existingPayments } = await supabase
    .from('payments')
    .select('amount, status')
    .eq('ticket_id', ticket_id)

  const confirmedTotal = (existingPayments ?? [])
    .filter((p) => p.status === 'confirmed')
    .reduce((sum, p) => sum + (p.amount ?? 0), 0)

  const pendingTotal = (existingPayments ?? [])
    .filter((p) => p.status === 'pending' || p.status === 'under_review')
    .reduce((sum, p) => sum + (p.amount ?? 0), 0)

  const isFirstPayment = confirmedTotal === 0 && pendingTotal === 0

  // ── 3. Validate amount ───────────────────────────────────────────────────
  if (isFirstPayment && amountDollars < FIRST_PAYMENT_MIN) {
    return NextResponse.json({ error: `El primer pago mínimo es $${FIRST_PAYMENT_MIN}.` }, { status: 400 })
  }

  const alreadyCommitted = confirmedTotal + pendingTotal
  if (alreadyCommitted + amountDollars > TICKET_PRICE) {
    const remaining = TICKET_PRICE - alreadyCommitted
    return NextResponse.json({ error: `Pago excede el precio del ticket. Máximo restante: $${remaining}.` }, { status: 400 })
  }

  const admin = await createAdminClient()

  // ── 4. Upload Zelle receipt if provided ──────────────────────────────────
  let zelleReceiptUrl: string | null = null
  if (receiptFile && receiptFile.size > 0) {
    const ext = receiptFile.name.split('.').pop() ?? 'jpg'
    const path = `${customer.id}/${ticket_id}/${Date.now()}.${ext}`
    const arrayBuf = await receiptFile.arrayBuffer()
    const { error: uploadErr } = await admin.storage
      .from('receipts')
      .upload(path, arrayBuf, { contentType: receiptFile.type, upsert: false })

    if (!uploadErr) {
      const { data: signed } = await admin.storage.from('receipts').createSignedUrl(path, 60 * 60 * 24 * 365)
      zelleReceiptUrl = signed?.signedUrl ?? null
    }
  }

  // ── 5. Insert payment record ─────────────────────────────────────────────
  const { data: payment, error: insertError } = await admin
    .from('payments')
    .insert({
      ticket_id,
      buyer_id: customer.id,
      amount: amountDollars,
      method: payment_method,
      status: (payment_method === 'zelle' && zelleReceiptUrl) ? 'under_review' : 'pending',
      zelle_receipt_url: zelleReceiptUrl,
    })
    .select('id')
    .single()

  if (insertError || !payment) {
    console.error('[purchase/installment] insert error:', insertError?.message)
    return NextResponse.json({ error: 'Failed to create payment record.' }, { status: 500 })
  }

  // ── 6. Link payment to ticket on first payment ───────────────────────────
  if (isFirstPayment) {
    await admin.from('tickets').update({ payment_id: payment.id }).eq('id', ticket_id)
  }

  // ── 7. Handle Stripe ─────────────────────────────────────────────────────
  if (payment_method === 'stripe') {
    const stripe = getStripe()
    if (!stripe) {
      await admin.from('payments').delete().eq('id', payment.id)
      return NextResponse.json({ error: 'Stripe payments not configured yet. Please use Zelle.' }, { status: 503 })
    }
    try {
      const intent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        metadata: { payment_id: payment.id, ticket_id, customer_id: customer.id },
        description: 'Golden Valley Members — Ticket Payment',
        receipt_email: customer.email ?? undefined,
      })
      await admin.from('payments').update({ stripe_payment_intent_id: intent.id }).eq('id', payment.id)
      return NextResponse.json({ payment_id: payment.id, client_secret: intent.client_secret })
    } catch (err) {
      console.error('[purchase/installment] Stripe error:', err)
      await admin.from('payments').delete().eq('id', payment.id)
      return NextResponse.json({ error: 'Failed to initialise Stripe payment.' }, { status: 500 })
    }
  }

  // ── 8. Zelle response ────────────────────────────────────────────────────
  return NextResponse.json({
    payment_id: payment.id,
    message: 'Pago registrado. Tu comprobante está en revisión.',
    zelle_instructions: {
      phone: process.env.GVM_ZELLE_PHONE ?? '',
      name: process.env.GVM_ZELLE_NAME ?? 'Golden Valley Members LLC',
      memo: `Ticket ${ticket_id.slice(0, 8).toUpperCase()}`,
      amount_dollars: amountDollars,
    },
  })
}
