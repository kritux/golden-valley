import { NextResponse } from 'next/server'

export const revalidate = 1800 // re-fetch every 30 minutes

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

export async function GET() {
  try {
    const res = await fetch(
      'https://www.calottery.com/api/DrawGameApi/DrawGamePastDrawResults/9/1/14',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; results-display/1.0)',
          Accept: 'application/json',
        },
        next: { revalidate: 1800 },
      }
    )

    if (!res.ok) throw new Error('upstream error')

    const json = await res.json() as { PreviousDraws: RawDraw[] }

    const draws: DrawResult[] = json.PreviousDraws.slice(0, 10).map((d) => ({
      drawNumber: d.DrawNumber,
      date: d.DrawDate,
      numbers: [
        d.WinningNumbers['1']?.Number ?? '?',
        d.WinningNumbers['2']?.Number ?? '?',
        d.WinningNumbers['3']?.Number ?? '?',
      ],
    }))

    return NextResponse.json(draws, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
    })
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
