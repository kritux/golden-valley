import { createAdminClient } from '@/lib/supabase/server'
import type { ResolvedReferral, DownlineEntry, SellerWithProfile } from '@/types'

export async function resolveReferral(refCode: string): Promise<ResolvedReferral | null> {
  const supabase = await createAdminClient()

  const { data: l1Seller } = await supabase
    .from('sellers')
    .select('id, recruited_by, is_active')
    .eq('referral_code', refCode)
    .eq('is_active', true)
    .single()

  if (!l1Seller) return null

  return {
    l1SellerId: l1Seller.id,
    l2SellerId: l1Seller.recruited_by ?? null,
  }
}

export async function getDownline(sellerId: string, maxDepth = 2): Promise<DownlineEntry[]> {
  const supabase = await createAdminClient()

  async function fetchLevel(parentId: string, depth: number): Promise<DownlineEntry[]> {
    if (depth > maxDepth) return []

    const { data: children } = await supabase
      .from('sellers')
      .select('*, profile:profiles(*)')
      .eq('recruited_by', parentId)

    if (!children || children.length === 0) return []

    return Promise.all(
      children.map(async (child) => {
        const nested = await fetchLevel(child.id, depth + 1)
        return {
          seller: child as unknown as SellerWithProfile,
          depth,
          children: nested.length > 0 ? nested : undefined,
        }
      })
    )
  }

  return fetchLevel(sellerId, 1)
}

export function generateReferralCode(firstName: string, lastName: string): string {
  const base = `${firstName.slice(0, 2)}${lastName.slice(0, 2)}`.toUpperCase()
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${base}${suffix}`
}
