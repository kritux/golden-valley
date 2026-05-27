'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GoldButton } from '@/components/ui/gold-button'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
      return
    }

    // Fetch role from profile to route correctly
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .single() as { data: { role: string } | null }

    if (profile?.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/seller')
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-10">
        <h1
          className="font-[var(--font-playfair)] text-3xl font-bold text-gold-gradient tracking-wider uppercase"
          style={{
            background: 'linear-gradient(135deg, var(--gold-dark), var(--gold), var(--gold-light))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Golden Valley Members
        </h1>
        <p className="text-[var(--white-muted)] text-sm tracking-[0.3em] uppercase mt-2 font-medium">
          Staff Portal
        </p>
      </div>

      {/* Card */}
      <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-xs uppercase tracking-widest text-[var(--white-muted)] mb-2 font-medium"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[var(--black-surface)] border border-[var(--black-border)] text-[var(--white)] rounded-sm px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] placeholder:text-[var(--white-muted)]/40"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs uppercase tracking-widest text-[var(--white-muted)] mb-2 font-medium"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--black-surface)] border border-[var(--black-border)] text-[var(--white)] rounded-sm px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] placeholder:text-[var(--white-muted)]/40"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm border border-red-900/50 bg-red-900/10 rounded-sm px-4 py-3">
              {error}
            </p>
          )}

          <GoldButton type="submit" loading={loading} size="md" className="w-full mt-2">
            Sign In
          </GoldButton>
        </form>
      </div>

      <p className="text-center text-[var(--white-muted)] text-xs mt-6 tracking-wide">
        Authorized personnel only. Unauthorized access is prohibited.
      </p>
    </div>
  )
}
