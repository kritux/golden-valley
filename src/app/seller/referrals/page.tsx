'use client'

import { useEffect, useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { GoldSpinner } from '@/components/ui/gold-button'

interface ReferralCommission {
  id: string
  ticket_id: string | null
  ticket_number: number | null
  buyer_name: string
  level: 1 | 2
  amount: number
  status: 'pending' | 'approved' | 'paid'
  created_at: string
}

interface ReferralStats {
  total_referrals: number
  total_pending: number
  total_earned: number
  commissions: ReferralCommission[]
}

function formatTicketNumber(n: number | null): string {
  if (n === null) return '—'
  return String(n - 1).padStart(3, '0')
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function CommissionStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/30',
    approved: 'bg-blue-900/30 text-blue-400 border-blue-800/30',
    paid: 'bg-green-900/30 text-green-400 border-green-800/30',
  }
  return (
    <span
      className={`px-2 py-0.5 rounded-sm text-xs border uppercase tracking-wide font-medium ${
        styles[status] ?? 'text-[var(--white-muted)] border-[var(--black-border)]'
      }`}
    >
      {status}
    </span>
  )
}

function SaleCard({ commission }: { commission: ReferralCommission }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const verifyUrl = commission.ticket_id
    ? `https://goldenvalleymembers.com/verify/${commission.ticket_id}`
    : 'https://goldenvalleymembers.com'

  function handlePrint() {
    if (!cardRef.current) return
    const printContent = cardRef.current.innerHTML
    const win = window.open('', '_blank', 'width=480,height=620')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket ${formatTicketNumber(commission.ticket_number)} — Golden Valley</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500&family=DM+Mono:wght@400&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              background: #0B0B0B;
              color: #FFFFFF;
              font-family: 'DM Sans', sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 24px;
            }
            .print-card {
              background: #1A1A1A;
              border: 1px solid #2A2A2A;
              border-radius: 4px;
              padding: 28px;
              width: 380px;
              text-align: center;
            }
            .print-card h2 {
              font-family: 'Playfair Display', serif;
              color: #D4AF37;
              font-size: 20px;
              margin-bottom: 6px;
            }
            .print-card .sub {
              color: #A0A0A0;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.12em;
              margin-bottom: 20px;
            }
            .print-card .ticket-num {
              font-family: 'DM Mono', monospace;
              font-size: 32px;
              color: #D4AF37;
              margin-bottom: 20px;
            }
            .qr-wrap {
              display: flex;
              justify-content: center;
              margin-bottom: 20px;
              padding: 16px;
              background: #111;
              border: 1px solid #2A2A2A;
              border-radius: 4px;
            }
            .print-card .info {
              font-size: 13px;
              color: #A0A0A0;
              margin-top: 4px;
            }
            .print-card .info strong { color: #FFFFFF; }
          </style>
        </head>
        <body>
          <div class="print-card">
            <h2>Golden Valley Members</h2>
            <p class="sub">Ticket Verification</p>
            <div class="ticket-num">#${formatTicketNumber(commission.ticket_number)}</div>
            <div class="qr-wrap">
              <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
                ${cardRef.current.querySelector('svg')?.innerHTML ?? ''}
              </svg>
            </div>
            <p class="info">Buyer: <strong>${commission.buyer_name}</strong></p>
            <p class="info">Commission: <strong>$${commission.amount.toLocaleString()} (L${commission.level})</strong></p>
            <p class="info">Date: <strong>${formatDate(commission.created_at)}</strong></p>
            <p class="info" style="margin-top:12px; font-size:11px; color:#5a5248;">${verifyUrl}</p>
          </div>
        </body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => {
      win.print()
      win.close()
    }, 400)
  }

  return (
    <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm p-5 flex flex-col gap-4">
      {/* Card header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[var(--white)] font-medium text-sm leading-tight">{commission.buyer_name}</p>
          <p className="text-[var(--white-muted)] text-xs font-[var(--font-dm-mono)] mt-0.5">
            Ticket{' '}
            <span className="text-[var(--gold)]">#{formatTicketNumber(commission.ticket_number)}</span>
          </p>
          <p className="text-[var(--white-muted)] text-xs mt-1">{formatDate(commission.created_at)}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-1.5 justify-end mb-1.5">
            <span className="px-1.5 py-0.5 text-xs font-semibold font-[var(--font-dm-mono)] bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/20 rounded-sm">
              L{commission.level}
            </span>
            <span className="text-[var(--white)] font-semibold font-[var(--font-dm-mono)] text-sm">
              ${commission.amount.toLocaleString()}
            </span>
          </div>
          <CommissionStatusBadge status={commission.status} />
        </div>
      </div>

      {/* QR code */}
      <div ref={cardRef} className="flex justify-center bg-[var(--black-surface)] border border-[var(--black-border)] rounded-sm p-3">
        <QRCodeSVG
          value={verifyUrl}
          size={120}
          bgColor="#111111"
          fgColor="#D4AF37"
          level="M"
        />
      </div>

      {/* Print button */}
      <button
        onClick={handlePrint}
        className="w-full py-2 text-xs font-semibold uppercase tracking-widest border border-[var(--gold)]/30 text-[var(--gold)] hover:border-[var(--gold)] hover:bg-[var(--gold)]/5 rounded-sm transition-all duration-200"
      >
        Print Card
      </button>
    </div>
  )
}

export default function SellerReferralsPage() {
  const [data, setData] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/seller/referral-stats')
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setError(json.error)
        } else {
          setData(json as ReferralStats)
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load referral data.')
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

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    )
  }

  const commissions = data?.commissions ?? []

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-[var(--font-playfair)] text-3xl font-bold text-[var(--white)] mb-1">
          Referral Sales
        </h1>
        <p className="text-[var(--white-muted)] text-sm">
          Commissions earned from referred ticket purchases
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm px-5 py-4">
          <p className="text-xs uppercase tracking-widest text-[var(--white-muted)] mb-1 font-medium">
            Total Referrals
          </p>
          <p className="text-2xl font-bold font-[var(--font-dm-mono)] text-[var(--white)]">
            {data?.total_referrals ?? 0}
          </p>
        </div>

        <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm px-5 py-4">
          <p className="text-xs uppercase tracking-widest text-[var(--white-muted)] mb-1 font-medium">
            Pending Commissions
          </p>
          <p className="text-2xl font-bold font-[var(--font-dm-mono)] text-yellow-400">
            ${(data?.total_pending ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm px-5 py-4">
          <p className="text-xs uppercase tracking-widest text-[var(--white-muted)] mb-1 font-medium">
            Total Earned
          </p>
          <p className="text-2xl font-bold font-[var(--font-dm-mono)] text-green-400">
            ${(data?.total_earned ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Sales grid */}
      {commissions.length === 0 ? (
        <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm p-12 text-center">
          <p className="text-[var(--white-muted)] text-sm">
            No referral sales yet. Share your link to start earning commissions.
          </p>
        </div>
      ) : (
        <div>
          <h2 className="text-[var(--white)] font-semibold text-xs uppercase tracking-widest mb-4">
            Referred Sales
            <span className="ml-2 text-[var(--gold)] font-[var(--font-dm-mono)]">
              ({commissions.length})
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {commissions.map((commission) => (
              <SaleCard key={commission.id} commission={commission} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
