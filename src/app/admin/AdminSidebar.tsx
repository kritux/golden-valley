'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import AdminSignOutButton from './AdminSignOutButton'

const navLinks = [
  { href: '/admin', label: 'Overview', icon: '◈' },
  { href: '/admin/customers', label: 'Customers', icon: '◐' },
  { href: '/admin/payments', label: 'Payments', icon: '◉' },
  { href: '/admin/sellers', label: 'Sellers', icon: '◎' },
  { href: '/admin/commissions', label: 'Commissions', icon: '◇' },
  { href: '/admin/export', label: 'Export', icon: '◫' },
]

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col h-full w-[240px] bg-[var(--black-surface)] border-r border-[var(--black-border)]">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-[var(--black-border)] flex items-center justify-between">
        <Link href="/" className="group">
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
          <p className="text-[var(--white-muted)] text-[10px] tracking-[0.25em] uppercase mt-0.5 group-hover:text-[var(--gold)] transition-colors">
            Admin Panel
          </p>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[var(--white-muted)] hover:text-[var(--white)] text-xl leading-none lg:hidden"
            aria-label="Close menu"
          >
            ×
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navLinks.map((link) => {
          const isActive = link.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors duration-150 group ${
                isActive
                  ? 'text-[var(--white)] bg-[var(--black-card)] border border-[var(--gold)]/20'
                  : 'text-[var(--white-muted)] hover:text-[var(--white)] hover:bg-[var(--black-card)]'
              }`}
            >
              <span className={`text-base leading-none transition-opacity ${isActive ? 'text-[var(--gold)] opacity-100' : 'text-[var(--gold)] opacity-60 group-hover:opacity-100'}`}>
                {link.icon}
              </span>
              <span className="tracking-wide">{link.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom: Sign Out + Home */}
      <div className="px-4 py-4 border-t border-[var(--black-border)] space-y-1">
        <AdminSignOutButton />
        <Link
          href="/"
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-sm text-sm text-[var(--white-muted)] hover:text-[var(--gold)] transition-colors duration-150"
        >
          <span className="text-base leading-none">←</span>
          <span className="tracking-wide">Back to Home</span>
        </Link>
      </div>
    </aside>
  )
}

export default function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex fixed top-0 left-0 h-full z-40">
        <SidebarContent />
      </div>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 flex flex-col items-center justify-center gap-1.5 bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm"
        aria-label="Open menu"
      >
        <span className="w-5 h-0.5 bg-[var(--gold)]" />
        <span className="w-5 h-0.5 bg-[var(--gold)]" />
        <span className="w-5 h-0.5 bg-[var(--gold)]" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
