'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import type { TicketGridItem } from '@/types'
import { GoldSpinner } from '@/components/ui/gold-button'

// ─── Color logic ──────────────────────────────────────────────────────────────

function cellStyle(status: TicketGridItem['status']): string {
  switch (status) {
    case 'available':
      return 'bg-[var(--gold)] text-[var(--black)] hover:bg-[var(--gold-light)] cursor-pointer'
    case 'active':
      return 'bg-[var(--black-border)] text-[var(--white-muted)] cursor-default'
    case 'pending_payment':
      return 'bg-transparent text-[var(--gold)] border border-[var(--gold)] animate-pulse cursor-default'
    case 'cancelled':
      return 'bg-[var(--black-surface)] text-[var(--black-border)] cursor-default'
    default:
      return 'bg-[var(--gold)] text-[var(--black)] cursor-pointer'
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketGridItem[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch('/api/tickets/available')
      if (!res.ok) throw new Error('API error')
      const json = await res.json() as TicketGridItem[]

      if (Array.isArray(json) && json.length > 0) {
        setTickets(json)
      } else {
        setTickets(Array.from({ length: 1000 }, (_, i) => ({ number: i + 1, status: 'available' as const })))
      }
      setLastUpdated(new Date())
    } catch {
      // API failed — show all 1,000 as available so the grid is never blank
      setTickets(Array.from({ length: 1000 }, (_, i) => ({ number: i + 1, status: 'available' as const })))
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const id = setInterval(() => {
      fetchTickets()
    }, 30_000)
    return () => clearInterval(id)
  }, [fetchTickets])

  const handleTicketClick = (ticket: TicketGridItem) => {
    if (ticket.status !== 'available') return
    window.location.href = `/?highlight=${ticket.number}#buy-form`
  }

  // Stats
  const availableCount = tickets.filter((t) => t.status === 'available').length
  const soldCount = tickets.filter((t) => t.status === 'active').length
  const pendingCount = tickets.filter((t) => t.status === 'pending_payment').length

  return (
    <main className="min-h-screen bg-[var(--black)] bg-gold-pattern px-4 py-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[var(--gold-dark)] hover:text-[var(--gold)] text-xs uppercase tracking-widest font-[var(--font-dm-mono)] transition-colors duration-150 mb-8"
          >
            ← Back to Home
          </Link>

          <p className="text-[var(--gold)] uppercase tracking-[0.4em] text-xs mb-4 font-[var(--font-dm-sans)]">
            — Ticket Registry —
          </p>
          <h1 className="font-[var(--font-playfair)] text-3xl md:text-5xl text-gold-gradient mb-4">
            All 1,000 Tickets — 000 to 999
          </h1>
          <p className="text-[var(--white-muted)] text-sm">
            Click an available (gold) number to purchase that ticket
          </p>

          {lastUpdated && (
            <p className="text-[var(--white-muted)] text-xs mt-2 font-[var(--font-dm-mono)]">
              Last updated: {lastUpdated.toLocaleTimeString()} — auto-refreshes every 30s
            </p>
          )}
        </div>

        {/* Legend + stats */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm p-4">
          <div className="flex flex-wrap gap-5 text-xs font-[var(--font-dm-mono)]">
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-sm bg-[var(--gold)] inline-block" />
              Available
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-sm bg-[var(--black-border)] inline-block" />
              Sold
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-sm border border-[var(--gold)] inline-block" />
              Pending
            </span>
          </div>

          <div className="flex flex-wrap gap-4 text-xs font-[var(--font-dm-mono)] text-[var(--white-muted)]">
            <span>
              <span className="text-[var(--gold)]">{availableCount}</span> available
            </span>
            <span>
              <span className="text-[var(--white-muted)]">{soldCount}</span> sold
            </span>
            {pendingCount > 0 && (
              <span>
                <span className="text-[var(--gold-dark)]">{pendingCount}</span> pending
              </span>
            )}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <GoldSpinner size={32} />
              <p className="text-[var(--white-muted)] text-sm">Loading ticket registry...</p>
            </div>
          </div>
        ) : (
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: 'repeat(25, minmax(0, 1fr))' }}
          >
            {tickets.map((ticket) => (
              <div
                key={ticket.number}
                title={`#${String(ticket.number - 1).padStart(3, '0')} — ${ticket.status}`}
                onClick={() => handleTicketClick(ticket)}
                role={ticket.status === 'available' ? 'button' : undefined}
                tabIndex={ticket.status === 'available' ? 0 : undefined}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleTicketClick(ticket)
                }}
                className={[
                  'aspect-square rounded-sm flex items-center justify-center',
                  'font-[var(--font-dm-mono)] text-[9px] transition-all duration-150',
                  'select-none',
                  cellStyle(ticket.status),
                ].join(' ')}
              >
                {String(ticket.number - 1).padStart(3, '0')}
              </div>
            ))}
          </div>
        )}

        {/* Progress bar */}
        {!loading && tickets.length > 0 && (
          <div className="mt-10">
            <div className="flex justify-between text-xs font-[var(--font-dm-mono)] text-[var(--white-muted)] mb-2">
              <span>{soldCount} sold</span>
              <span>{availableCount} remaining of 1,000</span>
            </div>
            <div className="h-2 bg-[var(--black-border)] rounded-full overflow-hidden">
              <div
                className="h-full btn-gold-shimmer rounded-full transition-all duration-500"
                style={{ width: `${(soldCount / 1000) * 100}%` }}
              />
            </div>
            <p className="text-center text-xs text-[var(--white-muted)] mt-3 font-[var(--font-dm-mono)]">
              Draw occurs when ticket #1,000 is sold
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/#buy-form"
            className="inline-flex items-center gap-3 btn-gold-shimmer text-[var(--black)] font-semibold uppercase tracking-widest text-sm px-8 py-4 rounded-sm hover:shadow-[0_0_24px_rgba(201,168,76,0.5)] transition-all duration-200"
          >
            GET YOUR TICKET — $500
          </Link>
        </div>
      </div>
    </main>
  )
}
