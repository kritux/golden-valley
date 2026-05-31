'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { GoldSpinner } from '@/components/ui/gold-button'

interface CustomerTicket {
  id: string
  ticket_number: number | null
  status: string
  activated_at: string | null
  created_at: string
}

interface CustomerPayment {
  id: string
  amount: number
  status: string
  method: string
  created_at: string
  zelle_receipt_url: string | null
}

interface Customer {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  phone_alt: string | null
  role: string
  referred_by: string | null
  seller_id: string | null
  created_at: string
  tickets: CustomerTicket[]
  payments: CustomerPayment[]
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmt(dollars: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(dollars)
}
function totalPaid(payments: CustomerPayment[]) {
  return payments.filter(p => p.status === 'confirmed').reduce((s, p) => s + p.amount, 0)
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({ customer, onClose, onSaved }: { customer: Customer; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    first_name: customer.first_name ?? '',
    last_name: customer.last_name ?? '',
    email: customer.email ?? '',
    phone: customer.phone ?? '',
    phone_alt: customer.phone_alt ?? '',
    referred_by: customer.referred_by ?? '',
    role: customer.role ?? 'customer',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/admin/customers/${customer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed'); setLoading(false); return }
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-md bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--black-border)] flex items-center justify-between">
          <h3 className="font-black uppercase tracking-widest text-white text-sm">Edit Customer</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name">
              <input className={inp} value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
            </Field>
            <Field label="Last Name">
              <input className={inp} value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
            </Field>
          </div>
          <Field label="Email">
            <input className={inp} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </Field>
          <Field label="Phone">
            <input className={inp} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </Field>
          <Field label="Alt Phone">
            <input className={inp} value={form.phone_alt} onChange={e => setForm(f => ({ ...f, phone_alt: e.target.value }))} />
          </Field>
          <Field label="Referred By">
            <input className={inp} placeholder="Referral code e.g. GV001AB" value={form.referred_by} onChange={e => setForm(f => ({ ...f, referred_by: e.target.value }))} />
          </Field>
          <Field label="Role">
            <select className={inp} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="customer">Customer</option>
              <option value="seller">Seller</option>
            </select>
          </Field>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-[var(--black-border)] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-white/50 hover:text-white border border-[var(--black-border)] hover:border-white/30 transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 text-sm font-black uppercase tracking-widest text-black disabled:opacity-50 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #A68B28, #D4AF37)' }}
          >
            {loading ? <GoldSpinner size={14} /> : null}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ customer, onClose, onEdit, onDelete }: {
  customer: Customer
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const ticket = customer.tickets?.[0] ?? null
  const paid = totalPaid(customer.payments ?? [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-lg bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--black-border)] flex items-center justify-between">
          <h3 className="font-black uppercase tracking-widest text-white text-sm">Customer Detail</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto space-y-5">
          {/* Profile */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Name" value={[customer.first_name, customer.last_name].filter(Boolean).join(' ') || '—'} />
            <Info label="Email" value={customer.email || '—'} />
            <Info label="Phone" value={customer.phone || '—'} />
            <Info label="Alt Phone" value={customer.phone_alt || '—'} />
            <Info label="Role" value={customer.role} />
            <Info label="Referred By" value={customer.referred_by || '—'} />
            <Info label="Joined" value={fmtDate(customer.created_at)} />
            <Info label="Seller ID" value={customer.seller_id || '—'} />
          </div>

          {/* Ticket */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[var(--white-muted)] font-bold mb-2">Membership</p>
            {ticket ? (
              <div className="bg-[var(--black-surface)] border border-[var(--black-border)] p-4 rounded-sm grid grid-cols-2 gap-3 text-sm">
                <Info label="Number" value={ticket.ticket_number ? `#${String(ticket.ticket_number).padStart(3,'0')}` : 'Unassigned'} />
                <Info label="Status" value={ticket.status} />
                <Info label="Total Paid" value={fmt(paid)} />
                <Info label="Balance" value={fmt(Math.max(0, 500 - paid))} />
              </div>
            ) : (
              <p className="text-white/30 text-sm">No membership yet</p>
            )}
          </div>

          {/* Payment History */}
          {(customer.payments?.length ?? 0) > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[var(--white-muted)] font-bold mb-2">Payments</p>
              <div className="space-y-2">
                {(customer.payments ?? []).map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-[var(--black-surface)] border border-[var(--black-border)] rounded-sm px-4 py-3 text-sm">
                    <div>
                      <span className="text-white font-bold">{fmt(p.amount)}</span>
                      <span className="text-white/40 text-xs ml-2">{p.method}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold" style={{
                        color: p.status === 'confirmed' ? '#16A34A' : p.status === 'rejected' ? '#DC2626' : '#D97706'
                      }}>{p.status}</p>
                      <p className="text-white/30 text-[10px]">{fmtDate(p.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[var(--black-border)] flex justify-between items-center">
          <button
            onClick={onDelete}
            className="px-4 py-2 text-sm font-black uppercase tracking-widest text-red-400 border border-red-900/40 hover:border-red-500/60 transition-colors"
          >
            Delete
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-white/50 hover:text-white border border-[var(--black-border)] hover:border-white/30 transition-colors">Close</button>
            <button
              onClick={onEdit}
              className="px-6 py-2 text-sm font-black uppercase tracking-widest text-black"
              style={{ background: 'linear-gradient(135deg, #A68B28, #D4AF37)' }}
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ customer, onClose, onDeleted }: { customer: Customer; onClose: () => void; onDeleted: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    const res = await fetch(`/api/admin/customers/${customer.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed'); setLoading(false); return }
    onDeleted()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.9)' }}>
      <div className="w-full max-w-sm bg-[var(--black-card)] border border-red-900/50 rounded-sm p-6 text-center">
        <p className="text-red-400 text-2xl mb-3">⚠</p>
        <h3 className="font-black uppercase text-white text-sm mb-2">Delete Customer?</h3>
        <p className="text-white/50 text-sm mb-5">
          This will permanently delete <strong className="text-white">{customer.first_name} {customer.last_name}</strong> and all their data. This cannot be undone.
        </p>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className="px-5 py-2 text-sm text-white/50 border border-[var(--black-border)] hover:text-white transition-colors">Cancel</button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-5 py-2 text-sm font-black uppercase tracking-widest text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {loading ? <GoldSpinner size={14} /> : null}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Modal =
  | { type: 'detail'; customer: Customer }
  | { type: 'edit'; customer: Customer }
  | { type: 'delete'; customer: Customer }

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [modal, setModal] = useState<Modal | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchCustomers = useCallback(async (search: string, pg: number) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(pg), q: search })
    const res = await fetch(`/api/admin/customers?${params}`)
    const data = await res.json()
    setCustomers(Array.isArray(data.data) ? data.data : [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => { fetchCustomers(q, page) }, [fetchCustomers, q, page])

  function handleSearch(val: string) {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setPage(1); setQ(val) }, 350)
  }

  const totalPages = Math.max(1, Math.ceil(total / 50))

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-white">Customers</h1>
          <p className="text-[var(--white-muted)] text-sm mt-0.5">{total} total members</p>
        </div>
        <input
          type="search"
          placeholder="Search name, email, phone…"
          onChange={e => handleSearch(e.target.value)}
          className="w-full sm:w-72 bg-[var(--black-surface)] border border-[var(--black-border)] text-white text-sm px-4 py-2.5 outline-none focus:border-[var(--gold)] transition-colors placeholder:text-white/25"
        />
      </div>

      {/* Table */}
      <div className="bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--black-border)] text-[10px] uppercase tracking-widest text-[var(--white-muted)]">
                <th className="text-left px-4 py-3 font-bold">Name</th>
                <th className="text-left px-4 py-3 font-bold hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-bold hidden lg:table-cell">Phone</th>
                <th className="text-left px-4 py-3 font-bold">Ticket</th>
                <th className="text-left px-4 py-3 font-bold">Status</th>
                <th className="text-left px-4 py-3 font-bold hidden sm:table-cell">Paid</th>
                <th className="text-left px-4 py-3 font-bold hidden xl:table-cell">Joined</th>
                <th className="text-right px-4 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-16"><GoldSpinner size={28} /></td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-[var(--white-muted)]">No customers found</td></tr>
              ) : customers.map((c) => {
                const ticket = c.tickets?.[0] ?? null
                const paid = totalPaid(c.payments ?? [])
                const ticketStatus = ticket?.status ?? 'none'
                return (
                  <tr key={c.id} className="border-b border-[var(--black-border)] hover:bg-[var(--black-surface)] transition-colors cursor-pointer" onClick={() => setModal({ type: 'detail', customer: c })}>
                    <td className="px-4 py-3">
                      <p className="text-white font-bold">{[c.first_name, c.last_name].filter(Boolean).join(' ') || <span className="text-white/30 italic">Unnamed</span>}</p>
                      <p className="text-white/35 text-[10px]">{c.role}</p>
                    </td>
                    <td className="px-4 py-3 text-white/60 hidden md:table-cell">{c.email}</td>
                    <td className="px-4 py-3 text-white/60 hidden lg:table-cell">{c.phone ?? '—'}</td>
                    <td className="px-4 py-3 font-bold" style={{ fontFamily: 'var(--font-dm-mono)' }}>
                      {ticket?.ticket_number ? `#${String(ticket.ticket_number).padStart(3, '0')}` : <span className="text-white/30">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ticketStatus} />
                    </td>
                    <td className="px-4 py-3 text-white/70 hidden sm:table-cell" style={{ fontFamily: 'var(--font-dm-mono)' }}>
                      {fmt(paid)}
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs hidden xl:table-cell">{fmtDate(c.created_at)}</td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setModal({ type: 'edit', customer: c })}
                          className="text-[10px] uppercase tracking-widest font-bold text-[var(--gold)] hover:text-[var(--gold-light)] border border-[var(--gold)]/30 hover:border-[var(--gold)] px-2.5 py-1.5 transition-colors"
                        >Edit</button>
                        <button
                          onClick={() => setModal({ type: 'delete', customer: c })}
                          className="text-[10px] uppercase tracking-widest font-bold text-red-400/70 hover:text-red-400 border border-red-900/30 hover:border-red-500/50 px-2.5 py-1.5 transition-colors"
                        >Del</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--black-border)] text-xs text-[var(--white-muted)]">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-[var(--black-border)] disabled:opacity-30 hover:border-white/30 transition-colors">← Prev</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-[var(--black-border)] disabled:opacity-30 hover:border-white/30 transition-colors">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === 'detail' && (
        <DetailModal
          customer={modal.customer}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ type: 'edit', customer: modal.customer })}
          onDelete={() => setModal({ type: 'delete', customer: modal.customer })}
        />
      )}
      {modal?.type === 'edit' && (
        <EditModal
          customer={modal.customer}
          onClose={() => setModal(null)}
          onSaved={() => fetchCustomers(q, page)}
        />
      )}
      {modal?.type === 'delete' && (
        <DeleteConfirm
          customer={modal.customer}
          onClose={() => setModal(null)}
          onDeleted={() => { fetchCustomers(q, page); setModal(null) }}
        />
      )}
    </div>
  )
}

// ─── Small helpers ────────────────────────────────────────────────────────────

const inp = 'w-full bg-[var(--black)] border border-[var(--black-border)] text-white text-sm px-3 py-2 outline-none focus:border-[var(--gold)] transition-colors'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-[var(--white-muted)] font-bold mb-1.5">{label}</p>
      {children}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">{label}</p>
      <p className="text-white text-sm mt-0.5 break-all">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { color: string; bg: string }> = {
    active: { color: '#16A34A', bg: 'rgba(22,163,74,0.12)' },
    pending_payment: { color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
    cancelled: { color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
    none: { color: '#555', bg: 'rgba(80,80,80,0.1)' },
  }
  const s = styles[status] ?? styles.none
  return (
    <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-sm" style={{ color: s.color, background: s.bg }}>
      {status === 'none' ? 'No ticket' : status.replace(/_/g, ' ')}
    </span>
  )
}
