'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SellerSignOutButton() {
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="w-full text-left px-3 py-2.5 rounded-sm text-sm text-[var(--white-muted)] hover:text-red-400 hover:bg-red-900/10 transition-colors duration-150 tracking-wide disabled:opacity-50"
    >
      {loading ? 'Signing out…' : 'Sign Out'}
    </button>
  )
}
