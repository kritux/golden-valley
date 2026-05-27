'use client'

import { useEffect, useState, useCallback } from 'react'
import { GoldButton, GoldSpinner } from '@/components/ui/gold-button'
import type { SellerWithProfile } from '@/types'

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<SellerWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    recruiter_seller_id: '',
  })

  const fetchSellers = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/sellers')
    const data = await res.json()
    setSellers(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchSellers() }, [fetchSellers])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError(null)
    setCreateLoading(true)

    const body: Record<string, string> = {
      email: form.email,
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone,
    }
    if (form.recruiter_seller_id) body.recruiter_seller_id = form.recruiter_seller_id

    const res = await fetch('/api/admin/sellers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()

    if (!res.ok) {
      setCreateError(data.error ?? 'Failed to create seller')
      setCreateLoading(false)
      return
    }

    setShowModal(false)
    setForm({ first_name: '', last_name: '', email: '', phone: '', recruiter_seller_id: '' })
    await fetchSellers()
    setCreateLoading(false)
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-[var(--font-playfair)] text-3xl font-bold text-[var(--white)] mb-1">
            Sellers
          </h1>
          <p className="text-[var(--white-muted)] text-sm">{sellers.length} registered sellers</p>
        </div>
        <GoldButton size="sm" onClick={() => setShowModal(true)}>
          + New Seller
        </GoldButton>
      </div>

      {/* Table */}
      <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <GoldSpinner size={28} />
          </div>
        ) : sellers.length === 0 ? (
          <p className="text-center text-[var(--white-muted)] py-16 text-sm">No sellers yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--black-border)]">
                  {['Name', 'Email', 'Referral Code', 'Level', 'Recruiter', 'Tickets', 'Commissions', 'Status'].map((h) => (
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
                {sellers.map((s, i) => (
                  <tr
                    key={s.id}
                    className={`border-b border-[var(--black-border)]/50 hover:bg-[var(--black-surface)] transition-colors ${
                      i % 2 === 0 ? '' : 'bg-[var(--black-surface)]/30'
                    }`}
                  >
                    <td className="px-5 py-3 text-[var(--white)] whitespace-nowrap font-medium">
                      {s.profile?.first_name} {s.profile?.last_name}
                    </td>
                    <td className="px-5 py-3 text-[var(--white-muted)] text-xs">
                      {s.profile?.email}
                    </td>
                    <td className="px-5 py-3 font-[var(--font-dm-mono)] text-[var(--gold)] text-xs tracking-widest">
                      {s.referral_code}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="bg-[var(--black-surface)] border border-[var(--black-border)] text-[var(--white-muted)] text-xs px-2 py-0.5 rounded-sm font-[var(--font-dm-mono)]">
                        L{s.level}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[var(--white-muted)] text-xs whitespace-nowrap">
                      {s.recruiter?.profile
                        ? `${s.recruiter.profile.first_name} ${s.recruiter.profile.last_name}`
                        : '—'}
                    </td>
                    <td className="px-5 py-3 font-[var(--font-dm-mono)] text-[var(--white)]">
                      {s.total_sales}
                    </td>
                    <td className="px-5 py-3 font-[var(--font-dm-mono)] text-[var(--white)]">
                      ${s.total_commissions_earned.toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-sm text-xs border uppercase tracking-wide ${
                          s.is_active
                            ? 'bg-green-900/30 text-green-400 border-green-800/30'
                            : 'bg-[var(--black-surface)] text-[var(--white-muted)] border-[var(--black-border)]'
                        }`}
                      >
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Seller Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-[var(--black-card)] border border-[var(--gold)]/30 rounded-sm w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-[var(--font-playfair)] text-xl font-bold text-[var(--white)]">
                Create New Seller
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-[var(--white-muted)] hover:text-[var(--white)] text-xl p-1"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name">
                  <input
                    required
                    value={form.first_name}
                    onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                    className={inputCls}
                    placeholder="John"
                  />
                </Field>
                <Field label="Last Name">
                  <input
                    required
                    value={form.last_name}
                    onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                    className={inputCls}
                    placeholder="Doe"
                  />
                </Field>
              </div>

              <Field label="Email">
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className={inputCls}
                  placeholder="john@example.com"
                />
              </Field>

              <Field label="Phone">
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className={inputCls}
                  placeholder="+1 (555) 000-0000"
                />
              </Field>

              <Field label="Recruiter (optional)">
                <select
                  value={form.recruiter_seller_id}
                  onChange={(e) => setForm((f) => ({ ...f, recruiter_seller_id: e.target.value }))}
                  className={`${inputCls} cursor-pointer`}
                >
                  <option value="">— None —</option>
                  {sellers.filter((s) => s.is_active).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.profile?.first_name} {s.profile?.last_name} ({s.referral_code})
                    </option>
                  ))}
                </select>
              </Field>

              {createError && (
                <p className="text-red-400 text-sm border border-red-900/50 bg-red-900/10 rounded-sm px-3 py-2">
                  {createError}
                </p>
              )}

              <GoldButton type="submit" loading={createLoading} size="md" className="w-full mt-1">
                Create Seller Account
              </GoldButton>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const inputCls =
  'w-full bg-[var(--black-surface)] border border-[var(--black-border)] text-[var(--white)] rounded-sm px-3 py-2 text-sm outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] placeholder:text-[var(--white-muted)]/40'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-[var(--white-muted)] mb-1.5 font-medium">
        {label}
      </label>
      {children}
    </div>
  )
}
