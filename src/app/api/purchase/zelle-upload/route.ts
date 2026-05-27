import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendPendingZelleEmail } from '@/lib/resend/receipt'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BYTES = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('receipt') as File | null
  const paymentId = formData.get('payment_id') as string | null

  if (!file || !paymentId) {
    return NextResponse.json({ error: 'Missing receipt or payment_id' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only image files are accepted (JPEG, PNG, WebP)' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
  }

  // Sanitize filename — reject path traversal attempts
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100)

  const supabase = await createAdminClient()

  // Verify payment exists and is in pending state
  const { data: payment } = await supabase
    .from('payments')
    .select('id, status, buyer_id, profiles(email, first_name, last_name)')
    .eq('id', paymentId)
    .single()

  if (!payment || !['pending', 'under_review'].includes(payment.status)) {
    return NextResponse.json({ error: 'Payment not found or already processed.' }, { status: 404 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const storagePath = `receipts/${paymentId}/${Date.now()}_${safeName}`

  const { error: storageError } = await supabase.storage
    .from('documents')
    .upload(storagePath, buffer, { contentType: file.type, upsert: false })

  if (storageError) {
    return NextResponse.json({ error: 'Failed to upload receipt. Please try again.' }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(storagePath)

  // Update payment to under_review
  await supabase
    .from('payments')
    .update({ status: 'under_review', zelle_receipt_url: publicUrl })
    .eq('id', paymentId)

  // Email the buyer
  const profile = payment.profiles as { email: string; first_name: string; last_name: string } | null
  if (profile) {
    await sendPendingZelleEmail({
      to: profile.email,
      buyerName: `${profile.first_name} ${profile.last_name}`,
    }).catch(() => null)
  }

  // Notify admin (simple email via resend)
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'tickets@goldenvalleymembers.com',
    to: process.env.ADMIN_NOTIFICATION_EMAIL ?? 'admin@goldenvalleymembers.com',
    subject: `[Action Required] Zelle Receipt Uploaded — Payment ${paymentId.slice(0, 8)}`,
    html: `<p>A Zelle payment receipt has been uploaded and is pending verification.</p>
           <p><strong>Payment ID:</strong> ${paymentId}</p>
           <p><strong>Receipt:</strong> <a href="${publicUrl}">${publicUrl}</a></p>
           <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/admin/payments">Review in Admin Dashboard →</a></p>`,
  }).catch(() => null)

  return NextResponse.json({ success: true })
}
