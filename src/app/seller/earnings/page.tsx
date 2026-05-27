'use client'

import { useEffect, useState } from 'react'
import { StatCard } from '@/components/ui/stat-card'
import { GoldSpinner } from '@/components/ui/gold-button'
import type { CommissionWithRelations, CommissionStatus } from '@/types'

const STATUS_STYLES: Record<CommissionStatus, string> = {
  pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/30',
  approved: 'bg-blue-900/30 text-blue-400 border-blue-800/30',
  paid: 'bg-green-900/30 text-green-400 border-green-800/30',
}

export default function SellerEarningsPage() {
  const [commissions, setCommissions] = useState<CommissionWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/seller/commissions')
      .then((r) => r.json())
      .then((data) => {
        setCommissions(Array.isArray(data) ? data : data.data ?? [])
        setLoading(false)
      })
  }, [])

  const totalEarned = commissions
    .filter((c) => c.status !== 'pending')
    .reduce((s, c) => s + c.amount, 0)
  const totalPending = commissions
    .filter((c) => c.status === 'pending')
    .reduce((s, c) => s + c.amount, 0)
  const totalPaid = commissions
    .filter((c) => c.status === 'paid')
    .reduce((s, c) => s + c.amount, 0)

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
          Earnings
        </h1>
        <p className="text-[var(--white-muted)] text-sm">Your commission history and totals</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Total Earned"
          value={`$${totalEarned.toLocaleString()}`}
          icon={<EarnedIcon />}
        />
        <StatCard
          label="Pending"
          value={`$${totalPending.toLocaleString()}`}
          icon={<PendingIcon />}
        />
        <StatCard
          label="Paid Out"
          value={`$${totalPaid.toLocaleString()}`}
          icon={<PaidIcon />}
        />
      </div>

      {/* Ledger */}
      <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--black-border)]">
          <h2 className="text-sm font-semibold text-[var(--white)] uppercase tracking-widest">
            Commission Ledger
          </h2>
        </div>

        {commissions.length === 0 ? (
          <p className="text-center text-[var(--white-muted)] py-12 text-sm">No commissions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--black-border)]">
                  {['Date', 'Ticket #', 'Level', 'Amount', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-[var(--gold)] text-xs uppercase tracking-widest font-semibold whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {commissions.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`border-b border-[var(--black-border)]/50 hover:bg-[var(--black-surface)] transition-colors ${
                      i % 2 === 0 ? '' : 'bg-[var(--black-surface)]/30'
                    }`}
                  >
                    <td className="px-5 py-3 text-[var(--white-muted)] font-[var(--font-dm-mono)] text-xs whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3 text-[var(--white-muted)] font-[var(--font-dm-mono)] text-xs">
                      {c.ticket?.ticket_number
                        ? `#${String(c.ticket.ticket_number).padStart(4, '0')}`
                        : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-[var(--white-muted)]">
                        {c.level === 1 ? 'L1 — Direct Sale' : 'L2 — Recruited Seller'}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-[var(--font-dm-mono)] text-[var(--white)] font-medium">
                      ${c.amount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-sm text-xs border uppercase tracking-wide ${STATUS_STYLES[c.status]}`}
                      >
                        {c.status}
                      </span>
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

function PaidIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
