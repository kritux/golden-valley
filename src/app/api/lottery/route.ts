import { NextResponse } from 'next/server'
import { getTrisCache, setTrisCache } from '@/lib/lottery-cache'
import dns from 'dns'

// Force IPv4 — VPS defaults to IPv6 which many sites block
dns.setDefaultResultOrder('ipv4first')

const TTL = 60 * 60 * 1000 // 1 hour in-memory buffer on top of file cache

let memCache: { digits: string; date: string; fetchedAt: number } | null = null

async function scrapeTrisSeven(): Promise<string | null> {
  const controllers = [
    // Primary: official Tris page
    async () => {
      const res = await fetch('https://www.loterianacional.gob.mx/Tris/Resultados', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-MX,es;q=0.9',
        },
        signal: AbortSignal.timeout(12_000),
      })
      if (!res.ok) return null
      const html = await res.text()
      return extractTrisDigits(html)
    },
    // Fallback: Lotería Nacional results JSON endpoint
    async () => {
      const res = await fetch('https://www.loterianacional.gob.mx/api/tris/ultimos', {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GVM/1.0)' },
        signal: AbortSignal.timeout(8_000),
      })
      if (!res.ok) return null
      const json = await res.json() as { resultado?: string; numero?: string }
      const raw = json?.resultado ?? json?.numero ?? ''
      const m = raw.match(/\d{3,5}/)
      return m ? m[0].slice(-3) : null
    },
  ]

  for (const attempt of controllers) {
    try {
      const result = await attempt()
      if (result) return result
    } catch { /* try next */ }
  }
  return null
}

function extractTrisDigits(html: string): string | null {
  const patterns = [
    /19:00[^<]*<[^>]+>[^<]*<\/[^>]+>\s*(\d{4,5})/i,
    /7:00\s*[Pp][Mm][^<]*<[^>]+>[^<]*<\/[^>]+>\s*(\d{4,5})/i,
    /19:00.*?(\d{4,5})/is,
    /7\s*pm.*?(\d{4,5})/is,
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m) return m[1].slice(-3)
  }
  const idx = html.indexOf('19:00')
  if (idx !== -1) {
    const snippet = html.slice(idx, idx + 800)
    const m = snippet.match(/\b(\d{4,5})\b/)
    if (m) return m[1].slice(-3)
  }
  const allNums = [...html.matchAll(/\b(\d{4,5})\b/g)]
  if (allNums.length > 0) return allNums[allNums.length - 1][1].slice(-3)
  return null
}

export async function GET() {
  const now = Date.now()
  const date = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })

  // 1. In-memory cache (hot path)
  if (memCache && now - memCache.fetchedAt < TTL) {
    return NextResponse.json({ digits: memCache.digits, date: memCache.date, cached: true })
  }

  // 2. Try live scrape
  const digits = await scrapeTrisSeven()
  if (digits) {
    memCache = { digits, date, fetchedAt: now }
    await setTrisCache(digits, date)
    return NextResponse.json({ digits, date, cached: false })
  }

  // 3. Fall back to file cache (persists across restarts)
  const fileCache = await getTrisCache()
  if (fileCache?.digits) {
    memCache = { digits: fileCache.digits, date: fileCache.date, fetchedAt: now }
    return NextResponse.json({ digits: fileCache.digits, date: fileCache.date, cached: true, stale: true })
  }

  return NextResponse.json({ digits: null, date, cached: false })
}

// Admin override: POST { digits: "XXX" }
export async function POST(req: Request) {
  try {
    const { digits } = await req.json() as { digits: string }
    if (!digits || !/^\d{3}$/.test(digits)) {
      return NextResponse.json({ error: 'digits must be exactly 3 digits' }, { status: 400 })
    }
    const date = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    memCache = { digits, date, fetchedAt: Date.now() }
    await setTrisCache(digits, date)
    return NextResponse.json({ ok: true, digits, date })
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
}
