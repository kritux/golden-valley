'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')

function CheckoutForm({ paymentId }: { paymentId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setProcessing(true)
    setError(null)

    const { error: stripeErr } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?payment_id=${paymentId}`,
      },
    })

    if (stripeErr) {
      setError(stripeErr.message ?? 'Payment failed. Please try again.')
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <PaymentElement />
      {error && (
        <p className="text-[#FF4E00] text-sm font-bold">{error}</p>
      )}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full py-4 font-black uppercase tracking-widest text-black text-sm transition-all hover:brightness-110 disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg, #A68B28, #D4AF37, #E8CC7A, #D4AF37)' }}
      >
        {processing ? 'Processing…' : 'Complete Payment →'}
      </button>
    </form>
  )
}

function CheckoutInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const paymentId = searchParams.get('payment_id') ?? ''
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  useEffect(() => {
    const cs = sessionStorage.getItem('stripe_cs')
    if (!cs) {
      router.replace('/')
      return
    }
    setClientSecret(cs)
    sessionStorage.removeItem('stripe_cs')
  }, [router])

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0B0B' }}>
        <p className="text-white/40 text-sm uppercase tracking-widest animate-pulse">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: '#0B0B0B' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--gold)] mb-2">Secure Payment</p>
          <h1 className="text-2xl font-black text-white uppercase tracking-widest">Complete Your Order</h1>
          <p className="text-white/40 text-sm mt-2">$500.00 — Golden Valley Membership</p>
        </div>

        <div
          className="border border-[var(--black-border)] rounded-sm p-6"
          style={{ background: '#111' }}
        >
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'night',
                variables: {
                  colorPrimary: '#D4AF37',
                  colorBackground: '#111111',
                  colorText: '#FFFFFF',
                  colorDanger: '#FF4E00',
                  fontFamily: 'system-ui, sans-serif',
                  borderRadius: '2px',
                },
              },
            }}
          >
            <CheckoutForm paymentId={paymentId} />
          </Elements>
        </div>

        <p className="text-center text-white/25 text-[10px] mt-6 uppercase tracking-widest">
          Secured by Stripe · 256-bit SSL
        </p>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0B0B' }}>
          <p className="text-white/40 text-sm uppercase tracking-widest animate-pulse">Loading…</p>
        </div>
      }
    >
      <CheckoutInner />
    </Suspense>
  )
}
