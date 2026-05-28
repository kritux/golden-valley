'use client'

import { useState } from 'react'
import Link from 'next/link'

const FAQS = [
  {
    q: 'What is Golden Valley Members?',
    a: 'Golden Valley Members is a formally registered company dedicated to exclusive promotional experiences, member rewards, and special campaigns for registered participants.',
  },
  {
    q: 'What is the grand prize?',
    a: 'The grand prize is a brand-new 2027 Toyota 4Runner — a fully equipped, off-road-ready SUV valued at approximately $70,000.',
  },
  {
    q: 'What other prizes are available?',
    a: '$20,000 in cash awarded to the second drawn ticket number, $1,000 per day for 90 consecutive days starting once the milestone is reached, surprise prizes announced throughout the campaign, and referral benefits for active members.',
  },
  {
    q: 'How many entries are available?',
    a: 'There is a maximum of 1,000 entries available. Once all 1,000 tickets are sold, the draw is triggered automatically.',
  },
  {
    q: 'How much does each entry cost?',
    a: 'Each entry has a minimum value of $500. Payment is accepted via Zelle (manual verification) or credit/debit card through Stripe.',
  },
  {
    q: 'When do the daily $1,000 prizes begin?',
    a: 'The daily prizes begin once all 1,000 entries have been sold and the minimum fundraising milestone has been reached. The target start date is July 31, 2026.',
  },
  {
    q: 'How do the daily prizes work?',
    a: 'Each day, one winner is selected for $1,000 according to the official rules published by Golden Valley Members. This continues for 90 consecutive days.',
  },
  {
    q: 'What does the "reverse number" prize mean?',
    a: 'A second ticket number is drawn separately from the grand prize pool. The holder of that ticket receives $20,000 in cash wired directly to their account.',
  },
  {
    q: 'How do referrals work?',
    a: 'Each member can share their personalized referral code or link. You receive $50 for each valid referral who completes a confirmed entry.',
  },
  {
    q: 'When are referral payments made?',
    a: 'Referral payouts are delivered at the end of the campaign and are tied to the participant\'s confirmed ticket or entry receipt.',
  },
  {
    q: 'Do I need to sell entries to participate?',
    a: 'No. The referral system is entirely voluntary. Simply purchasing an entry qualifies you for all prize draws.',
  },
  {
    q: 'How can I track my referrals?',
    a: 'All referrals can be viewed and verified within the member platform or through official reports shared by Golden Valley Members.',
  },
  {
    q: 'How do I participate?',
    a: 'Register officially on goldenvalleymembers.com, complete the entry form, sign the acceptance agreement, and submit your payment. Your ticket number is assigned upon confirmed payment.',
  },
  {
    q: 'Do I need to sign a document?',
    a: 'Yes. All participants are required to electronically sign an acceptance agreement before their entry is confirmed.',
  },
  {
    q: 'Where are payments sent?',
    a: 'All payments are made directly to Golden Valley Members LLC via officially authorized payment methods.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept Zelle (manual verification, up to 24 hours) and credit/debit cards via Stripe (instant confirmation).',
  },
  {
    q: 'Is Golden Valley Members a registered company?',
    a: 'Yes. Golden Valley Members LLC is a formally registered company operating under applicable state and federal regulations.',
  },
  {
    q: 'How can I verify transparency?',
    a: 'All campaign updates, winner announcements, ticket sales progress, and official activities are published on this website and on our official social media channels.',
  },
  {
    q: 'How are winners selected?',
    a: 'Winners are selected through a transparent, publicly verifiable process in accordance with the official rules. Grand prize and second prize draws occur simultaneously when ticket #1,000 is confirmed.',
  },
  {
    q: 'Will draws be streamed live?',
    a: 'Yes. The grand prize draw and major announcements will be broadcast live on our official social media channels. All participants will be notified in advance.',
  },
  {
    q: 'What happens if not all entries are sold?',
    a: 'If fewer than 500 tickets are sold within 90 days of the first confirmed sale, Golden Valley Members reserves the right to cancel the campaign and issue full refunds.',
  },
  {
    q: 'Can I transfer my entry to another person?',
    a: 'Entry transfers are subject to official validation and approval by Golden Valley Members. Contact support for details.',
  },
  {
    q: 'Are prizes subject to taxes?',
    a: 'Yes. All winners are solely responsible for any applicable federal, state, or local taxes. A Form 1099 will be issued to US winners where required by law.',
  },
  {
    q: 'What happens if I win but don\'t claim my prize?',
    a: 'Winners have a set time limit to claim their prize as defined in the official rules. Unclaimed prizes may be forfeited.',
  },
  {
    q: 'How will I know if I won?',
    a: 'Winners are contacted directly via the email on file and announced publicly on the Golden Valley Members website and social media within 48 hours of the draw.',
  },
  {
    q: 'How do you prevent fraud?',
    a: 'Golden Valley Members uses signed entry contracts, payment verification, identity validation, and continuous monitoring to ensure a secure and transparent campaign.',
  },
  {
    q: 'Where can I read the official rules?',
    a: 'The full official rules are available at goldenvalleymembers.com/terms.',
  },
  {
    q: 'Can I participate from any state?',
    a: 'Participation is subject to applicable local and federal laws. Please review the official rules for your state. The campaign is currently open to US residents aged 18 and older.',
  },
  {
    q: 'What might the surprise prizes include?',
    a: 'Surprise prizes may include cash, electronics, exclusive experiences, gift cards, and other promotional benefits announced throughout the campaign.',
  },
  {
    q: 'Where can I follow all updates?',
    a: 'Follow all updates on this website and on the official Golden Valley Members social media channels. Join our WhatsApp group for real-time announcements.',
  },
]

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="border-b border-[var(--black-border)] last:border-b-0"
    >
      <button
        className="w-full flex items-start justify-between gap-4 py-5 px-1 text-left group"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span
            className="shrink-0 font-black text-xs tabular-nums mt-0.5"
            style={{ fontFamily: 'var(--font-dm-mono)', color: open ? 'var(--gold)' : 'rgba(212,175,55,0.35)' }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
          <span
            className="font-black text-sm uppercase tracking-wide transition-colors"
            style={{ color: open ? '#fff' : 'rgba(255,255,255,0.65)' }}
          >
            {q}
          </span>
        </div>
        <span
          className="shrink-0 text-lg font-light leading-none transition-transform duration-300 mt-0.5"
          style={{ color: 'var(--gold)', transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
        >
          +
        </span>
      </button>
      {open && (
        <p className="pb-5 pl-7 pr-6 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {a}
        </p>
      )}
    </div>
  )
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[var(--black)] text-[var(--white)]">
      {/* Header */}
      <div
        className="sticky top-0 z-40 w-full border-b"
        style={{ background: 'rgba(10,10,10,0.97)', borderColor: 'rgba(201,168,76,0.12)', backdropFilter: 'blur(14px)' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 flex items-center justify-center font-black text-xs tracking-widest text-black shrink-0"
              style={{ background: 'linear-gradient(135deg, #8B6914, #C9A84C, #E8CC7A)' }}
            >
              GV
            </div>
            <span className="hidden sm:block text-xs font-black uppercase tracking-[0.2em] text-white/50 group-hover:text-white transition-colors">
              Golden Valley Members
            </span>
          </Link>
          <Link
            href="/#buy-form"
            className="text-[10px] font-black uppercase tracking-widest text-black px-4 py-2 transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #8B6914, #C9A84C, #E8CC7A)' }}
          >
            Get Ticket
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="flex items-center gap-4 mb-5">
          <div className="h-px flex-1 bg-[var(--gold)] opacity-30" />
          <span className="text-[var(--gold)] text-xs uppercase tracking-[0.4em] font-bold whitespace-nowrap">FAQ</span>
          <div className="h-px flex-1 bg-[var(--gold)] opacity-30" />
        </div>

        <div className="text-center mb-14">
          <h1
            className="font-black uppercase text-white leading-tight mb-3"
            style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(2rem, 6vw, 3.5rem)' }}
          >
            Frequently Asked<br />Questions
          </h1>
          <p className="text-white/40 text-sm max-w-lg mx-auto">
            Everything you need to know about Golden Valley Members, prizes, entries, and how the campaign works.
          </p>
        </div>

        {/* FAQ list */}
        <div className="bg-[var(--black-card)] border border-[var(--black-border)]">
          {FAQS.map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} index={i} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-14 text-center flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/#buy-form"
            className="font-black uppercase tracking-widest text-black px-10 py-4 text-sm transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #8B6914, #D4AF37, #F0D060, #D4AF37)', boxShadow: '0 0 24px rgba(212,175,55,0.4)' }}
          >
            🎟 Get Your Ticket — $500
          </Link>
          <Link
            href="/terms"
            className="text-[var(--gold)] text-xs font-black uppercase tracking-widest border border-[var(--gold)] border-opacity-30 px-6 py-4 hover:border-opacity-100 transition-colors"
          >
            Read Official Rules →
          </Link>
        </div>

        {/* Back */}
        <div className="mt-10 text-center">
          <Link href="/" className="text-white/25 text-xs hover:text-white/50 transition-colors uppercase tracking-widest">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
