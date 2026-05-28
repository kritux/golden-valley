type GHLEvent = 'purchase_intent' | 'ticket_confirmed' | 'seller_created'

export async function notifyGHL(event: GHLEvent, data: Record<string, unknown>): Promise<void> {
  const url = process.env.GHL_WEBHOOK_URL
  if (!url) return

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, timestamp: new Date().toISOString(), ...data }),
    })
  } catch {
    console.error('[GHL] Webhook delivery failed for event:', event)
  }
}

// Sends a full contact payload to GHL in their expected format.
// GHL webhooks match on email — creates contact if new, updates if existing.
export interface GHLContactPayload {
  firstName: string
  lastName: string
  email: string
  phone: string
  phone2?: string
  city?: string
  state?: string
  country?: string    // nationality mapped here
  gender?: string
  source?: string
  tags?: string[]
  customField?: Record<string, string>
}

export async function pushGHLContact(contact: GHLContactPayload): Promise<void> {
  const url = process.env.GHL_WEBHOOK_URL
  if (!url) return

  const payload = {
    // GHL standard contact fields
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    phone: contact.phone,
    phone2: contact.phone2 ?? '',
    city: contact.city ?? '',
    state: contact.state ?? '',
    country: contact.country ?? '',
    gender: contact.gender ?? '',
    source: contact.source ?? 'Golden Valley Members — Website',
    tags: contact.tags ?? ['raffle-lead'],
    ...( contact.customField ? { customField: contact.customField } : {} ),
    // Metadata
    _event: 'contact_created',
    _timestamp: new Date().toISOString(),
    _source: 'golden-valley-members',
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      console.error('[GHL] Contact push failed:', res.status, await res.text())
    }
  } catch (err) {
    console.error('[GHL] Contact push error:', err)
  }
}
