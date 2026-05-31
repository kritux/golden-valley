import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { normalisePhone } from '@/lib/auth-helpers'

const schema = z.object({
  phone: z.string().min(7).max(20).trim(),
})

// Simple in-memory rate limiter — 5 OTP requests per phone per 10 minutes
const otpAttempts = new Map<string, { count: number; resetAt: number }>()

function checkOtpRateLimit(phone: string): boolean {
  const now = Date.now()
  const entry = otpAttempts.get(phone)
  if (!entry || entry.resetAt < now) {
    otpAttempts.set(phone, { count: 1, resetAt: now + 10 * 60_000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const phone = normalisePhone(parsed.data.phone)
  if (!phone) {
    return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
  }

  if (!checkOtpRateLimit(phone)) {
    return NextResponse.json(
      { error: 'Too many OTP requests. Please wait 10 minutes and try again.' },
      { status: 429 }
    )
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { channel: 'sms' },
  })

  if (error) {
    // Don't leak internal Supabase details for phone enumeration safety
    console.error('[send-otp] Supabase OTP error:', error.message)
    return NextResponse.json(
      { error: 'Failed to send verification code. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
