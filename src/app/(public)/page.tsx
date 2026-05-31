'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GoldSpinner } from '@/components/ui/gold-button'
import { SignatureCanvasComponent } from '@/components/ui/signature-canvas'
import { FileUpload } from '@/components/ui/file-upload'
import type { TicketGridItem } from '@/types'

// ─── Schema ───────────────────────────────────────────────────────────────────

const purchaseSchema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  ref_code: z.string().optional(),
  payment_method: z.enum(['zelle', 'stripe']),
  agreed_age: z.literal(true, { errorMap: () => ({ message: 'Must be 18+' }) }),
  agreed_terms: z.literal(true, { errorMap: () => ({ message: 'Must accept terms' }) }),
})

type FormValues = z.infer<typeof purchaseSchema>

// ─── Constants ────────────────────────────────────────────────────────────────

// Date when the $1,000/day × 90-day daily giveaway period begins
const DRAW_DATE = new Date('2026-07-31T23:59:00-07:00')
const TICKET_PRICE = 500

// ─── Countdown hook ───────────────────────────────────────────────────────────

function useCountdown(target: Date) {
  const [time, setTime] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null)
  useEffect(() => {
    const calc = () => {
      const diff = Math.max(0, target.getTime() - Date.now())
      return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      }
    }
    setTime(calc())
    const id = setInterval(() => setTime(calc()), 1000)
    return () => clearInterval(id)
  }, [target])
  return time
}

// ─── Ticket color ─────────────────────────────────────────────────────────────

function ticketColor(status: TicketGridItem['status']) {
  switch (status) {
    case 'available':       return 'bg-[var(--gold)] text-[var(--black)] hover:bg-[var(--gold-light)] cursor-pointer'
    case 'active':          return 'bg-[#1a1a1a] text-[#444]'
    case 'pending_payment': return 'border border-[var(--gold)] text-[var(--gold)] animate-pulse bg-transparent'
    default:                return 'bg-[var(--gold)] text-[var(--black)]'
  }
}

// ─── TERMS MODAL ──────────────────────────────────────────────────────────────

const TERMS_TEXT = [
  { heading: '1. Eligibility', body: 'Participants must be 18 years of age or older. Entry is open to legal residents of the United States. Void where prohibited by law.' },
  { heading: '2. Entry & Ticket Price', body: 'Each raffle entry costs $500 USD. Payment may be made via Zelle (manual verification) or credit/debit card (Stripe). Entry is not confirmed until payment is verified.' },
  { heading: '3. Ticket Assignment', body: 'Tickets are numbered sequentially from #1 to #1,000. Your unique ticket number is assigned only after payment is confirmed by Golden Valley Members LLC. Pending payments do not reserve a number.' },
  { heading: '4. Draw Trigger', body: 'The prize draw is triggered automatically when ticket #1,000 is confirmed. There is no pre-set draw date — the draw happens only when all 1,000 tickets are sold.' },
  { heading: '5. Prize — First Place', body: 'Grand Prize winner receives one (1) 2026 Toyota 4Runner Special Edition Trailhunter or, at the winner\'s election, $70,000 USD in cash. Prize is awarded to the holder of the drawn ticket number.' },
  { heading: '6. Prize — Second Place', body: 'A second ticket number is drawn. That holder receives $20,000 USD in cash.' },
  { heading: '7. Prize — Daily Giveaway (3rd Tier)', body: 'Beginning on the date indicated by the live countdown timer, Golden Valley Members LLC will award $1,000 USD per day for 90 consecutive days to eligible participants as determined by the company\'s promotional rules.' },
  { heading: '8. Non-Refundable', body: 'All sales are final. Ticket purchases are non-refundable once payment is confirmed. If you paid via Zelle and payment is rejected or unverified within 72 hours, your spot is released.' },
  { heading: '9. Cancellation', body: 'Golden Valley Members LLC reserves the right to cancel the raffle and issue full refunds if fewer than 500 tickets are sold within 90 days of the first sale.' },
  { heading: '10. Taxes', body: 'All federal, state, and local taxes on prizes are the sole responsibility of the winner. A Form 1099 will be issued to US winners where required by law.' },
  { heading: '11. Prize Transfer', body: 'Prizes are non-transferable and may not be exchanged except as stated in Rule 5 (vehicle-to-cash election).' },
  { heading: '12. Winner Notification', body: 'Winners will be notified by email and announced publicly on the Golden Valley Members website and social media channels within 48 hours of the draw.' },
  { heading: '13. Governing Law', body: 'These rules are governed by the laws of the State of California, USA. Any disputes shall be resolved by binding arbitration in Los Angeles County, California.' },
  { heading: '14. Acceptance', body: 'By purchasing a ticket and signing this agreement, you confirm that you have read, understood, and agreed to all of the above terms and conditions in their entirety.' },
]

