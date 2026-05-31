import { NextResponse } from 'next/server'

interface CacheEntry { digits: string; date: string; fetchedAt: number }
let cache: CacheEntry | null = null
const TTL = 60 * 60 * 1000 // 1 hour

async function scrapeTrisSeven(): Promise<string | null> {
  try {
    const res = await fetch('https://www.loterianacional.gob.mx/Tris/Resultados', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GVM/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return null
    const html = await res.text()

    // Strategy 1: look for 19:00 draw result — number in a nearby element
    const blocks = [
      /19:00[^<]*<[^>]+>[^<]*<\/[^>]+>\s*(\d{4,5})/i,
      /7:00\s*[Pp][Mm][^<]*<[^>]+>[^<]*<\/[^>]+>\s*(\d{4,5})/i,
      /19:00.*?(\d{4,5})/is,
      /7\s*pm.*?(\d{4,5})/is,
    ]
    for (const re of blocks) {
      const m = html.match(re)
      if (m) return m[1].slice(-3)
    }

    // Strategy 2: find all 4-5 digit numbers near "19" or "19:00"
    const idx = html.indexOf('19:00')
    if (idx !== -1) {
      const snippet = html.slice(idx, idx + 800)
      const numMatch = snippet.match(/\b(\d{4,5})\b/)
      if (numMatch) return numMatch[1].slice(-3)
    }

    // Strategy 3: grab all 4-5 digit numbers from the page and return last found
    const allNums = [...html.matchAll(/\b(\d{4,5})\b/g)]
    if (allNums.length > 0) {
      // The last occurrence is most likely today's result
      const last = allNums[allNums.length - 1]
      return last[1].slice(-3)
    }

    return null
  } catch {
    return null
  }
}

export async function GET() {
  const now = Date.now()
  if (cache && now - cache.fetchedAt < TTL) {
    return NextResponse.json({ digits: cache.digits, date: cache.date, cached: true })
  }

  const digits = await scrapeTrisSeven()
  const date = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })

  if (digits) {
    cache = { digits, date, fetchedAt: now }
    return NextResponse.json({ digits, date, cached: false })
  }

  // Return stale cache if available
  if (cache) {
    return NextResponse.json({ digits: cache.digits, date: cache.date, cached: true, stale: true })
  }

  return NextResponse.json({ digits: null, date, cached: false })
}

// Admin can override the result (POST with { digits: "XXX" })
export async function POST(req: Request) {
  try {
    const { digits } = await req.json() as { digits: string }
    if (!digits || !/^\d{3}$/.test(digits)) {
      return NextResponse.json({ error: 'digits must be a 3-digit string' }, { status: 400 })
    }
    const date = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    cache = { digits, date, fetchedAt: Date.now() }
    return NextResponse.json({ ok: true, digits, date })
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
}
