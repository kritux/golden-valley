import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as { data: Record<string, unknown> | null }
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const notes = typeof body.notes === 'string' ? body.notes.slice(0, 500) : null

  const adminClient = await createAdminClient()
  const paymentId = params.id

  const { data: payment, error } = await adminClient
    .from('payments')
    .update({ status: 'rejected', notes, zelle_confirmed_by: user.id, zelle_confirmed_at: new Date().toISOString() })
    .eq('id', paymentId)
    .in('status', ['pending', 'under_review'])
    .select('ticket_id')
    .single()

  if (error || !payment) {
    return NextResponse.json({ error: 'Payment not found or already processed' }, { status: 404 })
  }

  if (payment.ticket_id) {
    await adminClient.from('tickets').update({ status: 'cancelled' }).eq('id', payment.ticket_id)
  }

  return NextResponse.json({ success: true })
}