function TermsModal({
  isOpen,
  onAccept,
  onClose,
}: {
  isOpen: boolean
  onAccept: (sig: string) => void
  onClose: () => void
}) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const [signature, setSignature] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setScrolledToBottom(false)
      setSignature('')
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 40
    if (atBottom) setScrolledToBottom(true)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.92)' }}>
      <div className="w-full max-w-2xl bg-[var(--black-card)] border border-[var(--gold)] flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--black-border)] shrink-0">
          <div>
            <h2 className="font-black uppercase tracking-wider text-white text-sm">Official Terms &amp; Conditions</h2>
            <p className="text-white/40 text-[10px] uppercase tracking-wider mt-0.5">
              {scrolledToBottom ? '✓ Scroll complete — sign below to accept' : 'Scroll to the bottom to unlock the signature'}
            </p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors text-xl leading-none">✕</button>
        </div>

        {/* Scrollable T&C */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="overflow-y-auto flex-1 px-6 py-6 space-y-5"
        >
          {TERMS_TEXT.map((item) => (
            <div key={item.heading}>
              <p className="text-[var(--gold)] text-xs font-black uppercase tracking-wider mb-1">{item.heading}</p>
              <p className="text-white/55 text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}

          {/* Signature area — locked until scrolled */}
          <div className="pt-6 border-t border-[var(--black-border)]">
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3">
              {scrolledToBottom
                ? 'Sign below to confirm you have read and agree to all terms above'
                : '⬇ Keep scrolling to unlock the signature field'}
            </p>
            <div className={`transition-opacity duration-300 ${scrolledToBottom ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
              <SignatureCanvasComponent onSave={setSignature} onClear={() => setSignature('')} />
            </div>
          </div>
        </div>

        {/* Modal footer */}
        <div className="px-6 py-4 border-t border-[var(--black-border)] shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-[var(--black-border)] text-white/50 text-xs font-black uppercase tracking-widest hover:border-white/30 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { if (signature) onAccept(signature) }}
            disabled={!scrolledToBottom || !signature}
            className="flex-1 py-3 font-black uppercase tracking-widest text-black text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
            style={{ background: scrolledToBottom && signature ? 'linear-gradient(135deg, #A68B28, #D4AF37, #E8CC7A)' : '#333' }}
          >
            {!scrolledToBottom ? 'Scroll to Unlock' : !signature ? 'Sign Above First' : 'I Accept & Sign'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── SITE HEADER ──────────────────────────────────────────────────────────────

function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMobileOpen(false)
  }

  return (
    <header
      className="sticky top-7 z-40 w-full transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(10,10,10,0.97)' : 'rgba(10,10,10,0.75)',
        borderBottom: '1px solid rgba(212,175,55,0.12)',
        backdropFilter: 'blur(14px)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 flex items-center justify-center font-black text-xs tracking-widest text-black shrink-0"
            style={{ background: 'linear-gradient(135deg, #A68B28, #D4AF37, #E8CC7A)' }}
          >
            GV
          </div>
          <span className="hidden sm:block text-xs font-black uppercase tracking-[0.2em] text-white/60 group-hover:text-white transition-colors">
            Golden Valley Members
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
          {[
            { label: 'About', id: 'about' },
            { label: 'Prizes', id: 'prizes' },
            { label: 'How It Works', id: 'how-it-works' },
            { label: 'Winners', href: '/winners' },
            { label: 'Tickets', href: '/tickets' },
            { label: 'FAQ', href: '/faq' },
          ].map((item) => (
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                className="px-3 py-2 text-white/40 hover:text-[var(--gold)] transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                onClick={() => scrollTo(item.id!)}
                className="px-3 py-2 text-white/40 hover:text-[var(--gold)] transition-colors"
              >
                {item.label}
              </button>
            )
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Buy ticket CTA */}
          <button
            onClick={() => scrollTo('buy-form')}
            className="hidden sm:flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-black px-4 py-2 transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #A68B28, #D4AF37, #E8CC7A)' }}
          >
            Get My Membership
          </button>

          {/* Login */}
          <Link
            href="/login"
            title="Staff Login"
            className="flex items-center gap-1.5 text-white/40 hover:text-[var(--gold)] transition-colors group"
          >
            <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest">Login</span>
            <div className="w-8 h-8 rounded-full border border-white/20 group-hover:border-[var(--gold)] flex items-center justify-center transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </Link>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-white/50 hover:text-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--black-border)] bg-[rgba(10,10,10,0.98)] px-4 py-3 space-y-1">
          {[
            { label: 'About', action: () => scrollTo('about') },
            { label: 'Prizes', action: () => scrollTo('prizes') },
            { label: 'How It Works', action: () => scrollTo('how-it-works') },
            { label: 'Winners', href: '/winners' },
            { label: 'Ticket Board', href: '/tickets' },
            { label: 'Get My Membership', action: () => scrollTo('buy-form'), gold: true },
          ].map((item) => (
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2.5 text-xs font-black uppercase tracking-widest text-white/50"
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                onClick={item.action}
                className={`block w-full text-left py-2.5 text-xs font-black uppercase tracking-widest ${item.gold ? 'text-[var(--gold)]' : 'text-white/50'}`}
              >
                {item.label}
              </button>
            )
          ))}
        </div>
      )}
    </header>
  )
}

// ─── URGENCY BANNER ───────────────────────────────────────────────────────────

function UrgencyBanner({ available }: { available: number | null }) {
  const left = available ?? 1000

  return (
    <div className="fixed top-0 left-0 right-0 z-50 text-white font-black uppercase text-center" style={{ background: '#8FFF3A', color: '#0B0B0B' }}>
      <div className="py-1.5 px-3 tracking-wider leading-none" style={{ fontSize: 'clamp(9px, 2.5vw, 13px)' }}>
        ⚡ ONLY <span style={{ fontSize: '1.25em' }}>{left}</span> MEMBERSHIPS LEFT · GRAND PRIZE REVEALED AT #1,000
      </div>
    </div>
  )
}

// ─── HERO ─────────────────────────────────────────────────────────────────────

function Hero({ available }: { available: number | null }) {
  const sold = 1000 - (available ?? 1000)
  const pct = (sold / 1000) * 100

  return (
    <section
      id="about"
      className="relative min-h-[100svh] flex flex-col items-center justify-end text-center px-4 pb-8 sm:pb-12 overflow-hidden bg-black"
    >
      <video
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ objectPosition: 'center 40%' }}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/assets/hero-poster.jpg"
      >
        <source src="/assets/hero.mp4" type="video/mp4" />
        <source src="/assets/hero.webm" type="video/webm" />
      </video>

      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.88) 35%, rgba(0,0,0,0.4) 65%, rgba(0,0,0,0.15) 100%)' }} />

      <div className="relative z-10 max-w-3xl w-full">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.4em] font-bold mb-3" style={{ color: '#D4AF37' }}>
          Season 1 · 1,000 Memberships Only
        </p>

        {/* Main headline */}
        <h1
          className="font-black uppercase leading-none mb-1"
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: 'clamp(2.6rem, 11vw, 7rem)',
            textShadow: '0 2px 40px rgba(0,0,0,0.9)',
            background: 'linear-gradient(135deg, #A68B28 0%, #D4AF37 35%, #F8E48A 55%, #D4AF37 75%, #A68B28 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          WIN A 4RUNNER
        </h1>

        {/* OR $70,000 line */}
        <div className="flex items-center justify-center gap-3 mb-5 sm:mb-7">
          <div className="h-px flex-1 max-w-[60px]" style={{ background: 'rgba(212,175,55,0.3)' }} />
          <div className="flex items-baseline gap-2">
            <span
              className="font-black uppercase"
              style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 'clamp(1.3rem, 4vw, 2.2rem)', color: '#D4AF37', textShadow: '0 0 20px rgba(212,175,55,0.8)' }}
            >
              OR
            </span>
            <span
              className="font-black uppercase"
              style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.5rem, 5.5vw, 3.5rem)', color: '#8FFF3A', textShadow: '0 0 30px rgba(143,255,58,0.7)' }}
            >
              $70,000 CASH
            </span>
          </div>
          <div className="h-px flex-1 max-w-[60px]" style={{ background: 'rgba(212,175,55,0.3)' }} />
        </div>

        {/* Mini prize cards */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-5 sm:mb-7 max-w-xs sm:max-w-sm mx-auto">
          <div className="border border-white/15 bg-black/60 backdrop-blur-sm px-3 sm:px-4 py-3 text-left" style={{ boxShadow: '0 0 20px rgba(255,255,255,0.04)' }}>
            <p className="text-white/40 text-[8px] sm:text-[10px] uppercase tracking-widest font-bold mb-1">2nd Prize</p>
            <p className="font-black" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 'clamp(1.2rem, 4.5vw, 1.8rem)', background: 'linear-gradient(135deg,#A68B28,#D4AF37,#E8CC7A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.5))' }}>$20,000</p>
            <p className="text-white/35 text-[7px] sm:text-[9px] uppercase tracking-wider">Cash · 2nd Selection</p>
          </div>
          <div className="border border-[#D4AF37]/35 bg-[#D4AF37]/8 backdrop-blur-sm px-3 sm:px-4 py-3 text-left" style={{ boxShadow: '0 0 20px rgba(212,175,55,0.08)' }}>
            <p className="text-[#D4AF37]/70 text-[8px] sm:text-[10px] uppercase tracking-widest font-bold mb-1">Daily Prize</p>
            <p className="font-black" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 'clamp(1.2rem, 4.5vw, 1.8rem)', color: '#8FFF3A', textShadow: '0 0 12px rgba(143,255,58,0.8), 0 0 24px rgba(143,255,58,0.4)' }}>$1,000</p>
            <p className="text-[#D4AF37]/50 text-[7px] sm:text-[9px] uppercase tracking-wider">Per day × 90 days</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 mb-6 sm:mb-8">
          <Link
            href="/register"
            className="w-full sm:w-auto font-black uppercase tracking-widest text-white px-8 sm:px-14 py-4 sm:py-5 text-sm sm:text-lg transition-all hover:brightness-110 active:scale-95 text-center"
            style={{ background: '#8FFF3A', color: '#0B0B0B', boxShadow: '0 0 40px rgba(143,255,58,0.6), 0 4px 20px rgba(0,0,0,0.6)' }}
          >
            GET MY MEMBERSHIP →
          </Link>
          <Link
            href="/signin"
            className="text-white/40 hover:text-white/70 transition-colors text-[11px] font-bold uppercase tracking-widest underline underline-offset-4"
          >
            Already a member? Sign in
          </Link>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-sm mx-auto">
          <div className="flex justify-between text-[9px] sm:text-[10px] uppercase tracking-widest text-white/35 mb-1.5">
            <span>{sold} claimed</span>
            <span>Goal: 1,000</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${pct}%`, minWidth: pct > 0 ? '4px' : '0', background: 'linear-gradient(90deg, #A68B28, #D4AF37, #E8CC7A)' }}
            />
          </div>
          <p className="text-center text-white/30 text-[9px] sm:text-[10px] uppercase tracking-widest mt-1.5">
            <span className="text-white font-black" style={{ fontFamily: 'var(--font-dm-mono)' }}>{available ?? 1000}</span> of 1,000 memberships available
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── TRUST STRIP ──────────────────────────────────────────────────────────────

// ─── FUNDING PROGRESS ────────────────────────────────────────────────────────


// ─── TRUST STRIP ──────────────────────────────────────────────────────────────

function TrustStrip() {
  return (
    <div className="py-3.5 px-4 overflow-hidden" style={{ background: '#111111' }}>
      <div className="flex items-center justify-center gap-5 md:gap-12 flex-wrap text-white text-[10px] sm:text-[11px] font-black uppercase tracking-widest">
        <span>🔒 Secure Payment</span>
        <span>✅ Official LLC</span>
        <span>🎯 Only 1,000 Members</span>
        <span>🏆 Live Reveal</span>
        <span>⚡ Instant Confirmation</span>
      </div>
    </div>
  )
}

// ─── LOTTERY SECTION ──────────────────────────────────────────────────────────

function LotterySection() {
  const [digits, setDigits] = useState<string | null>(null)
  const [date, setDate] = useState<string>('')
  const [status, setStatus] = useState<'loading' | 'ok' | 'none'>('loading')

  useEffect(() => {
    fetch('/api/lottery')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.digits) { setDigits(d.digits); setDate(d.date ?? ''); setStatus('ok') }
        else setStatus('none')
      })
      .catch(() => setStatus('none'))
  }, [])

  return (
    <section className="py-5 px-4" style={{ background: '#0a0800', borderTop: '1px solid rgba(212,175,55,0.12)', borderBottom: '1px solid rgba(212,175,55,0.12)' }}>
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3" strokeLinecap="round"/></svg>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] font-bold" style={{ color: '#D4AF37' }}>Daily Tris 7pm · Número Ganador</p>
            {date && <p className="text-white/30 text-[10px] mt-0.5">{date}</p>}
          </div>
        </div>

        <div className="flex items-center gap-6">
          {status === 'loading' && <div className="flex gap-2">{[0,1,2].map(i => <div key={i} className="w-12 h-14 bg-[var(--gold)]/10 animate-pulse rounded-sm" />)}</div>}
          {status === 'ok' && digits && (
            <div className="flex gap-2">
              {digits.split('').map((d, i) => (
                <div key={i} className="w-12 h-14 flex items-center justify-center font-black text-3xl rounded-sm"
                  style={{ fontFamily: 'var(--font-dm-mono)', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37', textShadow: '0 0 12px rgba(212,175,55,0.6)' }}>
                  {d}
                </div>
              ))}
            </div>
          )}
          {status === 'none' && (
            <div className="flex gap-2">
              {['?','?','?'].map((d, i) => (
                <div key={i} className="w-12 h-14 flex items-center justify-center font-black text-3xl rounded-sm"
                  style={{ fontFamily: 'var(--font-dm-mono)', background: 'rgba(80,80,80,0.1)', border: '1px solid rgba(80,80,80,0.3)', color: '#555' }}>
                  {d}
                </div>
              ))}
            </div>
          )}
          <div className="text-left hidden sm:block">
            <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Lotería Nacional</p>
            <p className="text-white/25 text-[10px]">Últimas 3 cifras • Tris</p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── PRIZES SECTION ───────────────────────────────────────────────────────────

function PrizesSection() {
  return (
    <section id="prizes" className="py-8 sm:py-14 px-4 overflow-hidden" style={{ background: '#080808' }}>
      <style>{`
        @keyframes prize-glow {
          0%, 100% { text-shadow: 0 0 30px rgba(143,255,58,0.9), 0 0 60px rgba(143,255,58,0.5), 0 0 100px rgba(143,255,58,0.2); }
          50% { text-shadow: 0 0 50px rgba(143,255,58,1), 0 0 100px rgba(143,255,58,0.8), 0 0 150px rgba(143,255,58,0.35); }
        }
        @keyframes gold-shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes card-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .prize-red-glow {
          color: #8FFF3A;
          animation: prize-glow 2.8s ease-in-out infinite;
        }
        .gold-shine {
          background: linear-gradient(90deg, #A68B28 0%, #D4AF37 20%, #F8E48A 40%, #FFFDE0 50%, #F8E48A 60%, #D4AF37 80%, #A68B28 100%);
          background-size: 300% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gold-shimmer 3s linear infinite;
        }
        .float-a { animation: card-float 5s ease-in-out infinite; }
        .float-b { animation: card-float 5s ease-in-out 1.5s infinite; }
      `}</style>

      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-6 sm:mb-8">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.5em] font-bold mb-3" style={{ color: '#8FFF3A' }}>
            What You Can Win
          </p>
          <h2
            className="font-black uppercase text-white leading-none"
            style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(2rem, 7vw, 5rem)' }}
          >
            Three Ways to Win
          </h2>
        </div>

        {/* Grand Prize */}
        <div className="mb-8 sm:mb-12">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-5 py-2 border font-black text-[11px] uppercase tracking-widest" style={{ borderColor: '#D4AF37', color: '#D4AF37', background: 'rgba(212,175,55,0.07)' }}>
              🏆 Grand Prize — Winner&apos;s Choice
            </div>
          </div>

          {/* Vehicle + OR + Cash layout */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-0">
            {/* 4Runner side */}
            <div className="flex-1 text-center px-4 sm:px-6 py-5 sm:py-7 border border-white/10 bg-[#0d0d0d] w-full sm:max-w-xs">
              <div className="relative overflow-hidden mb-5 mx-auto" style={{ height: 180, maxWidth: 320 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/4runner-golden-gate.png"
                  alt="2027 Toyota 4Runner"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: 'center 55%' }}
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 50%, #0d0d0d 100%)' }} />
              </div>
              <p className="text-white/30 text-[9px] uppercase tracking-[0.4em] font-bold mb-1">Vehicle Prize</p>
              <p
                className="font-black uppercase leading-tight"
                style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', background: 'linear-gradient(135deg, #A68B28, #D4AF37, #E8CC7A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
              >
                Toyota<br />4Runner
              </p>
              <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1 font-bold">2027 Edition</p>
            </div>

            {/* OR divider */}
            <div className="flex sm:flex-col items-center justify-center gap-3 sm:gap-4 px-2 py-4 sm:py-0 sm:px-4 z-10">
              <div className="h-px w-12 sm:h-16 sm:w-px bg-white/15" />
              <div
                className="font-black leading-none"
                style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: 'clamp(3rem, 8vw, 5.5rem)',
                  background: 'linear-gradient(135deg, #A68B28, #D4AF37, #E8CC7A)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 20px rgba(212,175,55,0.5))',
                }}
              >
                OR
              </div>
              <div className="h-px w-12 sm:h-16 sm:w-px bg-white/15" />
            </div>

            {/* Cash side */}
            <div className="flex-1 text-center px-4 sm:px-6 py-5 sm:py-7 border border-[#8FFF3A]/20 bg-[#8FFF3A]/4 w-full sm:max-w-xs" style={{ boxShadow: '0 0 60px rgba(143,255,58,0.04)' }}>
              <p className="text-[#8FFF3A]/60 text-[9px] uppercase tracking-[0.4em] font-bold mb-4">Cash Prize</p>
              <div
                className="prize-red-glow font-black leading-none tabular-nums"
                style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 'clamp(2.25rem, 7vw, 3.75rem)' }}
              >
                $70,000
              </div>
              <p className="text-white/40 text-[10px] sm:text-sm uppercase tracking-widest mt-3 font-bold">USD Cash</p>
              <p className="text-white/25 text-[10px] uppercase tracking-wider mt-1">Wired directly to the winner</p>
            </div>
          </div>

          <p className="text-center text-white/25 text-[11px] uppercase tracking-widest mt-5 font-bold">
            Winner chooses: take the truck or the cash — at the moment of the draw
          </p>
        </div>

        {/* 2nd + Daily prizes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-8">
          {/* 2nd Prize */}
          <div className="float-a border border-white/10 bg-[#111] p-6 sm:p-8 text-center" style={{ boxShadow: '0 0 60px rgba(255,255,255,0.02), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
            <p className="text-white/25 text-[10px] uppercase tracking-[0.5em] font-bold mb-3">2nd Prize · Cash</p>
            <div
              className="gold-shine font-black leading-none tabular-nums mb-4"
              style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 'clamp(2.8rem, 6vw, 5.5rem)' }}
            >
              $20,000
            </div>
            <p className="text-white/40 text-xs sm:text-sm uppercase tracking-widest font-bold">Wired directly to the winner</p>
          </div>

          {/* Daily Prize */}
          <div className="float-b border border-[#8FFF3A]/25 bg-[#8FFF3A]/6 p-6 sm:p-8 text-center relative" style={{ boxShadow: '0 0 80px rgba(143,255,58,0.05)' }}>
            <div className="absolute -right-3 -top-3 font-black text-white/5 select-none pointer-events-none leading-none" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10rem' }}>90</div>
            <p className="text-[#8FFF3A]/60 text-[10px] uppercase tracking-[0.5em] font-bold mb-3 relative z-10">Daily Prize</p>
            <div
              className="font-black leading-none tabular-nums mb-2 relative z-10"
              style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 'clamp(2.8rem, 6vw, 5.5rem)', color: '#8FFF3A', textShadow: '0 0 40px rgba(143,255,58,0.5)' }}
            >
              $1,000
            </div>
            <p className="text-white/40 text-xs sm:text-sm uppercase tracking-widest font-bold relative z-10">Every day for 90 days</p>
          </div>
        </div>

        {/* Odds callout */}
        <div className="relative overflow-hidden border border-[#D4AF37]/30 p-8 sm:p-14 text-center" style={{ background: 'radial-gradient(ellipse at center, #120f00 0%, #080808 65%)', boxShadow: '0 0 80px rgba(212,175,55,0.06)' }}>
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.5em] font-bold mb-4" style={{ color: '#D4AF37' }}>
            Why Your Odds Are Exceptional
          </p>
          <h3
            className="font-black uppercase text-white leading-tight mb-5"
            style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.8rem, 6vw, 4rem)' }}
          >
            Your Chances Are<br className="hidden sm:block" /> Incredibly High
          </h3>
          <p className="text-white/45 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-8">
            Only 1,000 memberships — ever. With 90 daily prizes distributed across the member pool,
            <strong className="text-white"> nearly 1 in 11 members</strong> can receive a daily prize.
            These are exceptional odds compared to any traditional contest.
          </p>
          <button
            onClick={() => document.getElementById('buy-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-auto font-black uppercase tracking-widest text-white px-10 sm:px-16 py-4 sm:py-5 text-sm sm:text-base transition-all hover:brightness-110 active:scale-95"
            style={{ background: '#8FFF3A', color: '#0B0B0B', boxShadow: '0 0 35px rgba(143,255,58,0.4)' }}
          >
            GET MY MEMBERSHIP →
          </button>
        </div>
      </div>
    </section>
  )
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      num: '01',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
      ),
      title: 'Register',
      body: 'Complete your information and become a verified member. Your identity and signature are securely stored.',
      accent: '#D4AF37',
    },
    {
      num: '02',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8FFF3A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          <path d="M14 17h3m4 0h-3m0-3v3m0 3v-3" />
        </svg>
      ),
      title: 'Get Your Number',
      body: 'Pick your lucky number from 1 to 1,000. Your official participation number is reserved once your payment is confirmed.',
      accent: '#8FFF3A',
    },
    {
      num: '03',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
      title: 'Receive Your Referral Code',
      body: 'Get your unique personal code. Share it with friends and earn $50 for every qualified referral you bring in.',
      accent: '#D4AF37',
    },
    {
      num: '04',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8FFF3A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
        </svg>
      ),
      title: 'Stay Updated',
      body: 'Follow our official channels for live announcements, daily prize results, events, and the final draw.',
      accent: '#8FFF3A',
    },
  ]

  return (
    <section id="how-it-works" className="py-10 sm:py-14 px-4" style={{ background: '#0D0900' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-3">
          <div className="h-px flex-1 bg-[var(--gold)] opacity-30" />
          <span className="text-[var(--gold)] text-[10px] sm:text-xs uppercase tracking-[0.4em] font-bold whitespace-nowrap">How to Participate</span>
          <div className="h-px flex-1 bg-[var(--gold)] opacity-30" />
        </div>
        <div className="text-center mb-8">
          <h2
            className="font-black uppercase text-white"
            style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.6rem, 5vw, 3rem)' }}
          >
            4 Simple Steps
          </h2>
        </div>

        {/* Steps — compact rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[var(--black-border)]">
          {steps.map((step) => (
            <div
              key={step.num}
              className="bg-[var(--black-card)] px-5 py-5 flex items-start gap-4 hover:bg-[#100e06] transition-colors"
            >
              {/* Number circle */}
              <div
                className="w-9 h-9 flex items-center justify-center font-black text-sm shrink-0 mt-0.5"
                style={{
                  background: step.accent === '#D4AF37' ? 'rgba(212,175,55,0.12)' : 'rgba(143,255,58,0.1)',
                  color: step.accent,
                  border: `1.5px solid ${step.accent}50`,
                }}
              >
                {step.num}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ color: step.accent }}>{step.icon}</span>
                  <h3 className="text-white font-black uppercase tracking-wide text-xs sm:text-sm">{step.title}</h3>
                </div>
                <p className="text-white/40 text-xs sm:text-sm leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Payment methods note */}
        <div className="mt-4 px-4 sm:px-5 py-4 border border-[var(--black-border)] bg-[var(--black-card)] flex items-start gap-3">
          <div className="w-0.5 h-8 bg-[var(--gold)] shrink-0 mt-0.5" />
          <p className="text-white/45 text-xs leading-relaxed">
            <span className="text-[var(--gold)] font-black uppercase tracking-wider text-[10px]">Payment: </span>
            <strong className="text-white">⚡ Zelle</strong> (verified within 24h) or <strong className="text-white">💳 Card</strong> via Stripe (instant). Number assigned only after payment confirmed.
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── WINNERS SECTION (homepage preview) ───────────────────────────────────────

