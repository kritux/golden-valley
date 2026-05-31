'use client'

import Link from 'next/link'

const YEAR = new Date().getFullYear()

export function SiteFooter() {
  return (
    <footer className="bg-[#0B0B0B] border-t border-[var(--black-border)]">
      {/* Main footer grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Brand */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className="w-9 h-9 flex items-center justify-center font-black text-xs tracking-widest text-black shrink-0"
              style={{ background: 'linear-gradient(135deg, #A68B28, #D4AF37, #E8CC7A)' }}
            >
              GV
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-white/70">
              Golden Valley<br />Members
            </span>
          </div>
          <p className="text-white/35 text-xs leading-relaxed mb-4">
            An exclusive 1,000-ticket raffle with three prize tiers totaling over $180,000 in cash and prizes. Operated by Golden Valley Members LLC.
          </p>
          <p className="text-white/20 text-[10px] uppercase tracking-widest">
            California, United States
          </p>
        </div>

        {/* Navigation */}
        <div>
          <p className="text-[var(--gold)] text-[10px] font-black uppercase tracking-[0.3em] mb-4">Navigation</p>
          <ul className="space-y-2.5">
            {[
              { label: 'Home', href: '/' },
              { label: 'Prizes', href: '/#prizes' },
              { label: 'How It Works', href: '/#how-it-works' },
              { label: 'Winners', href: '/winners' },
              { label: 'Ticket Board', href: '/tickets' },
              { label: 'Get Your Ticket', href: '/#buy-form' },
            ].map(({ label, href }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="text-white/40 text-xs hover:text-[var(--gold)] transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <p className="text-[var(--gold)] text-[10px] font-black uppercase tracking-[0.3em] mb-4">Legal</p>
          <ul className="space-y-2.5">
            {[
              { label: 'Terms of Use', href: '/terms' },
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Data Management (CA)', href: '/data-management' },
              { label: 'Official Rules', href: '/terms#official-rules' },
              { label: 'Refund Policy', href: '/terms#refunds' },
            ].map(({ label, href }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="text-white/40 text-xs hover:text-[var(--gold)] transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact / Communication */}
        <div>
          <p className="text-[var(--gold)] text-[10px] font-black uppercase tracking-[0.3em] mb-4">Contact Us</p>
          <ul className="space-y-3">
            <li>
              <p className="text-white/25 text-[9px] uppercase tracking-widest mb-0.5">Email</p>
              <a
                href="mailto:support@goldenvalleymembers.com"
                className="text-white/50 text-xs hover:text-[var(--gold)] transition-colors"
              >
                support@goldenvalleymembers.com
              </a>
            </li>
            <li>
              <p className="text-white/25 text-[9px] uppercase tracking-widest mb-0.5">General Inquiries</p>
              <a
                href="mailto:info@goldenvalleymembers.com"
                className="text-white/50 text-xs hover:text-[var(--gold)] transition-colors"
              >
                info@goldenvalleymembers.com
              </a>
            </li>
            <li>
              <p className="text-white/25 text-[9px] uppercase tracking-widest mb-1.5">Social Media</p>
              <div className="flex items-center gap-3">
                {[
                  {
                    label: 'Instagram',
                    href: '#',
                    icon: (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                        <circle cx="12" cy="12" r="4"/>
                        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                      </svg>
                    ),
                  },
                  {
                    label: 'Facebook',
                    href: '#',
                    icon: (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                      </svg>
                    ),
                  },
                  {
                    label: 'TikTok',
                    href: '#',
                    icon: (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
                      </svg>
                    ),
                  },
                  {
                    label: 'YouTube',
                    href: '#',
                    icon: (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M22.54 6.42A2.78 2.78 0 0 0 20.59 4.47C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.53C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
                        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
                      </svg>
                    ),
                  },
                ].map(({ label, href, icon }) => (
                  <a
                    key={label}
                    href={href}
                    title={label}
                    className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-white/35 hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors"
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[var(--black-border)] mx-4 sm:mx-6" />

      {/* Bottom bar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-white/20 text-[10px] uppercase tracking-widest text-center sm:text-left">
          © {YEAR} Golden Valley Members LLC · All Rights Reserved
        </p>
        <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest">
          <Link href="/terms" className="text-white/25 hover:text-white/50 transition-colors">Terms</Link>
          <Link href="/privacy" className="text-white/25 hover:text-white/50 transition-colors">Privacy</Link>
          <Link href="/data-management" className="text-white/25 hover:text-white/50 transition-colors">Data Rights</Link>
        </div>
        <p className="text-white/15 text-[10px] text-center sm:text-right">
          Operated under California law · 18+ only · Void where prohibited
        </p>
      </div>
    </footer>
  )
}
