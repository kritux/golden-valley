import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SellerSidebar from './SellerSidebar'

export default async function SellerLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, first_name, last_name')
    .eq('id', user.id)
    .single() as { data: { role: string; first_name: string; last_name: string } | null }

  if (profile?.role !== 'seller') redirect('/login')

  return (
    <div className="flex min-h-screen bg-[var(--black)]">
      <SellerSidebar firstName={profile?.first_name} lastName={profile?.last_name} />
      <main className="flex-1 min-h-screen lg:ml-[240px] bg-[var(--black)] overflow-y-auto pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
