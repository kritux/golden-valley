import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

type ExportType = 'payments' | 'sellers' | 'tickets'

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => {
        const val = row[h] ?? ''
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val)
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str
      }).join(',')
    ),
  ]
  return lines.join('\n')
}

export async function GET(req: NextRequest, { params }: { params: { type: ExportType } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as { data: Record<string, unknown> | null }
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const exportType = params.type
  if (!['payments', 'sellers', 'tickets'].includes(exportType)) {
    return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
  }

  const adminClient = await createAdminClient()
  let rows: Record<string, unknown>[] = []

  if (exportType === 'payments') {
    const { data } = await adminClient
      .from('payments')
      .select('id, amount, method, status, created_at, updated_at, zelle_confirmed_at, notes, stripe_payment_intent_id')
      .order('created_at', { ascending: false })
    rows = (data ?? []) as Record<string, unknown>[]
  }

  if (exportType === 'sellers') {
    const { data } = await adminClient
      .from('sellers')
      .select('id, referral_code, level, is_active, total_sales, total_commissions_earned, created_at, profile:profiles(first_name, last_name, email, phone)')
      .order('total_sales', { ascending: false })
    rows = (data ?? []).map((s) => ({
      id: s.id,
      referral_code: s.referral_code,
      level: s.level,
      is_active: s.is_active,
      total_sales: s.total_sales,
      total_commissions_earned: s.total_commissions_earned,
      created_at: s.created_at,
      first_name: (s.profile as { first_name: string } | null)?.first_name ?? '',
      last_name: (s.profile as { last_name: string } | null)?.last_name ?? '',
      email: (s.profile as { email: string } | null)?.email ?? '',
      phone: (s.profile as { phone: string } | null)?.phone ?? '',
    }))
  }

  if (exportType === 'tickets') {
    const { data } = await adminClient
      .from('tickets')
      .select('id, ticket_number, status, activated_at, created_at, buyer:profiles!tickets_buyer_id_fkey(first_name, last_name, email)')
      .order('ticket_number', { ascending: true })
    rows = (data ?? []).map((t) => ({
      id: t.id,
      ticket_number: t.ticket_number,
      status: t.status,
      activated_at: t.activated_at,
      created_at: t.created_at,
      buyer_first_name: (t.buyer as { first_name: string } | null)?.first_name ?? '',
      buyer_last_name: (t.buyer as { last_name: string } | null)?.last_name ?? '',
      buyer_email: (t.buyer as { email: string } | null)?.email ?? '',
    }))
  }

  const csv = toCSV(rows)
  const filename = `gvm-${exportType}-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
