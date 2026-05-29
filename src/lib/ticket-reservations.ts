// In-memory ticket reservation store (15-min TTL)
// Prevents two users from selecting the same ticket simultaneously.
// NOTE: Resets on server restart — acceptable for MVP single-instance deploy.

interface Reservation {
  expiresAt: number
  sessionId: string
}

const store = new Map<number, Reservation>()

function purgeExpired() {
  const now = Date.now()
  store.forEach((res, num) => {
    if (res.expiresAt < now) store.delete(num)
  })
}

export function reserveTicket(ticketNumber: number, sessionId: string): { expiresAt: number } {
  purgeExpired()
  const expiresAt = Date.now() + 15 * 60 * 1000
  store.set(ticketNumber, { expiresAt, sessionId })
  return { expiresAt }
}

/** Returns true if the ticket is reserved by SOMEONE ELSE. */
export function isReservedByOther(ticketNumber: number, sessionId: string): boolean {
  purgeExpired()
  const res = store.get(ticketNumber)
  if (!res) return false
  return res.sessionId !== sessionId
}

export function releaseReservation(ticketNumber: number, sessionId: string): void {
  const res = store.get(ticketNumber)
  if (res?.sessionId === sessionId) store.delete(ticketNumber)
}
