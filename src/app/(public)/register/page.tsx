'use client'

import { Suspense, useState, FormEvent, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { OtpInput } from '@/components/ui/otp-input'
import { GoldSpinner } from '@/components/ui/gold-button'
import SignatureCanvas from 'react-signature-canvas'
import { createClient } from '@/lib/supabase/client'

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10)
  if (digits.length === 0) return ''
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

function generateReferralCode(ticketNumber: number | null, firstName: string, lastName: string): string {
  const num = ticketNumber ? String(ticketNumber).padStart(3, '0') : ''
  const f = (firstName.trim()[0] ?? '').toUpperCase()
  const l = (lastName.trim()[0] ?? '').toUpperCase()
  return `GV${num}${f}${l}`
}

function GVLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <div className="w-9 h-9 flex items-center justify-center font-black text-xs tracking-widest text-black shrink-0"
        style={{ background: 'linear-gradient(135deg, #A68B28, #D4AF37, #E8CC7A)' }}>GV</div>
      <span className="text-xs font-black uppercase tracking-[0.2em] text-white/50 group-hover:text-white/80 transition-colors">
        Golden Valley Members
      </span>
    </Link>
  )
}

interface FormData {
  firstName: string; lastName: string; email: string; phone: string
  password: string; signatureData: string; referralCode: string
}

