import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — Golden Valley Members',
  description: 'Privacy Policy for Golden Valley Members LLC, compliant with California CCPA/CPRA and applicable US privacy law.',
}

const SECTIONS = [
  {
    id: 'overview',
    title: '1. Overview',
    content: `Golden Valley Members LLC ("Company," "we," "us," or "our") is committed to protecting your personal information. This Privacy Policy describes how we collect, use, disclose, and protect information about you when you visit our website (goldenvalleymembers.com) or participate in our raffle program.

This Policy is compliant with the California Consumer Privacy Act (CCPA), the California Privacy Rights Act (CPRA), and other applicable US privacy laws. If you are a California resident, you have additional rights described in Section 9.`,
  },
  {
    id: 'information-collected',
    title: '2. Information We Collect',
    content: `We collect the following categories of personal information:

A. Information You Provide Directly
• Identifiers: Full name, email address, phone number (primary and alternate), mailing address (if applicable).
• Financial Information: Payment confirmation references (we do not store full card numbers — these are handled by Stripe).
• Signatures: Digital signature captured at the time of purchase, stored securely in encrypted cloud storage.
• Communications: Messages you send us via email or our contact form.

B. Information Collected Automatically
• Usage Data: Pages visited, time spent, click behavior, referring URL.
• Device Information: IP address, browser type, operating system, device identifiers.
• Cookies & Tracking: Session cookies, analytics cookies (see Section 6).

C. Information from Third Parties
• Payment processors (Stripe) may share transaction confirmation details.
• CRM platforms may share interaction history for support purposes.`,
  },
  {
    id: 'how-we-use',
    title: '3. How We Use Your Information',
    content: `We use personal information for the following purposes:

• To process and verify raffle ticket purchases.
• To assign ticket numbers and maintain the official participant registry.
• To communicate with you about your entry, payment status, and prize notifications.
• To send transactional emails (receipt, payment confirmation, winner announcement).
• To comply with legal obligations (tax reporting, IRS Form 1099).
• To prevent fraud, abuse, and unauthorized access.
• To improve our website and user experience via analytics.
• To send marketing communications only if you have opted in.

We do not use your personal information for automated decision-making or profiling that produces legal or significant effects.`,
  },
  {
    id: 'sharing',
    title: '4. How We Share Your Information',
    content: `We do not sell, rent, or trade your personal information to third parties for their own marketing purposes.

We may share your information with:

• Service Providers: Stripe (payment processing), Supabase (database hosting), Resend (email delivery), GoHighLevel (CRM). These providers process data on our behalf under contractual obligations.
• Legal Requirements: If required by law, subpoena, court order, or governmental authority.
• Business Transfers: In connection with a merger, acquisition, or sale of assets, subject to the same privacy protections.
• Winner Announcements: First name and ticket number of prize winners may be published publicly on our website.

All third-party processors are contractually required to maintain the confidentiality and security of your data.`,
  },
  {
    id: 'retention',
    title: '5. Data Retention',
    content: `We retain personal information for as long as necessary to fulfill the purposes described in this Policy, including:

• Participant records: Retained for 7 years after the raffle draw to comply with tax and legal obligations.
• Payment records: Retained for 7 years per IRS requirements.
• Digital signatures: Retained for 7 years as proof of agreement.
• Marketing data: Retained until you opt out or request deletion (subject to legal hold requirements).
• Server logs and analytics: Retained for 13 months, then deleted or anonymized.

After applicable retention periods, data is securely deleted or anonymized.`,
  },
  {
    id: 'cookies',
    title: '6. Cookies & Tracking Technologies',
    content: `We use the following types of cookies:

Essential Cookies — Required for the website to function. They enable secure login, form submissions, and session management. Cannot be disabled.

Analytics Cookies — Help us understand how visitors use the site (e.g., which pages are most visited). Data is aggregated and anonymous. You may opt out via your browser settings.

We do not use advertising, tracking, or cross-site profiling cookies.

Most browsers allow you to refuse cookies or delete existing ones. Disabling essential cookies may impair website functionality.`,
  },
  {
    id: 'security',
    title: '7. Security',
    content: `We implement industry-standard security measures to protect your personal information:

• TLS/SSL encryption for all data in transit.
• AES-256 encryption for sensitive data at rest.
• Access controls limiting data access to authorized personnel only.
• Digital signatures stored in isolated, access-controlled cloud storage.
• Regular security audits and vulnerability assessments.

No system is 100% secure. In the event of a data breach affecting your rights, we will notify affected individuals and relevant authorities as required by law, within 72 hours of discovery.`,
  },
  {
    id: 'childrens',
    title: '8. Children\'s Privacy',
    content: `Our website and raffle are intended for adults 18 years of age and older. We do not knowingly collect personal information from anyone under 18. If we become aware that a person under 18 has provided us personal information, we will delete it immediately. If you believe a minor has provided us information, contact us at privacy@goldenvalleymembers.com.`,
  },
  {
    id: 'california-rights',
    title: '9. California Resident Rights (CCPA / CPRA)',
    content: `If you are a California resident, you have the following rights under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA):

Right to Know: You may request information about the categories and specific pieces of personal information we have collected about you, as well as how we use and disclose it.

Right to Delete: You may request that we delete personal information we have collected from you, subject to certain exceptions (e.g., legal obligations, ongoing transactions).

Right to Correct: You may request that we correct inaccurate personal information we hold about you.

Right to Opt-Out of Sale: We do not sell personal information. This right is not applicable.

Right to Limit Use of Sensitive Personal Information: We only use sensitive information (such as financial data and signatures) for the purpose of processing your raffle entry. You may request we limit this use.

Right to Non-Discrimination: We will not discriminate against you for exercising any of your privacy rights.

To exercise these rights, submit a verifiable consumer request to:
Email: privacy@goldenvalleymembers.com
Subject line: "California Privacy Rights Request"

We will respond within 45 days. We may need to verify your identity before processing your request.`,
  },
  {
    id: 'other-states',
    title: '10. Other US State Privacy Rights',
    content: `Residents of Virginia, Colorado, Connecticut, Texas, and other states with comprehensive privacy laws may have similar rights to those described in Section 9. Please contact us at privacy@goldenvalleymembers.com to exercise any applicable rights in your state.`,
  },
  {
    id: 'do-not-sell',
    title: '11. Do Not Sell or Share My Personal Information',
    content: `Golden Valley Members LLC does not sell or share personal information with third parties for cross-context behavioral advertising. We have no "sale" of personal information as defined under CCPA/CPRA to disclose.`,
  },
  {
    id: 'updates',
    title: '12. Updates to This Policy',
    content: `We may update this Privacy Policy periodically. The "Last updated" date at the top of this page reflects the most recent revision. For material changes, we will notify confirmed Participants by email. Continued use of the website after changes are posted constitutes acceptance.`,
  },
  {
    id: 'contact-privacy',
    title: '13. Contact Us',
    content: `For privacy-related questions, requests, or complaints:

Golden Valley Members LLC
Email: privacy@goldenvalleymembers.com
General Support: support@goldenvalleymembers.com

California residents may also file a complaint with the California Privacy Protection Agency (CPPA) at cppa.ca.gov.`,
  },
]

