'use client'

import { useEffect, useState, useCallback } from 'react'
import { GoldSpinner } from '@/components/ui/gold-button'
import type { CommissionWithRelations, CommissionStatus } from '@/types'

interface CommissionsResponse {
  data: CommissionWithRelations[]
  page: number
  total: number
  per_page: number
}

const STATUS_STYLES: Record<CommissionStatus, string> = {
  pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/30',
  approved: 'bg-blue-900/30 text-blue-400 border-blue-800/30',
  paid: 'bg-green-900/30 text-green-400 border-green-800/30',
}

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<CommissionWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [perPage, setPerPage] = useState(20)
  const [statusFilter, setStatusFilter] = useState('')

  const fetchCommissions = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    params.set('page', String(page))

    const res = await fetch(`/api/admin/commissions?${params}`)
    const json: CommissionsResponse = await res.json()
    setCommissions(json.data ?? [])
    setTotal(json.total ?? 0)
    setPerPage(json.per_page ?? 20)
    setLoading(false)
  }, [statusFilter, page])

  useEffect(() => { fetchCommissions() }, [fetchCommissions])

  const totalPages = Math.ceil(total / perPage)

  // Compute totals from current page
  const pendingTotal = commissions
    .filter((c) => c.status === 'pending')
    .reduce((s, c) => s + c.amount, 0)
  const approvedTotal = commissions
    .filter((c) => c.status === 'approved')
    .reduce((s, c) => s + c.amount, 0)
  const paidTotal = commissions
    .filter((c) => c.status === 'paid')
    .reduce((s, c) => s + c.amount, 0)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-[var(--font-playfair)] text-3xl font-bold text-[var(--white)] mb-1">
          Commissions
        </h1>
        <p className="text-[var(--white-muted)] text-sm">{total} total commission entries</p>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="bg-[var(--black-card)] border border-[var(--black-border)] text-[var(--white)] text-sm rounded-sm px-4 py-2 outline-none focus:border-[var(--gold)] cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <GoldSpinner size={28} />
          </div>
        ) : commissions.length === 0 ? (
          <p className="text-center text-[var(--white-muted)] py-16 text-sm">No commissions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--black-border)]">
                  {['Date', 'Seller', 'Level', 'Ticket #', 'Amount', 'Status'].map((h) => (
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
                    <td className="px-5 py-3 text-[var(--white)] whitespace-nowrap">
                      {c.seller?.profile
                        ? `${c.seller.profile.first_name} ${c.seller.profile.last_name}`
                        : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-[var(--font-dm-mono)] text-[var(--white-muted)] bg-[var(--black-surface)] border border-[var(--black-border)] px-2 py-0.5 rounded-sm">
                        L{c.level}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-[var(--font-dm-mono)] text-[var(--white-muted)] text-xs">
                      {c.ticket?.ticket_number
                        ? `#${String(c.ticket.ticket_number).padStart(4, '0')}`
                        : '—'}
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

              {/* Totals row */}
              <tfoot>
                <tr className="border-t-2 border-[var(--gold)]/30 bg-[var(--black-surface)]">
                  <td colSpan={4} className="px-5 py-3 text-xs uppercase tracking-widest text-[var(--white-muted)] font-medium">
                    Page Totals
                  </td>
                  <td className="px-5 py-3" colSpan={2}>
                    <div className="flex flex-wrap gap-4 text-xs font-[var(--font-dm-mono)]">
                      <span className="text-yellow-400">
                        Pending: ${pendingTotal.toLocaleString()}
                      </span>
                      <span className="text-blue-400">
                        Approved: ${approvedTotal.toLocaleString()}
                      </span>
                      <span className="text-green-400">
                        Paid: ${paidTotal.toLocaleString()}
                      </span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-[var(--white-muted)] text-xs">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm text-[var(--white-muted)] bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm disabled:opacity-40 hover:border-[var(--gold)] hover:text-[var(--white)] transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm text-[var(--white-muted)] bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm disabled:opacity-40 hover:border-[var(--gold)] hover:text-[var(--white)] transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
