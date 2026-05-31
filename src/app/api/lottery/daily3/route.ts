import { NextResponse } from 'next/server'
import { getDaily3Cache, setDaily3Cache } from '@/lib/lottery-cache'
import dns from 'dns'

dns.setDefaultResultOrder('ipv4first')

const TTL = 30 * 60 * 1000 // 30 min in-memory

let memCache: { draws: unknown[]; fetchedAt: number } | null = null

interface RawDraw {
  DrawNumber: number
  DrawDate: string
  WinningNumbers: Record<string, { Number: string }>
}

interface DrawResult {
  drawNumber: number
  date: string
  numbers: [string, string, string]
}

async function fetchDaily3(): Promise<DrawResult[] | null> {
  const endpoints = [
    'https://www.calottery.com/api/DrawGameApi/DrawGamePastDrawResults/9/1/14',
    'https://www.calottery.com/api/DrawGameApi/DrawGamePastDrawResults/9/1/7',
  ]

  const browserHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.calottery.com/',
    'Origin': 'https://www.calottery.com',
    'Cache-Control': 'no-cache',
  }

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: browserHeaders,
        signal: AbortSignal.timeout(12_000),
      })
      if (!res.ok) continue
      const json = await res.json() as { PreviousDraws: RawDraw[] }
      if (!json?.PreviousDraws?.length) continue

      return json.PreviousDraws.slice(0, 10).map((d) => ({
        drawNumber: d.DrawNumber,
        date: d.DrawDate,
        numbers: [
          d.WinningNumbers['1']?.Number ?? '?',
          d.WinningNumbers['2']?.Number ?? '?',
          d.WinningNumbers['3']?.Number ?? '?',
        ] as [string, string, string],
      }))
    } catch { /* try next */ }
  }
  return null
}

export async function GET() {
  const now = Date.now()

  // 1. In-memory cache
  if (memCache && now - memCache.fetchedAt < TTL) {
    return NextResponse.json(memCache.draws, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
    })
  }

  // 2. Try live fetch
  const draws = await fetchDaily3()
  if (draws?.length) {
    memCache = { draws, fetchedAt: now }
    await setDaily3Cache(draws)
    return NextResponse.json(draws, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
    })
  }

  // 3. Fall back to file cache
  const fileCache = await getDaily3Cache()
  if (fileCache?.draws?.length) {
    memCache = { draws: fileCache.draws, fetchedAt: now }
    return NextResponse.json(fileCache.draws, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
    })
  }

  return NextResponse.json([], { status: 200 })
}
