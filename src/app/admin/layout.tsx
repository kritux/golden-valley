import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from './AdminSidebar'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null }

  if (profile?.role !== 'admin') redirect('/login')

  return (
    <div className="flex min-h-screen bg-[var(--black)]">
      <AdminSidebar />
      <main className="flex-1 min-h-screen lg:ml-[240px] bg-[var(--black)] overflow-y-auto pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
