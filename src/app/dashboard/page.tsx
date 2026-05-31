'use client'

import { Suspense, useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { GoldSpinner } from '@/components/ui/gold-button'
import { FileUpload } from '@/components/ui/file-upload'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Membership {
  id: string
  number: number | null
  payment_status: string
  total_paid: number   // cents
  balance_due: number  // cents
  payment_deadline: string | null
  referral_code: string | null
}

interface CustomerData {
  customer_id: string
  name: string | null
  email: string | null
  phone: string
  memberships: Membership[]
}

interface CustomerPayment {
  id: string
  amount: number
  method: 'zelle' | 'stripe' | 'other'
  status: 'pending' | 'under_review' | 'confirmed' | 'rejected'
  created_at: string
}

interface ReferralStats {
  referral_code: string
  total_referred: number
  total_commissions: number
  qr_data_url: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PRICE_CENTS = 50_000   // $500
const DAILY_THRESHOLD = 300  // dollars — eligible for daily prize
const GRAND_THRESHOLD = 500  // dollars — eligible for grand prize

function cents(c: number) { return c / 100 }
function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function numPad(n: number) { return `#${String(n).padStart(3, '0')}` }

// ─── Countdown hook ───────────────────────────────────────────────────────────

function useDeadlineCountdown(deadline: string | null) {
  const [label, setLabel] = useState<string | null>(null)
  useEffect(() => {
    if (!deadline) return
    const calc = () => {
      const diff = new Date(deadline).getTime() - Date.now()
      if (diff <= 0) { setLabel('Overdue'); return }
      const days = Math.floor(diff / 86400000)
      const hours = Math.floor((diff % 86400000) / 3600000)
      const mins = Math.floor((diff % 3600000) / 60000)
      if (days > 0) setLabel(`${days}d ${hours}h remaining`)
      else if (hours > 0) setLabel(`${hours}h ${mins}m remaining`)
      else setLabel(`${mins}m remaining`)
    }
    calc()
    const id = setInterval(calc, 60000)
    return () => clearInterval(id)
  }, [deadline])
  return label
}

// ─── Eligibility Badge ────────────────────────────────────────────────────────

function EligibilityCard({ paidDollars }: { paidDollars: number }) {
  const dailyOk = paidDollars >= DAILY_THRESHOLD
  const grandOk = paidDollars >= GRAND_THRESHOLD

  return (
    <section className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm p-5 sm:p-6">
      <h2 className="text-[10px] uppercase tracking-widest text-[var(--white-muted)] font-bold mb-4">Prize Eligibility</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Daily prize */}
        <div
          className="rounded-sm px-4 py-4 border"
          style={{
            background: dailyOk ? 'rgba(22,163,74,0.07)' : 'rgba(255,255,255,0.02)',
            borderColor: dailyOk ? 'rgba(22,163,74,0.35)' : 'var(--black-border)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">{dailyOk ? '✅' : '🔒'}</span>
            <p className="text-[10px] uppercase tracking-widest font-black" style={{ color: dailyOk ? '#16A34A' : '#666' }}>
              Daily Prize
            </p>
          </div>
          <p
            className="font-black"
            style={{
              fontFamily: 'var(--font-dm-mono, monospace)',
              fontSize: 'clamp(1.2rem, 4vw, 1.6rem)',
              color: dailyOk ? '#D4AF37' : '#444',
            }}
          >
            $1,000/day
          </p>
          <p className="text-[10px] mt-1" style={{ color: dailyOk ? '#16A34A' : '#555' }}>
            {dailyOk ? '90 daily draws · you\'re in!' : `Pay ${fmt(DAILY_THRESHOLD - paidDollars)} more to unlock`}
          </p>
        </div>

        {/* Grand prize */}
        <div
          className="rounded-sm px-4 py-4 border"
          style={{
            background: grandOk ? 'rgba(212,175,55,0.07)' : 'rgba(255,255,255,0.02)',
            borderColor: grandOk ? 'rgba(212,175,55,0.4)' : 'var(--black-border)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">{grandOk ? '🏆' : '🔒'}</span>
            <p className="text-[10px] uppercase tracking-widest font-black" style={{ color: grandOk ? '#D4AF37' : '#666' }}>
              Grand Prize
            </p>
          </div>
          <p
            className="font-black"
            style={{
              fontFamily: 'var(--font-dm-mono, monospace)',
              fontSize: 'clamp(1.2rem, 4vw, 1.6rem)',
              background: grandOk ? 'linear-gradient(135deg, #A68B28, #D4AF37, #E8CC7A)' : 'none',
              WebkitBackgroundClip: grandOk ? 'text' : 'unset',
              WebkitTextFillColor: grandOk ? 'transparent' : '#444',
              backgroundClip: grandOk ? 'text' : 'unset',
            }}
          >
            $70K or 4Runner
          </p>
          <p className="text-[10px] mt-1" style={{ color: grandOk ? '#D4AF37' : '#555' }}>
            {grandOk ? 'Full membership confirmed!' : `Pay ${fmt(GRAND_THRESHOLD - paidDollars)} more to unlock`}
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── Number Picker (inside dashboard) ────────────────────────────────────────

interface TicketGridItem { number: number; status: string }

interface NumberPickerProps {
  preselected: number | null
  onClaimed: (ticketId: string, ticketNumber: number) => void
}

function NumberPicker({ preselected, onClaimed }: NumberPickerProps) {
  const [grid, setGrid] = useState<TicketGridItem[]>([])
  const [gridLoading, setGridLoading] = useState(true)
  const [selected, setSelected] = useState<number | null>(preselected)
  const [refCode, setRefCode] = useState('')
  const [claiming, setClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/tickets/available')
      .then((r) => r.json())
      .then((data: TicketGridItem[]) => { setGrid(data); setGridLoading(false) })
      .catch(() => setGridLoading(false))
  }, [])

  function pickRandom() {
    const available = grid.filter((t) => t.status === 'available')
    if (!available.length) return
    const pick = available[Math.floor(Math.random() * available.length)]
    setSelected(pick.number)
    setError(null)
  }

  async function handleClaim() {
    if (!selected) { setError('Please select a number from the grid.'); return }
    const code = refCode.trim()
    if (!code) { setError("Enter a referral code, or use DIRECTO if you don't have one."); return }
    setClaiming(true)
    setError(null)
    try {
      const res = await fetch('/api/tickets/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_number: selected, referral_code: code }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to claim this number. Please try another.'); return }
      onClaimed(data.ticket_id, data.ticket_number)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setClaiming(false)
    }
  }

  const takenCount = grid.filter((t) => t.status !== 'available').length
  const availableCount = 1000 - takenCount

  return (
    <section className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0" style={{ background: '#8FFF3A', color: '#0B0B0B' }}>1</div>
        <h2 className="text-sm font-black uppercase tracking-widest text-white">Choose Your Membership Number</h2>
      </div>

      {/* Selected display + random button */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex-1 bg-[var(--black-surface)] border rounded-sm px-4 py-4 text-center font-black transition-colors"
          style={{
            fontFamily: 'var(--font-dm-mono, monospace)',
            fontSize: 'clamp(2rem, 8vw, 3rem)',
            borderColor: selected ? 'var(--gold)' : 'var(--black-border)',
            color: selected ? '#D4AF37' : 'rgba(255,255,255,0.2)',
          }}
        >
          {selected ? `#${String(selected).padStart(3, '0')}` : '—'}
        </div>
        <button
          onClick={pickRandom}
          disabled={gridLoading || availableCount === 0}
          className="flex flex-col items-center justify-center gap-1 px-4 py-4 border border-[var(--black-border)] hover:border-[var(--gold)] transition-colors rounded-sm disabled:opacity-40 shrink-0"
          style={{ background: 'var(--black-surface)', minWidth: 72 }}
          title="Pick a random available number"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
            <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
          </svg>
          <span className="text-[9px] font-black uppercase tracking-widest text-[var(--gold)]">Random</span>
        </button>
      </div>

      {/* Ticket grid */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] uppercase tracking-widest text-[var(--white-muted)] font-bold">Select from grid</p>
          <p className="text-[10px] text-[var(--white-muted)]">
            <span className="text-[#8FFF3A] font-bold">{availableCount}</span> available · <span className="text-white/30 font-bold">{takenCount}</span> taken
          </p>
        </div>

        {gridLoading ? (
          <div className="flex justify-center py-8"><GoldSpinner size={28} /></div>
        ) : (
          <div
            className="overflow-y-auto rounded-sm border border-[var(--black-border)]"
            style={{ maxHeight: 280 }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(34px, 1fr))',
                gap: 2,
                padding: 6,
                background: 'var(--black-surface)',
              }}
            >
              {grid.map((t) => {
                const isAvailable = t.status === 'available'
                const isSelected = selected === t.number
                return (
                  <button
                    key={t.number}
                    onClick={() => { if (isAvailable) { setSelected(t.number); setError(null) } }}
                    disabled={!isAvailable}
                    title={`#${String(t.number).padStart(3, '0')} — ${isAvailable ? 'available' : 'taken'}`}
                    style={{
                      height: 30,
                      fontSize: 9,
                      fontWeight: 900,
                      borderRadius: 2,
                      border: isSelected ? '2px solid #D4AF37' : '1px solid transparent',
                      background: isSelected
                        ? 'linear-gradient(135deg, #A68B28, #D4AF37, #E8CC7A)'
                        : isAvailable
                        ? 'rgba(212,175,55,0.12)'
                        : 'rgba(255,255,255,0.04)',
                      color: isSelected ? '#0B0B0B' : isAvailable ? '#D4AF37' : 'rgba(255,255,255,0.15)',
                      cursor: isAvailable ? 'pointer' : 'not-allowed',
                      transition: 'all 0.12s',
                      fontFamily: 'var(--font-dm-mono, monospace)',
                    }}
                  >
                    {t.number}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)' }} />
            <span className="text-[9px] text-[var(--white-muted)] uppercase tracking-wider">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(255,255,255,0.04)' }} />
            <span className="text-[9px] text-[var(--white-muted)] uppercase tracking-wider">Taken</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(135deg, #A68B28, #D4AF37)', border: '2px solid #D4AF37' }} />
            <span className="text-[9px] text-[var(--white-muted)] uppercase tracking-wider">Your pick</span>
          </div>
        </div>
      </div>

      {/* Referral code */}
      <div className="mb-4">
        <label className="block text-xs uppercase tracking-widest text-[var(--white-muted)] mb-2 font-bold">
          Referral Code
        </label>
        <input
          type="text"
          value={refCode}
          onChange={(e) => { setRefCode(e.target.value.toUpperCase()); setError(null) }}
          placeholder="Código de referido — o escribe DIRECTO"
          className="w-full bg-[var(--black-surface)] border border-[var(--black-border)] text-white rounded-sm px-4 py-3 text-sm outline-none focus:border-[var(--gold)] transition-colors tracking-widest font-bold uppercase"
          style={{ fontFamily: 'var(--font-dm-mono, monospace)' }}
        />
        <p className="text-[var(--white-muted)] text-[10px] mt-1.5">
          ¿Sin código? Escribe <span className="text-[var(--gold)] font-bold">DIRECTO</span> para continuar.
        </p>
      </div>

      {error && (
        <p className="text-red-400 text-sm border border-red-900/50 bg-red-900/10 rounded-sm px-4 py-3 mb-4">{error}</p>
      )}

      <button
        onClick={handleClaim}
        disabled={claiming || !selected || !refCode.trim()}
        className="w-full py-4 font-black uppercase tracking-widest text-sm transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ background: '#8FFF3A', color: '#0B0B0B', boxShadow: '0 0 20px rgba(143,255,58,0.3)' }}
      >
        {claiming ? <><GoldSpinner size={18} /><span>Reservando...</span></> : `Reserve #${selected ? String(selected).padStart(3, '0') : '—'} →`}
      </button>
    </section>
  )
}

// ─── Payment Modal ────────────────────────────────────────────────────────────

interface PaymentModalProps {
  isOpen: boolean
  ticketId: string
  hasExistingPayment: boolean
  onClose: () => void
  onSuccess: () => void
}

function PaymentModal({ isOpen, ticketId, hasExistingPayment, onClose, onSuccess }: PaymentModalProps) {
  const [method, setMethod] = useState<'zelle' | 'stripe'>('zelle')
  const [amount, setAmount] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const minAmount = hasExistingPayment ? 1 : 200

  useEffect(() => {
    if (isOpen) {
      setAmount(String(minAmount))
      setReceiptFile(null)
      setError(null)
      setMethod('zelle')
    }
  }, [isOpen, minAmount])

  async function handleSubmit() {
    const amt = parseInt(amount, 10)
    if (isNaN(amt) || amt < minAmount) {
      setError(`Minimum payment is ${fmt(minAmount)}.`)
      return
    }
    if (method === 'zelle' && !receiptFile) {
      setError('Please upload your Zelle receipt to continue.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      let res: Response
      const amtCents = amt * 100

      if (method === 'zelle' && receiptFile) {
        const fd = new FormData()
        fd.append('ticket_id', ticketId)
        fd.append('amount', String(amtCents))
        fd.append('payment_method', 'zelle')
        fd.append('receipt', receiptFile)
        res = await fetch('/api/purchase/installment', { method: 'POST', body: fd })
      } else {
        res = await fetch('/api/purchase/installment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticket_id: ticketId, amount: amtCents, payment_method: method }),
        })
      }

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Payment submission failed. Please try again.')
        return
      }
      if (data.client_secret) {
        sessionStorage.setItem('stripe_cs', data.client_secret)
        window.location.href = `/checkout?payment_id=${data.payment_id ?? ''}`
        return
      }
      onSuccess()
      onClose()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--black-card)] border-t border-[var(--black-border)] rounded-t-xl p-5 pb-safe sm:pb-5"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black uppercase tracking-widest text-white text-sm">Make a Payment</h3>
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors text-lg leading-none">✕</button>
          </div>

          {/* Method toggle */}
          <div className="flex rounded-sm overflow-hidden border border-[var(--black-border)] mb-5">
            {(['zelle', 'stripe'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className="flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all"
                style={{ background: method === m ? '#DC2626' : 'transparent', color: method === m ? '#fff' : 'rgba(255,255,255,0.4)' }}
              >
                {m === 'zelle' ? 'Zelle' : 'Card'}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div className="mb-5">
            <label className="block text-xs uppercase tracking-widest text-[var(--white-muted)] mb-2 font-bold">
              Amount (min. {fmt(minAmount)})
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--white-muted)] font-bold">$</span>
              <input
                type="number"
                min={minAmount}
                max={500}
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(null) }}
                className="w-full bg-[var(--black-surface)] border border-[var(--black-border)] text-white rounded-sm pl-9 pr-4 py-3 text-base outline-none transition-all focus:border-[var(--gold)]"
              />
            </div>
          </div>

          {method === 'zelle' && (
            <div className="mb-5 space-y-4">
              <div className="bg-[var(--black-surface)] border border-[var(--black-border)] rounded-sm p-4">
                <p className="text-xs font-black uppercase tracking-widest text-[var(--gold)] mb-2">Zelle Instructions</p>
                <p className="text-white/60 text-sm leading-relaxed">
                  Send your payment to{' '}
                  <span className="text-white font-bold">goldenvalleymembers@gmail.com</span>{' '}
                  via Zelle. Include your phone number in the memo.
                </p>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--white-muted)] mb-2 font-bold">Upload Zelle Receipt</label>
                <FileUpload accept="image/*,application/pdf" label="Upload receipt screenshot" onFile={(f) => { setReceiptFile(f); setError(null) }} />
                {receiptFile && <p className="text-green-400 text-xs mt-2">✓ Receipt ready: {receiptFile.name}</p>}
              </div>
            </div>
          )}

          {method === 'stripe' && (
            <div className="mb-5 bg-[var(--black-surface)] border border-[var(--black-border)] rounded-sm p-4">
              <p className="text-white/60 text-sm leading-relaxed">You'll be redirected to a secure Stripe checkout page.</p>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm border border-red-900/50 bg-red-900/10 rounded-sm px-4 py-3 mb-4">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 font-black uppercase tracking-widest text-white text-sm transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: '#8FFF3A', color: '#0B0B0B', boxShadow: '0 0 20px rgba(143,255,58,0.35)' }}
          >
            {loading ? <><GoldSpinner size={18} /><span>Processing...</span></> : method === 'zelle' ? 'Submit Payment' : 'Pay with Card →'}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Main Dashboard (uses useSearchParams) ────────────────────────────────────

function DashboardInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawNum = searchParams.get('number')
  const urlNumber = rawNum ? parseInt(rawNum, 10) : null
  const preselected = urlNumber && urlNumber >= 1 && urlNumber <= 1000 ? urlNumber : null

  const [data, setData] = useState<CustomerData | null>(null)
  const [payments, setPayments] = useState<CustomerPayment[]>([])
  const [referrals, setReferrals] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [lottery, setLottery] = useState<{ digits: string; date: string } | null>(null)
  const paymentSectionRef = useRef<HTMLDivElement>(null)

  const membership = data?.memberships?.[0] ?? null
  const paidDollars = membership ? cents(membership.total_paid) : 0
  const owedDollars = membership ? cents(membership.balance_due) : GRAND_THRESHOLD
  const progressPct = PRICE_CENTS > 0 ? Math.min((membership?.total_paid ?? 0) / PRICE_CENTS * 100, 100) : 0
  const deadline = useDeadlineCountdown(membership?.payment_deadline ?? null)
  const referralCode = referrals?.referral_code ?? membership?.referral_code ?? ''
  const hasExistingPayment = payments.length > 0

  const fetchData = useCallback(async () => {
    try {
      const [meRes, paymentsRes, referralsRes] = await Promise.all([
        fetch('/api/customer/me'),
        fetch('/api/customer/payments'),
        fetch('/api/customer/referrals'),
      ])
      if (meRes.ok) setData(await meRes.json())
      if (paymentsRes.ok) setPayments(await paymentsRes.json())
      if (referralsRes.ok) setReferrals(await referralsRes.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    fetch('/api/lottery').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.digits) setLottery({ digits: d.digits, date: d.date ?? '' })
    }).catch(() => {})
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  function handleCopyCode() {
    const code = referralCode
    if (!code) return
    navigator.clipboard.writeText(`https://goldenvalleymembers.com/?ref=${code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleShare() {
    const code = referralCode
    if (!code) return
    const url = `https://goldenvalleymembers.com/?ref=${code}`
    if (navigator.share) {
      await navigator.share({ title: 'Golden Valley Members', text: 'Join me — win a 4Runner or $70K! Use my link:', url }).catch(() => {})
    } else {
      handleCopyCode()
    }
  }

  function handleClaimed(ticketId: string, ticketNumber: number) {
    // Refresh data after successful claim
    void ticketId
    void ticketNumber
    fetchData()
    // Clean number param from URL without reload
    window.history.replaceState({}, '', '/dashboard')
  }

  const firstName = data?.name?.split(' ')[0] ?? ''

  return (
    <div className="min-h-[100svh] flex flex-col" style={{ background: 'var(--black)' }}>
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.04) 0%, transparent 50%)' }} />

      {/* Header */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 h-14 border-b border-[var(--black-border)]"
        style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(14px)' }}
      >
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 flex items-center justify-center font-black text-[10px] tracking-widest text-black shrink-0" style={{ background: 'linear-gradient(135deg, #A68B28, #D4AF37, #E8CC7A)' }}>
            GV
          </div>
          <span className="hidden sm:block text-[10px] font-black uppercase tracking-[0.2em] text-white/50 group-hover:text-white/80 transition-colors">
            Golden Valley Members
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {firstName && <span className="hidden sm:block text-[var(--white-muted)] text-xs">{firstName}</span>}
          <button
            onClick={handleSignOut}
            className="text-xs font-black uppercase tracking-widest text-white/40 hover:text-white/80 transition-colors px-3 py-1.5 border border-[var(--black-border)] hover:border-white/20"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 px-4 sm:px-6 py-6 sm:py-8 max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-24"><GoldSpinner size={36} /></div>
        ) : (
          <div className="space-y-5">

            {/* ── INCOMPLETE PROFILE BANNER ── */}
            {!data?.name && (
              <Link
                href="/register/profile"
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-sm border border-yellow-600/40 bg-yellow-900/15 hover:border-yellow-500/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-yellow-400 text-lg">⚠</span>
                  <div>
                    <p className="text-yellow-300 text-xs font-black uppercase tracking-widest">Profile Incomplete</p>
                    <p className="text-yellow-200/60 text-xs mt-0.5">Add your name to activate your referral code →</p>
                  </div>
                </div>
                <span className="text-yellow-400 text-sm font-black shrink-0">→</span>
              </Link>
            )}

            {/* ── DAILY LOTTERY NUMBER ── */}
            {lottery && (
              <section className="flex items-center justify-between gap-4 px-5 py-3.5 border border-[var(--gold)]/20 bg-[rgba(212,175,55,0.04)] rounded-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.4em] font-bold" style={{ color: '#D4AF37' }}>Tris 7pm · Número de Hoy</p>
                  {lottery.date && <p className="text-white/30 text-[10px] mt-0.5">{lottery.date}</p>}
                </div>
                <div className="flex gap-1.5">
                  {lottery.digits.split('').map((d, i) => (
                    <div key={i} className="w-10 h-12 flex items-center justify-center font-black text-2xl rounded-sm"
                      style={{ fontFamily: 'var(--font-dm-mono)', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>
                      {d}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── STEP 1: No membership yet — pick a number ── */}
            {!membership && (
              <NumberPicker preselected={preselected} onClaimed={handleClaimed} />
            )}

            {/* ── MEMBERSHIP STATUS ── */}
            {membership && (
              <section className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    {membership.number ? (
                      <>
                        <p className="text-[10px] uppercase tracking-widest text-[var(--white-muted)] font-bold mb-1">Your Membership Number</p>
                        <div
                          className="font-black leading-none"
                          style={{
                            fontFamily: 'var(--font-dm-mono, monospace)',
                            fontSize: 'clamp(3.5rem, 15vw, 6rem)',
                            background: 'linear-gradient(135deg, #A68B28, #D4AF37, #E8CC7A)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                          }}
                        >
                          {numPad(membership.number)}
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-[10px] uppercase tracking-widest text-[var(--white-muted)] font-bold mb-2">Membership Number</p>
                        <p className="text-white/30 text-sm font-bold uppercase tracking-widest">Assigned after payment</p>
                      </>
                    )}
                    <div className="mt-3">
                      <span
                        className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-sm"
                        style={
                          membership.payment_status === 'paid_full'
                            ? { color: '#16A34A', background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.35)' }
                            : membership.payment_status === 'partial'
                            ? { color: '#D97706', background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.35)' }
                            : { color: '#DC2626', background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.35)' }
                        }
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: membership.payment_status === 'paid_full' ? '#16A34A' : membership.payment_status === 'partial' ? '#D97706' : '#DC2626' }}
                        />
                        {membership.payment_status === 'paid_full' ? 'FULLY PAID' : membership.payment_status === 'partial' ? 'PARTIAL PAYMENT' : 'AWAITING PAYMENT'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[var(--black-surface)] border border-[var(--black-border)] rounded-sm px-4 py-3 sm:max-w-[180px]">
                    <p className="text-[9px] uppercase tracking-widest text-[var(--white-muted)] font-bold mb-1">You're entered to win</p>
                    <p
                      className="font-black leading-tight"
                      style={{
                        fontFamily: 'var(--font-dm-mono, monospace)',
                        fontSize: 'clamp(1.1rem, 4vw, 1.5rem)',
                        background: 'linear-gradient(135deg, #A68B28, #D4AF37, #E8CC7A)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      $70,000
                    </p>
                    <p className="text-white/35 text-[9px] uppercase tracking-wider mt-0.5">or the 4Runner</p>
                  </div>
                </div>
              </section>
            )}

            {/* ── ELIGIBILITY (shown once they have a ticket) ── */}
            {membership && <EligibilityCard paidDollars={paidDollars} />}

            {/* ── PAYMENT PROGRESS ── */}
            {membership && (
              <section ref={paymentSectionRef} className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm p-5 sm:p-6">
                <h2 className="text-[10px] uppercase tracking-widest text-[var(--white-muted)] font-bold mb-4">Payment Progress</h2>

                <div className="mb-5">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-green-400">Paid: {fmt(paidDollars)}</span>
                    <span className="text-[var(--white-muted)]">Remaining: {fmt(owedDollars)}</span>
                  </div>
                  <div className="h-3 bg-[var(--black-surface)] rounded-full overflow-hidden border border-[var(--black-border)]">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${progressPct}%`,
                        minWidth: progressPct > 0 ? '6px' : '0',
                        background: progressPct >= 100 ? 'linear-gradient(90deg, #16A34A, #22C55E)' : 'linear-gradient(90deg, #A68B28, #D4AF37, #E8CC7A)',
                      }}
                    />
                  </div>
                  {/* Thresholds markers */}
                  <div className="relative mt-1">
                    <div className="flex justify-between text-[9px] text-white/20 uppercase tracking-widest">
                      <span>$0</span>
                      <span>$300 Daily</span>
                      <span>$500 Grand</span>
                    </div>
                  </div>
                </div>

                {deadline && owedDollars > 0 && (
                  <div
                    className="flex items-center gap-3 rounded-sm px-4 py-3 mb-5 border"
                    style={{
                      background: deadline === 'Overdue' ? 'rgba(220,38,38,0.08)' : 'rgba(217,119,6,0.06)',
                      borderColor: deadline === 'Overdue' ? 'rgba(220,38,38,0.25)' : 'rgba(217,119,6,0.25)',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={deadline === 'Overdue' ? '#DC2626' : '#D97706'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: deadline === 'Overdue' ? '#DC2626' : '#D97706' }}>
                        {deadline === 'Overdue' ? 'Payment Overdue — number may be released' : 'Balance due in:'}
                      </p>
                      {deadline !== 'Overdue' && (
                        <p className="text-white font-bold text-sm" style={{ fontFamily: 'var(--font-dm-mono, monospace)' }}>{deadline}</p>
                      )}
                    </div>
                  </div>
                )}

                {owedDollars > 0 && (
                  <button
                    onClick={() => setPaymentModalOpen(true)}
                    className="w-full sm:w-auto py-3.5 px-8 font-black uppercase tracking-widest text-white text-xs transition-all hover:brightness-110 active:scale-[0.98] mb-5"
                    style={{ background: '#8FFF3A', color: '#0B0B0B', boxShadow: '0 0 16px rgba(143,255,58,0.3)' }}
                  >
                    Make a Payment →
                  </button>
                )}

                {/* Payment history */}
                {payments.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[var(--white-muted)] font-bold mb-3">Payment History</p>
                    <div className="space-y-2">
                      {payments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between py-3 px-4 bg-[var(--black-surface)] border border-[var(--black-border)] rounded-sm">
                          <div className="flex items-center gap-3">
                            <span className={p.status === 'confirmed' ? 'text-green-400 font-bold' : p.status === 'rejected' ? 'text-red-400 font-bold' : 'text-yellow-400'}>
                              {p.status === 'confirmed' ? '✓' : p.status === 'rejected' ? '✗' : '…'}
                            </span>
                            <div>
                              <p className="text-white text-sm font-bold">{fmt(p.amount / 100)}</p>
                              <p className="text-[var(--white-muted)] text-[10px] uppercase tracking-wider">{fmtDate(p.created_at)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: p.status === 'confirmed' ? '#16A34A' : p.status === 'rejected' ? '#DC2626' : '#D97706' }}>
                              {p.status === 'confirmed' ? 'Verified' : p.status === 'rejected' ? 'Rejected' : 'Pending'}
                            </p>
                            <p className="text-[var(--white-muted)] text-[10px] uppercase tracking-wider mt-0.5">{p.method}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {payments.length === 0 && (
                  <div className="text-center py-6 text-[var(--white-muted)] text-sm">
                    No payments yet. Make your first payment ($200 minimum) to activate your membership.
                  </div>
                )}
              </section>
            )}

            {/* ── REFERRAL PROGRAM ── */}
            <section className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm p-5 sm:p-6">
              <h2 className="text-[10px] uppercase tracking-widest text-[var(--white-muted)] font-bold mb-4">Referral Program</h2>

              {referralCode ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[var(--white-muted)] font-bold mb-2">Your Referral Code</p>
                    <div className="flex items-center gap-2">
                      <div
                        className="flex-1 bg-[var(--black-surface)] border border-[var(--black-border)] rounded-sm px-4 py-3 font-black tracking-[0.3em] text-[var(--gold)] text-base sm:text-lg"
                        style={{ fontFamily: 'var(--font-dm-mono, monospace)' }}
                      >
                        {referralCode}
                      </div>
                      <button
                        onClick={handleCopyCode}
                        className="px-4 py-3 border font-black uppercase tracking-widest text-[10px] transition-all hover:brightness-110 active:scale-95 shrink-0"
                        style={{ border: copied ? '1px solid rgba(22,163,74,0.5)' : '1px solid var(--black-border)', color: copied ? '#16A34A' : 'var(--white-muted)', background: 'var(--black-surface)' }}
                      >
                        {copied ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {referrals?.qr_data_url && (
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      <div className="bg-white p-3 rounded-sm shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={referrals.qr_data_url} alt={`QR code for referral ${referralCode}`} width={120} height={120} className="block" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <p className="text-[var(--white-muted)] text-xs leading-relaxed">
                          Share this QR code or your referral link. Earn $100 per member who joins through you.
                        </p>
                        <a
                          href={referrals.qr_data_url}
                          download={`gv-referral-qr-${referralCode}.png`}
                          className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--gold)] hover:underline"
                        >
                          Download QR
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: referrals?.total_referred ?? 0, label: 'Members Joined' },
                      { value: fmt(referrals?.total_commissions ?? 0), label: 'Commissions Earned' },
                    ].map(({ value, label }) => (
                      <div key={label} className="bg-[var(--black-surface)] border border-[var(--black-border)] rounded-sm px-4 py-3 text-center">
                        <p
                          className="font-black text-2xl sm:text-3xl"
                          style={{ fontFamily: 'var(--font-dm-mono, monospace)', background: 'linear-gradient(135deg, #A68B28, #D4AF37)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                        >
                          {value}
                        </p>
                        <p className="text-[var(--white-muted)] text-[9px] uppercase tracking-widest font-bold mt-1">{label}</p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleShare}
                    className="w-full py-3.5 font-black uppercase tracking-widest text-black text-xs transition-all hover:brightness-105 active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #A68B28, #D4AF37, #E8CC7A)' }}
                  >
                    Share My Referral Link
                  </button>
                </div>
              ) : (
                <p className="text-[var(--white-muted)] text-sm text-center py-6">
                  Your referral code will be available after your first payment is confirmed.
                </p>
              )}
            </section>

          </div>
        )}
      </main>

      {/* Payment Modal */}
      {membership && (
        <PaymentModal
          isOpen={paymentModalOpen}
          ticketId={membership.id}
          hasExistingPayment={hasExistingPayment}
          onClose={() => setPaymentModalOpen(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  )
}

// ─── Page export with Suspense ────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100svh] flex items-center justify-center" style={{ background: 'var(--black)' }}>
          <GoldSpinner size={36} />
        </div>
      }
    >
      <DashboardInner />
    </Suspense>
  )
}
