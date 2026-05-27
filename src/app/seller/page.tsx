'use client'

import { useEffect, useState } from 'react'
import { StatCard } from '@/components/ui/stat-card'
import { TicketBadge } from '@/components/ui/ticket-badge'
import { GoldSpinner } from '@/components/ui/gold-button'
import type { SellerDashboardStats, TicketWithRelations } from '@/types'

export default function SellerOverviewPage() {
  const [stats, setStats] = useState<SellerDashboardStats | null>(null)
  const [tickets, setTickets] = useState<TicketWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/seller/dashboard').then((r) => r.json()),
      fetch('/api/seller/tickets').then((r) => r.json()),
    ]).then(([dashData, ticketData]) => {
      setStats(dashData)
      const arr = Array.isArray(ticketData) ? ticketData : ticketData.data ?? []
      setTickets(arr.slice(0, 5))
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <GoldSpinner size={32} />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-[var(--font-playfair)] text-3xl font-bold text-[var(--white)] mb-1">
          My Sales
        </h1>
        <p className="text-[var(--white-muted)] text-sm">Your performance at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Tickets Sold" value={stats?.tickets_sold ?? 0} icon={<TicketIcon />} />
        <StatCard
          label="Commissions Earned"
          value={`$${(stats?.commissions_earned ?? 0).toLocaleString()}`}
          icon={<EarnedIcon />}
        />
        <StatCard
          label="Pending Commissions"
          value={`$${(stats?.commissions_pending ?? 0).toLocaleString()}`}
          icon={<PendingIcon />}
        />
      </div>

      {/* Recent Sales */}
      <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--black-border)]">
          <h2 className="text-sm font-semibold text-[var(--white)] uppercase tracking-widest">
            Recent Sales
          </h2>
        </div>

        {tickets.length === 0 ? (
          <p className="text-center text-[var(--white-muted)] py-12 text-sm">
            No tickets sold yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--black-border)]">
                  {['Ticket #', 'Client', 'Date', 'Payment', 'Commission'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-[var(--gold)] text-xs uppercase tracking-widest font-semibold"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map((t, i) => (
                  <tr
                    key={t.id}
                    className={`border-b border-[var(--black-border)]/50 hover:bg-[var(--black-surface)] transition-colors ${
                      i % 2 === 0 ? '' : 'bg-[var(--black-surface)]/30'
                    }`}
                  >
                    <td className="px-5 py-3">
                      {t.ticket_number ? (
                        <TicketBadge number={t.ticket_number} size="sm" />
                      ) : (
                        <span className="text-[var(--white-muted)] text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[var(--white)] whitespace-nowrap">
                      {t.buyer ? `${t.buyer.first_name} ${t.buyer.last_name}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-[var(--white-muted)] font-[var(--font-dm-mono)] text-xs whitespace-nowrap">
                      {new Date(t.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <PaymentStatusBadge status={t.payment?.status} />
                    </td>
                    <td className="px-5 py-3 text-[var(--white-muted)] text-xs">
                      {t.payment?.status === 'confirmed' ? (
                        <span className="text-green-400 text-xs uppercase tracking-wide">Earned</span>
                      ) : (
                        <span className="text-yellow-400 text-xs uppercase tracking-wide">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function PaymentStatusBadge({ status }: { status?: string }) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/30',
    under_review: 'bg-blue-900/30 text-blue-400 border-blue-800/30',
    confirmed: 'bg-green-900/30 text-green-400 border-green-800/30',
    rejected: 'bg-red-900/30 text-red-400 border-red-800/30',
  }
  const label = status ?? 'unknown'
  return (
    <span className={`px-2 py-0.5 rounded-sm text-xs border uppercase tracking-wide ${map[label] ?? 'text-[var(--white-muted)]'}`}>
      {label.replace('_', ' ')}
    </span>
  )
}

function TicketIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 0 0-2 2v3a2 2 0 0 1 0 4v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 0 1 0-4V7a2 2 0 0 0-2-2H5z" strokeLinecap="round" />
    </svg>
  )
}

function EarnedIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" />
    </svg>
  )
}

function PendingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4l3 3" strokeLinecap="round" />
    </svg>
  )
}
