import { NextResponse } from 'next/server'

// Called by a cron job or scheduled task to refresh lottery results
// curl http://localhost:3000/api/cron/lottery-refresh
export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const results = await Promise.allSettled([
    fetch(`${base}/api/lottery`).then(r => r.json()),
    fetch(`${base}/api/lottery/daily3`).then(r => r.json()),
  ])

  return NextResponse.json({
    tris: results[0].status === 'fulfilled' ? results[0].value : null,
    daily3: results[1].status === 'fulfilled' ? 'ok' : null,
    ts: new Date().toISOString(),
  })
}
