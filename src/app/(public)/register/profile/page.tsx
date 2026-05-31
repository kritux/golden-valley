'use client'

import { Suspense, useState, useEffect, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
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

function ProfileForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawNum = searchParams.get('number')
  const numSuffix = rawNum ? `?number=${rawNum}` : ''
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-fill if user already has partial profile data
  useEffect(() => {
    fetch('/api/customer/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return
        if (d.email) setEmail(d.email)
        if (d.name) {
          const parts = (d.name as string).trim().split(' ')
          setFirstName(parts[0] ?? '')
          setLastName(parts.slice(1).join(' ') ?? '')
        }
      })
      .catch(() => {})
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/customer/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName.trim(), last_name: lastName.trim(), email: email.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to save profile. Please try again.')
        return
      }

      router.push(`/dashboard${numSuffix}`)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-[100svh] flex flex-col"
      style={{ background: 'var(--black)' }}
    >
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.08) 0%, transparent 60%)',
        }}
      />

      {/* Header */}
      <header className="relative z-10 px-5 py-4 border-b border-[var(--black-border)]">
        <GVLogo />
      </header>

      {/* Step indicator */}
      <div className="relative z-10 px-5 pt-6 flex justify-center">
        <div className="flex items-center gap-2">
          {['Phone', 'Verify', 'Profile'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
                  style={{
                    background: i < 2 ? 'linear-gradient(135deg, #A68B28, #D4AF37)' : '#8FFF3A',
                    color: i < 3 ? '#000' : '#fff',
                  }}
                >
                  {i < 2 ? '✓' : i + 1}
                </div>
                <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: i === 2 ? '#D4AF37' : '#555' }}>
                  {label}
                </span>
              </div>
              {i < 2 && (
                <div className="w-8 h-px mb-4" style={{ background: i < 1 ? '#D4AF37' : '#333' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full border-2"
              style={{ borderColor: 'rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.08)' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h1
              className="font-black uppercase text-white mb-2"
              style={{
                fontFamily: 'var(--font-playfair, "Playfair Display", serif)',
                fontSize: 'clamp(1.5rem, 4.5vw, 2.2rem)',
              }}
            >
              Complete Your Profile
            </h1>
            <p className="text-[var(--white-muted)] text-sm max-w-xs mx-auto leading-relaxed">
              Just a few details so we can send your membership confirmation
            </p>
          </div>

          {/* Card */}
          <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm p-7 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="first_name"
                    className="block text-xs uppercase tracking-widest text-[var(--white-muted)] mb-2 font-bold"
                  >
                    First Name
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    autoComplete="given-name"
                    required
                    value={firstName}
                    onChange={(e) => { setFirstName(e.target.value); setError(null) }}
                    placeholder="Maria"
                    className="w-full bg-[var(--black-surface)] border border-[var(--black-border)] text-[var(--white)] rounded-sm px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] placeholder:text-[var(--white-muted)]/30"
                  />
                </div>
                <div>
                  <label
                    htmlFor="last_name"
                    className="block text-xs uppercase tracking-widest text-[var(--white-muted)] mb-2 font-bold"
                  >
                    Last Name
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    autoComplete="family-name"
                    required
                    value={lastName}
                    onChange={(e) => { setLastName(e.target.value); setError(null) }}
                    placeholder="Garcia"
                    className="w-full bg-[var(--black-surface)] border border-[var(--black-border)] text-[var(--white)] rounded-sm px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] placeholder:text-[var(--white-muted)]/30"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs uppercase tracking-widest text-[var(--white-muted)] mb-2 font-bold"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null) }}
                  placeholder="maria@example.com"
                  className="w-full bg-[var(--black-surface)] border border-[var(--black-border)] text-[var(--white)] rounded-sm px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] placeholder:text-[var(--white-muted)]/30"
                />
                <p className="text-[var(--white-muted)] text-[10px] mt-1.5">
                  We&apos;ll send your membership confirmation here
                </p>
              </div>

              {error && (
                <p className="text-red-400 text-sm border border-red-900/50 bg-red-900/10 rounded-sm px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !firstName.trim() || !lastName.trim() || !email.trim()}
                className="w-full py-4 font-black uppercase tracking-widest text-white text-sm transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                style={{ background: '#8FFF3A', color: '#0B0B0B', boxShadow: '0 0 20px rgba(143,255,58,0.35)' }}
              >
                {loading ? (
                  <>
                    <GoldSpinner size={18} />
                    <span>Saving...</span>
                  </>
                ) : (
                  'Continue →'
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-[var(--white-muted)] text-xs mt-5 leading-relaxed max-w-xs mx-auto">
            Your information is kept private and secure.
          </p>
        </div>
      </main>
    </div>
  )
}

export default function RegisterProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100svh] flex items-center justify-center" style={{ background: 'var(--black)' }}>
        <GoldSpinner size={36} />
      </div>
    }>
      <ProfileForm />
    </Suspense>
  )
}
