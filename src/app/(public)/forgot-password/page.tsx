'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { GoldSpinner } from '@/components/ui/gold-button'

function GVLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <div
        className="w-9 h-9 flex items-center justify-center font-black text-xs tracking-widest text-black shrink-0"
        style={{ background: 'linear-gradient(135deg, #A68B28, #D4AF37, #E8CC7A)' }}
      >
        GV
      </div>
      <span className="text-xs font-black uppercase tracking-[0.2em] text-white/50 group-hover:text-white/80 transition-colors">
        Golden Valley Members
      </span>
    </Link>
  )
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (resetError) {
      setError('Failed to send reset email. Please try again.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-[100svh] flex flex-col" style={{ background: 'var(--black)' }}>
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{ backgroundImage: 'radial-gradient(ellipse at 30% 60%, rgba(212,175,55,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, rgba(143,255,58,0.04) 0%, transparent 50%)' }}
      />
      <header className="relative z-10 px-5 py-4 border-b border-[var(--black-border)]">
        <GVLogo />
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-10">
            <div
              className="w-16 h-16 mx-auto mb-5 flex items-center justify-center border-2"
              style={{ borderColor: 'rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.08)' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1
              className="font-black uppercase text-white mb-3"
              style={{
                fontFamily: 'var(--font-playfair, "Playfair Display", serif)',
                fontSize: 'clamp(1.6rem, 5vw, 2.2rem)',
                textShadow: '0 0 40px rgba(212,175,55,0.3)',
              }}
            >
              Reset{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #A68B28, #D4AF37, #E8CC7A)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Password
              </span>
            </h1>
            <p className="text-[var(--white-muted)] text-sm leading-relaxed max-w-xs mx-auto">
              Enter your email and we&apos;ll send you a link to reset your password
            </p>
          </div>

          {sent ? (
            <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm p-7 sm:p-8 text-center">
              <div
                className="w-14 h-14 mx-auto mb-5 flex items-center justify-center rounded-full"
                style={{ background: 'rgba(143,255,58,0.1)', border: '2px solid rgba(143,255,58,0.4)' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8FFF3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="font-black uppercase text-white text-lg tracking-wide mb-3">Check Your Email</h2>
              <p className="text-[var(--white-muted)] text-sm leading-relaxed mb-6">
                We sent a password reset link to{' '}
                <span className="text-white font-bold">{email}</span>.
                Check your inbox and follow the link to set a new password.
              </p>
              <p className="text-[var(--white-muted)] text-xs">
                Didn&apos;t receive it?{' '}
                <button onClick={() => setSent(false)} className="text-[var(--gold)] hover:underline font-bold">
                  Try again
                </button>
              </p>
            </div>
          ) : (
            <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm p-7 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-[10px] uppercase tracking-widest text-[var(--white-muted)] mb-2.5 font-bold">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null) }}
                    placeholder="you@example.com"
                    className="w-full bg-[var(--black-surface)] border border-[var(--black-border)] text-[var(--white)] rounded-sm px-4 py-4 text-base outline-none transition-all duration-200 focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] placeholder:text-[var(--white-muted)]/30 font-medium"
                  />
                </div>

                {error && (
                  <p className="text-[#ff6b6b] text-sm border px-4 py-3 rounded-sm" style={{ borderColor: 'rgba(220,80,80,0.3)', background: 'rgba(220,80,80,0.07)' }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full py-4 font-black uppercase tracking-widest text-sm transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: '#8FFF3A', color: '#0B0B0B', boxShadow: '0 0 20px rgba(143,255,58,0.35)' }}
                >
                  {loading ? <><GoldSpinner size={18} /><span>Sending...</span></> : 'Send Reset Link →'}
                </button>
              </form>
            </div>
          )}

          <p className="text-center text-[var(--white-muted)] text-xs mt-6 tracking-wide">
            Remember your password?{' '}
            <Link href="/signin" className="text-[var(--gold)] hover:underline">Sign in</Link>
          </p>
        </div>
      </main>

      <footer className="relative z-10 px-5 py-4 text-center">
        <p className="text-[var(--white-muted)] text-[10px] uppercase tracking-widest">
          Golden Valley Members LLC · Authorized Access Only
        </p>
      </footer>
    </div>
  )
}
