import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthenticatedCustomer } from '@/lib/auth-helpers'

function buildReferralCode(ticketNumber: number | null, firstName: string, lastName: string): string | null {
  if (!ticketNumber) return null
  const num = String(ticketNumber).padStart(3, '0')
  const f = (firstName.trim()[0] ?? '').toUpperCase()
  const l = (lastName.trim()[0] ?? '').toUpperCase()
  return `GV${num}${f}${l}`
}

async function generateQR(text: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const QRCode = require('qrcode') as typeof import('qrcode')
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    margin: 2,
    width: 300,
    color: { dark: '#1a1a1a', light: '#ffffff' },
  })
}

export async function GET(req: NextRequest) {
  const customer = await getAuthenticatedCustomer()
  if (!customer) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const refCodeParam = searchParams.get('ref_code')

  let refCode = refCodeParam

  if (!refCode) {
    const admin = await createAdminClient()
    const { data: ticket } = await admin
      .from('tickets')
      .select('ticket_number')
      .eq('buyer_id', customer.id)
      .eq('status', 'active')
      .maybeSingle()

    refCode = buildReferralCode(
      ticket?.ticket_number ?? null,
      customer.first_name ?? '',
      customer.last_name ?? ''
    )
  }

  if (!refCode) {
    return NextResponse.json(
      { error: 'No referral code available. Your payment must be confirmed first.' },
      { status: 422 }
    )
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://goldenvalleymembers.com'
  const referralUrl = `${siteUrl}/?ref=${encodeURIComponent(refCode)}`

  try {
    const qrDataUrl = await generateQR(referralUrl)
    return NextResponse.json({ qr_data_url: qrDataUrl })
  } catch (err) {
    console.error('[customer/qr] QR generation failed:', err)
    return NextResponse.json({ error: 'Failed to generate QR code.' }, { status: 500 })
  }
}
