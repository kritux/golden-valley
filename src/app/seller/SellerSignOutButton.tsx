'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SellerSignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full text-left px-3 py-2.5 rounded-sm text-sm text-[var(--white-muted)] hover:text-red-400 hover:bg-red-900/10 transition-colors duration-150 tracking-wide"
    >
      Sign Out
    </button>
  )
}