export default function PrivacyPage() {
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
        <div className="max-w-3xl mx-auto">
          <p className="text-[var(--gold)] text-[10px] font-black uppercase tracking-[0.4em] mb-3">Legal</p>
          <h1 className="font-black uppercase text-white leading-tight mb-3" style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            Privacy Policy
          </h1>
          <p className="text-white/40 text-sm leading-relaxed max-w-xl mb-4">
            Last updated: May 2026 · Compliant with California CCPA / CPRA and applicable US privacy law.
          </p>
          <div className="flex flex-wrap gap-2">
            {['CCPA Compliant', 'CPRA Compliant', 'No Data Sale', 'SSL Encrypted'].map((badge) => (
              <span key={badge} className="bg-[var(--black-card)] border border-[var(--black-border)] text-white/40 text-[10px] font-black uppercase tracking-wider px-3 py-1">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        {/* TOC */}
        <div className="bg-[var(--black-card)] border border-[var(--black-border)] p-6 mb-12">
          <p className="text-[var(--gold)] text-[10px] font-black uppercase tracking-[0.3em] mb-4">Table of Contents</p>
          <ol className="space-y-1.5">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-white/45 text-xs hover:text-[var(--gold)] transition-colors">{s.title}</a>
              </li>
            ))}
          </ol>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {SECTIONS.map((section) => (
            <div key={section.id} id={section.id} className="scroll-mt-20">
              <h2 className="font-black uppercase text-white text-base tracking-wide mb-4 pb-2 border-b border-[var(--black-border)]">
                {section.title}
              </h2>
              <div className="text-white/50 text-sm leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
            </div>
          ))}
        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-[var(--black-border)] flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex gap-4">
            <Link href="/terms" className="text-white/40 text-xs font-black uppercase tracking-wider hover:text-white/70 transition-colors">
              Terms of Use →
            </Link>
            <Link href="/data-management" className="text-[var(--gold)] text-xs font-black uppercase tracking-wider hover:text-[var(--gold-light)] transition-colors">
              Data Management →
            </Link>
          </div>
          <Link href="/" className="text-white/30 text-xs uppercase tracking-wider hover:text-white/60 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
