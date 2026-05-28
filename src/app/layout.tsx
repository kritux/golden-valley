import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans, DM_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-dm-mono',
  weight: ['400', '500'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Golden Valley Members — Exclusive Raffle',
  description: 'Join the Golden Valley Members exclusive raffle. 1,000 tickets. One winner. $500 to enter.',
  openGraph: {
    title: 'Golden Valley Members',
    description: 'Exclusive members raffle — win the ultimate prize.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body className="bg-[var(--black)] text-[var(--white)] antialiased">
        {children}
        {/* Highlead.us external tracking — page views + form detection */}
        <Script
          src="https://links.highlead.us/js/external-tracking.js"
          data-tracking-id="tk_b06c1254e2f644e189beb0c484eaa2c1"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
