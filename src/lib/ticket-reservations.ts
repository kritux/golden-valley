// Supabase-backed ticket reservation store (15-min TTL).
// Replaces the in-memory Map that reset on every Vercel cold start.

import { createAdminClient } from '@/lib/supabase/server'

const TTL_MS = 15 * 60 * 1000 // 15 minutes

export async function reserveTicket(
  ticketNumber: number,
  sessionId: string,
): Promise<{ expiresAt: number }> {
  const supabase = await createAdminClient()
  const expiresAt = new Date(Date.now() + TTL_MS)

  await supabase.from('ticket_reservations').upsert(
    { ticket_number: ticketNumber, session_id: sessionId, expires_at: expiresAt.toISOString() },
    { onConflict: 'ticket_number' },
  )

  return { expiresAt: expiresAt.getTime() }
}

/** Returns true if ticket is reserved by someone OTHER than sessionId. */
export async function isReservedByOther(
  ticketNumber: number,
  sessionId: string,
): Promise<boolean> {
  const supabase = await createAdminClient()

  const { data } = await supabase
    .from('ticket_reservations')
    .select('session_id')
    .eq('ticket_number', ticketNumber)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!data) return false
  return data.session_id !== sessionId
}

export async function releaseReservation(
  ticketNumber: number,
  sessionId: string,
): Promise<void> {
  const supabase = await createAdminClient()
  await supabase
    .from('ticket_reservations')
    .delete()
    .eq('ticket_number', ticketNumber)
    .eq('session_id', sessionId)
}
