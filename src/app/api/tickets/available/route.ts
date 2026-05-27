import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { TicketGridItem } from '@/types'

export const revalidate = 30 // Cache for 30 seconds

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const grid: TicketGridItem[] = Array.from({ length: 1000 }, (_, i) => ({ number: i + 1, status: 'available' as const }))
    return NextResponse.json(grid)
  }

  const supabase = await createClient()

  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('ticket_number, status')
    .not('ticket_number', 'is', null)
    .order('ticket_number', { ascending: true })

  if (error) {
    // DB not yet migrated — return all 1,000 as available (safe fallback)
    const fallback: TicketGridItem[] = Array.from({ length: 1000 }, (_, i) => ({ number: i + 1, status: 'available' as const }))
    return NextResponse.json(fallback)
  }

  const soldMap = new Map(tickets?.map((t) => [t.ticket_number!, t.status]) ?? [])

  const grid: TicketGridItem[] = Array.from({ length: 1000 }, (_, i) => {
    const num = i + 1
    const status = soldMap.get(num)
    return {
      number: num,
      status: status ?? 'available',
    }
  })

  return NextResponse.json(grid, {
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    },
  })
}
