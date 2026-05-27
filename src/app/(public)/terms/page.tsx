import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Use — Golden Valley Members',
  description: 'Official Terms of Use and Raffle Rules for Golden Valley Members LLC.',
}

const SECTIONS = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: `By accessing the Golden Valley Members website, purchasing a raffle ticket, or otherwise participating in the Golden Valley Members raffle program ("the Raffle"), you agree to be bound by these Terms of Use ("Terms"), our Privacy Policy, and all applicable federal, state, and local laws. If you do not agree to these Terms in their entirety, you may not participate.

These Terms constitute a legally binding agreement between you ("Participant" or "you") and Golden Valley Members LLC, a California limited liability company ("Company," "we," "us," or "our").`,
  },
  {
    id: 'eligibility',
    title: '2. Eligibility',
    content: `To participate in the Raffle you must:

• Be at least 18 years of age at the time of purchase.
• Be a legal resident of the United States in a jurisdiction where participation is permitted by law.
• Not be an employee, officer, director, agent, or immediate family member of Golden Valley Members LLC or any affiliated entity.
• Have a valid U.S.-based payment method.

Void where prohibited by law. We reserve the right to verify eligibility at any time. Fraudulent entries will be disqualified without refund.`,
  },
  {
    id: 'ticket-purchase',
    title: '3. Ticket Purchase & Payment',
    content: `Each raffle entry ("Ticket") costs $500 USD. Payment is accepted via:

• Zelle — manual bank-to-bank transfer, subject to verification by Company staff.
• Credit or Debit Card — processed securely via Stripe.

All payments are non-refundable once confirmed. Zelle payments are considered unconfirmed until manually verified by Company staff, which may take up to 72 hours. During the verification window, no Ticket number is reserved. Card payments are confirmed in real time upon Stripe authorization.

Company reserves the right to reject any payment that cannot be verified or that violates these Terms.`,
  },
  {
    id: 'ticket-assignment',
    title: '4. Ticket Numbers & Assignment',
    content: `Tickets are numbered sequentially from #1 to #1,000. Your unique Ticket number is assigned exclusively on a first-confirmed basis — the moment your payment is verified, the next available sequential number is permanently assigned to you.

No two Participants hold the same number. Ticket numbers are non-transferable after assignment. Lost or stolen tickets are not replaced.`,
  },
  {
    id: 'draw',
    title: '5. Prize Draw',
    content: `The prize draw is triggered automatically when Ticket #1,000 is confirmed. There is no pre-determined draw date. Two (2) Ticket numbers are independently and randomly selected:

• First Draw — Grand Prize winner (1st Prize).
• Second Draw — Cash prize winner (2nd Prize).

The draw method is designed to ensure equal probability for every Ticket. Company will document and retain draw records. Results are final and binding.`,
  },
  {
    id: 'prizes',
    title: '6. Prizes',
    content: `1st Prize — Grand Prize Winner
One (1) 2026 Toyota 4Runner Special Edition Trailhunter (approximate retail value $70,000 USD), or, at the sole election of the winner communicated in writing within 7 days of notification, $70,000 USD cash. If the winner does not elect within the allotted period, the vehicle is awarded by default.

2nd Prize — Second Draw Winner
$20,000 USD cash, paid by wire transfer or certified check.

Daily Giveaway — 3rd Tier
Beginning on the date specified by the live countdown timer on the website, Golden Valley Members LLC will award $1,000 USD per day for 90 consecutive calendar days to eligible participants as determined by Company's promotional rules published separately.

All prizes are awarded in US Dollars unless otherwise stated. Prizes are non-transferable except as stated above. No cash substitution is available except as expressly provided herein.`,
  },
  {
    id: 'official-rules',
    title: '7. Official Raffle Rules',
    content: `(a) Maximum Entries: 1,000 Tickets total. Only one Ticket may be purchased per transaction; multiple purchases are permitted.

(b) Draw Trigger: The draw occurs when Ticket #1,000 is confirmed — not before.

(c) Cancellation Right: Company reserves the right to cancel the Raffle and issue full refunds to all confirmed Participants if fewer than 500 Tickets are confirmed within 90 calendar days of the first Ticket sale. Refunds will be issued within 30 days of a cancellation notice.

(d) Force Majeure: Company is not liable for delays or cancellations caused by events outside its reasonable control, including but not limited to natural disasters, government orders, payment processor failures, or acts of God.

(e) Disqualification: Company reserves the right to disqualify any Participant who violates these Terms, engages in fraudulent activity, or attempts to manipulate the draw.`,
  },
  {
    id: 'refunds',
    title: '8. Refund Policy',
    content: `All Ticket purchases are final and non-refundable once payment is confirmed. Exceptions:

• Raffle Cancellation: If Company cancels the Raffle per Section 7(c), all Participants receive a full refund.
• Unverified Zelle Payment: If a Zelle payment cannot be verified within 72 hours, the entry is voided and payment is returned within 10 business days.
• Duplicate Charges: Verified duplicate charges caused by payment processor error will be refunded within 5 business days.

No refunds are issued for change of mind, personal circumstances, or failure to win.`,
  },
  {
    id: 'taxes',
    title: '9. Taxes',
    content: `Winners are solely responsible for all applicable federal, state, and local income taxes on prizes received. For prizes valued at $600 or more, Golden Valley Members LLC is required by US federal law (IRC § 6041) to report winnings to the IRS and issue a Form 1099-MISC. Winners must provide a valid Social Security Number or Individual Taxpayer Identification Number (ITIN) before any prize is delivered.

Failure to provide required tax information may result in prize forfeiture.`,
  },
  {
    id: 'intellectual-property',
    title: '10. Intellectual Property',
    content: `All content on this website, including but not limited to text, graphics, logos, images, and software, is the property of Golden Valley Members LLC or its licensors and is protected by US and international copyright and trademark laws. You may not reproduce, distribute, or create derivative works without prior written permission.`,
  },
  {
    id: 'limitation',
    title: '11. Limitation of Liability',
    content: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, GOLDEN VALLEY MEMBERS LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR PARTICIPATION IN THE RAFFLE, INCLUDING BUT NOT LIMITED TO LOSS OF DATA, LOSS OF PROFITS, OR PERSONAL INJURY.

COMPANY'S TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU FOR YOUR TICKET(S).`,
  },
  {
    id: 'governing-law',
    title: '12. Governing Law & Dispute Resolution',
    content: `These Terms are governed by and construed in accordance with the laws of the State of California, without regard to conflict of law principles.

Any dispute arising from or relating to these Terms or the Raffle shall be resolved by binding arbitration in Los Angeles County, California, administered under the rules of the American Arbitration Association (AAA). You waive the right to a jury trial and to participate in any class action lawsuit or class-wide arbitration.

Notwithstanding the foregoing, Company may seek injunctive or other equitable relief in any court of competent jurisdiction.`,
  },
  {
    id: 'changes',
    title: '13. Changes to These Terms',
    content: `Company reserves the right to modify these Terms at any time. Changes are effective upon posting to this page. Continued participation after changes are posted constitutes acceptance. For material changes, we will provide notice via email to Participants who have confirmed purchases.`,
  },
  {
    id: 'contact-terms',
    title: '14. Contact',
    content: `For questions about these Terms, contact us at:

Golden Valley Members LLC
Email: legal@goldenvalleymembers.com
General Support: support@goldenvalleymembers.com`,
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--black-border)]" style={{ background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(14px)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 flex items-center justify-center font-black text-xs tracking-widest text-black" style={{ background: 'linear-gradient(135deg, #8B6914, #C9A84C, #E8CC7A)' }}>
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
      <section className="py-16 px-4 border-b border-[var(--black-border)]" style={{ background: 'radial-gradient(ellipse at top, #1a1200 0%, #0A0A0A 70%)' }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-[var(--gold)] text-[10px] font-black uppercase tracking-[0.4em] mb-3">Legal</p>
          <h1 className="font-black uppercase text-white leading-tight mb-3" style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            Terms of Use
          </h1>
          <p className="text-white/40 text-sm leading-relaxed max-w-xl">
            Last updated: May 2026 · Governed by California law · Applies to all participants in the Golden Valley Members raffle program.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        {/* Table of contents */}
        <div className="bg-[var(--black-card)] border border-[var(--black-border)] p-6 mb-12">
          <p className="text-[var(--gold)] text-[10px] font-black uppercase tracking-[0.3em] mb-4">Table of Contents</p>
          <ol className="space-y-1.5">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-white/45 text-xs hover:text-[var(--gold)] transition-colors">
                  {s.title}
                </a>
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
            <Link href="/privacy" className="text-[var(--gold)] text-xs font-black uppercase tracking-wider hover:text-[var(--gold-light)] transition-colors">
              Privacy Policy →
            </Link>
            <Link href="/data-management" className="text-white/40 text-xs font-black uppercase tracking-wider hover:text-white/70 transition-colors">
              Data Rights →
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
