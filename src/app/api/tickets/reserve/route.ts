import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { reserveTicket, isReservedByOther } from '@/lib/ticket-reservations'

const schema = z.object({
  number: z.number().int().min(1).max(1000),
  session_id: z.string().min(1).max(128),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
  }

  const { number, session_id } = parsed.data

  if (await isReservedByOther(number, session_id)) {
    return NextResponse.json({ success: false, error: 'This ticket is currently held by another user. Please choose a different number.' })
  }

  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('tickets')
    .select('status')
    .eq('ticket_number', number)
    .in('status', ['active', 'pending_payment'])
    .maybeSingle()

  if (data) {
    return NextResponse.json({ success: false, error: 'This ticket has already been sold. Please choose another number.' })
  }

  const { expiresAt } = await reserveTicket(number, session_id)
  return NextResponse.json({ success: true, reserved_until: new Date(expiresAt).toISOString() })
}
