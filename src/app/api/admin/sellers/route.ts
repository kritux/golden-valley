import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateReferralCode } from '@/lib/referrals'
import { sendSellerWelcomeEmail } from '@/lib/resend/receipt'
import { notifyGHL } from '@/lib/ghl'

const createSellerSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  first_name: z.string().min(1).max(50).trim(),
  last_name: z.string().min(1).max(50).trim(),
  phone: z.string().min(7).max(20).trim(),
  recruiter_seller_id: z.string().uuid().optional(),
})

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as { data: Record<string, unknown> | null }
  if (profile?.role !== 'admin') return { error: 'Forbidden', status: 403 }
  return { user }
}

export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const adminClient = await createAdminClient()
  const { data, error } = await adminClient
    .from('sellers')
    .select(`
      *,
      profile:profiles(first_name, last_name, email, phone),
      recruiter:sellers!sellers_recruited_by_fkey(
        id,
        profile:profiles(first_name, last_name)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to fetch sellers' }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: (auth as { error: string; status: number }).status })

  const body = await req.json()
  const parsed = createSellerSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 })

  const data = parsed.data
  const adminClient = await createAdminClient()

  // Determine level
  let level = 1
  if (data.recruiter_seller_id) {
    const { data: recruiter } = await adminClient.from('sellers').select('level').eq('id', data.recruiter_seller_id).single()
    if (recruiter) level = Math.min(recruiter.level + 1, 3)
  }

  // Create auth user for seller
  const tempPassword = Math.random().toString(36).slice(2, 12) + 'A1!'
  const { data: { user }, error: authError } = await adminClient.auth.admin.createUser({
    email: data.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { first_name: data.first_name, last_name: data.last_name, phone: data.phone, role: 'seller' },
  })

  if (authError || !user) {
    return NextResponse.json({ error: authError?.message ?? 'Failed to create seller account' }, { status: 500 })
  }

  // Update profile role to seller
  await adminClient.from('profiles').update({ role: 'seller', phone: data.phone }).eq('id', user.id)

  // Create seller record
  const referralCode = generateReferralCode(data.first_name, data.last_name)
  const { data: seller, error: sellerError } = await adminClient
    .from('sellers')
    .insert({
      profile_id: user.id,
      referral_code: referralCode,
      level,
      recruited_by: data.recruiter_seller_id ?? null,
      is_active: true,
    })
    .select('id')
    .single()

  if (sellerError || !seller) {
    return NextResponse.json({ error: 'Failed to create seller record' }, { status: 500 })
  }

  // Link profile → seller
  await adminClient.from('profiles').update({ seller_id: seller.id }).eq('id', user.id)

  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://goldenvalleymembers.com'}/login`

  await sendSellerWelcomeEmail({
    to: data.email,
    sellerName: `${data.first_name} ${data.last_name}`,
    referralCode,
    loginUrl,
  }).catch(() => null)

  notifyGHL('seller_created', { seller_id: seller.id, seller_email: data.email, referral_code: referralCode })

  return NextResponse.json({ success: true, seller_id: seller.id, referral_code: referralCode }, { status: 201 })
}
