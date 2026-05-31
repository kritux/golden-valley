'use client'

export default function AdminExportPage() {
  const exports = [
    {
      label: 'Export Payments CSV',
      description: 'All payment records with buyer info, method, status, and timestamps.',
      href: '/api/admin/export/payments',
      icon: '◈',
    },
    {
      label: 'Export Sellers CSV',
      description: 'Seller roster with referral codes, levels, recruiter, and commission totals.',
      href: '/api/admin/export/sellers',
      icon: '◎',
    },
    {
      label: 'Export Tickets CSV',
      description: 'All ticket records with assigned numbers, buyer info, and activation dates.',
      href: '/api/admin/export/tickets',
      icon: '◉',
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-[var(--font-playfair)] text-3xl font-bold text-[var(--white)] mb-1">
          Export Data
        </h1>
        <p className="text-[var(--white-muted)] text-sm">
          Download CSV files for reporting and reconciliation.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {exports.map((item) => (
          <a
            key={item.href}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-[var(--black-card)] border border-[var(--black-border)] rounded-sm p-6 flex flex-col gap-4 hover:border-[var(--gold)]/50 hover:shadow-[0_0_20px_rgba(212,175,55,0.1)] transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-[var(--gold)] text-2xl opacity-70 group-hover:opacity-100 transition-opacity">
                {item.icon}
              </span>
              <span className="text-[var(--white)] font-semibold text-sm group-hover:text-[var(--gold-light)] transition-colors">
                {item.label}
              </span>
            </div>
            <p className="text-[var(--white-muted)] text-xs leading-relaxed">
              {item.description}
            </p>
            <div className="mt-auto pt-2">
              <span className="inline-flex items-center gap-1.5 text-[var(--gold)] text-xs uppercase tracking-widest border border-[var(--gold)]/30 px-3 py-1.5 rounded-sm group-hover:border-[var(--gold)] transition-colors">
                <DownloadIcon />
                Download
              </span>
            </div>
          </a>
        ))}
      </div>

      <p className="mt-8 text-[var(--white-muted)] text-xs">
        Files are generated in real-time from the database. Large datasets may take a few seconds to prepare.
      </p>
    </div>
  )
}

function DownloadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}
