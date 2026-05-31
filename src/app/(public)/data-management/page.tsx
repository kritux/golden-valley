import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Data Management & Your Rights — Golden Valley Members',
  description: 'How Golden Valley Members LLC handles your personal data under California CCPA/CPRA law. Submit data access, correction, or deletion requests.',
}

const RIGHTS = [
  {
    icon: '📋',
    title: 'Right to Know',
    law: 'CCPA § 1798.100',
    description: 'Request a full report of the personal information we have collected about you, the sources it came from, the business purpose for collecting it, and any third parties it was shared with.',
    action: 'Submit a "Know" Request',
  },
  {
    icon: '🗑️',
    title: 'Right to Delete',
    law: 'CCPA § 1798.105',
    description: 'Request deletion of personal information we hold about you. Some data may be retained if legally required (e.g., tax records for prize winners, 7-year IRS retention).',
    action: 'Submit a Deletion Request',
  },
  {
    icon: '✏️',
    title: 'Right to Correct',
    law: 'CPRA § 1798.106',
    description: 'Request correction of inaccurate personal information. We will use commercially reasonable efforts to correct your data within 45 days.',
    action: 'Submit a Correction Request',
  },
  {
    icon: '🚫',
    title: 'Right to Opt-Out of Sale',
    law: 'CCPA § 1798.120',
    description: 'We do not sell personal information. This right is not applicable to Golden Valley Members LLC. We confirm no sale of personal data takes place.',
    action: 'N/A — We Do Not Sell Data',
  },
  {
    icon: '🔒',
    title: 'Limit Sensitive Data Use',
    law: 'CPRA § 1798.121',
    description: 'Request that we limit the use of sensitive personal information (such as your digital signature and financial references) to only what is necessary to complete your raffle entry.',
    action: 'Submit a Limitation Request',
  },
  {
    icon: '⚖️',
    title: 'Right to Non-Discrimination',
    law: 'CCPA § 1798.125',
    description: 'We will never deny you services, charge different prices, or provide a lower quality of service because you exercised any of your privacy rights.',
    action: 'Guaranteed — No Action Needed',
  },
  {
    icon: '📦',
    title: 'Right to Data Portability',
    law: 'CPRA',
    description: 'Request a machine-readable copy of the personal information you provided to us. We provide exports in JSON or CSV format within 45 days.',
    action: 'Submit a Portability Request',
  },
]

const DATA_CATEGORIES = [
  {
    category: 'Contact Information',
    examples: 'Name, email, phone number',
    purpose: 'Ticket issuance, winner notification, support',
    retention: '7 years (legal obligation)',
    shared: 'Email provider (Resend), CRM (GoHighLevel)',
  },
  {
    category: 'Payment References',
    examples: 'Transaction IDs, payment status',
    purpose: 'Purchase verification, fraud prevention',
    retention: '7 years (IRS requirement)',
    shared: 'Stripe (processor), accountant/auditor',
  },
  {
    category: 'Digital Signature',
    examples: 'PNG image of handwritten signature',
    purpose: 'Legal proof of T&C acceptance',
    retention: '7 years (contractual record)',
    shared: 'Cloud storage (Supabase, encrypted)',
  },
  {
    category: 'Device & Usage Data',
    examples: 'IP address, browser, pages visited',
    purpose: 'Security, fraud detection, analytics',
    retention: '13 months, then anonymized',
    shared: 'Analytics provider (anonymized)',
  },
  {
    category: 'Communications',
    examples: 'Emails sent to us, support messages',
    purpose: 'Customer support, dispute resolution',
    retention: '3 years',
    shared: 'Customer support platform',
  },
]

