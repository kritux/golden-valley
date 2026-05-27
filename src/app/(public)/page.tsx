'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { GoldSpinner } from '@/components/ui/gold-button'
import { SignatureCanvasComponent } from '@/components/ui/signature-canvas'
import { FileUpload } from '@/components/ui/file-upload'
import type { TicketGridItem } from '@/types'

// ─── Schema ───────────────────────────────────────────────────────────────────

const purchaseSchema = z
  .object({
    first_name: z.string().min(1, 'Required'),
    last_name: z.string().min(1, 'Required'),
    email: z.string().email('Invalid email'),
    email_confirm: z.string().email('Invalid email'),
    phone: z.string().min(10, 'Enter a valid phone number'),
    phone_alt: z.string().optional(),
    city: z.string().min(1, 'Required'),
    state: z.string().min(1, 'Required'),
    nationality: z.string().min(1, 'Required'),
    gender: z.enum(['male', 'female', 'other', 'prefer_not'], { errorMap: () => ({ message: 'Required' }) }),
    ref_code: z.string().optional(),
    payment_method: z.enum(['zelle', 'stripe']),
    agreed_accuracy: z.literal(true, { errorMap: () => ({ message: 'Required' }) }),
    agreed_age: z.literal(true, { errorMap: () => ({ message: 'Must be 18+' }) }),
    agreed_terms: z.literal(true, { errorMap: () => ({ message: 'Must accept terms' }) }),
  })
  .refine((d) => d.email === d.email_confirm, {
    message: 'Emails do not match',
    path: ['email_confirm'],
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
    if (!isOpen) {
      setScrolledToBottom(false)
      setSignature('')
    }
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
            style={{ background: scrolledToBottom && signature ? 'linear-gradient(135deg, #8B6914, #C9A84C, #E8CC7A)' : '#333' }}
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
      className="sticky top-[52px] sm:top-9 z-40 w-full transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(10,10,10,0.97)' : 'rgba(10,10,10,0.75)',
        borderBottom: '1px solid rgba(201,168,76,0.12)',
        backdropFilter: 'blur(14px)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 flex items-center justify-center font-black text-xs tracking-widest text-black shrink-0"
            style={{ background: 'linear-gradient(135deg, #8B6914, #C9A84C, #E8CC7A)' }}
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
            { label: 'Ticket Board', href: '/tickets' },
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
            style={{ background: 'linear-gradient(135deg, #8B6914, #C9A84C, #E8CC7A)' }}
          >
            Buy Ticket
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
            { label: 'Buy Ticket — $500', action: () => scrollTo('buy-form'), gold: true },
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
  const time = useCountdown(DRAW_DATE)
  const { days, hours, minutes, seconds } = time ?? { days: 0, hours: 0, minutes: 0, seconds: 0 }
  const sold = available !== null ? 1000 - available : 0
  const pct = Math.min(100, (sold / 1000) * 100)

  return (
    <div className="fixed top-0 left-0 right-0 z-50 text-black text-xs font-bold uppercase tracking-wider" style={{ background: 'linear-gradient(90deg, #8B6914, #D4AF37, #F0D060, #D4AF37, #8B6914)', backgroundSize: '200% auto', animation: 'shimmer 3s linear infinite' }}>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-6 py-2 px-4 text-center">
        <span className="flex items-center gap-2 font-black">
          🔥 $1,000/DAY × 90 DAYS STARTS IN
        </span>
        <span className="hidden sm:block opacity-50">|</span>
        <span className="font-black tabular-nums">
          {days}d {String(hours).padStart(2, '0')}h {String(minutes).padStart(2, '0')}m {String(seconds).padStart(2, '0')}s
        </span>
        <span className="hidden sm:block opacity-50">|</span>
        <span>
          <span className="font-black">{available !== null ? available : '…'}</span> TICKETS LEFT
        </span>
      </div>
      <div className="h-0.5 bg-black/30">
        <div className="h-full bg-white transition-all duration-1000" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ─── HERO ─────────────────────────────────────────────────────────────────────

function Hero({ available }: { available: number | null }) {
  const time = useCountdown(DRAW_DATE)
  const { days, hours, minutes, seconds } = time ?? { days: 0, hours: 0, minutes: 0, seconds: 0 }
  const sold = available !== null ? 1000 - available : 0

  return (
    <section
      id="about"
      className="relative min-h-[92vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden"
      style={{
        backgroundImage: 'url(/assets/4runner-hero.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center 40%',
      }}
    >
      {/* Dark gradient overlay so text stays readable */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(10,8,0,0.82) 60%, #0A0A0A 100%)' }} />
      <div className="absolute inset-0 bg-gold-pattern opacity-10 pointer-events-none" />

      <div className="relative z-10 max-w-4xl w-full">
        <p className="inline-flex items-center gap-2 border border-[var(--gold)] border-opacity-50 text-[var(--gold)] text-[10px] font-black uppercase tracking-[0.35em] px-5 py-2 mb-8">
          Season 1 — Now Open
        </p>

        <h1
          className="font-black uppercase leading-[0.9] mb-4 tracking-tight"
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: 'clamp(3rem, 10vw, 7.5rem)',
            background: 'linear-gradient(180deg, #E8CC7A 0%, #C9A84C 50%, #8B6914 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Golden Valley<br />Members Raffle
        </h1>

        <p className="text-white/55 text-base md:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
          1,000 exclusive tickets. One draw. Three prize tiers totaling over{' '}
          <span className="text-[var(--gold)] font-bold">$180,000</span> in cash and prizes.
          The draw happens when the last ticket is sold.
        </p>

        {/* Prize pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <div className="bg-[var(--black-card)] border border-[var(--gold)] border-opacity-60 px-4 py-2.5 text-center">
            <div className="text-[var(--gold)] font-black text-[10px] uppercase tracking-wider">1st Prize</div>
            <div className="text-white font-black text-sm mt-0.5">4Runner Trailhunter 2026</div>
            <div className="text-white/40 text-[10px] mt-0.5">or $70,000 cash</div>
          </div>
          <div className="bg-[var(--black-card)] border border-[var(--black-border)] px-4 py-2.5 text-center">
            <div className="text-white/50 font-black text-[10px] uppercase tracking-wider">2nd Prize</div>
            <div className="text-white font-black text-sm mt-0.5" style={{ fontFamily: 'var(--font-dm-mono)' }}>$20,000</div>
            <div className="text-white/40 text-[10px] mt-0.5">Cash</div>
          </div>
          <div className="px-4 py-2.5 text-center" style={{ background: 'linear-gradient(135deg, #8B6914, #D4AF37)' }}>
            <div className="text-black/70 font-black text-[10px] uppercase tracking-wider">Daily Prize</div>
            <div className="text-black font-black text-sm mt-0.5" style={{ fontFamily: 'var(--font-dm-mono)' }}>$1,000 × 90 Days</div>
            <div className="text-black/60 text-[10px] mt-0.5">Starts Jul 31</div>
          </div>
        </div>

        {/* Countdown — $1K/day start */}
        <p className="text-white/30 text-[10px] uppercase tracking-[0.3em] mb-3">
          ⏱ Daily $1,000 giveaway begins in:
        </p>
        <div className="flex items-center justify-center gap-3 md:gap-5 mb-10">
          {[
            { val: days, label: 'Days' },
            { val: hours, label: 'Hrs' },
            { val: minutes, label: 'Min' },
            { val: seconds, label: 'Sec' },
          ].map(({ val, label }) => (
            <div key={label} className="flex flex-col items-center">
              <div
                className="bg-[var(--black-card)] border border-[var(--gold)] border-opacity-60 text-[var(--gold)] font-black tabular-nums flex items-center justify-center"
                style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: 'clamp(1.4rem, 4.5vw, 2.8rem)',
                  width: 'clamp(56px, 11vw, 92px)',
                  height: 'clamp(56px, 11vw, 92px)',
                }}
              >
                {String(val).padStart(2, '0')}
              </div>
              <span className="text-white/35 text-[10px] uppercase tracking-widest mt-1">{label}</span>
            </div>
          ))}
        </div>

        {/* Ticket progress bar */}
        <div className="w-full max-w-xl mx-auto mb-10">
          <div className="flex justify-between items-end mb-2">
            <span className="text-white/40 text-[10px] uppercase tracking-widest">Tickets Sold</span>
            <span className="font-black tabular-nums" style={{ fontFamily: 'var(--font-dm-mono)', color: 'var(--gold)', fontSize: 'clamp(1rem, 3vw, 1.4rem)' }}>
              {sold} <span className="text-white/30 text-xs font-normal">/ 1,000</span>
            </span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${Math.max(2, (sold / 1000) * 100)}%`,
                background: 'linear-gradient(90deg, #8B6914, #D4AF37, #F0D060)',
                boxShadow: '0 0 12px rgba(212,175,55,0.6)',
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-white/25 text-[9px] uppercase tracking-widest">0</span>
            <span className="text-white/40 text-[10px] font-bold">
              {available !== null ? available : <GoldSpinner size={12} />} remaining
            </span>
            <span className="text-white/25 text-[9px] uppercase tracking-widest">1,000</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => document.getElementById('buy-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="font-black uppercase tracking-widest text-black px-10 py-4 text-base transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #8B6914, #C9A84C, #E8CC7A, #C9A84C)',
              backgroundSize: '200% auto',
              animation: 'shimmer 2s linear infinite',
            }}
          >
            Get Your Ticket — $500
          </button>
          <button
            onClick={() => document.getElementById('prizes')?.scrollIntoView({ behavior: 'smooth' })}
            className="font-black uppercase tracking-widest text-white/60 px-10 py-4 text-base border border-white/20 hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors"
          >
            View All Prizes
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none" />
    </section>
  )
}

// ─── TRUST STRIP ──────────────────────────────────────────────────────────────

function TrustStrip() {
  return (
    <div className="bg-[var(--gold)] py-3.5 px-4 overflow-hidden">
      <div className="flex items-center justify-center gap-6 md:gap-14 flex-wrap text-black text-[11px] font-black uppercase tracking-widest">
        <span>🔒 Secure Payment</span>
        <span>✅ Official Rules</span>
        <span>📧 Instant Confirmation</span>
        <span>🎯 Only 1,000 Entries</span>
        <span>🏆 $180K+ in Prizes</span>
      </div>
    </div>
  )
}

// ─── PRIZES SECTION ───────────────────────────────────────────────────────────

function PrizesSection() {
  return (
    <section id="prizes" className="bg-[#0A0A0A] py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-px flex-1 bg-[var(--gold)] opacity-30" />
          <span className="text-[var(--gold)] text-xs uppercase tracking-[0.4em] font-bold whitespace-nowrap">Prize Structure</span>
          <div className="h-px flex-1 bg-[var(--gold)] opacity-30" />
        </div>
        <div className="text-center mb-12">
          <h2
            className="font-black uppercase text-white leading-tight"
            style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            Three Ways to Win
          </h2>
          <p className="text-white/40 mt-3 text-sm max-w-md mx-auto">
            One draw. Three prize tiers. Over $180,000 in total value.
          </p>
        </div>

        {/* Prize cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
          {/* 1st Prize */}
          <div className="md:col-span-3 border border-[var(--gold)] bg-[var(--black-card)] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Image */}
              <div className="relative min-h-[320px] lg:min-h-[400px] overflow-hidden">
                <div className="absolute top-4 left-4 z-10 bg-[var(--gold)] text-black text-[10px] font-black uppercase tracking-widest px-3 py-1.5">
                  1st Prize
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/4runner-golden-gate.png"
                  alt="2026 Toyota 4Runner Trailhunter at the Golden Gate Bridge"
                  className="w-full h-full object-cover object-center"
                  style={{ minHeight: 320 }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--black-card)]/60 pointer-events-none hidden lg:block" />
              </div>

              {/* Info */}
              <div className="p-8 lg:p-12 flex flex-col justify-center gap-5">
                <div>
                  <p className="text-[var(--gold)] text-[10px] font-black uppercase tracking-[0.3em] mb-2">Grand Prize — Winner&apos;s Choice</p>
                  <h3
                    className="font-black uppercase text-white leading-tight"
                    style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)' }}
                  >
                    2026 Toyota<br />4Runner Trailhunter
                  </h3>
                  <p className="text-white/40 text-sm mt-2">Special Edition · Off-Road Ready</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Engine', val: '2.4L Turbo-4 · 278 HP' },
                    { label: 'Drive', val: '4WD with Crawl Control' },
                    { label: 'Edition', val: 'Trailhunter Special' },
                    { label: 'Retail Value', val: '~$70,000 USD' },
                  ].map(({ label, val }) => (
                    <div key={label} className="bg-[var(--black)] border border-[var(--black-border)] p-3">
                      <p className="text-white/35 text-[9px] uppercase tracking-wider mb-0.5">{label}</p>
                      <p className="text-white font-bold text-xs" style={{ fontFamily: 'var(--font-dm-mono)' }}>{val}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4 pt-2 border-t border-[var(--black-border)]">
                  <div className="text-center">
                    <p className="text-white/35 text-[9px] uppercase tracking-wider">Vehicle Value</p>
                    <p className="text-[var(--gold)] font-black text-xl" style={{ fontFamily: 'var(--font-dm-mono)' }}>~$70K</p>
                  </div>
                  <div className="text-white/20 text-lg font-thin">or</div>
                  <div className="text-center">
                    <p className="text-white/35 text-[9px] uppercase tracking-wider">Cash Alternative</p>
                    <p className="text-white font-black text-xl" style={{ fontFamily: 'var(--font-dm-mono)' }}>$70,000</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2nd Prize */}
          <div className="bg-[var(--black-card)] border border-[var(--black-border)] p-8 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="bg-white/10 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1">
                2nd Prize
              </div>
              <span className="text-4xl opacity-60">💵</span>
            </div>
            <div>
              <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Cash Prize</p>
              <p className="font-black text-white text-4xl" style={{ fontFamily: 'var(--font-dm-mono)' }}>$20,000</p>
            </div>
            <p className="text-white/40 text-sm leading-relaxed flex-1">
              A second ticket number is drawn. That holder receives twenty thousand dollars cash, wired directly to their account.
            </p>
            <div className="h-px bg-[var(--black-border)]" />
            <div className="text-[10px] uppercase tracking-wider text-white/25">Awarded to 2nd drawn ticket</div>
          </div>

          {/* 3rd — Daily */}
          <div className="md:col-span-2 bg-[#FF4E00] p-8 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="bg-black/20 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1">
                Daily Giveaway
              </div>
              <span className="text-4xl">📅</span>
            </div>
            <div>
              <p className="text-white/70 text-xs uppercase tracking-widest mb-1">Starting Jul 31, 2026</p>
              <p className="font-black text-white leading-none" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
                $1,000<span className="text-white/70 text-2xl">/day</span>
              </p>
              <p className="text-white/80 text-base font-bold mt-1">for 90 consecutive days</p>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              When the countdown hits zero, we start giving away $1,000 every single day for 90 days.
              Total daily prize pool: <span className="font-black text-white">$90,000</span>.
            </p>
            <div className="flex items-center gap-3 mt-auto">
              <div className="bg-black/20 px-4 py-2 text-center">
                <p className="text-white/60 text-[9px] uppercase tracking-wider">Duration</p>
                <p className="text-white font-black text-sm">90 Days</p>
              </div>
              <div className="bg-black/20 px-4 py-2 text-center">
                <p className="text-white/60 text-[9px] uppercase tracking-wider">Daily Amount</p>
                <p className="text-white font-black text-sm">$1,000</p>
              </div>
              <div className="bg-black/20 px-4 py-2 text-center">
                <p className="text-white/60 text-[9px] uppercase tracking-wider">Total Pool</p>
                <p className="text-white font-black text-sm">$90,000</p>
              </div>
            </div>
          </div>
        </div>

        {/* Total value bar */}
        <div className="border border-[var(--black-border)] bg-[var(--black-card)] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white/35 text-[10px] uppercase tracking-widest">Total Prize Value Across All Tiers</p>
            <p className="text-[var(--gold)] font-black mt-1" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
              $180,000+
            </p>
          </div>
          <button
            onClick={() => document.getElementById('buy-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="font-black uppercase tracking-widest text-black px-8 py-4 text-sm transition-all hover:opacity-90 shrink-0"
            style={{ background: 'linear-gradient(135deg, #8B6914, #C9A84C, #E8CC7A)' }}
          >
            Enter for $500 →
          </button>
        </div>
      </div>
    </section>
  )
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-4" style={{ background: '#0d0d0d' }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-px flex-1 bg-[var(--gold)] opacity-30" />
          <span className="text-[var(--gold)] text-xs uppercase tracking-[0.4em] font-bold whitespace-nowrap">How It Works</span>
          <div className="h-px flex-1 bg-[var(--gold)] opacity-30" />
        </div>
        <div className="text-center mb-12">
          <h2
            className="font-black uppercase text-white"
            style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            Simple. Transparent. Fair.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--black-border)]">
          {[
            {
              num: '01', icon: '💳',
              title: 'Purchase Your Ticket',
              body: 'Pay $500 securely via Zelle or credit card. Each ticket is numbered #1–1,000 and assigned only after payment is confirmed.',
              accent: '#C9A84C',
            },
            {
              num: '02', icon: '🎫',
              title: 'Get Your Number',
              body: 'Your sequential ticket number is yours permanently. It appears on the live ticket board and is your entry into all prize draws.',
              accent: '#FF4E00',
            },
            {
              num: '03', icon: '🏆',
              title: 'Win When #1,000 Sells',
              body: 'The moment ticket #1,000 is confirmed, the draw happens live. Two winners are drawn — one for the 4Runner, one for $20,000.',
              accent: '#C9A84C',
            },
          ].map((step) => (
            <div
              key={step.num}
              className="bg-[var(--black-card)] p-8 md:p-10 flex flex-col gap-4 group hover:bg-[#151515] transition-colors"
            >
              <div className="flex items-start justify-between">
                <span className="text-4xl">{step.icon}</span>
                <span
                  className="font-black text-5xl opacity-15 leading-none group-hover:opacity-25 transition-opacity"
                  style={{ fontFamily: 'var(--font-dm-mono)', color: step.accent }}
                >
                  {step.num}
                </span>
              </div>
              <div className="h-0.5 w-10 transition-all duration-300 group-hover:w-full" style={{ background: step.accent }} />
              <h3 className="text-white font-black uppercase tracking-wide text-base">{step.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 p-6 border border-[var(--black-border)] bg-[var(--black-card)] flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-1 h-12 bg-[var(--gold)] shrink-0" />
          <div>
            <p className="text-[var(--gold)] text-xs font-black uppercase tracking-wider mb-1">Important Note</p>
            <p className="text-white/50 text-sm leading-relaxed">
              Ticket numbers are assigned on a first-confirmed basis — not first-paid. Zelle payments require manual admin verification (up to 24h). Card payments via Stripe are confirmed instantly.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── WINNERS SECTION (homepage preview) ───────────────────────────────────────

function WinnersSection() {
  return (
    <section id="winners" className="py-20 px-4 bg-[#0A0A0A]">
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
                style={{ width: '0%', background: 'linear-gradient(90deg, #8B6914, #C9A84C, #E8CC7A)' }}
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
  const first100 = tickets.slice(0, 100)
  const available = tickets.filter((t) => t.status === 'available').length
  const sold = 1000 - available

  return (
    <section className="bg-[#0A0A0A] py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-px flex-1 bg-[var(--gold)] opacity-30" />
          <span className="text-[var(--gold)] text-xs uppercase tracking-[0.4em] font-bold whitespace-nowrap">Live Ticket Board</span>
          <div className="h-px flex-1 bg-[var(--gold)] opacity-30" />
        </div>

        <div className="flex items-center justify-center gap-6 mb-6 text-center">
          <div>
            <div className="text-[var(--gold)] font-black text-2xl" style={{ fontFamily: 'var(--font-dm-mono)' }}>{sold}</div>
            <div className="text-white/35 text-[10px] uppercase tracking-widest">Sold</div>
          </div>
          <div className="flex-1 max-w-xs">
            <div className="h-2 bg-[var(--black-border)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${(sold / 1000) * 100}%`, background: 'linear-gradient(90deg, #8B6914, #C9A84C, #E8CC7A)' }}
              />
            </div>
            <div className="text-white/25 text-[10px] text-center mt-1">{sold}/1,000 SOLD</div>
          </div>
          <div>
            <div className="text-white font-black text-2xl" style={{ fontFamily: 'var(--font-dm-mono)' }}>{available}</div>
            <div className="text-white/35 text-[10px] uppercase tracking-widest">Left</div>
          </div>
        </div>

        <div className="flex gap-4 justify-center text-[10px] uppercase tracking-wider mb-5 text-white/35 font-bold">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[var(--gold)] rounded-sm inline-block" />Available</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#1a1a1a] border border-[#333] rounded-sm inline-block" />Sold</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 border border-[var(--gold)] rounded-sm inline-block animate-pulse" />Pending</span>
        </div>

        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}>
          {first100.map((t) => (
            <div
              key={t.number}
              title={`#${t.number}`}
              onClick={() => t.status === 'available' && document.getElementById('buy-form')?.scrollIntoView({ behavior: 'smooth' })}
              className={[
                'aspect-square flex items-center justify-center text-[9px] md:text-[11px] font-bold transition-all rounded-sm',
                ticketColor(t.status),
              ].join(' ')}
              style={{ fontFamily: 'var(--font-dm-mono)' }}
            >
              {t.number}
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

// ─── BUY FORM ─────────────────────────────────────────────────────────────────

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
    <section id="check-winner" className="py-20 px-4" style={{ background: 'radial-gradient(ellipse at center, #0f0c00 0%, #0A0A0A 70%)' }}>
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
              style={{ background: 'linear-gradient(135deg, #8B6914, #D4AF37, #F0D060, #D4AF37)' }}
            >
              Check
            </button>
          </div>

          {/* Result */}
          {result === 'pending' && (
            <div className="border border-[var(--gold)]/40 bg-[var(--gold)]/5 p-5 text-center">
              <div className="text-3xl mb-2">⏳</div>
              <p className="text-[var(--gold)] font-black uppercase tracking-wider text-sm">Draw Not Yet Held</p>
              <p className="text-white/40 text-xs mt-1">Check back when ticket #999 is confirmed sold.</p>
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
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--black-card)] border-2 border-[var(--gold)] max-w-sm w-full p-8 text-center shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-white/40 hover:text-white text-2xl font-light leading-none"
          aria-label="Close"
        >
          ×
        </button>

        <div className="w-14 h-14 mx-auto mb-5 flex items-center justify-center rounded-full" style={{ background: 'linear-gradient(135deg, #8B6914, #D4AF37)' }}>
          <span className="text-black font-black text-2xl">$</span>
        </div>

        <p className="text-[var(--gold)] text-[10px] font-black uppercase tracking-[0.35em] mb-2">Daily Giveaway</p>
        <h2 className="font-black uppercase text-white leading-tight mb-3" style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.4rem, 5vw, 1.9rem)' }}>
          Don&apos;t Miss Out on<br /><span style={{ color: 'var(--gold)' }}>$1,000 Every Day</span>
        </h2>
        <p className="text-white/50 text-sm mb-6 leading-relaxed">
          Join 1,000 exclusive members for a chance to win a <strong className="text-white">2026 Toyota 4Runner Trailhunter</strong> or $70,000 cash — plus a daily $1,000 giveaway for 90 days.
        </p>

        <a
          href="/#buy-form"
          onClick={onClose}
          className="flex items-center justify-center w-full py-4 font-black uppercase tracking-widest text-black text-sm mb-3 transition-transform hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #8B6914, #D4AF37, #F0D060, #D4AF37)' }}
        >
          Get My Ticket — $500
        </a>

        <a
          href={WA_GROUP}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2.5 w-full py-3 border-2 border-[#25D366] text-[#25D366] font-black uppercase tracking-widest text-xs hover:bg-[#25D366]/10 transition-colors"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Undecided? Join Our WhatsApp Group
        </a>
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

function BuyForm() {
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
      const payload = { ...data, signature_data: signature }
      const res = await fetch('/api/purchase/intent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) { const e = await res.json() as { error?: string }; throw new Error(e.error ?? 'Failed') }
      const result = await res.json() as { stripe_client_secret?: string; payment_id?: string }

      if (data.payment_method === 'zelle' && receiptFile && result.payment_id) {
        const fd = new FormData()
        fd.append('receipt', receiptFile)
        fd.append('payment_id', result.payment_id)
        await fetch('/api/purchase/zelle-upload', { method: 'POST', body: fd })
      }
      if (data.payment_method === 'stripe' && result.stripe_client_secret) {
        window.location.href = `/checkout?secret=${result.stripe_client_secret}`
        return
      }
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
          We received your entry. Your ticket number will be assigned once your Zelle payment is verified (within 24h). Check your email for confirmation.
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

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {/* Names */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name" error={errors.first_name?.message} required>
            <input {...register('first_name')} placeholder="John" className={inp} />
          </Field>
          <Field label="Last Name" error={errors.last_name?.message} required>
            <input {...register('last_name')} placeholder="Doe" className={inp} />
          </Field>
        </div>

        {/* Emails */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Email" error={errors.email?.message} required>
            <input {...register('email')} type="email" placeholder="john@email.com" className={inp} />
          </Field>
          <Field label="Confirm Email" error={errors.email_confirm?.message} required>
            <input {...register('email_confirm')} type="email" placeholder="john@email.com" className={inp} />
          </Field>
        </div>

        {/* Phones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone" error={errors.phone?.message} required>
            <input {...register('phone')} type="tel" placeholder="+1 (555) 000-0000" className={inp} />
          </Field>
          <Field label="Phone (alternate)" error={undefined}>
            <input {...register('phone_alt')} type="tel" placeholder="Optional" className={inp} />
          </Field>
        </div>

        {/* City & State */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="City" error={errors.city?.message} required>
            <input {...register('city')} placeholder="Los Angeles" className={inp} />
          </Field>
          <Field label="State" error={errors.state?.message} required>
            <input {...register('state')} placeholder="California" className={inp} />
          </Field>
        </div>

        {/* Nationality */}
        <Field label="Nationality" error={errors.nationality?.message} required>
          <input {...register('nationality')} placeholder="American" className={inp} />
        </Field>

        {/* Gender */}
        <Field label="Gender" error={errors.gender?.message} required>
          <select {...register('gender')} className={inp} defaultValue="">
            <option value="" disabled>Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not">Prefer not to say</option>
          </select>
        </Field>

        {/* Referral */}
        <Field label="Referral Code" error={undefined}>
          <input {...register('ref_code')} placeholder="Auto-filled from invite link" className={inp} />
        </Field>

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
                    ? 'border-[var(--gold)] bg-[rgba(201,168,76,0.15)] text-[var(--gold)]'
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
              <p className="text-[var(--gold)] font-black uppercase tracking-widest text-sm">Send $500 via Zelle</p>
            </div>
            <div className="space-y-2 font-mono text-sm">
              <p className="flex items-center gap-3">
                <span className="text-white/35 uppercase text-[10px] tracking-widest w-12">Phone</span>
                <span className="text-white font-bold">{process.env.NEXT_PUBLIC_ZELLE_PHONE ?? '(see website)'}</span>
              </p>
              <p className="flex items-center gap-3">
                <span className="text-white/35 uppercase text-[10px] tracking-widest w-12">Name</span>
                <span className="text-white font-bold">Golden Valley Members LLC</span>
              </p>
              <p className="flex items-center gap-3">
                <span className="text-white/35 uppercase text-[10px] tracking-widest w-12">Memo</span>
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
                ? 'border-[var(--gold)] text-[var(--gold)] bg-[rgba(201,168,76,0.08)]'
                : 'border-white/20 text-white/60 hover:border-white/40',
            ].join(' ')}
          >
            {termsAccepted ? '✓ Terms Accepted & Signed — Click to Review Again' : 'Read & Sign Terms & Conditions →'}
          </button>

          <input type="hidden" {...register('agreed_terms')} value={termsAccepted ? 'true' : ''} />
          {errors.agreed_terms && (
            <p className="text-[10px] text-[#FF4E00] font-bold uppercase tracking-wider mt-2">{errors.agreed_terms.message}</p>
          )}
        </div>

        {/* Remaining checkboxes */}
        <div className="space-y-3">
          {[
            { id: 'agreed_accuracy', label: 'All information provided is accurate', reg: register('agreed_accuracy'), err: errors.agreed_accuracy?.message },
            { id: 'agreed_age', label: 'I am 18 years of age or older', reg: register('agreed_age'), err: errors.agreed_age?.message },
          ].map(({ id, label, reg, err }) => (
            <div key={id}>
              <label htmlFor={id} className="flex items-start gap-3 cursor-pointer group">
                <input id={id} type="checkbox" {...reg} className="mt-0.5 w-4 h-4 accent-[var(--gold)] shrink-0" />
                <span className="text-sm text-white/50 group-hover:text-white/75 transition-colors">{label}</span>
              </label>
              {err && <p className="text-[10px] text-[#FF4E00] font-bold uppercase tracking-wider mt-1 ml-7">{err}</p>}
            </div>
          ))}
        </div>

        {submitError && (
          <div className="bg-red-950/50 border border-red-800 p-4 text-sm text-red-300 font-medium">
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-5 font-black uppercase tracking-widest text-black text-lg transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-3"
          style={{ background: 'linear-gradient(135deg, #8B6914, #C9A84C, #E8CC7A, #C9A84C)', backgroundSize: '200% auto', animation: 'shimmer 2s linear infinite' }}
        >
          {submitting ? <><GoldSpinner size={20} /> Processing...</> : `Claim My Ticket — $${TICKET_PRICE}`}
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
        const grid: TicketGridItem[] = Array.from({ length: 1000 }, (_, i) => ({ number: i + 1, status: 'available' as const }))
        setTickets(grid)
        setAvailable(1000)
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
    }, 3000)
    return () => clearTimeout(id)
  }, [])

  return (
    <div className="bg-[#0A0A0A]">
      {showPromo && <WhatsAppPromo onClose={() => setShowPromo(false)} />}
      <FloatingWhatsApp />
      <UrgencyBanner available={available} />
      <div className="h-[52px] sm:h-[36px]" />
      <SiteHeader />

      <Hero available={available} />
      <TrustStrip />
      <PrizesSection />
      <HowItWorks />
      <WinnersSection />
      <CheckWinner />

      {/* Buy Ticket */}
      <section id="buy-form" className="py-20 px-4" style={{ background: '#0d0d0d' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-[var(--gold)] opacity-30" />
            <span className="text-[var(--gold)] text-xs uppercase tracking-[0.4em] font-bold whitespace-nowrap">
              Secure Your Entry
            </span>
            <div className="h-px flex-1 bg-[var(--gold)] opacity-30" />
          </div>
          <div className="text-center mb-10">
            <h2
              className="font-black uppercase text-white mb-2"
              style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.8rem, 5vw, 3rem)' }}
            >
              Get Your Ticket
            </h2>
            <p className="text-white/40 text-sm uppercase tracking-widest">
              {available !== null ? available : '…'} spots remaining
            </p>
          </div>
          <div className="border border-[var(--black-border)] bg-[var(--black-card)] p-6 md:p-10">
            <BuyForm />
          </div>
        </div>
      </section>

      {tickets.length > 0 && <TeaserGrid tickets={tickets} />}

      {/* Pre-footer CTA */}
      <section className="py-16 px-4 text-center" style={{ background: 'radial-gradient(ellipse at center, #1a1200 0%, #0A0A0A 70%)' }}>
        <p className="text-[var(--gold)] text-xs uppercase tracking-[0.4em] font-bold mb-3">Don&apos;t Miss Out</p>
        <h2
          className="font-black uppercase text-white mb-4"
          style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.8rem, 5vw, 3rem)' }}
        >
          {available !== null ? available : '…'} Tickets Remaining
        </h2>
        <p className="text-white/40 mb-8 max-w-md mx-auto text-sm leading-relaxed">
          Once all 1,000 tickets are sold, the draw happens instantly. Make sure yours is one of them.
        </p>
        <button
          onClick={() => document.getElementById('buy-form')?.scrollIntoView({ behavior: 'smooth' })}
          className="font-black uppercase tracking-widest text-black px-12 py-4 text-base transition-all hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #8B6914, #C9A84C, #E8CC7A, #C9A84C)', backgroundSize: '200% auto', animation: 'shimmer 2s linear infinite' }}
        >
          Get My Ticket — $500
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
