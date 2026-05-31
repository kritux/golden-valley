'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { GoldButton, GoldSpinner } from '@/components/ui/gold-button'
import { TicketBadge } from '@/components/ui/ticket-badge'
import type { PaymentWithRelations, PaymentStatus, PaymentMethod } from '@/types'

interface PaymentsResponse {
  data: PaymentWithRelations[]
  page: number
  total: number
  per_page: number
}

const STATUS_STYLES: Record<PaymentStatus, string> = {
  pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/30',
  under_review: 'bg-blue-900/30 text-blue-400 border-blue-800/30',
  confirmed: 'bg-green-900/30 text-green-400 border-green-800/30',
  rejected: 'bg-red-900/30 text-red-400 border-red-800/30',
}

export default function AdminPaymentsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [payments, setPayments] = useState<PaymentWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [perPage, setPerPage] = useState(20)
  const [status, setStatus] = useState<string>(searchParams.get('status') ?? '')
  const [method, setMethod] = useState<string>('')

  // Modal state
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithRelations | null>(null)
  const [modalAction, setModalAction] = useState<'verify' | 'reject' | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (method) params.set('method', method)
    params.set('page', String(page))

    const res = await fetch(`/api/admin/payments?${params}`)
    const json: PaymentsResponse = await res.json()
    setPayments(json.data ?? [])
    setTotal(json.total ?? 0)
    setPerPage(json.per_page ?? 20)
    setLoading(false)
  }, [status, method, page])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  async function handleVerify(id: string) {
    setActionLoading(true)
    await fetch(`/api/admin/payments/${id}/verify`, { method: 'POST' })
    setSelectedPayment(null)
    setModalAction(null)
    await fetchPayments()
    setActionLoading(false)
  }

  async function handleReject(id: string) {
    setActionLoading(true)
    await fetch(`/api/admin/payments/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: rejectNotes }),
    })
    setSelectedPayment(null)
    setModalAction(null)
    setRejectNotes('')
    await fetchPayments()
    setActionLoading(false)
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-[var(--font-playfair)] text-3xl font-bold text-[var(--white)] mb-1">
          Payments
        </h1>
        <p className="text-[var(--white-muted)] text-sm">{total} total payments</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="bg-[var(--black-card)] border border-[var(--black-border)] text-[var(--white)] text-sm rounded-sm px-4 py-2 outline-none focus:border-[var(--gold)] cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="confirmed">Confirmed</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={method}
          onChange={(e) => { setMethod(e.target.value); setPage(1) }}
          className="bg-[var(--black-card)] border border-[var(--black-border)] text-[var(--white)] text-sm rounded-sm px-4 py-2 outline-none focus:border-[var(--gold)] cursor-pointer"
        >
          <option value="">All Methods</option>
          <option value="zelle">Zelle</option>
          <option value="stripe">Stripe</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <GoldSpinner size={28} />
          </div>
        ) : payments.length === 0 ? (
          <p className="text-center text-[var(--white-muted)] py-16 text-sm">No payments found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--black-border)]">
                  {['Ticket #', 'Buyer', 'Amount', 'Method', 'Status', 'Date', 'Actions'].map((h) => (
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
                {payments.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`border-b border-[var(--black-border)]/50 transition-colors hover:bg-[var(--black-surface)] ${
                      i % 2 === 0 ? '' : 'bg-[var(--black-surface)]/30'
                    }`}
                  >
                    <td className="px-5 py-3">
                      {p.ticket?.ticket_number ? (
                        <TicketBadge number={p.ticket.ticket_number} size="sm" />
                      ) : (
                        <span className="text-[var(--white-muted)] text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[var(--white)] whitespace-nowrap">
                      {p.buyer ? `${p.buyer.first_name} ${p.buyer.last_name}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-[var(--white)] font-[var(--font-dm-mono)]">
                      ${p.amount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <span className="uppercase text-xs tracking-widest text-[var(--white-muted)]">
                        {p.method}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-5 py-3 text-[var(--white-muted)] whitespace-nowrap font-[var(--font-dm-mono)] text-xs">
                      {new Date(p.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3">
                      {(p.status === 'under_review' || p.status === 'pending') ? (
                        <button
                          onClick={() => { setSelectedPayment(p); setModalAction('verify') }}
                          className="text-[var(--gold)] text-xs uppercase tracking-widest hover:text-[var(--gold-light)] transition-colors border border-[var(--gold)]/30 px-3 py-1 rounded-sm hover:border-[var(--gold)] whitespace-nowrap"
                        >
                          Review
                        </button>
                      ) : (
                        <span className="text-[var(--white-muted)] text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
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

      {/* Review Modal */}
      {selectedPayment && modalAction === 'verify' && (
        <Modal onClose={() => { setSelectedPayment(null); setModalAction(null); setRejectNotes('') }}>
          <h2 className="font-[var(--font-playfair)] text-xl font-bold text-[var(--white)] mb-4">
            Review Zelle Payment
          </h2>

          <div className="space-y-3 mb-5 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--white-muted)]">Buyer</span>
              <span className="text-[var(--white)]">
                {selectedPayment.buyer
                  ? `${selectedPayment.buyer.first_name} ${selectedPayment.buyer.last_name}`
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--white-muted)]">Amount</span>
              <span className="text-[var(--white)] font-[var(--font-dm-mono)]">
                ${selectedPayment.amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--white-muted)]">Submitted</span>
              <span className="text-[var(--white)] font-[var(--font-dm-mono)] text-xs">
                {new Date(selectedPayment.created_at).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Receipt Image */}
          {selectedPayment.zelle_receipt_url ? (
            <div className="mb-5">
              <p className="text-xs uppercase tracking-widest text-[var(--white-muted)] mb-2">
                Receipt
              </p>
              <div className="relative w-full h-64 bg-[var(--black-surface)] rounded-sm border border-[var(--black-border)] overflow-hidden">
                <Image
                  src={selectedPayment.zelle_receipt_url}
                  alt="Zelle receipt"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
          ) : (
            <p className="text-[var(--white-muted)] text-sm mb-5 italic">No receipt image uploaded.</p>
          )}

          {/* Reject notes */}
          <div className="mb-5">
            <label className="block text-xs uppercase tracking-widest text-[var(--white-muted)] mb-2">
              Rejection Notes (optional)
            </label>
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              rows={2}
              placeholder="Reason for rejection..."
              className="w-full bg-[var(--black-surface)] border border-[var(--black-border)] text-[var(--white)] rounded-sm px-3 py-2 text-sm outline-none focus:border-[var(--gold)] resize-none placeholder:text-[var(--white-muted)]/40"
            />
          </div>

          <div className="flex gap-3">
            <GoldButton
              size="sm"
              loading={actionLoading}
              onClick={() => handleVerify(selectedPayment.id)}
              className="flex-1"
            >
              Approve
            </GoldButton>
            <button
              onClick={() => handleReject(selectedPayment.id)}
              disabled={actionLoading}
              className="flex-1 px-4 py-2 text-sm text-red-400 border border-red-800/50 rounded-sm hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-xs border font-medium uppercase tracking-wide ${STATUS_STYLES[status]}`}
    >
      {status === 'under_review' && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-400" />
        </span>
      )}
      {status.replace('_', ' ')}
    </span>
  )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[var(--black-card)] border border-[var(--gold)]/30 rounded-sm w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <div />
          <button
            onClick={onClose}
            className="text-[var(--white-muted)] hover:text-[var(--white)] text-xl leading-none p-1"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