function WinnersSection() {
  return (
    <section id="winners" className="py-20 px-4 bg-[#0B0B0B]">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-px flex-1 bg-[var(--gold)] opacity-30" />
          <span className="text-[var(--gold)] text-xs uppercase tracking-[0.4em] font-bold whitespace-nowrap">Winners</span>
          <div className="h-px flex-1 bg-[var(--gold)] opacity-30" />
        </div>
        <div className="text-center mb-12">
          <h2
            className="font-black uppercase text-white"
            style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            Season 1 Winners
          </h2>
          <p className="text-white/40 mt-3 text-sm">Results posted here the moment the draw happens.</p>
        </div>

        {/* Placeholder — no draw yet */}
        <div className="border border-[var(--black-border)] bg-[var(--black-card)] p-12 text-center">
          <div
            className="text-[var(--gold)] font-black text-6xl mb-6 opacity-20"
            style={{ fontFamily: 'var(--font-dm-mono)' }}
          >
            ?
          </div>
          <p className="text-white font-black uppercase tracking-widest text-base mb-3">Draw Has Not Happened Yet</p>
          <p className="text-white/40 text-sm max-w-md mx-auto leading-relaxed mb-8">
            The grand prize draw is triggered automatically when ticket #1,000 is sold. Winners are announced live and posted here within 48 hours.
          </p>

          {/* Progress toward draw */}
          <div className="max-w-sm mx-auto">
            <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/30 mb-2">
              <span>Tickets Sold</span>
              <span>Draw Trigger: #1,000</span>
            </div>
            <div className="h-2 bg-[var(--black)] border border-[var(--black-border)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: '0%', background: 'linear-gradient(90deg, #A68B28, #D4AF37, #E8CC7A)' }}
              />
            </div>
            <p className="text-white/25 text-[10px] text-center mt-2 uppercase tracking-wider">0 / 1,000 confirmed</p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/winners"
            className="inline-flex items-center gap-2 text-[var(--gold)] text-xs font-black uppercase tracking-[0.3em] hover:text-[var(--gold-light)] transition-colors border border-[var(--gold)] border-opacity-40 hover:border-opacity-100 px-6 py-3"
          >
            View Full Winners Page →
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── TEASER GRID ──────────────────────────────────────────────────────────────

function TeaserGrid({ tickets }: { tickets: TicketGridItem[] }) {
  const router = useRouter()
  const first100 = tickets.slice(0, 100)
  const available = tickets.filter((t) => t.status === 'available').length
  const sold = 1000 - available

  return (
    <section className="py-20 px-4" style={{ background: '#111116' }}>
      <style>{`
        @keyframes gold-cell-glow {
          0%, 100% {
            box-shadow: 0 0 4px rgba(212,175,55,0.5), 0 0 8px rgba(212,175,55,0.2);
            background: linear-gradient(135deg, #A68B28, #D4AF37, #E8CC7A);
          }
          50% {
            box-shadow: 0 0 10px rgba(212,175,55,0.9), 0 0 20px rgba(212,175,55,0.5), 0 0 35px rgba(212,175,55,0.2);
            background: linear-gradient(135deg, #C4A030, #F0C840, #FFF0A0);
          }
        }
        @keyframes gold-sweep {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .ticket-available {
          background: linear-gradient(135deg, #A68B28, #D4AF37, #E8CC7A);
          animation: gold-cell-glow 2.5s ease-in-out infinite;
          color: #0B0B0B;
          cursor: pointer;
        }
        .ticket-available:nth-child(2n) { animation-delay: 0.3s; }
        .ticket-available:nth-child(3n) { animation-delay: 0.6s; }
        .ticket-available:nth-child(5n) { animation-delay: 1s; }
        .ticket-available:nth-child(7n) { animation-delay: 1.4s; }
        .ticket-available:hover {
          animation: none;
          box-shadow: 0 0 16px rgba(212,175,55,1), 0 0 32px rgba(212,175,55,0.7), 0 0 50px rgba(212,175,55,0.3) !important;
          background: linear-gradient(135deg, #C4A030, #F0C840, #FFF0A0) !important;
          transform: scale(1.12);
          z-index: 2;
        }
      `}</style>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-px flex-1 bg-[var(--gold)] opacity-30" />
          <span className="text-[var(--gold)] text-xs uppercase tracking-[0.4em] font-bold whitespace-nowrap">Live Membership Board</span>
          <div className="h-px flex-1 bg-[var(--gold)] opacity-30" />
        </div>

        <p className="text-center text-white/50 text-sm mb-6 font-bold uppercase tracking-wider">
          See a number you want? <span className="text-[var(--gold)]">Click it to claim it!</span>
        </p>

        <div className="flex items-center justify-center gap-6 mb-6 text-center">
          <div>
            <div className="font-black" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 'clamp(2.5rem,5vw,3.5rem)', color: 'var(--gold)', filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.6))' }}>{sold}</div>
            <div className="text-white/35 text-[10px] uppercase tracking-widest">Claimed</div>
          </div>
          <div className="flex-1 max-w-xs">
            <div className="h-3 bg-[var(--black-border)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${(sold / 1000) * 100}%`, background: 'linear-gradient(90deg, #A68B28, #D4AF37, #E8CC7A)', boxShadow: '0 0 8px rgba(212,175,55,0.5)' }}
              />
            </div>
            <div className="text-white/25 text-[10px] text-center mt-1">{sold}/1,000 SOLD</div>
          </div>
          <div>
            <div className="font-black" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 'clamp(2.5rem,5vw,3.5rem)', color: '#fff', textShadow: '0 0 20px rgba(255,255,255,0.4)' }}>{available}</div>
            <div className="text-white/35 text-[10px] uppercase tracking-widest">Left</div>
          </div>
        </div>

        <div className="flex gap-4 justify-center text-[10px] uppercase tracking-wider mb-5 text-white/35 font-bold">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: 'linear-gradient(135deg,#A68B28,#D4AF37,#E8CC7A)', boxShadow: '0 0 6px rgba(212,175,55,0.7)' }} />
            Available
          </span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#1a1a1a] border border-[#333] rounded-sm inline-block" />Sold</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 border border-[var(--gold)] rounded-sm inline-block animate-pulse" />Pending</span>
        </div>

        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}>
          {first100.map((t) => (
            <div
              key={t.number}
              title={`#${t.number}`}
              onClick={() => t.status === 'available' && router.push(`/register?number=${t.number}`)}
              className={[
                'aspect-square flex items-center justify-center text-[8px] md:text-[10px] font-bold transition-transform rounded-sm relative',
                t.status === 'available' ? 'ticket-available' : ticketColor(t.status),
              ].join(' ')}
              style={{ fontFamily: 'var(--font-dm-mono)' }}
            >
              {String(t.number).padStart(3, '0')}
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/tickets"
            className="inline-flex items-center gap-2 text-[var(--gold)] text-xs font-black uppercase tracking-[0.3em] hover:text-[var(--gold-light)] transition-colors border border-[var(--gold)] border-opacity-40 hover:border-opacity-100 px-6 py-3"
          >
            View All 1,000 Numbers →
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── TICKET PICKER ────────────────────────────────────────────────────────────

function TicketPicker({ tickets }: { tickets: TicketGridItem[] }) {
  const router = useRouter()
  const [mode, setMode] = useState<'idle' | 'manual' | 'random'>('idle')
  const [manualInput, setManualInput] = useState('')
  const [checking, setChecking] = useState(false)
  const [checkResult, setCheckResult] = useState<{ available: boolean } | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [spinDisplay, setSpinDisplay] = useState<number | null>(null)
  const [confirmed, setConfirmed] = useState<number | null>(null)
  const [reserving, setReserving] = useState(false)
  const [sessionId] = useState(() => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2))
  const spinRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const availableTickets = tickets.filter((t) => t.status === 'available')

  const checkManual = useCallback(async (val: string) => {
    const num = parseInt(val, 10)
    if (isNaN(num) || num < 1 || num > 1000) { setCheckResult(null); return }
    setChecking(true)
    try {
      const res = await fetch(`/api/tickets/check?number=${num}&session_id=${sessionId}`)
      const data = await res.json() as { available: boolean }
      setCheckResult(data)
    } catch { setCheckResult(null) }
    setChecking(false)
  }, [sessionId])

  useEffect(() => {
    if (mode !== 'manual') return
    setCheckResult(null)
    const timer = setTimeout(() => checkManual(manualInput), 500)
    return () => clearTimeout(timer)
  }, [manualInput, mode, checkManual])

  const startSpin = () => {
    if (availableTickets.length === 0) return
    setSpinDisplay(null)
    setSpinning(true)
    if (spinRef.current) clearInterval(spinRef.current)

    const target = availableTickets[Math.floor(Math.random() * availableTickets.length)]
    let elapsed = 0
    const totalDuration = 2600
    let intervalMs = 80

    const step = () => {
      // (uses ticket.number directly — 1-based, consistent with DB and display)
      elapsed += intervalMs
      if (elapsed >= totalDuration) {
        if (spinRef.current) clearInterval(spinRef.current)
        spinRef.current = null
        setSpinDisplay(target.number)
        setSpinning(false)
        return
      }
      if (elapsed > totalDuration - 900) intervalMs = 220
      const rand = availableTickets[Math.floor(Math.random() * availableTickets.length)]
      setSpinDisplay(rand.number)
    }
    spinRef.current = setInterval(step, intervalMs)
  }

  useEffect(() => () => { if (spinRef.current) clearInterval(spinRef.current) }, [])

  const confirmSelection = async (internalNum: number) => {
    setReserving(true)
    try {
      const res = await fetch('/api/tickets/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: internalNum, session_id: sessionId }),
      })
      const data = await res.json() as { success: boolean; error?: string }
      if (!data.success) {
        alert(data.error ?? 'Could not reserve this number. Please try another.')
        setCheckResult(null)
        setSpinDisplay(null)
        setReserving(false)
        return
      }
      setConfirmed(internalNum)
      router.push(`/register?number=${internalNum}`)
    } catch {
      alert('Connection error. Please try again.')
    }
    setReserving(false)
  }

  const reset = () => {
    setConfirmed(null)
    setSpinDisplay(null)
    setCheckResult(null)
    setManualInput('')
    setMode('idle')
  }

  if (confirmed) {
    return (
      <div className="text-center py-4">
        <div
          className="inline-flex flex-col items-center gap-2 border-2 border-[var(--gold)] px-10 py-6 mb-4"
          style={{ background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.08) 0%, transparent 70%)' }}
        >
          <span className="text-[10px] uppercase tracking-[0.4em] text-[var(--gold)] font-bold">Your Membership Number</span>
          <span
            className="font-black"
            style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 'clamp(3.5rem, 10vw, 5.5rem)', color: 'var(--gold)', textShadow: '0 0 40px rgba(212,175,55,0.7)' }}
          >
            #{String(confirmed).padStart(3, '0')}
          </span>
          <span className="text-white/35 text-xs uppercase tracking-widest">Reserved · 15-minute hold</span>
        </div>
        <button
          onClick={reset}
          className="text-white/25 text-xs hover:text-white/50 uppercase tracking-widest transition-colors"
        >
          ← Choose a different number
        </button>
      </div>
    )
  }

  return (
    <div>
      <style>{`
        @keyframes tmode-pulse-gold {
          0%, 100% { box-shadow: 0 0 16px rgba(212,175,55,0.28); }
          50% { box-shadow: 0 0 30px rgba(212,175,55,0.55), 0 0 55px rgba(212,175,55,0.22); }
        }
        @keyframes tmode-pulse-green {
          0%, 100% { box-shadow: 0 0 16px rgba(143,255,58,0.32); }
          50% { box-shadow: 0 0 32px rgba(143,255,58,0.6), 0 0 60px rgba(143,255,58,0.28); }
        }
        .tmode {
          transition: transform .15s ease, background .2s ease, color .2s ease;
          border-radius: 4px;
        }
        .tmode:hover { transform: translateY(-2px) scale(1.02); }
        .tmode:active { transform: scale(0.97); }
        .tmode-gold {
          border-color: #D4AF37; color: #F0D060;
          background: rgba(212,175,55,0.07);
          animation: tmode-pulse-gold 2.4s ease-in-out infinite;
        }
        .tmode-gold.sel {
          background: linear-gradient(135deg,#A68B28,#D4AF37,#F0D060,#E8CC7A);
          color: #0B0B0B;
          box-shadow: 0 0 34px rgba(212,175,55,0.75), 0 0 64px rgba(212,175,55,0.35);
          animation: none;
        }
        .tmode-green {
          border-color: #8FFF3A; color: #8FFF3A;
          background: rgba(143,255,58,0.08);
          animation: tmode-pulse-green 2.4s ease-in-out infinite;
        }
        .tmode-green.sel {
          background: #8FFF3A;
          color: #0B0B0B;
          box-shadow: 0 0 34px rgba(143,255,58,0.8), 0 0 64px rgba(143,255,58,0.38);
          animation: none;
        }
      `}</style>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
        {([
          { key: 'manual', icon: '🎯', label: 'Choose My Number', theme: 'gold' },
          { key: 'random', icon: '🎲', label: 'Surprise Me', theme: 'green' },
        ] as const).map(({ key, icon, label, theme }) => (
          <button
            key={key}
            type="button"
            onClick={() => { setMode(key); setSpinDisplay(null); setManualInput(''); setCheckResult(null) }}
            className={[
              'tmode flex flex-col items-center justify-center gap-2 py-6 sm:py-7 border-2 font-black uppercase tracking-widest',
              theme === 'gold' ? 'tmode-gold' : 'tmode-green',
              mode === key ? 'sel' : '',
            ].join(' ')}
          >
            <span className="text-3xl sm:text-4xl leading-none">{icon}</span>
            <span className="text-xs sm:text-base text-center leading-tight px-1">{label}</span>
          </button>
        ))}
      </div>

      {mode === 'manual' && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">
              Enter a number between 001 and 1,000
            </label>
            <input
              type="number"
              min={1}
              max={1000}
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="e.g. 042"
              className="w-full bg-[var(--black)] border border-[var(--black-border)] px-4 py-4 text-white text-center font-black focus:outline-none focus:border-[var(--gold)] transition-colors"
              style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 'clamp(2rem, 8vw, 3rem)' }}
            />
          </div>
          {checking && (
            <p className="text-white/35 text-xs uppercase tracking-wider text-center animate-pulse">Checking availability…</p>
          )}
          {!checking && checkResult && manualInput !== '' && (
            checkResult.available ? (
              <div className="text-center">
                <p className="text-[var(--gold)] font-black uppercase tracking-wider text-sm mb-4">✓ Available!</p>
                <button
                  type="button"
                  disabled={reserving}
                  onClick={() => confirmSelection(parseInt(manualInput, 10))}
                  className="w-full py-4 font-black uppercase tracking-widest text-white text-sm transition-all hover:brightness-110 disabled:opacity-40"
                  style={{ background: '#8FFF3A', color: '#0B0B0B' }}
                >
                  {reserving ? 'Reserving…' : `Reserve #${String(parseInt(manualInput, 10)).padStart(3, '0')}`}
                </button>
              </div>
            ) : (
              <p className="text-[#FF4E00] font-black uppercase tracking-wider text-sm text-center">✗ Already taken — try another number</p>
            )
          )}
        </div>
      )}

      {mode === 'random' && (
        <div className="flex flex-col items-center gap-5">
          <div
            className="w-full max-w-xs border-2 border-[var(--gold)] flex items-center justify-center py-10"
            style={{ background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.07) 0%, transparent 70%)' }}
          >
            {spinDisplay !== null ? (
              <span
                className="font-black transition-colors duration-300"
                style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: 'clamp(3.5rem, 12vw, 5.5rem)',
                  color: spinning ? 'rgba(212,175,55,0.5)' : 'var(--gold)',
                  textShadow: spinning ? 'none' : '0 0 40px rgba(212,175,55,0.7)',
                }}
              >
                #{String(spinDisplay).padStart(3, '0')}
              </span>
            ) : (
              <span className="text-white/15 font-black" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 'clamp(3.5rem, 12vw, 5.5rem)' }}>
                ???
              </span>
            )}
          </div>

          {!spinning && spinDisplay === null && (
            <button
              type="button"
              onClick={startSpin}
              className="w-full max-w-xs py-4 font-black uppercase tracking-widest text-black text-sm transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #A68B28, #D4AF37, #E8CC7A, #D4AF37)' }}
            >
              🎲 Spin the Wheel
            </button>
          )}

          {spinning && (
            <p className="text-white/35 text-xs uppercase tracking-widest animate-pulse">Drawing your lucky number…</p>
          )}

          {!spinning && spinDisplay !== null && (
            <div className="flex flex-col items-center gap-3 w-full max-w-xs">
              <button
                type="button"
                disabled={reserving}
                onClick={() => confirmSelection(spinDisplay)}
                className="w-full py-4 font-black uppercase tracking-widest text-black text-sm transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #A68B28, #D4AF37, #E8CC7A, #D4AF37)' }}
              >
                {reserving ? 'Reserving…' : `Yes! Lock in #${String(spinDisplay).padStart(3, '0')}`}
              </button>
              <button type="button" onClick={startSpin} className="text-white/30 text-xs uppercase tracking-widest hover:text-white/55 transition-colors">
                Spin again →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── BUY FORM ─────────────────────────────────────────────────────────────────

// ─── DAILY NUMBERS ────────────────────────────────────────────────────────────

interface DrawResult {
  drawNumber: number
  date: string
  numbers: [string, string, string]
}

function DailyNumbers() {
  const [draws, setDraws] = useState<DrawResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/lottery/daily3')
      .then((r) => r.json())
      .then((data) => { setDraws(data as DrawResult[]); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const today = draws[0]
  const history = draws.slice(1)

  const fmt = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <section className="py-20 px-4" style={{ background: '#0d0d0d' }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px flex-1 bg-[var(--gold)] opacity-30" />
          <span className="text-[var(--gold)] text-xs uppercase tracking-[0.4em] font-bold whitespace-nowrap">Lucky Numbers</span>
          <div className="h-px flex-1 bg-[var(--gold)] opacity-30" />
        </div>

        <div className="text-center mb-10">
          <h2
            className="font-black uppercase text-white leading-tight mb-2"
            style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.8rem, 5vw, 3rem)' }}
          >
            Daily Reference Numbers
          </h2>
          <p className="text-white/35 text-sm">Updated twice daily · Used to verify daily $1,000 giveaway draws</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><GoldSpinner size={32} /></div>
        ) : (
          <>
            {/* Today's numbers — hero display */}
            {today && (
              <div
                className="border-2 border-[var(--gold)] bg-[var(--black-card)] p-8 mb-6 text-center"
                style={{ background: 'radial-gradient(ellipse at top, #1a1000, #1a1a1a)' }}
              >
                <p className="text-[var(--gold)] text-[10px] font-black uppercase tracking-[0.4em] mb-5">
                  Latest Draw · {fmt(today.date)}
                </p>
                <div className="flex items-center justify-center gap-4 mb-4">
                  {today.numbers.map((n, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-center font-black text-black rounded-sm"
                      style={{
                        width: 72, height: 72,
                        fontSize: 32,
                        fontFamily: 'var(--font-dm-mono)',
                        background: 'linear-gradient(135deg, #A68B28, #D4AF37, #F0D060)',
                        boxShadow: '0 0 20px rgba(212,175,55,0.4)',
                      }}
                    >
                      {n}
                    </div>
                  ))}
                </div>
                <p className="text-white/25 text-[10px] uppercase tracking-widest">
                  Draw #{today.drawNumber}
                </p>
              </div>
            )}

            {/* History table */}
            {history.length > 0 && (
              <div className="border border-[var(--black-border)] overflow-hidden">
                <div className="grid grid-cols-3 border-b border-[var(--black-border)] bg-[var(--black-card)]">
                  {['Date', 'Numbers', 'Draw #'].map((h) => (
                    <div key={h} className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-white/25">{h}</div>
                  ))}
                </div>
                {history.map((d, i) => (
                  <div
                    key={d.drawNumber}
                    className={`grid grid-cols-3 items-center border-b border-[var(--black-border)] last:border-b-0 ${i % 2 === 0 ? 'bg-[var(--black-card)]' : 'bg-[#0e0e0e]'}`}
                  >
                    <div className="px-4 py-3 text-white/50 text-xs">{fmt(d.date)}</div>
                    <div className="px-4 py-3 flex gap-2">
                      {d.numbers.map((n, j) => (
                        <span
                          key={j}
                          className="inline-flex items-center justify-center w-7 h-7 text-xs font-black text-black rounded-sm"
                          style={{ background: 'linear-gradient(135deg, #A68B28, #D4AF37)' }}
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                    <div className="px-4 py-3 text-white/25 text-xs font-mono">#{d.drawNumber}</div>
                  </div>
                ))}
              </div>
            )}

            {!loading && draws.length === 0 && (
              <p className="text-center text-white/30 text-sm py-8">Numbers unavailable — check back shortly.</p>
            )}
          </>
        )}
      </div>
    </section>
  )
}

// ─── CHECK YOUR NUMBER ────────────────────────────────────────────────────────

// Winning numbers — set these when the draw happens (empty = draw not yet held)
const WINNING_NUMBERS: Record<string, { prize: string; date: string }> = {
  // '042': { prize: '2026 Toyota 4Runner Trailhunter', date: 'TBD' },
  // '317': { prize: '$20,000 Cash', date: 'TBD' },
}

function CheckWinner() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<'idle' | 'won' | 'not_won' | 'pending'>('idle')
  const [prizeInfo, setPrizeInfo] = useState<{ prize: string; date: string } | null>(null)

  const drawHeld = Object.keys(WINNING_NUMBERS).length > 0

  const handleCheck = () => {
    const normalized = query.trim().replace(/^#/, '').padStart(3, '0')
    if (!normalized.match(/^\d{3}$/)) return
    if (!drawHeld) { setResult('pending'); return }
    const match = WINNING_NUMBERS[normalized]
    if (match) { setPrizeInfo(match); setResult('won') }
    else setResult('not_won')
  }

  return (
    <section id="check-winner" className="py-20 px-4" style={{ background: 'radial-gradient(ellipse at center, #0f0c00 0%, #0B0B0B 70%)' }}>
      <div className="max-w-xl mx-auto text-center">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px flex-1 bg-[var(--gold)] opacity-30" />
          <span className="text-[var(--gold)] text-xs uppercase tracking-[0.4em] font-bold whitespace-nowrap">Winning Number</span>
          <div className="h-px flex-1 bg-[var(--gold)] opacity-30" />
        </div>

        <h2
          className="font-black uppercase text-white leading-tight mb-3"
          style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.8rem, 5vw, 3rem)' }}
        >
          Did You Win?
        </h2>
        <p className="text-white/40 text-sm mb-10 leading-relaxed">
          {drawHeld
            ? 'Enter your 3-digit ticket number below to check if it was drawn.'
            : 'The draw has not been held yet. Check back once all 1,000 tickets are sold.'}
        </p>

        <div className="bg-[var(--black-card)] border border-[var(--black-border)] p-8">
          <div className="flex gap-3 mb-5">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-black text-lg">#</span>
              <input
                type="text"
                maxLength={3}
                value={query}
                onChange={(e) => { setQuery(e.target.value.replace(/\D/g, '')); setResult('idle') }}
                onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                placeholder="000"
                className="w-full bg-[var(--black)] border border-[var(--black-border)] pl-9 pr-4 py-4 text-center text-2xl font-black text-white tracking-[0.3em] focus:outline-none focus:border-[var(--gold)] transition-colors"
                style={{ fontFamily: 'var(--font-dm-mono)' }}
              />
            </div>
            <button
              onClick={handleCheck}
              className="px-8 py-4 font-black uppercase tracking-widest text-black text-sm transition-all hover:scale-105 active:scale-95 shrink-0"
              style={{ background: 'linear-gradient(135deg, #A68B28, #D4AF37, #F0D060, #D4AF37)' }}
            >
              Check
            </button>
          </div>

          {/* Result */}
          {result === 'pending' && (
            <div className="border border-[var(--gold)]/40 bg-[var(--gold)]/5 p-5 text-center">
              <div className="text-3xl mb-2">⏳</div>
              <p className="text-[var(--gold)] font-black uppercase tracking-wider text-sm">Draw Not Yet Held</p>
              <p className="text-white/40 text-xs mt-1">Check back when membership #1,000 is confirmed sold.</p>
            </div>
          )}

          {result === 'won' && prizeInfo && (
            <div className="border-2 border-[var(--gold)] bg-[var(--gold)]/10 p-6 text-center">
              <div className="text-4xl mb-3">🏆</div>
              <p className="text-[var(--gold)] font-black uppercase tracking-wider text-sm mb-1">Congratulations — You Won!</p>
              <p className="text-white font-black text-lg mb-1">{prizeInfo.prize}</p>
              <p className="text-white/40 text-xs">Draw date: {prizeInfo.date}</p>
              <p className="text-white/50 text-xs mt-3 leading-relaxed">
                Our team will contact you at the email on file within 48 hours with claim instructions.
              </p>
            </div>
          )}

          {result === 'not_won' && (
            <div className="border border-[var(--black-border)] bg-[var(--black)] p-5 text-center">
              <div className="text-3xl mb-2">🎟️</div>
              <p className="text-white/60 font-black uppercase tracking-wider text-sm">Not a Winning Number</p>
              <p className="text-white/30 text-xs mt-1">Thank you for participating. Follow us for upcoming raffles.</p>
            </div>
          )}

          {!drawHeld && (
            <p className="text-white/20 text-[10px] uppercase tracking-widest mt-4">
              Winning numbers will be posted here immediately after the draw
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

// ─── WHATSAPP PROMO POPUP ─────────────────────────────────────────────────────

const WA_GROUP = 'https://chat.whatsapp.com/XXXXXXXXXXXXXXXXX' // ← replace with real link

function WhatsAppPromo({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--black-card)] border border-[var(--gold)] max-w-sm w-full shadow-2xl overflow-hidden"
        style={{ boxShadow: '0 0 60px rgba(212,175,55,0.2)' }}>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 text-white/50 hover:text-white text-2xl font-light leading-none w-8 h-8 flex items-center justify-center"
          aria-label="Close"
        >×</button>

        {/* 4Runner image */}
        <div className="relative w-full overflow-hidden" style={{ height: 180 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/4runner-golden-gate.png"
            alt="2026 Toyota 4Runner Trailhunter"
            className="w-full h-full object-cover"
            style={{ objectPosition: 'center 55%' }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(10,8,0,0.7))' }} />
          <div className="absolute bottom-3 left-4 right-4">
            <p className="text-[var(--gold)] text-[9px] font-black uppercase tracking-[0.3em]">Grand Prize</p>
            <p className="text-white font-black text-sm leading-tight" style={{ fontFamily: 'var(--font-playfair)' }}>
              2026 Toyota 4Runner Trailhunter
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <p className="text-[var(--gold)] text-[9px] font-black uppercase tracking-[0.35em] mb-1.5">Limited to 1,000 Tickets</p>
          <h2 className="font-black uppercase text-white leading-tight mb-2" style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.25rem, 4vw, 1.6rem)' }}>
            Win the <span style={{ color: 'var(--gold)' }}>4Runner</span><br />or $70,000 Cash
          </h2>
          <p className="text-white/45 text-xs mb-5 leading-relaxed">
            Plus <strong className="text-[var(--gold)]">$1,000/day × 90 days</strong> plus <strong className="text-white">$20,000</strong> 2nd prize.
          </p>

          <a
            href="/#buy-form"
            onClick={onClose}
            className="flex items-center justify-center w-full py-3.5 font-black uppercase tracking-widest text-black text-sm mb-3 transition-transform hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #A68B28, #D4AF37, #F0D060, #D4AF37)', boxShadow: '0 0 20px rgba(212,175,55,0.4)' }}
          >
            🎟 Quiero Mi Ticket
          </a>

          <a
            href={WA_GROUP}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 font-black uppercase tracking-widest text-xs transition-colors"
            style={{ border: '1px solid #25D366', color: '#25D366' }}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Join Our WhatsApp Group
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── FLOATING WHATSAPP BUTTON ─────────────────────────────────────────────────

function FloatingWhatsApp() {
  return (
    <a
      href={WA_GROUP}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Join our WhatsApp group"
      className="fixed bottom-6 right-6 z-[150] flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-transform hover:scale-110 active:scale-95"
      style={{ background: '#25D366', boxShadow: '0 4px 24px rgba(37,211,102,0.5)' }}
    >
      <svg viewBox="0 0 24 24" width="28" height="28" fill="white" aria-hidden>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </a>
  )
}

function BuyForm({ selectedTicket }: { selectedTicket: number | null }) {
  const [paymentMethod, setPaymentMethod] = useState<'zelle' | 'stripe'>('zelle')
  const [signature, setSignature] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [defaultRefCode, setDefaultRefCode] = useState('')
  const [termsOpen, setTermsOpen] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setDefaultRefCode(p.get('ref') ?? '')
  }, [])

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: { payment_method: 'zelle' },
  })

  useEffect(() => { if (defaultRefCode) setValue('ref_code', defaultRefCode) }, [defaultRefCode, setValue])
  useEffect(() => { setValue('payment_method', paymentMethod) }, [paymentMethod, setValue])

  const handleTermsAccept = (sig: string) => {
    setSignature(sig)
    setTermsAccepted(true)
    setValue('agreed_terms', true)
    setTermsOpen(false)
  }

  const onSubmit = async (data: FormValues) => {
    setSubmitError(null)
    if (!signature || !termsAccepted) { setSubmitError('Please review and sign the Terms & Conditions.'); return }
    if (data.payment_method === 'zelle' && !receiptFile) { setSubmitError('Please upload your Zelle receipt.'); return }
    setSubmitting(true)
    try {
      const payload = { ...data, signature_data: signature, preferred_ticket_number: selectedTicket ?? undefined }
      const res = await fetch('/api/purchase/intent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) { const e = await res.json() as { error?: string }; throw new Error(e.error ?? 'Failed') }
      const result = await res.json() as { stripe_client_secret?: string; payment_id?: string }

      if (data.payment_method === 'zelle' && receiptFile && result.payment_id) {
        const fd = new FormData()
        fd.append('receipt', receiptFile)
        fd.append('payment_id', result.payment_id)
        const uploadRes = await fetch('/api/purchase/zelle-upload', { method: 'POST', body: fd })
        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json() as { error?: string }
          throw new Error(uploadErr.error ?? 'Failed to upload receipt. Please try again.')
        }
      }
      if (data.payment_method === 'stripe' && result.stripe_client_secret) {
        sessionStorage.setItem('stripe_cs', result.stripe_client_secret)
        window.location.href = `/checkout?payment_id=${result.payment_id ?? ''}`
        return
      }
      // Push contact event to Highlead.us browser tracker
      try {
        const lcTracking = ((window as unknown) as Record<string, unknown>)._lcTracking as { tracker?: { submitForm?: (d: unknown) => void } } | undefined
        lcTracking?.tracker?.submitForm?.({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
        })
      } catch { /* non-fatal */ }

      setSubmitSuccess(true)
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="text-center py-16 px-4">
        <div className="text-6xl mb-6">🏆</div>
        <h3
          className="font-black uppercase text-[var(--gold)] mb-4"
          style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}
        >
          You&apos;re In!
        </h3>
        <p className="text-white/60 max-w-md mx-auto leading-relaxed">
          We received your submission. Your membership number will be assigned once your Zelle payment is verified (within 24h). Check your email for confirmation.
        </p>
      </div>
    )
  }

  return (
    <>
      <TermsModal
        isOpen={termsOpen}
        onAccept={handleTermsAccept}
        onClose={() => setTermsOpen(false)}
      />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5" id="buy-form-fields">
        {/* Selected ticket badge */}
        {selectedTicket && (
          <div
            className="flex items-center justify-between border border-[var(--gold)] px-5 py-4"
            style={{ background: 'rgba(212,175,55,0.07)' }}
          >
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[var(--gold)] font-bold">Your Ticket</p>
              <p className="font-black text-white text-xl" style={{ fontFamily: 'var(--font-dm-mono)' }}>
                #{String(selectedTicket).padStart(3, '0')}
              </p>
            </div>
            <div className="text-xs text-white/30 text-right">
              <p>Reserved</p>
              <p>15 min hold</p>
            </div>
          </div>
        )}
        {/* Names */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name" error={errors.first_name?.message} required>
            <input {...register('first_name')} placeholder="John" className={inp} />
          </Field>
          <Field label="Last Name" error={errors.last_name?.message} required>
            <input {...register('last_name')} placeholder="Doe" className={inp} />
          </Field>
        </div>

        {/* Email */}
        <Field label="Email" error={errors.email?.message} required>
          <input {...register('email')} type="email" placeholder="john@email.com" className={inp} />
        </Field>

        {/* Phone */}
        <Field label="Phone" error={errors.phone?.message} required>
          <input {...register('phone')} type="tel" placeholder="+1 (555) 000-0000" className={inp} />
        </Field>

        {/* Referral — optional/secondary */}
        <div>
          <label className={lbl + ' mb-1.5 block'}>
            Referral Code <span className="text-white/25 normal-case font-normal tracking-normal text-[10px]">(optional)</span>
          </label>
          <input {...register('ref_code')} placeholder="Auto-filled from invite link" className={inp + ' text-sm opacity-75'} />
        </div>

        {/* Payment toggle */}
        <div>
          <p className={lbl}>Payment Method</p>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {(['zelle', 'stripe'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPaymentMethod(m)}
                className={[
                  'py-4 border-2 text-sm font-black uppercase tracking-widest transition-all duration-150',
                  paymentMethod === m
                    ? 'border-[var(--gold)] bg-[rgba(212,175,55,0.15)] text-[var(--gold)]'
                    : 'border-[var(--black-border)] text-white/40 hover:border-[var(--gold-dark)]',
                ].join(' ')}
              >
                {m === 'zelle' ? '⚡ Zelle' : '💳 Card'}
              </button>
            ))}
          </div>
          <input type="hidden" {...register('payment_method')} />
        </div>

        {/* Zelle box */}
        {paymentMethod === 'zelle' && (
          <div className="border-2 border-[var(--gold)] bg-[var(--black-card)] p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-[var(--gold)]" />
              <p className="text-[var(--gold)] font-black uppercase tracking-widest text-sm">Send $500 via Zelle to Join</p>
            </div>
            <div className="space-y-2 font-mono text-sm">
              <p className="flex items-center gap-3">
                <span className="text-white/35 uppercase text-[10px] tracking-widest w-12 shrink-0">Email</span>
                <span className="text-[var(--gold)] font-bold">Goldenvalleymembers@gmail.com</span>
              </p>
              <p className="flex items-center gap-3">
                <span className="text-white/35 uppercase text-[10px] tracking-widest w-12 shrink-0">Name</span>
                <span className="text-white font-bold">Golden Valley Members LLC</span>
              </p>
              <p className="flex items-center gap-3">
                <span className="text-white/35 uppercase text-[10px] tracking-widest w-12 shrink-0">Memo</span>
                <span className="text-white font-bold">Your full name</span>
              </p>
            </div>
            <div className="bg-[var(--gold)]/10 border border-[var(--gold)]/40 p-3 text-xs text-[var(--gold)] font-bold uppercase tracking-wider">
              ⚠️ Ticket number assigned ONLY after payment is manually verified (up to 24h)
            </div>
            <div>
              <p className={lbl + ' mb-2'}>Upload Zelle Receipt *</p>
              <FileUpload onFile={setReceiptFile} accept="image/*" maxSizeMB={10} label="Drag & drop or click to upload" />
            </div>
          </div>
        )}

        {/* Terms & Conditions — modal trigger */}
        <div className="border border-[var(--black-border)] bg-[var(--black-card)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={lbl}>Terms &amp; Conditions</p>
              <p className="text-white/40 text-xs mt-1 leading-relaxed">
                You must read and sign the full terms before submitting. Click the button to open the agreement.
              </p>
            </div>
            {termsAccepted && (
              <div className="shrink-0 flex items-center gap-1.5 text-[var(--gold)] text-[10px] font-black uppercase tracking-wider">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Signed
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setTermsOpen(true)}
            className={[
              'mt-4 w-full py-3 text-sm font-black uppercase tracking-widest transition-all border-2',
              termsAccepted
                ? 'border-[var(--gold)] text-[var(--gold)] bg-[rgba(212,175,55,0.08)]'
                : 'border-white/20 text-white/60 hover:border-white/40',
            ].join(' ')}
          >
            {termsAccepted ? '✓ Terms Accepted & Signed — Click to Review Again' : 'Read & Sign Terms & Conditions →'}
          </button>

          <input type="hidden" {...register('agreed_terms')} />
          {errors.agreed_terms && (
            <p className="text-[10px] text-[#FF4E00] font-bold uppercase tracking-wider mt-2">{errors.agreed_terms.message}</p>
          )}
        </div>

        {/* Age confirmation checkbox */}
        <div>
          <label htmlFor="agreed_age" className="flex items-start gap-3 cursor-pointer group">
            <input id="agreed_age" type="checkbox" {...register('agreed_age')} className="mt-0.5 w-4 h-4 accent-[var(--gold)] shrink-0" />
            <span className="text-sm text-white/50 group-hover:text-white/75 transition-colors">I confirm I am 18 years of age or older</span>
          </label>
          {errors.agreed_age && <p className="text-[10px] text-[#FF4E00] font-bold uppercase tracking-wider mt-1 ml-7">{errors.agreed_age.message}</p>}
        </div>

        {submitError && (
          <div className="bg-red-950/50 border border-red-800 p-4 text-sm text-red-300 font-medium">
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-5 font-black uppercase tracking-widest text-white text-lg transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-3"
          style={{ background: '#8FFF3A', color: '#0B0B0B', boxShadow: '0 0 25px rgba(143,255,58,0.35)' }}
        >
          {submitting ? <><GoldSpinner size={20} /> Processing...</> : `CLAIM MY MEMBERSHIP — $${TICKET_PRICE}`}
        </button>

        <p className="text-white/25 text-xs text-center uppercase tracking-widest">
          🔒 SSL Encrypted · Your information is never sold or shared
        </p>
      </form>
    </>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [available, setAvailable] = useState<number | null>(null)
  const [tickets, setTickets] = useState<TicketGridItem[]>([])
  const [showPromo, setShowPromo] = useState(false)

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch('/api/tickets/available')
        if (!res.ok) throw new Error()
        const data = await res.json() as TicketGridItem[]
        setTickets(data)
        setAvailable(data.filter((t) => t.status === 'available').length)
      } catch {
        // Demo: simulate 990 sold memberships scattered randomly (seeded so consistent)
        const sold = new Set<number>()
        let s = 0xdeadbeef
        const rand = () => { s = Math.imul(s ^ (s >>> 13), 0x45d9f3b); s ^= s >>> 7; return (s >>> 0) / 0xffffffff }
        while (sold.size < 990) sold.add(Math.floor(rand() * 1000) + 1)
        const grid: TicketGridItem[] = Array.from({ length: 1000 }, (_, i) => ({
          number: i + 1,
          status: sold.has(i + 1) ? 'active' as const : 'available' as const,
        }))
        setTickets(grid)
        setAvailable(grid.filter((t) => t.status === 'available').length)
      }
    }
    fetchTickets()
  }, [])

  // Show promo popup after 3 seconds (only once per session)
  useEffect(() => {
    if (sessionStorage.getItem('promoSeen')) return
    const id = setTimeout(() => {
      setShowPromo(true)
      sessionStorage.setItem('promoSeen', '1')
    }, 8000)
    return () => clearTimeout(id)
  }, [])

  return (
    <div className="bg-[#0B0B0B]">
      <UrgencyBanner available={available} />
      <div className="h-7" />
      <SiteHeader />

      <Hero available={available} />

      {/* Number picker — selecting a number redirects to register */}
      <section id="buy-form" className="py-14 sm:py-20 px-4 relative" style={{ background: '#0B0B0B', borderTop: '3px solid #82BF35' }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <h2
              className="font-black uppercase text-white mb-2"
              style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.8rem, 5vw, 3rem)' }}
            >
              Choose Your Number
            </h2>
            <p className="text-white/40 text-sm uppercase tracking-widest">
              {available !== null ? available : '…'} spots remaining · pick your lucky number
            </p>
          </div>

          <div className="border border-[var(--black-border)] bg-[var(--black-card)] p-5 sm:p-8 mb-5">
            <TicketPicker tickets={tickets} />
          </div>

          <div className="text-center">
            <p className="text-white/30 text-xs mb-3 uppercase tracking-widest">Don't want to pick? We'll assign one for you</p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 font-black uppercase tracking-widest text-black text-sm px-8 py-4 hover:brightness-110 transition-all"
              style={{ background: 'linear-gradient(135deg, #A68B28, #D4AF37, #E8CC7A, #D4AF37)' }}
            >
              Register &amp; Get Started →
            </Link>
          </div>
        </div>
      </section>

      {/* More info below — prizes, how it works, ticket board */}
      <TrustStrip />
      <LotterySection />
      <PrizesSection />
      <HowItWorks />
      {tickets.length > 0 && <TeaserGrid tickets={tickets} />}

      {/* Pre-footer CTA */}
      <section className="py-14 sm:py-16 px-4 text-center" style={{ background: 'radial-gradient(ellipse at center, #1a0000 0%, #0B0B0B 70%)' }}>
        <p className="text-white/40 text-[10px] sm:text-xs uppercase tracking-[0.4em] font-bold mb-3">Don&apos;t Miss Your Spot</p>
        <h2
          className="font-black uppercase text-white mb-2"
          style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.8rem, 5vw, 3rem)' }}
        >
          <span style={{ fontFamily: 'var(--font-dm-mono)', color: '#8FFF3A' }}>{available ?? 1000}</span> Memberships Left
        </h2>
        <p className="text-white/40 mb-8 max-w-md mx-auto text-sm leading-relaxed">
          The grand prize is revealed the moment membership #1,000 is confirmed. Spots are strictly limited.
        </p>
        <button
          onClick={() => document.getElementById('buy-form')?.scrollIntoView({ behavior: 'smooth' })}
          className="w-full sm:w-auto font-black uppercase tracking-widest text-white px-10 sm:px-12 py-4 sm:py-5 text-base transition-all hover:brightness-110 active:scale-95"
          style={{ background: '#8FFF3A', color: '#0B0B0B', boxShadow: '0 0 30px rgba(143,255,58,0.35)' }}
        >
          GET MY MEMBERSHIP →
        </button>
      </section>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inp = [
  'w-full bg-[var(--black)] border border-[var(--black-border)] px-4 py-3 text-sm text-white',
  'placeholder-white/25 focus:outline-none focus:border-[var(--gold)] transition-colors',
].join(' ')

const lbl = 'block text-[10px] text-white/40 uppercase tracking-widest font-bold'

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={lbl}>
        {label}
        {required && <span className="text-[var(--gold)] ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-[10px] text-[#FF4E00] font-bold uppercase tracking-wider">{error}</p>}
    </div>
  )
}
