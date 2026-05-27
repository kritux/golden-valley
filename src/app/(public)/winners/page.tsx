import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Winners — Golden Valley Members',
  description: 'Official winners of the Golden Valley Members raffle. Grand prize, second prize, and daily giveaway results.',
}

// ─── Static winner data (replace with DB query when draw happens) ─────────────

type Winner = {
  season: number
  prize: string
  prizeLabel: string
  ticketNumber: number | null
  name: string
  date: string | null
  announced: boolean
}

const WINNERS: Winner[] = [
  // Season 1 — draw hasn't happened yet
  {
    season: 1,
    prize: '1st',
    prizeLabel: '2026 Toyota 4Runner Trailhunter or $70,000 Cash',
    ticketNumber: null,
    name: '—',
    date: null,
    announced: false,
  },
  {
    season: 1,
    prize: '2nd',
    prizeLabel: '$20,000 Cash',
    ticketNumber: null,
    name: '—',
    date: null,
    announced: false,
  },
  {
    season: 1,
    prize: 'Daily',
    prizeLabel: '$1,000/Day × 90 Days',
    ticketNumber: null,
    name: 'Starts Jul 31, 2026',
    date: null,
    announced: false,
  },
]

// ─── Components ───────────────────────────────────────────────────────────────

function WinnersHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--black-border)]" style={{ background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(14px)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 flex items-center justify-center font-black text-xs tracking-widest text-black shrink-0"
            style={{ background: 'linear-gradient(135deg, #8B6914, #C9A84C, #E8CC7A)' }}
          >
            GV
          </div>
          <span className="hidden sm:block text-xs font-black uppercase tracking-[0.2em] text-white/60 group-hover:text-white transition-colors">
            Golden Valley Members
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
          <Link href="/" className="px-3 py-2 text-white/40 hover:text-[var(--gold)] transition-colors">Home</Link>
          <Link href="/#prizes" className="px-3 py-2 text-white/40 hover:text-[var(--gold)] transition-colors">Prizes</Link>
          <Link href="/winners" className="px-3 py-2 text-[var(--gold)] transition-colors">Winners</Link>
          <Link href="/tickets" className="px-3 py-2 text-white/40 hover:text-[var(--gold)] transition-colors">Ticket Board</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/#buy-form"
            className="hidden sm:flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-black px-4 py-2"
            style={{ background: 'linear-gradient(135deg, #8B6914, #C9A84C, #E8CC7A)' }}
          >
            Buy Ticket
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-white/40 hover:text-[var(--gold)] transition-colors group"
          >
            <div className="w-8 h-8 rounded-full border border-white/20 group-hover:border-[var(--gold)] flex items-center justify-center transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </Link>
        </div>
      </div>
    </header>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WinnersPage() {
  const hasWinners = WINNERS.some((w) => w.announced)

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <WinnersHeader />

      {/* Page hero */}
      <section
        className="py-20 px-4 text-center relative overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at top, #1a1200 0%, #0A0A0A 60%)' }}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden" aria-hidden>
          <span
            className="font-black uppercase text-[var(--gold)] opacity-[0.03] leading-none whitespace-nowrap"
            style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(6rem, 30vw, 22rem)' }}
          >
            WIN
          </span>
        </div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-8 justify-center">
            <div className="h-px w-16 bg-[var(--gold)] opacity-40" />
            <span className="text-[var(--gold)] text-xs uppercase tracking-[0.4em] font-bold">Season 1</span>
            <div className="h-px w-16 bg-[var(--gold)] opacity-40" />
          </div>
          <h1
            className="font-black uppercase text-white leading-tight mb-4"
            style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(2.5rem, 7vw, 5rem)' }}
          >
            Official<br />
            <span
              style={{
                background: 'linear-gradient(180deg, #E8CC7A 0%, #C9A84C 50%, #8B6914 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Winners
            </span>
          </h1>
          <p className="text-white/45 text-base max-w-xl mx-auto leading-relaxed">
            All prize winners are announced here within 48 hours of the draw.
            Results are final and independently verifiable by ticket number.
          </p>
        </div>
      </section>

      {/* Status bar */}
      <div className="border-y border-[var(--black-border)] bg-[var(--black-card)] py-4 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${hasWinners ? 'bg-green-500' : 'bg-[#FF4E00] animate-pulse'}`} />
            <span className="text-xs font-black uppercase tracking-widest text-white/60">
              {hasWinners ? 'Draw Completed' : 'Draw Pending — Waiting for Ticket #1,000'}
            </span>
          </div>
          <Link
            href="/tickets"
            className="text-[10px] font-black uppercase tracking-widest text-[var(--gold)] hover:text-[var(--gold-light)] transition-colors"
          >
            View Live Ticket Board →
          </Link>
        </div>
      </div>

      {/* Winners content */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">

          {hasWinners ? (
            /* ── WINNERS ANNOUNCED ─────────────────────────────────────────── */
            <div className="space-y-4">
              {WINNERS.filter((w) => w.announced).map((winner, i) => (
                <div
                  key={i}
                  className="border border-[var(--gold)] bg-[var(--black-card)] p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6"
                >
                  <div
                    className="w-16 h-16 flex items-center justify-center font-black text-xl text-black shrink-0"
                    style={{ background: 'linear-gradient(135deg, #8B6914, #C9A84C, #E8CC7A)' }}
                  >
                    #{winner.prize}
                  </div>
                  <div className="flex-1">
                    <p className="text-[var(--gold)] text-[10px] font-black uppercase tracking-widest mb-1">{winner.prizeLabel}</p>
                    <p className="text-white font-black text-xl" style={{ fontFamily: 'var(--font-playfair)' }}>{winner.name}</p>
                    <p className="text-white/40 text-xs mt-1">Ticket #{winner.ticketNumber} · Drawn {winner.date}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2 text-green-400 text-xs font-black uppercase tracking-wider">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Verified
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── NO DRAW YET ───────────────────────────────────────────────── */
            <div>
              {/* Prize preview cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                {[
                  {
                    rank: '1st',
                    icon: '🏆',
                    prize: '2026 Toyota 4Runner Trailhunter',
                    sub: 'or $70,000 cash — winner\'s choice',
                    color: 'var(--gold)',
                    border: 'border-[var(--gold)]',
                  },
                  {
                    rank: '2nd',
                    icon: '💵',
                    prize: '$20,000 Cash',
                    sub: 'Wired directly to winner',
                    color: 'rgba(255,255,255,0.7)',
                    border: 'border-[var(--black-border)]',
                  },
                  {
                    rank: 'Daily',
                    icon: '📅',
                    prize: '$1,000 / Day × 90',
                    sub: 'Starting July 31, 2026',
                    color: '#FF4E00',
                    border: 'border-[#FF4E00]/40',
                  },
                ].map((p) => (
                  <div key={p.rank} className={`bg-[var(--black-card)] border ${p.border} p-7 flex flex-col gap-3`}>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{p.icon}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{p.rank} Prize</span>
                    </div>
                    <p className="font-black text-white text-base leading-tight">{p.prize}</p>
                    <p className="text-white/40 text-xs">{p.sub}</p>
                    <div className="mt-auto pt-3 border-t border-[var(--black-border)]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#FF4E00] animate-pulse" />
                        <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold">Awaiting Draw</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Explanation */}
              <div className="border border-[var(--black-border)] bg-[var(--black-card)] p-8 md:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                  <div>
                    <p className="text-[var(--gold)] text-xs font-black uppercase tracking-[0.3em] mb-3">How the Draw Works</p>
                    <h3
                      className="font-black uppercase text-white mb-5 leading-tight"
                      style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)' }}
                    >
                      Triggered at Ticket #1,000
                    </h3>
                    <div className="space-y-4 text-sm text-white/50 leading-relaxed">
                      <p>The draw is <strong className="text-white/80">not</strong> scheduled for a specific date. It happens automatically the moment ticket #1,000 is confirmed paid.</p>
                      <p>Two ticket numbers are randomly selected. The first wins the 4Runner (or $70K). The second wins $20,000.</p>
                      <p>Winners are contacted by email within 24 hours and announced publicly on this page within 48 hours.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-widest text-white/35 font-bold mb-4">Draw Timeline</p>
                    {[
                      { step: '01', text: 'Ticket #1,000 is confirmed' },
                      { step: '02', text: 'Random draw executed live' },
                      { step: '03', text: 'Two winners selected' },
                      { step: '04', text: 'Winners contacted within 24h' },
                      { step: '05', text: 'Results posted on this page' },
                    ].map((item) => (
                      <div key={item.step} className="flex items-center gap-4">
                        <div
                          className="w-8 h-8 flex items-center justify-center text-[10px] font-black text-black shrink-0"
                          style={{ background: 'linear-gradient(135deg, #8B6914, #C9A84C)' }}
                        >
                          {item.step}
                        </div>
                        <p className="text-white/55 text-sm">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Back to home CTA */}
          <div className="mt-12 text-center">
            <Link
              href="/#buy-form"
              className="inline-flex items-center gap-2 font-black uppercase tracking-widest text-black px-10 py-4 text-sm transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #8B6914, #C9A84C, #E8CC7A)' }}
            >
              Get Your Ticket — $500 →
            </Link>
            <p className="text-white/25 text-xs mt-4 uppercase tracking-wider">Every ticket entered is a chance to win</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--black-border)] py-8 px-4 text-center">
        <p className="text-white/20 text-xs uppercase tracking-widest">
          © {new Date().getFullYear()} Golden Valley Members LLC · All Rights Reserved
        </p>
      </footer>
    </div>
  )
}
