// Golden Valley Members — Complete TypeScript Type Definitions

export type UserRole = 'admin' | 'seller' | 'customer'
export type TicketStatus = 'pending_payment' | 'active' | 'cancelled'
export type PaymentMethod = 'zelle' | 'stripe' | 'other'
export type PaymentStatus = 'pending' | 'under_review' | 'confirmed' | 'rejected'
export type CommissionLevel = 1 | 2
export type CommissionStatus = 'pending' | 'approved' | 'paid'

// ─── Core DB entities ────────────────────────────────────────────────────────

export interface Profile {
  id: string
  role: UserRole
  first_name: string
  last_name: string
  email: string
  phone: string
  phone_alt: string | null
  referred_by: string | null
  seller_id: string | null
  created_at: string
  updated_at: string
}

export interface Seller {
  id: string
  profile_id: string
  referral_code: string
  level: number
  recruited_by: string | null
  is_active: boolean
  total_sales: number
  total_commissions_earned: number
  created_at: string
}

export interface Ticket {
  id: string
  ticket_number: number | null
  status: TicketStatus
  buyer_id: string
  seller_id: string | null
  payment_id: string | null
  signature_url: string | null
  signature_ip: string | null
  signed_at: string | null
  activated_at: string | null
  created_at: string
}

export interface Payment {
  id: string
  ticket_id: string | null
  buyer_id: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  stripe_payment_intent_id: string | null
  zelle_receipt_url: string | null
  zelle_confirmed_by: string | null
  zelle_confirmed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Commission {
  id: string
  ticket_id: string
  payment_id: string
  seller_id: string
  level: CommissionLevel
  amount: number
  status: CommissionStatus
  paid_at: string | null
  created_at: string
}

export interface PrizePool {
  id: string
  ticket_id: string
  payment_id: string
  amount: number
  created_at: string
}

export interface DrawResult {
  id: string
  winning_ticket_id: string
  winner_id: string
  draw_date: string | null
  total_pool_paid: number | null
  created_at: string
}

// ─── Supabase Database type map ───────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }
        Update: Partial<Omit<Profile, 'id'>>
      }
      sellers: {
        Row: Seller
        Insert: Omit<Seller, 'id' | 'created_at' | 'total_sales' | 'total_commissions_earned' | 'is_active'> & {
          id?: string
          created_at?: string
          total_sales?: number
          total_commissions_earned?: number
          is_active?: boolean
        }
        Update: Partial<Omit<Seller, 'id'>>
      }
      tickets: {
        Row: Ticket
        Insert: Omit<Ticket, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Ticket, 'id'>>
      }
      payments: {
        Row: Payment
        Insert: Omit<Payment, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<Payment, 'id'>>
      }
      commissions: {
        Row: Commission
        Insert: Omit<Commission, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Commission, 'id'>>
      }
      prize_pool: {
        Row: PrizePool
        Insert: Omit<PrizePool, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<PrizePool, 'id'>>
      }
      draw_result: {
        Row: DrawResult
        Insert: Omit<DrawResult, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<DrawResult, 'id'>>
      }
    }
    Views: { [_ in never]: never }
    Enums: {
      user_role: UserRole
      ticket_status: TicketStatus
      payment_method: PaymentMethod
      payment_status: PaymentStatus
      commission_status: CommissionStatus
    }
    Functions: {
      get_next_ticket_number: {
        Args: Record<never, never>
        Returns: number
      }
      activate_ticket: {
        Args: { p_payment_id: string }
        Returns: { ticket_number: number; ticket_id: string }
      }
      get_admin_stats: {
        Args: Record<never, never>
        Returns: unknown
      }
      is_admin: {
        Args: Record<never, never>
        Returns: boolean
      }
      my_seller_id: {
        Args: Record<never, never>
        Returns: string
      }
    }
    CompositeTypes: { [_ in never]: never }
  }
}

// ─── Joined / enriched types for API responses ───────────────────────────────

export interface TicketWithRelations extends Ticket {
  buyer?: Profile
  seller?: SellerWithProfile
  payment?: Payment
}

export interface PaymentWithRelations extends Payment {
  ticket?: Ticket
  buyer?: Profile
  confirmed_by?: Profile
}

export interface CommissionWithRelations extends Commission {
  seller?: SellerWithProfile
  ticket?: Ticket
  payment?: Payment
}

export interface SellerWithProfile extends Seller {
  profile?: Profile
  recruiter?: Seller & { profile?: Profile }
}

// ─── Form payload types ───────────────────────────────────────────────────────

export interface PurchaseIntentPayload {
  first_name: string
  last_name: string
  email: string
  email_confirm: string
  phone: string
  phone_alt?: string
  ref_code?: string
  payment_method: 'zelle' | 'stripe'
  signature_data: string // base64 PNG
  agreed_terms: boolean
  agreed_age: boolean
  agreed_accuracy: boolean
}

export interface CreateSellerPayload {
  email: string
  first_name: string
  last_name: string
  phone: string
  recruiter_seller_id?: string // optional — the seller who recruited this new seller
}

// ─── API response wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}

export interface PurchaseIntentResponse {
  payment_id: string
  zelle_instructions?: {
    phone: string
    name: string
    memo: string
    amount: number
  }
  stripe_client_secret?: string
}

export interface ActivateTicketResponse {
  ticket_number: number
  ticket_id: string
}

// ─── Dashboard aggregate types ────────────────────────────────────────────────

export interface AdminStats {
  total_revenue: number
  tickets_sold: number
  tickets_pending: number
  tickets_available: number
  pending_zelle_count: number
  prize_pool_total: number
  active_sellers: number
}

export interface SellerDashboardStats {
  tickets_sold: number
  commissions_earned: number
  commissions_pending: number
  downline_count: number
  referral_link: string
}

// ─── Public ticket grid ───────────────────────────────────────────────────────

export interface TicketGridItem {
  number: number
  status: 'available' | TicketStatus
}

// ─── Referral resolution ──────────────────────────────────────────────────────

export interface ResolvedReferral {
  l1SellerId: string
  l2SellerId: string | null
}

export interface DownlineEntry {
  seller: SellerWithProfile
  depth: number
  children?: DownlineEntry[]
}
