'use client'

import { useEffect, useState } from 'react'
import { GoldSpinner } from '@/components/ui/gold-button'
import type { SellerDashboardStats, DownlineEntry } from '@/types'

export default function SellerReferralsPage() {
  const [stats, setStats] = useState<SellerDashboardStats | null>(null)
  const [downline, setDownline] = useState<DownlineEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/seller/dashboard').then((r) => r.json()),
      fetch('/api/seller/downline').then((r) => r.json()),
    ]).then(([dash, dl]) => {
      setStats(dash)
      setDownline(Array.isArray(dl) ? dl : dl.data ?? [])
      setLoading(false)
    })
  }, [])

  function handleCopy() {
    if (!stats?.referral_link) return
    navigator.clipboard.writeText(stats.referral_link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <GoldSpinner size={32} />
      </div>
    )
  }

  const referralLink = stats?.referral_link ?? ''

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-[var(--font-playfair)] text-3xl font-bold text-[var(--white)] mb-1">
          Referrals
        </h1>
        <p className="text-[var(--white-muted)] text-sm">Share your link and grow your network</p>
      </div>

      {/* Referral Link */}
      <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm p-6 mb-6">
        <p className="text-xs uppercase tracking-widest text-[var(--white-muted)] mb-3 font-medium">
          Your Referral Link
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 bg-[var(--black-surface)] border border-[var(--black-border)] text-[var(--white)] rounded-sm px-4 py-2.5 text-sm font-[var(--font-dm-mono)] outline-none select-all cursor-text"
          />
          <button
            onClick={handleCopy}
            className={`px-5 py-2.5 rounded-sm text-sm font-semibold uppercase tracking-widest border transition-all duration-200 whitespace-nowrap ${
              copied
                ? 'bg-green-900/30 text-green-400 border-green-800/50'
                : 'text-[var(--gold)] border-[var(--gold)]/40 hover:border-[var(--gold)] hover:bg-[var(--gold)]/5'
            }`}
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        {/* QR Code */}
        {referralLink && (
          <div className="mt-5 flex flex-col items-start gap-2">
            <p className="text-xs uppercase tracking-widest text-[var(--white-muted)] font-medium">
              QR Code
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(referralLink)}&bgcolor=1A1A1A&color=C9A84C&margin=12`}
              alt="Referral QR code"
              width={180}
              height={180}
              className="rounded-sm border border-[var(--black-border)]"
            />
          </div>
        )}
      </div>

      {/* Downline */}
      <div>
        <h2 className="text-[var(--white)] font-semibold text-sm uppercase tracking-widest mb-4">
          Your Downline
          {downline.length > 0 && (
            <span className="ml-2 text-[var(--gold)] font-[var(--font-dm-mono)]">
              ({downline.length})
            </span>
          )}
        </h2>

        {downline.length === 0 ? (
          <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm p-8 text-center">
            <p className="text-[var(--white-muted)] text-sm">
              No recruits yet. Share your link to grow your network.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {downline.map((entry) => (
              <DownlineCard key={entry.seller.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DownlineCard({ entry }: { entry: DownlineEntry }) {
  const { seller, children } = entry
  const name = seller.profile
    ? `${seller.profile.first_name} ${seller.profile.last_name}`
    : seller.referral_code

  return (
    <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm">
      {/* Direct recruit row */}
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center text-[var(--gold)] text-xs font-semibold">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-[var(--white)] text-sm font-medium">{name}</p>
            <p className="text-[var(--white-muted)] text-xs font-[var(--font-dm-mono)]">
              {seller.referral_code}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[var(--white)] text-sm font-[var(--font-dm-mono)]">
            {seller.total_sales} <span className="text-[var(--white-muted)] text-xs">tickets</span>
          </p>
          <p className="text-[var(--gold-dark)] text-xs uppercase tracking-widest">L{seller.level}</p>
        </div>
      </div>

      {/* Children (L2) */}
      {children && children.length > 0 && (
        <div className="border-t border-[var(--black-border)]/50 pl-10 pr-5 py-2 space-y-2 bg-[var(--black-surface)]/40">
          {children.map((child) => {
            const childName = child.seller.profile
              ? `${child.seller.profile.first_name} ${child.seller.profile.last_name}`
              : child.seller.referral_code
            return (
              <div key={child.seller.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-[var(--gold)]/40" />
                  <p className="text-[var(--white)] text-xs">{childName}</p>
                  <span className="text-[var(--white-muted)] text-xs font-[var(--font-dm-mono)]">
                    {child.seller.referral_code}
                  </span>
                </div>
                <p className="text-[var(--white-muted)] text-xs font-[var(--font-dm-mono)]">
                  {child.seller.total_sales} tickets
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
