import { createClient } from '@/lib/supabase/server'

export interface AuthenticatedCustomer {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  phone_alt: string | null
  role: string
  referred_by: string | null
  seller_id: string | null
  created_at: string
}

export async function getAuthenticatedCustomer(): Promise<AuthenticatedCustomer | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, phone, phone_alt, role, referred_by, seller_id, created_at')
    .eq('id', user.id)
    .single()

  return profile ? (profile as AuthenticatedCustomer) : null
}

/**
 * Normalise a raw phone string to E.164 (+1XXXXXXXXXX for US 10-digit numbers).
 * Already-formatted +E.164 numbers are returned as-is.
 */
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')

  // Already has country code and correct length
  if (raw.startsWith('+') && digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`
  }

  // 10-digit US number → prepend +1
  if (digits.length === 10) return `+1${digits}`

  // 11-digit starting with 1 → E.164
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`

  // International with no leading +: require 10–15 digits
  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`

  return null
}