export default function DataManagementPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--black-border)]" style={{ background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(14px)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 flex items-center justify-center font-black text-xs tracking-widest text-black" style={{ background: 'linear-gradient(135deg, #A68B28, #D4AF37, #E8CC7A)' }}>
              GV
            </div>
            <span className="hidden sm:block text-xs font-black uppercase tracking-[0.2em] text-white/60 group-hover:text-white transition-colors">Golden Valley Members</span>
          </Link>
          <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-[var(--gold)] transition-colors">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 border-b border-[var(--black-border)]" style={{ background: 'radial-gradient(ellipse at top, #1a1200 0%, #0B0B0B 70%)' }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-[var(--gold)] text-[10px] font-black uppercase tracking-[0.4em] mb-3">California CCPA / CPRA</p>
          <h1 className="font-black uppercase text-white leading-tight mb-3" style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            Data Management<br />&amp; Your Rights
          </h1>
          <p className="text-white/40 text-sm leading-relaxed max-w-2xl mb-6">
            Golden Valley Members LLC is committed to transparency about how we collect and use your data. As a California-operated company, we comply fully with the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA).
          </p>
          <div className="flex flex-wrap gap-2">
            {['CCPA Compliant', 'CPRA Compliant', 'No Data Sold', 'Encrypted Storage', 'Right to Delete'].map((b) => (
              <span key={b} className="bg-[var(--black-card)] border border-[var(--gold)] border-opacity-30 text-[var(--gold)] text-[10px] font-black uppercase tracking-wider px-3 py-1">
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-16">

        {/* Your Rights */}
        <div>
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-[var(--gold)] opacity-20" />
            <span className="text-[var(--gold)] text-xs uppercase tracking-[0.4em] font-bold whitespace-nowrap">Your Rights Under California Law</span>
            <div className="h-px flex-1 bg-[var(--gold)] opacity-20" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RIGHTS.map((right) => (
              <div key={right.title} className="bg-[var(--black-card)] border border-[var(--black-border)] p-6 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{right.icon}</span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-white/25 border border-white/10 px-2 py-0.5">{right.law}</span>
                </div>
                <h3 className="font-black uppercase text-white text-sm tracking-wide">{right.title}</h3>
                <p className="text-white/45 text-xs leading-relaxed flex-1">{right.description}</p>
                <p className="text-[var(--gold)] text-[10px] font-black uppercase tracking-wider">{right.action}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How to Submit a Request */}
        <div>
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-[var(--gold)] opacity-20" />
            <span className="text-[var(--gold)] text-xs uppercase tracking-[0.4em] font-bold whitespace-nowrap">How to Submit a Request</span>
            <div className="h-px flex-1 bg-[var(--gold)] opacity-20" />
          </div>

          <div className="border border-[var(--black-border)] bg-[var(--black-card)] p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <p className="text-white font-black uppercase tracking-wide text-sm mb-4">Submit via Email</p>
                <div className="space-y-3 text-sm text-white/50 leading-relaxed">
                  <p>Send your request to:</p>
                  <a href="mailto:privacy@goldenvalleymembers.com" className="block text-[var(--gold)] font-bold hover:text-[var(--gold-light)] transition-colors">
                    privacy@goldenvalleymembers.com
                  </a>
                  <p>Use subject line: <span className="text-white font-bold">"California Privacy Rights Request"</span></p>
                  <p>Include in your message:</p>
                  <ul className="list-disc list-inside space-y-1 text-white/40">
                    <li>Your full name</li>
                    <li>Email address on file with us</li>
                    <li>Type of request (Know / Delete / Correct / Other)</li>
                    <li>Any relevant details</li>
                  </ul>
                </div>
              </div>

              <div>
                <p className="text-white font-black uppercase tracking-wide text-sm mb-4">Response Timeline</p>
                <div className="space-y-4">
                  {[
                    { step: '1', text: 'We acknowledge receipt within 10 business days.' },
                    { step: '2', text: 'We verify your identity to prevent unauthorized access.' },
                    { step: '3', text: 'We fulfill your request within 45 calendar days.' },
                    { step: '4', text: 'If we need more time, we notify you and may extend up to 90 days total.' },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-3">
                      <div className="w-6 h-6 flex items-center justify-center font-black text-[10px] text-black shrink-0 mt-0.5" style={{ background: 'linear-gradient(135deg, #A68B28, #D4AF37)' }}>
                        {item.step}
                      </div>
                      <p className="text-white/45 text-xs leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data categories table */}
        <div>
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-[var(--gold)] opacity-20" />
            <span className="text-[var(--gold)] text-xs uppercase tracking-[0.4em] font-bold whitespace-nowrap">Data We Collect — Full Disclosure</span>
            <div className="h-px flex-1 bg-[var(--gold)] opacity-20" />
          </div>

          <div className="border border-[var(--black-border)] overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-5 gap-0 border-b border-[var(--black-border)] bg-[var(--black-card)] hidden md:grid">
              {['Category', 'Examples', 'Purpose', 'Retention', 'Shared With'].map((h) => (
                <div key={h} className="px-4 py-3 border-r border-[var(--black-border)] last:border-r-0">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/30">{h}</p>
                </div>
              ))}
            </div>

            {/* Table rows */}
            {DATA_CATEGORIES.map((row, i) => (
              <div key={row.category} className={`grid grid-cols-1 md:grid-cols-5 border-b border-[var(--black-border)] last:border-b-0 ${i % 2 === 0 ? 'bg-[var(--black-card)]' : 'bg-[#0e0e0e]'}`}>
                <div className="px-4 py-4 border-b md:border-b-0 md:border-r border-[var(--black-border)]">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-1 md:hidden">Category</p>
                  <p className="text-white font-bold text-xs">{row.category}</p>
                </div>
                <div className="px-4 py-4 border-b md:border-b-0 md:border-r border-[var(--black-border)]">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-1 md:hidden">Examples</p>
                  <p className="text-white/45 text-xs">{row.examples}</p>
                </div>
                <div className="px-4 py-4 border-b md:border-b-0 md:border-r border-[var(--black-border)]">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-1 md:hidden">Purpose</p>
                  <p className="text-white/45 text-xs">{row.purpose}</p>
                </div>
                <div className="px-4 py-4 border-b md:border-b-0 md:border-r border-[var(--black-border)]">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-1 md:hidden">Retention</p>
                  <p className="text-white/45 text-xs">{row.retention}</p>
                </div>
                <div className="px-4 py-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-1 md:hidden">Shared With</p>
                  <p className="text-white/45 text-xs">{row.shared}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact DPO */}
        <div className="border border-[var(--gold)] border-opacity-40 bg-[var(--black-card)] p-8">
          <p className="text-[var(--gold)] text-[10px] font-black uppercase tracking-[0.3em] mb-3">Privacy Contact</p>
          <h3 className="font-black uppercase text-white text-base mb-4">Questions? Contact Our Privacy Team</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-white/25 text-[9px] uppercase tracking-widest mb-1">Privacy Requests</p>
              <a href="mailto:privacy@goldenvalleymembers.com" className="text-white/60 hover:text-[var(--gold)] transition-colors text-xs">
                privacy@goldenvalleymembers.com
              </a>
            </div>
            <div>
              <p className="text-white/25 text-[9px] uppercase tracking-widest mb-1">General Support</p>
              <a href="mailto:support@goldenvalleymembers.com" className="text-white/60 hover:text-[var(--gold)] transition-colors text-xs">
                support@goldenvalleymembers.com
              </a>
            </div>
            <div>
              <p className="text-white/25 text-[9px] uppercase tracking-widest mb-1">CA Privacy Agency</p>
              <a href="https://cppa.ca.gov" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-[var(--gold)] transition-colors text-xs">
                cppa.ca.gov
              </a>
            </div>
          </div>
        </div>

        {/* Footer nav */}
        <div className="pt-4 border-t border-[var(--black-border)] flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex gap-4">
            <Link href="/terms" className="text-white/40 text-xs font-black uppercase tracking-wider hover:text-white/70 transition-colors">Terms of Use →</Link>
            <Link href="/privacy" className="text-white/40 text-xs font-black uppercase tracking-wider hover:text-white/70 transition-colors">Privacy Policy →</Link>
          </div>
          <Link href="/" className="text-white/30 text-xs uppercase tracking-wider hover:text-white/60 transition-colors">← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
