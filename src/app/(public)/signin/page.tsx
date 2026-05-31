'use client'

import { Suspense, useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function SignInInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/dashboard'

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!identifier.trim() || !password) return
    setLoading(true)
    setError(null)

    const supabase = createClient()

    // Determine if identifier is email or phone
    const isEmail = identifier.includes('@')
    let email = identifier.trim()

    if (!isEmail) {
      // Server-side lookup — uses service role to bypass RLS
      const res = await fetch('/api/auth/phone-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: identifier.trim() }),
      })
      const result = await res.json() as { email?: string; error?: string }
      if (!res.ok || !result.email) {
        setError('No account found with that phone number.')
        setLoading(false)
        return
      }
      email = result.email
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      if (authError.message.toLowerCase().includes('invalid login')) {
        setError('Incorrect email or password. Please try again.')
      } else if (authError.message.toLowerCase().includes('email not confirmed')) {
        setError('Please verify your email before signing in.')
      } else {
        setError('Sign in failed. Please try again.')
      }
      setLoading(false)
      return
    }

    router.push(redirect)
  }

  return (
    <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-10">
          <div
            className="w-16 h-16 mx-auto mb-5 flex items-center justify-center border-2"
            style={{ borderColor: 'rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.08)' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h1
            className="font-black uppercase text-white mb-3"
            style={{
              fontFamily: 'var(--font-playfair, "Playfair Display", serif)',
              fontSize: 'clamp(1.6rem, 5vw, 2.5rem)',
              textShadow: '0 0 40px rgba(212,175,55,0.3)',
            }}
          >
            Member{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #A68B28, #D4AF37, #E8CC7A)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Sign In
            </span>
          </h1>
          <p className="text-[var(--white-muted)] text-sm leading-relaxed max-w-xs mx-auto">
            Sign in with your email or phone number and password
          </p>
        </div>

        <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm p-7 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="identifier" className="block text-[10px] uppercase tracking-widest text-[var(--white-muted)] mb-2.5 font-bold">
                Email or Phone Number
              </label>
              <input
                id="identifier"
                type="text"
                inputMode="email"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => { setIdentifier(e.target.value); setError(null) }}
                placeholder="you@example.com or (555) 555-5555"
                className="w-full bg-[var(--black-surface)] border border-[var(--black-border)] text-[var(--white)] rounded-sm px-4 py-4 text-base outline-none transition-all duration-200 focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] placeholder:text-[var(--white-muted)]/30 font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label htmlFor="password" className="block text-[10px] uppercase tracking-widest text-[var(--white-muted)] font-bold">
                  Password
                </label>
                <Link href="/forgot-password" className="text-[10px] text-[var(--gold)] hover:underline uppercase tracking-wider font-bold">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null) }}
                  placeholder="••••••••"
                  className="w-full bg-[var(--black-surface)] border border-[var(--black-border)] text-[var(--white)] rounded-sm pl-4 pr-12 py-4 text-base outline-none transition-all duration-200 focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] placeholder:text-[var(--white-muted)]/30 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-[var(--white-muted)] hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            {error && (
              <p className="text-[#ff6b6b] text-sm border px-4 py-3 rounded-sm" style={{ borderColor: 'rgba(220,80,80,0.3)', background: 'rgba(220,80,80,0.07)' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !identifier.trim() || !password}
              className="w-full py-4 font-black uppercase tracking-widest text-sm transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: '#8FFF3A', color: '#0B0B0B', boxShadow: '0 0 20px rgba(143,255,58,0.35)' }}
            >
              {loading ? <><GoldSpinner size={18} /><span>Signing In...</span></> : 'Sign In →'}
            </button>
          </form>
        </div>

        <p className="text-center text-[var(--white-muted)] text-xs mt-6 tracking-wide">
          Not a member yet?{' '}
          <Link href="/register" className="text-[var(--gold)] hover:underline">Register here</Link>
        </p>
        <p className="text-center mt-4">
          <Link href="/login" className="text-white/15 hover:text-white/35 transition-colors text-[10px] uppercase tracking-widest">
            Staff access
          </Link>
        </p>
      </div>
    </main>
  )
}

export default function SignInPage() {
  return (
    <div className="min-h-[100svh] flex flex-col" style={{ background: 'var(--black)' }}>
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{ backgroundImage: 'radial-gradient(ellipse at 30% 60%, rgba(212,175,55,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, rgba(143,255,58,0.04) 0%, transparent 50%)' }}
      />
      <header className="relative z-10 px-5 py-4 border-b border-[var(--black-border)]">
        <GVLogo />
      </header>

      <Suspense
        fallback={
          <main className="relative z-10 flex-1 flex items-center justify-center">
            <GoldSpinner size={36} />
          </main>
        }
      >
        <SignInInner />
      </Suspense>

      <footer className="relative z-10 px-5 py-4 text-center">
        <p className="text-[var(--white-muted)] text-[10px] uppercase tracking-widest">
          Golden Valley Members LLC · Authorized Access Only
        </p>
      </footer>
    </div>
  )
}
