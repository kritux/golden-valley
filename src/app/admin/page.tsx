'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { StatCard } from '@/components/ui/stat-card'
import { GoldSpinner } from '@/components/ui/gold-button'
import type { AdminStats } from '@/types'

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setStats(data)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <GoldSpinner size={32} />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="p-8">
        <p className="text-red-400">Failed to load stats: {error}</p>
      </div>
    )
  }

  const ticketPct = Math.round((stats.tickets_sold / 1000) * 100)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-[var(--font-playfair)] text-3xl font-bold text-[var(--white)] mb-1">
          Overview
        </h1>
        <p className="text-[var(--white-muted)] text-sm">
          Golden Valley Members — Raffle Dashboard
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Total Revenue"
          value={`$${stats.total_revenue.toLocaleString()}`}
          icon={<RevenueIcon />}
        />
        <StatCard
          label="Tickets Sold"
          value={`${stats.tickets_sold} / 1,000`}
          icon={<TicketIcon />}
        />
        <StatCard
          label="Pending Zelle"
          value={stats.pending_zelle_count}
          icon={<PendingIcon urgent={stats.pending_zelle_count > 0} />}
        />
        <StatCard
          label="Prize Pool"
          value={`$${stats.prize_pool_total.toLocaleString()}`}
          icon={<TrophyIcon />}
        />
        <StatCard
          label="Active Sellers"
          value={stats.active_sellers}
          icon={<SellersIcon />}
        />
        <StatCard
          label="Tickets Available"
          value={stats.tickets_available}
          icon={<AvailableIcon />}
        />
      </div>

      {/* Progress Bar */}
      <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-widest text-[var(--white-muted)] font-medium">
            Raffle Progress
          </span>
          <span className="text-[var(--gold)] font-[var(--font-dm-mono)] text-sm font-medium">
            {ticketPct}%
          </span>
        </div>
        <div className="h-2 bg-[var(--black-border)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${ticketPct}%`,
              background: 'linear-gradient(90deg, var(--gold-dark), var(--gold), var(--gold-light))',
            }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-[var(--white-muted)]">
          <span>0 tickets</span>
          <span className="text-[var(--white-muted)]">{stats.tickets_sold} sold</span>
          <span>1,000 tickets</span>
        </div>
      </div>

      {/* Pending Verifications */}
      {stats.pending_zelle_count > 0 && (
        <div className="bg-[var(--black-card)] border border-[var(--black-border)] border-l-2 border-l-yellow-500 rounded-sm p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500" />
              </span>
              <div>
                <p className="text-[var(--white)] text-sm font-semibold">
                  {stats.pending_zelle_count} Pending Zelle Verification{stats.pending_zelle_count !== 1 ? 's' : ''}
                </p>
                <p className="text-[var(--white-muted)] text-xs mt-0.5">
                  Review and approve receipts to activate tickets
                </p>
              </div>
            </div>
            <Link
              href="/admin/payments?status=under_review"
              className="text-[var(--gold)] text-xs uppercase tracking-widest hover:text-[var(--gold-light)] transition-colors border border-[var(--gold)]/30 px-3 py-1.5 rounded-sm hover:border-[var(--gold)] whitespace-nowrap"
            >
              Review Now
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function RevenueIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" />
    </svg>
  )
}

function TicketIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 0 0-2 2v3a2 2 0 0 1 0 4v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 0 1 0-4V7a2 2 0 0 0-2-2H5z" strokeLinecap="round" />
    </svg>
  )
}

function PendingIcon({ urgent }: { urgent: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={urgent ? '#fbbf24' : 'currentColor'}
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4l3 3" strokeLinecap="round" />
    </svg>
  )
}

function TrophyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 21h8m-4-4v4M7 3H4a1 1 0 0 0-1 1v2a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4V4a1 1 0 0 0-1-1h-3" strokeLinecap="round" />
      <path d="M7 3h10v7a5 5 0 0 1-10 0V3z" strokeLinecap="round" />
    </svg>
  )
}

function SellersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
    </svg>
  )
}

function AvailableIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
