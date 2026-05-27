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
    // Non-fatal — GHL is a CRM integration, not critical path
    console.error('[GHL] Webhook delivery failed for event:', event)
  }
}
