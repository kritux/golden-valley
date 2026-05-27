'use client'

import { useEffect, useState } from 'react'
import { TicketBadge } from '@/components/ui/ticket-badge'
import { GoldSpinner } from '@/components/ui/gold-button'
import type { TicketWithRelations } from '@/types'

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/30',
  under_review: 'bg-blue-900/30 text-blue-400 border-blue-800/30',
  confirmed: 'bg-green-900/30 text-green-400 border-green-800/30',
  rejected: 'bg-red-900/30 text-red-400 border-red-800/30',
}

export default function SellerClientsPage() {
  const [tickets, setTickets] = useState<TicketWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/seller/tickets')
      .then((r) => r.json())
      .then((data) => {
        setTickets(Array.isArray(data) ? data : data.data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-[var(--font-playfair)] text-3xl font-bold text-[var(--white)] mb-1">
          My Clients
        </h1>
        <p className="text-[var(--white-muted)] text-sm">{tickets.length} clients total</p>
      </div>

      <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <GoldSpinner size={28} />
          </div>
        ) : tickets.length === 0 ? (
          <p className="text-center text-[var(--white-muted)] py-16 text-sm">No clients yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--black-border)]">
                  {['Ticket #', 'Name', 'Email', 'Phone', 'Payment Status', 'Commission'].map((h) => (
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
                        <span className="text-[var(--white-muted)] text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[var(--white)] whitespace-nowrap font-medium">
                      {t.buyer ? `${t.buyer.first_name} ${t.buyer.last_name}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-[var(--white-muted)] text-xs">
                      {t.buyer?.email ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-[var(--white-muted)] font-[var(--font-dm-mono)] text-xs whitespace-nowrap">
                      {t.buyer?.phone ?? '—'}
                    </td>
                    <td className="px-5 py-3">
                      {t.payment?.status ? (
                        <span
                          className={`px-2 py-0.5 rounded-sm text-xs border uppercase tracking-wide ${
                            PAYMENT_STATUS_STYLES[t.payment.status] ?? 'text-[var(--white-muted)]'
                          }`}
                        >
                          {t.payment.status.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-[var(--white-muted)] text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {t.payment?.status === 'confirmed' ? (
                        <span className="text-green-400 text-xs uppercase tracking-wide font-medium">
                          $100
                        </span>
                      ) : (
                        <span className="text-[var(--white-muted)] text-xs uppercase tracking-wide">
                          Pending
                        </span>
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
