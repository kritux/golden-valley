import { createAdminClient } from '@/lib/supabase/server'

const L1_COMMISSION = 100
const L2_COMMISSION = 25
const POOL_CONTRIBUTION = 25

export async function processCommissions(
  ticketId: string,
  paymentId: string,
  sellerId: string | null
): Promise<void> {
  const supabase = await createAdminClient()

  if (!sellerId) {
    await supabase.from('prize_pool').insert({ ticket_id: ticketId, payment_id: paymentId, amount: POOL_CONTRIBUTION })
    return
  }

  const { data: seller } = await supabase
    .from('sellers')
    .select('id, recruited_by')
    .eq('id', sellerId)
    .single()

  if (!seller) return

  await supabase.from('commissions').insert({
    ticket_id: ticketId,
    payment_id: paymentId,
    seller_id: seller.id,
    level: 1,
    amount: L1_COMMISSION,
    status: 'pending',
  })

  if (seller.recruited_by) {
    await supabase.from('commissions').insert({
      ticket_id: ticketId,
      payment_id: paymentId,
      seller_id: seller.recruited_by,
      level: 2,
      amount: L2_COMMISSION,
      status: 'pending',
    })
  }

  await supabase.from('prize_pool').insert({ ticket_id: ticketId, payment_id: paymentId, amount: POOL_CONTRIBUTION })

  // Increment total_sales by 1 (the previous code incorrectly set it to a Promise object)
  const { data: current } = await supabase
    .from('sellers').select('total_sales').eq('id', seller.id).single()
  await supabase
    .from('sellers')
    .update({ total_sales: (current?.total_sales ?? 0) + 1 })
    .eq('id', seller.id)
}

export async function activateTicketAndCommissions(paymentId: string): Promise<{ ticket_number: number; ticket_id: string }> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase.rpc('activate_ticket', { p_payment_id: paymentId })

  if (error) throw new Error(`activate_ticket failed: ${error.message}`)

  return data as { ticket_number: number; ticket_id: string }
}
