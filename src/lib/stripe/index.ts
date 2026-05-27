import Stripe from 'stripe'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Missing STRIPE_SECRET_KEY')
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-09-30.acacia',
    typescript: true,
  })
}

export async function createPaymentIntent(metadata: {
  payment_id: string
  buyer_email: string
  buyer_name: string
}) {
  return getStripe().paymentIntents.create({
    amount: 50000, // $500.00 in cents
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    metadata,
    description: 'Golden Valley Members — Raffle Ticket',
    receipt_email: metadata.buyer_email,
  })
}

export function constructWebhookEvent(body: string, signature: string) {
  return getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
}
