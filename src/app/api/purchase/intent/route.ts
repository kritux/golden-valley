import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { createPaymentIntent } from '@/lib/stripe'
import { resolveReferral } from '@/lib/referrals'
import { notifyGHL } from '@/lib/ghl'

const intentSchema = z.object({
  first_name: z.string().min(1).max(50).trim(),
  last_name: z.string().min(1).max(50).trim(),
  email: z.string().email().toLowerCase().trim(),
  email_confirm: z.string().email().toLowerCase().trim(),
  phone: z.string().min(7).max(20).trim(),
  phone_alt: z.string().max(20).trim().optional(),
  city: z.string().min(1).max(100).trim(),
  state: z.string().min(1).max(100).trim(),
  nationality: z.string().min(1).max(100).trim(),
  ref_code: z.string().max(20).trim().optional(),
  payment_method: z.enum(['zelle', 'stripe']),
  signature_data: z.string().min(10), // base64 PNG
  agreed_terms: z.literal(true),
  agreed_age: z.literal(true),
  agreed_accuracy: z.literal(true),
})

// Simple in-memory rate limiter (3 per IP per hour — MVP)
const ipAttempts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipAttempts.get(ip)
  if (!entry || entry.resetAt < now) {
    ipAttempts.set(ip, { count: 1, resetAt: now + 3600_000 })
    return true
  }
  if (entry.count >= 3) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests. Try again in an hour.' }, { status: 429 })
  }

  const body = await req.json()
  const parsed = intentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid input' }, { status: 400 })
  }

  const data = parsed.data
  if (data.email !== data.email_confirm) {
    return NextResponse.json({ error: 'Emails do not match' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  // Resolve referral
  let l1SellerId: string | null = null
  if (data.ref_code) {
    const ref = await resolveReferral(data.ref_code)
    l1SellerId = ref?.l1SellerId ?? null
  }

  // Upsert profile (customer may already exist if returning)
  const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
    email: data.email,
    email_confirm: true,
    user_metadata: {
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      role: 'customer',
    },
  })

  let profileId: string

  if (authError) {
    // User already exists — find their profile
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', data.email)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Unable to create account. Please contact support.' }, { status: 500 })
    }
    profileId = existing.id
  } else {
    profileId = user!.id
    // Update profile with phone_alt and referred_by (trigger already created base profile)
    await supabase.from('profiles').update({
      phone_alt: data.phone_alt ?? null,
      referred_by: l1SellerId ? (await supabase.from('sellers').select('profile_id').eq('id', l1SellerId).single()).data?.profile_id ?? null : null,
    }).eq('id', profileId)
  }

  // Store signature in Supabase Storage
  const signatureBuffer = Buffer.from(data.signature_data.replace(/^data:image\/\w+;base64,/, ''), 'base64')
  const signaturePath = `signatures/${profileId}/${Date.now()}.png`

  const { error: storageError } = await supabase.storage
    .from('documents')
    .upload(signaturePath, signatureBuffer, { contentType: 'image/png', upsert: false })

  const signatureUrl = storageError ? null : supabase.storage.from('documents').getPublicUrl(signaturePath).data.publicUrl

  // Create pending ticket
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .insert({
      status: 'pending_payment',
      buyer_id: profileId,
      seller_id: l1SellerId,
      signature_url: signatureUrl,
      signature_ip: ip,
      signed_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (ticketError || !ticket) {
    return NextResponse.json({ error: 'Failed to create ticket. Please try again.' }, { status: 500 })
  }

  // Create payment record
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      ticket_id: ticket.id,
      buyer_id: profileId,
      amount: 500,
      method: data.payment_method,
      status: 'pending',
    })
    .select('id')
    .single()

  if (paymentError || !payment) {
    return NextResponse.json({ error: 'Failed to create payment record.' }, { status: 500 })
  }

  // Link payment back to ticket
  await supabase.from('tickets').update({ payment_id: payment.id }).eq('id', ticket.id)

  // GHL notification (non-blocking)
  notifyGHL('purchase_intent', {
    buyer_email: data.email,
    buyer_name: `${data.first_name} ${data.last_name}`,
    payment_method: data.payment_method,
    payment_id: payment.id,
  })

  // Build response based on payment method
  if (data.payment_method === 'stripe') {
    const intent = await createPaymentIntent({
      payment_id: payment.id,
      buyer_email: data.email,
      buyer_name: `${data.first_name} ${data.last_name}`,
    })

    await supabase.from('payments').update({ stripe_payment_intent_id: intent.id }).eq('id', payment.id)

    return NextResponse.json({
      payment_id: payment.id,
      stripe_client_secret: intent.client_secret,
    })
  }

  return NextResponse.json({
    payment_id: payment.id,
    zelle_instructions: {
      phone: process.env.GVM_ZELLE_PHONE ?? '',
      name: process.env.GVM_ZELLE_NAME ?? 'Golden Valley Members LLC',
      memo: `${data.first_name} ${data.last_name}`,
      amount: 500,
    },
  })
}
