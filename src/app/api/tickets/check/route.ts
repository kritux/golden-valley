import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { isReservedByOther } from '@/lib/ticket-reservations'

export async function GET(req: NextRequest) {
  const n = parseInt(req.nextUrl.searchParams.get('number') ?? '', 10)
  const sessionId = req.nextUrl.searchParams.get('session_id') ?? ''

  if (!n || n < 1 || n > 1000) {
    return NextResponse.json({ available: false, error: 'Invalid number' }, { status: 400 })
  }

  if (isReservedByOther(n, sessionId)) {
    return NextResponse.json({ available: false, reserved: true })
  }

  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('tickets')
    .select('status')
    .eq('ticket_number', n)
    .in('status', ['active', 'pending_payment'])
    .maybeSingle()

  return NextResponse.json({ available: !data })
}
