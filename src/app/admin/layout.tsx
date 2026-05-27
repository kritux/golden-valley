import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AdminSignOutButton from './AdminSignOutButton'

const navLinks = [
  { href: '/admin', label: 'Overview', icon: '◈' },
  { href: '/admin/payments', label: 'Payments', icon: '◉' },
  { href: '/admin/sellers', label: 'Sellers', icon: '◎' },
  { href: '/admin/commissions', label: 'Commissions', icon: '◇' },
  { href: '/admin/export', label: 'Export', icon: '◫' },
]

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
      {/* Sidebar */}
      <aside
        className="fixed top-0 left-0 h-full w-[240px] bg-[var(--black-surface)] border-r border-[var(--black-border)] flex flex-col z-40"
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b border-[var(--black-border)]">
          <span
            className="font-[var(--font-playfair)] text-2xl font-bold tracking-wider"
            style={{
              background: 'linear-gradient(135deg, var(--gold-dark), var(--gold), var(--gold-light))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            GVM
          </span>
          <p className="text-[var(--white-muted)] text-[10px] tracking-[0.25em] uppercase mt-0.5">
            Admin Panel
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navLinks.map((link) => (
            <AdminNavLink key={link.href} href={link.href} label={link.label} icon={link.icon} />
          ))}
        </nav>

        {/* Sign Out */}
        <div className="px-4 py-5 border-t border-[var(--black-border)]">
          <AdminSignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-[240px] flex-1 min-h-screen bg-[var(--black)] overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

// Server-renderable nav link wrapper — active state uses a client component
function AdminNavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-[var(--white-muted)] hover:text-[var(--white)] hover:bg-[var(--black-card)] transition-colors duration-150 group"
    >
      <span className="text-[var(--gold)] opacity-60 group-hover:opacity-100 transition-opacity text-base leading-none">
        {icon}
      </span>
      <span className="tracking-wide">{label}</span>
    </Link>
  )
}