// ─── TERMS CONTENT ────────────────────────────────────────────────────────────
const TERMS_SECTIONS = [
  { title: '1. Acceptance of Terms', body: `By accessing the Golden Valley Members website, purchasing a raffle ticket, or otherwise participating in the Golden Valley Members raffle program ("the Raffle"), you agree to be bound by these Terms of Use and all applicable federal, state, and local laws.\n\nThese Terms constitute a legally binding agreement between you ("Participant") and Golden Valley Members LLC, a California limited liability company.` },
  { title: '2. Eligibility', body: `To participate you must:\n• Be at least 18 years of age.\n• Be a legal US resident in a jurisdiction where participation is permitted by law.\n• Not be an employee or immediate family member of Golden Valley Members LLC.\n• Have a valid U.S.-based payment method.\n\nVoid where prohibited. We reserve the right to verify eligibility at any time.` },
  { title: '3. Ticket Purchase & Payment', body: `Each raffle entry ("Ticket") costs $500 USD. Payment via Zelle (verified within 72h) or Credit/Debit Card via Stripe (instant). All payments are non-refundable once confirmed. Your ticket number is only reserved after payment is verified.` },
  { title: '4. Ticket Numbers & Assignment', body: `Tickets are numbered #1 to #1,000. Numbers are assigned on a first-confirmed basis. No two participants hold the same number. Numbers are non-transferable after assignment.` },
  { title: '5. Prize Draw', body: `The draw is triggered automatically when Ticket #1,000 is confirmed. Two numbers are randomly and independently selected:\n• First Draw — Grand Prize (1st Prize).\n• Second Draw — Cash Prize (2nd Prize).\nResults are final and binding.` },
  { title: '6. Prizes', body: `1st Prize: One (1) 2027 Toyota 4Runner or, at winner's election within 7 days, $70,000 USD cash.\n\n2nd Prize: $20,000 USD cash via wire transfer.\n\nDaily Prize: $1,000 USD per day for 90 consecutive days to eligible participants.\n\nAll prizes are non-transferable except as stated above.` },
  { title: '7. Refund Policy', body: `All purchases are final and non-refundable once confirmed. Exceptions: raffle cancellation (full refund), unverified Zelle payment (voided + returned in 10 business days), or verified duplicate charges (refunded in 5 business days). No refunds for change of mind or failure to win.` },
  { title: '8. Taxes', body: `Winners are solely responsible for all applicable taxes. For prizes $600+, Golden Valley Members LLC is required to report winnings to the IRS (Form 1099-MISC). Winners must provide a valid SSN or ITIN before any prize is delivered.` },
  { title: '9. Limitation of Liability', body: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, GOLDEN VALLEY MEMBERS LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES. COMPANY'S TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID FOR YOUR TICKET(S).` },
  { title: '10. Governing Law', body: `These Terms are governed by California law. Disputes shall be resolved by binding arbitration in Los Angeles County under AAA rules. You waive the right to a jury trial or class action.` },
  { title: '11. Changes', body: `Company reserves the right to modify these Terms at any time. Continued participation after changes constitutes acceptance.` },
  { title: '12. Contact', body: `Golden Valley Members LLC\nEmail: legal@goldenvalleymembers.com\nSupport: support@goldenvalleymembers.com` },
]

// ─── TERMS READER ─────────────────────────────────────────────────────────────
function TermsReader({ signatureData, onSignature, onSignatureClear, sigRef, termsAccepted, onTermsAccepted }: {
  signatureData: string; onSignature: (d: string) => void; onSignatureClear: () => void
  sigRef: React.RefObject<SignatureCanvas>; termsAccepted: boolean; onTermsAccepted: (v: boolean) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hasRead, setHasRead] = useState(false)

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setHasRead(true)
  }

  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-[var(--white-muted)] mb-2 font-bold">
        Terms & Conditions <span className="text-[var(--gold)]">*</span>
      </label>
      <div ref={scrollRef} onScroll={handleScroll}
        className="border border-[var(--black-border)] bg-[#0d0d0d] rounded-sm overflow-y-auto" style={{ height: 220 }}>
        <div className="p-4 space-y-4">
          {TERMS_SECTIONS.map((s) => (
            <div key={s.title}>
              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--gold)] mb-1">{s.title}</p>
              <p className="text-white/40 text-xs leading-relaxed whitespace-pre-line">{s.body}</p>
            </div>
          ))}
          <p className="text-white/20 text-[10px] text-center py-3 uppercase tracking-widest">— End of Terms —</p>
        </div>
      </div>
      {!hasRead && (
        <p className="text-[10px] text-white/30 mt-1.5 flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
          Scroll to read all terms before accepting
        </p>
      )}
      {hasRead && (
        <div className="mt-4 space-y-4 border-t border-[var(--black-border)] pt-4">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5 shrink-0">
              <input type="checkbox" className="sr-only" checked={termsAccepted} onChange={(e) => onTermsAccepted(e.target.checked)} />
              <div className="w-5 h-5 border-2 flex items-center justify-center transition-all"
                style={{ borderColor: termsAccepted ? '#D4AF37' : '#333', background: termsAccepted ? 'rgba(212,175,55,0.15)' : 'transparent' }}>
                {termsAccepted && <svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M1 3.5L4 6.5L10 1" stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
            </div>
            <span className="text-xs text-[var(--white-muted)] leading-relaxed group-hover:text-white/80 transition-colors">
              I have read, understood, and accept all Terms & Conditions in their entirety.
            </span>
          </label>
          {termsAccepted && (
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[var(--white-muted)] mb-2 font-bold">
                Sign to Confirm <span className="text-[var(--gold)]">*</span>
              </label>
              <div className="border border-[var(--gold)] rounded-sm overflow-hidden bg-white" style={{ minHeight: 150 }}>
                <SignatureCanvas ref={sigRef}
                  onEnd={() => { if (sigRef.current && !sigRef.current.isEmpty()) onSignature(sigRef.current.toDataURL('image/png')) }}
                  penColor="#1a1a1a"
                  canvasProps={{ className: 'w-full', style: { width: '100%', height: 150, display: 'block', background: '#fff' } }} />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[10px] text-[var(--white-muted)] italic">Draw your signature to confirm acceptance</p>
                <button type="button" onClick={onSignatureClear} className="text-[10px] text-[var(--white-muted)] hover:text-[var(--gold)] transition-colors underline">Clear</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── STEP 1: Registration Form ────────────────────────────────────────────────
function RegistrationForm({ reservedNumber, onSuccess }: {
  reservedNumber: number | null
  onSuccess: (email: string, data: FormData) => void
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneDisplay, setPhoneDisplay] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [referralCode, setReferralCode] = useState('')
  const [referralEdited, setReferralEdited] = useState(false)
  const [signatureData, setSignatureData] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [ageAccepted, setAgeAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sigRef = useRef<SignatureCanvas>(null)
  const supabase = createClient()

  useEffect(() => {
    if (referralEdited) return
    if (firstName.trim() || lastName.trim())
      setReferralCode(generateReferralCode(reservedNumber, firstName, lastName))
  }, [firstName, lastName, reservedNumber, referralEdited])

  const handleSignatureClear = useCallback(() => { sigRef.current?.clear(); setSignatureData('') }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) { setError('First and last name are required.'); return }
    if (!email.trim()) { setError('Email address is required.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    if (!termsAccepted) { setError('Please scroll through and accept the Terms & Conditions.'); return }
    if (!signatureData) { setError('Please draw your signature to confirm acceptance.'); return }
    if (!ageAccepted) { setError('Please confirm you are 18 years or older.'); return }

    setLoading(true)
    setError(null)
    try {
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      })
      if (otpErr) {
        setError(otpErr.message ?? 'Failed to send verification code. Please try again.')
        return
      }
      const phone = phoneDisplay.replace(/\D/g, '').length >= 10 ? `+1${phoneDisplay.replace(/\D/g, '')}` : ''
      const code = referralCode.trim() || generateReferralCode(reservedNumber, firstName, lastName)
      onSuccess(email.trim(), { firstName, lastName, email: email.trim(), phone, password, signatureData, referralCode: code })
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const inp = 'w-full bg-[var(--black-surface)] border border-[var(--black-border)] text-[var(--white)] rounded-sm px-4 py-3.5 text-sm outline-none transition-all duration-200 focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] placeholder:text-[var(--white-muted)]/30'

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-8">
        {reservedNumber && (
          <div className="inline-flex items-center gap-3 border border-[var(--gold)] px-6 py-3 mb-5" style={{ background: 'rgba(212,175,55,0.07)' }}>
            <span className="text-[10px] uppercase tracking-widest text-[var(--gold)] font-bold">Reserving</span>
            <span className="font-black text-2xl" style={{ fontFamily: 'var(--font-dm-mono,monospace)', background: 'linear-gradient(135deg,#A68B28,#D4AF37,#E8CC7A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              #{String(reservedNumber).padStart(3, '0')}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[var(--gold)] font-bold">for you</span>
          </div>
        )}
        <h1 className="font-black uppercase text-white mb-3" style={{ fontFamily: 'var(--font-playfair,"Playfair Display",serif)', fontSize: 'clamp(1.6rem,5vw,2.5rem)', textShadow: '0 0 40px rgba(212,175,55,0.3)' }}>
          Join Golden Valley
          <span className="block" style={{ background: 'linear-gradient(135deg,#A68B28,#D4AF37,#E8CC7A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Members</span>
        </h1>
        <p className="text-[var(--white-muted)] text-sm max-w-xs mx-auto">Complete your registration to secure your membership</p>
      </div>

      <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[var(--white-muted)] mb-2 font-bold">First Name <span className="text-[var(--gold)]">*</span></label>
              <input type="text" autoComplete="given-name" required value={firstName} onChange={(e) => { setFirstName(e.target.value); setError(null) }} placeholder="John" className={inp} />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[var(--white-muted)] mb-2 font-bold">Last Name <span className="text-[var(--gold)]">*</span></label>
              <input type="text" autoComplete="family-name" required value={lastName} onChange={(e) => { setLastName(e.target.value); setError(null) }} placeholder="Smith" className={inp} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[var(--white-muted)] mb-2 font-bold">Email Address <span className="text-[var(--gold)]">*</span></label>
            <input type="email" autoComplete="email" required value={email} onChange={(e) => { setEmail(e.target.value); setError(null) }} placeholder="john@example.com" className={inp} />
            <p className="text-[10px] text-[var(--white-muted)] mt-1.5">A verification code will be sent to this address.</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[var(--white-muted)] mb-2 font-bold">Phone Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <span className="text-[var(--white-muted)] text-sm font-bold">+1</span>
              </div>
              <input type="tel" inputMode="numeric" autoComplete="tel" value={phoneDisplay} onChange={(e) => { setPhoneDisplay(formatPhone(e.target.value)); setError(null) }} placeholder="(555) 555-5555" className={`${inp} pl-12 tracking-wider`} />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[var(--white-muted)] mb-2 font-bold">Password <span className="text-[var(--gold)]">*</span></label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={password} onChange={(e) => { setPassword(e.target.value); setError(null) }} placeholder="Minimum 8 characters" className={`${inp} pr-12`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-4 flex items-center text-white/30 hover:text-white/60 transition-colors text-xs">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[var(--white-muted)] mb-2 font-bold">Confirm Password <span className="text-[var(--gold)]">*</span></label>
            <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(null) }} placeholder="Repeat your password" className={inp} />
          </div>

          {/* Referral Code */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[var(--white-muted)] mb-2 font-bold">Referral Code</label>
            <div className="relative">
              <input type="text" value={referralCode} onChange={(e) => { setReferralCode(e.target.value.toUpperCase()); setReferralEdited(true); setError(null) }} placeholder="Enter referral code" className={`${inp} tracking-widest`} style={{ fontFamily: 'var(--font-dm-mono,monospace)' }} />
              {!referralEdited && referralCode && (
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <span className="text-[9px] uppercase tracking-wider text-[var(--gold)]/60 font-bold">Auto</span>
                </div>
              )}
            </div>
            <p className="text-[10px] text-[var(--white-muted)] mt-1.5">Enter the code of who referred you, or leave the auto-generated one.</p>
          </div>

          {/* T&C */}
          <TermsReader signatureData={signatureData} onSignature={setSignatureData} onSignatureClear={handleSignatureClear}
            sigRef={sigRef as React.RefObject<SignatureCanvas>} termsAccepted={termsAccepted} onTermsAccepted={setTermsAccepted} />

          {/* Age */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5 shrink-0">
              <input type="checkbox" className="sr-only" checked={ageAccepted} onChange={(e) => { setAgeAccepted(e.target.checked); setError(null) }} />
              <div className="w-5 h-5 border-2 flex items-center justify-center transition-all" style={{ borderColor: ageAccepted ? '#D4AF37' : '#333', background: ageAccepted ? 'rgba(212,175,55,0.15)' : 'transparent' }}>
                {ageAccepted && <svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M1 3.5L4 6.5L10 1" stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
            </div>
            <span className="text-xs text-[var(--white-muted)] leading-relaxed group-hover:text-white/80 transition-colors">
              I confirm that I am 18 years of age or older and legally eligible to participate.
            </span>
          </label>

          {error && (
            <p className="text-[#ff6b6b] text-sm border px-4 py-3 rounded-sm" style={{ borderColor: 'rgba(220,80,80,0.3)', background: 'rgba(220,80,80,0.07)' }}>{error}</p>
          )}

          <button type="submit" disabled={loading || !firstName.trim() || !lastName.trim() || !email.trim() || password.length < 8}
            className="w-full py-4 font-black uppercase tracking-widest text-sm transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            style={{ background: '#8FFF3A', color: '#0B0B0B', boxShadow: '0 0 20px rgba(143,255,58,0.35)' }}>
            {loading ? <><GoldSpinner size={18} /><span>Sending Code...</span></> : 'Send Verification Code →'}
          </button>
        </form>
      </div>

      <p className="text-center text-[var(--white-muted)] text-xs mt-6 tracking-wide">
        Already a member?{' '}
        <Link href="/signin" className="text-[var(--gold)] hover:underline">Sign in here</Link>
      </p>
    </div>
  )
}

// ─── STEP 2: Email OTP Verification ──────────────────────────────────────────
function OtpStep({ email, formData, onBack, reservedNumber }: {
  email: string; formData: FormData; onBack: () => void; reservedNumber: number | null
}) {
  const router = useRouter()
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [resending, setResending] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return }
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [countdown])

  const numSuffix = reservedNumber ? `?number=${reservedNumber}` : ''

  async function handleVerify() {
    const code = digits.join('')
    if (code.length < 6) { setError('Please enter all 6 digits.'); return }
    setLoading(true)
    setError(null)
    try {
      const { error: verifyErr } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
      if (verifyErr) {
        setError('Invalid or expired code. Please try again.')
        setDigits(['', '', '', '', '', ''])
        return
      }

      // Set password after OTP verification
      const { error: pwErr } = await supabase.auth.updateUser({
        password: formData.password,
        data: { first_name: formData.firstName, last_name: formData.lastName, phone: formData.phone },
      })
      if (pwErr) console.error('[register] set password error:', pwErr.message)

      // Save profile
      await fetch('/api/customer/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: formData.firstName, last_name: formData.lastName, email: formData.email, signature_data: formData.signatureData }),
      })

      router.push(`/dashboard${numSuffix}`)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setError(null)
    try {
      await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
      setCountdown(60)
      setCanResend(false)
      setDigits(['', '', '', '', '', ''])
    } catch { /* silently fail */ } finally {
      setResending(false)
    }
  }

  useEffect(() => {
    if (digits.every((d) => d !== '') && !loading) handleVerify()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits])

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-10">
        <div className="w-16 h-16 mx-auto mb-5 flex items-center justify-center rounded-full border-2"
          style={{ borderColor: 'rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.08)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <h2 className="font-black uppercase text-white mb-2" style={{ fontFamily: 'var(--font-playfair,"Playfair Display",serif)', fontSize: 'clamp(1.4rem,4.5vw,2rem)' }}>
          Check Your Email
        </h2>
        <p className="text-[var(--white-muted)] text-sm">We sent a 6-digit verification code to</p>
        <p className="text-white font-bold tracking-wider mt-1" style={{ fontFamily: 'var(--font-dm-mono,monospace)' }}>{email}</p>
      </div>

      <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm p-7 sm:p-8">
        <div className="mb-6">
          <label className="block text-xs uppercase tracking-widest text-[var(--white-muted)] mb-5 font-bold text-center">Enter Verification Code</label>
          <OtpInput value={digits} onChange={setDigits} disabled={loading} />
        </div>

        {error && (
          <p className="text-[#ff6b6b] text-sm border px-4 py-3 mb-4 text-center rounded-sm" style={{ borderColor: 'rgba(220,80,80,0.3)', background: 'rgba(220,80,80,0.07)' }}>{error}</p>
        )}

        <button type="button" onClick={handleVerify} disabled={loading || digits.join('').length < 6}
          className="w-full py-4 font-black uppercase tracking-widest text-sm transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ background: '#8FFF3A', color: '#0B0B0B', boxShadow: '0 0 20px rgba(143,255,58,0.35)' }}>
          {loading ? <><GoldSpinner size={18} /><span>Verifying...</span></> : 'Verify & Create Account →'}
        </button>

        <div className="text-center mt-5">
          {canResend ? (
            <button onClick={handleResend} disabled={resending} className="text-sm text-[var(--gold)] hover:underline disabled:opacity-50 font-medium">
              {resending ? 'Sending...' : 'Resend code'}
            </button>
          ) : (
            <p className="text-[var(--white-muted)] text-xs">
              Resend in <span className="text-white font-bold" style={{ fontFamily: 'var(--font-dm-mono,monospace)' }}>{countdown}s</span>
            </p>
          )}
        </div>
      </div>
      <button onClick={onBack} className="block mx-auto mt-5 text-[var(--white-muted)] text-xs hover:text-white transition-colors">← Edit registration details</button>
    </div>
  )
}

// ─── Inner ────────────────────────────────────────────────────────────────────
function RegisterInner() {
  const searchParams = useSearchParams()
  const rawNum = searchParams.get('number')
  const reservedNumber = rawNum ? parseInt(rawNum, 10) : null
  const validNumber = reservedNumber && reservedNumber >= 1 && reservedNumber <= 1000 ? reservedNumber : null
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [email, setEmail] = useState('')
  const [formData, setFormData] = useState<FormData>({ firstName: '', lastName: '', email: '', phone: '', password: '', signatureData: '', referralCode: '' })

  return (
    <main className="relative z-10 flex-1 flex items-start justify-center px-4 py-10">
      {step === 'form' ? (
        <RegistrationForm reservedNumber={validNumber} onSuccess={(e, data) => { setEmail(e); setFormData(data); setStep('otp') }} />
      ) : (
        <OtpStep email={email} formData={formData} reservedNumber={validNumber} onBack={() => setStep('form')} />
      )}
    </main>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-[100svh] flex flex-col" style={{ background: 'var(--black)' }}>
      <div className="fixed inset-0 pointer-events-none opacity-30"
        style={{ backgroundImage: 'radial-gradient(ellipse at 20% 50%,rgba(212,175,55,0.06) 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(143,255,58,0.04) 0%,transparent 50%)' }} />
      <header className="relative z-10 px-5 py-4 border-b border-[var(--black-border)]"><GVLogo /></header>
      <Suspense fallback={<main className="relative z-10 flex-1 flex items-center justify-center"><GoldSpinner size={36} /></main>}>
        <RegisterInner />
      </Suspense>
      <footer className="relative z-10 px-5 py-4 text-center">
        <p className="text-[var(--white-muted)] text-[10px] uppercase tracking-widest">Golden Valley Members LLC · Authorized Access Only</p>
      </footer>
    </div>
  )
}
