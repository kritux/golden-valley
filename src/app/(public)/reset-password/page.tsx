'use client'

import { Suspense, useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

function ResetPasswordInner() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionReady, setSessionReady] = useState(false)

  // Supabase sends the recovery token in the URL hash; the client picks it up automatically.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setSessionReady(true)
    })
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError('Failed to update password. The link may have expired — please request a new one.')
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
    setTimeout(() => router.push('/signin'), 3000)
  }

  if (!sessionReady) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm p-8 text-center">
          <GoldSpinner size={32} />
          <p className="text-[var(--white-muted)] text-sm mt-4">Verifying reset link…</p>
          <p className="text-[var(--white-muted)] text-xs mt-3">
            If nothing happens,{' '}
            <Link href="/forgot-password" className="text-[var(--gold)] hover:underline">request a new link</Link>.
          </p>
        </div>
      </div>
    )
  }

  return (
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
          New{' '}
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
          Choose a strong password to secure your account
        </p>
      </div>

      {done ? (
        <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm p-7 sm:p-8 text-center">
          <div
            className="w-14 h-14 mx-auto mb-5 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(143,255,58,0.1)', border: '2px solid rgba(143,255,58,0.4)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8FFF3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="font-black uppercase text-white text-lg tracking-wide mb-3">Password Updated</h2>
          <p className="text-[var(--white-muted)] text-sm">
            Your password has been reset. Redirecting to sign in…
          </p>
        </div>
      ) : (
        <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm p-7 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-[10px] uppercase tracking-widest text-[var(--white-muted)] mb-2.5 font-bold">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null) }}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-[var(--black-surface)] border border-[var(--black-border)] text-[var(--white)] rounded-sm pl-4 pr-12 py-4 text-base outline-none transition-all duration-200 focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] placeholder:text-[var(--white-muted)]/30 font-medium"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-[var(--white-muted)] hover:text-white transition-colors" tabIndex={-1}>
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm" className="block text-[10px] uppercase tracking-widest text-[var(--white-muted)] mb-2.5 font-bold">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setError(null) }}
                  placeholder="Repeat your new password"
                  className="w-full bg-[var(--black-surface)] border border-[var(--black-border)] text-[var(--white)] rounded-sm pl-4 pr-12 py-4 text-base outline-none transition-all duration-200 focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] placeholder:text-[var(--white-muted)]/30 font-medium"
                />
                <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-[var(--white-muted)] hover:text-white transition-colors" tabIndex={-1}>
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
            </div>

            {password && confirm && password !== confirm && (
              <p className="text-[#ff6b6b] text-xs">Passwords do not match.</p>
            )}

            {error && (
              <p className="text-[#ff6b6b] text-sm border px-4 py-3 rounded-sm" style={{ borderColor: 'rgba(220,80,80,0.3)', background: 'rgba(220,80,80,0.07)' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || password.length < 8 || password !== confirm}
              className="w-full py-4 font-black uppercase tracking-widest text-sm transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: '#8FFF3A', color: '#0B0B0B', boxShadow: '0 0 20px rgba(143,255,58,0.35)' }}
            >
              {loading ? <><GoldSpinner size={18} /><span>Updating...</span></> : 'Set New Password →'}
            </button>
          </form>
        </div>
      )}

      <p className="text-center text-[var(--white-muted)] text-xs mt-6 tracking-wide">
        <Link href="/signin" className="text-[var(--gold)] hover:underline">← Back to sign in</Link>
      </p>
    </div>
  )
}

export default function ResetPasswordPage() {
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
        <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
          <ResetPasswordInner />
        </main>
      </Suspense>

      <footer className="relative z-10 px-5 py-4 text-center">
        <p className="text-[var(--white-muted)] text-[10px] uppercase tracking-widest">
          Golden Valley Members LLC · Authorized Access Only
        </p>
      </footer>
    </div>
  )
}
