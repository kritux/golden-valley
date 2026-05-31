-- ============================================================
-- 20260530_installments_phone_auth.sql
-- Golden Valley Members — Installment payments + phone auth
-- ============================================================
--
-- ARCHITECTURE NOTE:
-- This codebase uses `profiles` (id = auth.users.id) as the unified
-- identity for all users, including customers.  There is NO separate
-- `customers` table.  Buyers are tracked via tickets.buyer_id which
-- references profiles(id).  All RLS relies on auth.uid() = profiles.id.
--
-- WHAT THIS MIGRATION ADDS:
--   1. Installment-tracking columns on `tickets`
--   2. New `payment_installments` table (replaces single-payment model
--      for the partial-payment flow; existing `payments` table is kept
--      for backwards-compat / Stripe full-pay path)
--   3. `profiles.user_id` alias column is NOT needed — profiles.id IS
--      the auth.users.id by design.  Phone is already on profiles.
--      We DO add a dedicated phone-auth helper index & ensure the
--      handle_new_user trigger populates phone from Supabase phone auth.
--   4. RLS policies for payment_installments
--   5. Supplementary RLS: customers can read their own tickets by
--      buyer_id (a more explicit policy alongside the existing public grid)
--   6. forfeit_overdue_tickets() callable function
--   7. update_installment_ticket_totals() trigger function that keeps
--      tickets.total_paid / balance_due / payment_status in sync
--   8. New indexes
--
-- COMMISSION RULE (enforced at application + function layer):
--   Commissions are created ONLY when tickets.payment_status = 'paid_full'.
--   Do NOT create commission rows on partial payments.  The
--   activate_ticket() function in 004_functions.sql must be updated to
--   call record_full_payment_commissions() (defined below) instead of
--   inserting commissions inline, so that the paid_full gate is respected.
-- ============================================================

-- ============================================================
-- SECTION 1 — ADD INSTALLMENT COLUMNS TO tickets
-- ============================================================

-- total_paid: running sum of all verified installment amounts (cents)
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS total_paid INTEGER NOT NULL DEFAULT 0;

-- balance_due: amount still owed (cents).  Starts at $500 = 50000 cents.
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS balance_due INTEGER NOT NULL DEFAULT 50000;

-- payment_status tracks the installment lifecycle:
--   unpaid      → no payment received yet
--   partial     → first payment (≥ $200) received; balance pending
--   paid_full   → full $500 collected; ticket active
--   overdue     → partial but payment_deadline has passed (not yet forfeited)
--   forfeited   → deadline missed; ticket released back to available pool
--
-- NOTE: This is a TEXT column (not the existing payment_status ENUM which
-- belongs to the `payments` table and has different values).
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS installment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (installment_status IN ('unpaid', 'partial', 'paid_full', 'overdue', 'forfeited'));

-- payment_deadline: set to (initial_payment_at + 30 days) when first payment arrives
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS payment_deadline TIMESTAMPTZ;

-- initial_payment_at: timestamp of the first verified installment
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS initial_payment_at TIMESTAMPTZ;

-- ============================================================
-- SECTION 2 — ENSURE phone IS ON profiles (it already exists
-- per 001_schema.sql; this block is a safety no-op guard)
-- ============================================================

-- profiles.phone already exists as TEXT NOT NULL DEFAULT ''.
-- For phone-auth we need to allow NULL (phone may not be set yet for
-- email-based accounts) and add a UNIQUE constraint so Supabase can
-- look up a profile by phone.
--
-- Step 1: relax NOT NULL (safe — existing '' values become queryable)
ALTER TABLE public.profiles
  ALTER COLUMN phone DROP NOT NULL;

-- Step 2: add UNIQUE on non-empty phone values only (partial unique index)
-- We use a partial unique index rather than a column constraint so that
-- multiple rows with NULL or '' don't violate uniqueness.
CREATE UNIQUE INDEX IF NOT EXISTS uidx_profiles_phone_nonempty
  ON public.profiles(phone)
  WHERE phone IS NOT NULL AND phone <> '';

-- Step 3: update handle_new_user to also capture phone from Supabase
-- phone-auth sign-ins.  auth.users.phone is populated by Supabase when
-- the user authenticates via SMS OTP.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles(id, email, first_name, last_name, phone, role)
  VALUES(
    NEW.id,
    -- email may be null for phone-auth users
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name',  ''),
    -- phone is populated by Supabase phone auth; fall back to meta
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer')
  )
  ON CONFLICT (id) DO UPDATE
    SET phone = EXCLUDED.phone   -- keep phone in sync if user updates it
  WHERE public.profiles.phone IS DISTINCT FROM EXCLUDED.phone;

  RETURN NEW;
END;
$$;

-- ============================================================
-- SECTION 3 — payment_installments TABLE
-- ============================================================
-- Each row represents one payment attempt toward a ticket's $500 total.
-- First payment must be ≥ $200 ($20000 cents) — enforced at app layer.
-- The ticket number is locked (assigned) after the first verified payment.
-- Commissions fire only after installment_status reaches 'paid_full'.

CREATE TABLE IF NOT EXISTS public.payment_installments (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The ticket this payment is toward
  ticket_id                UUID        NOT NULL
                             REFERENCES public.tickets(id) ON DELETE CASCADE,

  -- The buyer making this payment (= profiles.id = auth.uid())
  buyer_id                 UUID        NOT NULL
                             REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Amount in cents (e.g. 20000 = $200, 50000 = $500)
  amount                   INTEGER     NOT NULL CHECK (amount > 0),

  -- 'zelle' requires manual admin verification; 'stripe' is auto-confirmed
  payment_method           TEXT        NOT NULL
                             CHECK (payment_method IN ('zelle', 'stripe')),

  -- pending   → submitted, awaiting verification
  -- verified  → admin confirmed (zelle) or Stripe webhook confirmed (stripe)
  -- rejected  → admin rejected (zelle bounce, fraud, etc.)
  status                   TEXT        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'verified', 'rejected')),

  -- URL to Zelle screenshot / Stripe receipt stored in Supabase Storage
  receipt_url              TEXT,

  -- Stripe payment intent ID (stripe payments only)
  stripe_payment_intent_id TEXT        UNIQUE,

  -- Admin notes (rejection reason, confirmation notes, etc.)
  admin_notes              TEXT,

  -- Set by admin when verifying / rejecting
  verified_at              TIMESTAMPTZ,
  verified_by              UUID        REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at trigger for payment_installments
DROP TRIGGER IF EXISTS trg_payment_installments_updated_at ON public.payment_installments;
CREATE TRIGGER trg_payment_installments_updated_at
  BEFORE UPDATE ON public.payment_installments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- SECTION 4 — TRIGGER: keep tickets totals in sync
-- ============================================================
-- Fires AFTER INSERT or UPDATE on payment_installments.
-- When a payment is verified:
--   • Add amount to tickets.total_paid
--   • Recalculate tickets.balance_due
--   • Set installment_status:
--       - First verification  → sets initial_payment_at, payment_deadline (+30d)
--       - total_paid >= 50000 → 'paid_full'
--       - total_paid < 50000  → 'partial'
-- When a payment is rejected after previously being verified:
--   • Subtract amount from total_paid, recalculate balance_due, revert status
--
-- COMMISSION NOTE: commissions must NOT be created here.
-- They are created by record_full_payment_commissions() (defined in
-- Section 6) which is called ONLY when installment_status = 'paid_full'.

CREATE OR REPLACE FUNCTION public.sync_ticket_installment_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_verified BOOLEAN;
  v_new_verified BOOLEAN;
  v_ticket       RECORD;
BEGIN
  v_old_verified := (TG_OP = 'UPDATE' AND OLD.status = 'verified');
  v_new_verified := (NEW.status = 'verified');

  -- Only act when verification status actually changes
  IF TG_OP = 'INSERT' AND NOT v_new_verified THEN
    RETURN NEW;  -- new pending/rejected row — nothing to aggregate yet
  END IF;

  IF TG_OP = 'UPDATE' AND v_old_verified = v_new_verified THEN
    RETURN NEW;  -- status unchanged w.r.t. verified — skip
  END IF;

  -- Lock the ticket row for this update
  SELECT * INTO v_ticket
    FROM public.tickets
   WHERE id = NEW.ticket_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ticket % not found', NEW.ticket_id;
  END IF;

  -- Recompute total_paid from all verified installments for this ticket
  -- (recompute is safer than incremental delta to avoid drift)
  UPDATE public.tickets
     SET total_paid      = agg.total,
         balance_due     = GREATEST(0, 50000 - agg.total),

         -- Set initial_payment_at the first time we see a verified payment
         initial_payment_at = CASE
           WHEN v_ticket.initial_payment_at IS NULL AND agg.total > 0
           THEN now()
           ELSE v_ticket.initial_payment_at
         END,

         -- Deadline = initial_payment_at + 30 days (set once, never moved)
         payment_deadline = CASE
           WHEN v_ticket.payment_deadline IS NULL AND agg.total > 0
           THEN now() + INTERVAL '30 days'
           ELSE v_ticket.payment_deadline
         END,

         -- Derive installment_status
         installment_status = CASE
           WHEN agg.total <= 0        THEN 'unpaid'
           WHEN agg.total >= 50000    THEN 'paid_full'
           -- Overdue if deadline has passed and balance still remains
           WHEN v_ticket.payment_deadline IS NOT NULL
                AND v_ticket.payment_deadline < now()
                AND agg.total < 50000  THEN 'overdue'
           ELSE 'partial'
         END

    FROM (
      SELECT COALESCE(SUM(amount), 0) AS total
        FROM public.payment_installments
       WHERE ticket_id = NEW.ticket_id
         AND status = 'verified'
    ) agg
   WHERE id = NEW.ticket_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_ticket_installment_totals ON public.payment_installments;
CREATE TRIGGER trg_sync_ticket_installment_totals
  AFTER INSERT OR UPDATE OF status ON public.payment_installments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_ticket_installment_totals();

-- ============================================================
-- SECTION 5 — TRIGGER: assign ticket number on first payment
-- ============================================================
-- When a ticket transitions to 'partial' or 'paid_full' for the first
-- time (i.e. ticket_number is still NULL), atomically assign the next
-- sequential number.  This "locks in" the membership number.

CREATE OR REPLACE FUNCTION public.assign_ticket_number_on_first_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only act when installment_status moves to partial or paid_full
  -- AND ticket_number has not yet been assigned
  IF NEW.installment_status IN ('partial', 'paid_full')
     AND OLD.installment_status = 'unpaid'
     AND NEW.ticket_number IS NULL
  THEN
    NEW.ticket_number := public.get_next_ticket_number();
    NEW.status        := 'pending_payment';  -- becomes 'active' on paid_full
  END IF;

  -- When fully paid, activate the ticket
  IF NEW.installment_status = 'paid_full'
     AND OLD.installment_status IS DISTINCT FROM 'paid_full'
  THEN
    NEW.status       := 'active';
    NEW.activated_at := COALESCE(NEW.activated_at, now());
  END IF;

  -- When forfeited, release the ticket number so it can be reused
  IF NEW.installment_status = 'forfeited'
     AND OLD.installment_status IS DISTINCT FROM 'forfeited'
  THEN
    NEW.ticket_number := NULL;
    NEW.status        := 'cancelled';
    NEW.buyer_id      := NULL;  -- release buyer claim
                                 -- buyer_id FK is ON DELETE RESTRICT,
                                 -- but we're setting to NULL here to free the slot
  END IF;

  RETURN NEW;
END;
$$;

-- NOTE: buyer_id on tickets is REFERENCES profiles(id) ON DELETE RESTRICT.
-- Setting buyer_id = NULL on forfeiture requires it to be nullable.
-- Add DROP NOT NULL guard:
ALTER TABLE public.tickets
  ALTER COLUMN buyer_id DROP NOT NULL;

DROP TRIGGER IF EXISTS trg_assign_ticket_number ON public.tickets;
CREATE TRIGGER trg_assign_ticket_number
  BEFORE UPDATE OF installment_status ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_ticket_number_on_first_payment();

-- ============================================================
-- SECTION 6 — record_full_payment_commissions()
-- ============================================================
-- Called when a ticket reaches paid_full.  Inserts commission rows
-- following the same logic as activate_ticket() but gated on
-- installment_status = 'paid_full'.
--
-- COMMISSION RULE (canonical):
--   L1 seller (direct):   $100
--   L2 seller (recruiter of L1): $25
--   Prize pool:           $25  (always)
--   Company keeps:        $350 (residual — not stored in a table)
--   Total:                $500
--
-- If no L2 exists: the $25 L2 commission goes to the company ($375 total).
-- Commissions are created with status='pending' — admin approves payout.
-- This function is idempotent: calling it twice for the same ticket is safe.

CREATE OR REPLACE FUNCTION public.record_full_payment_commissions(p_ticket_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seller_id    UUID;
  v_recruiter_id UUID;
  v_buyer_id     UUID;
BEGIN
  -- Verify ticket is paid_full
  SELECT seller_id, buyer_id
    INTO v_seller_id, v_buyer_id
    FROM public.tickets
   WHERE id = p_ticket_id
     AND installment_status = 'paid_full';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket % is not paid_full — commissions not created.', p_ticket_id;
  END IF;

  -- Idempotency guard: skip if commissions already exist for this ticket
  IF EXISTS (SELECT 1 FROM public.commissions WHERE ticket_id = p_ticket_id) THEN
    RETURN;
  END IF;

  -- Prize pool entry (always $25)
  INSERT INTO public.prize_pool(ticket_id, payment_id, amount)
  SELECT p_ticket_id,
         -- Use the most recent verified installment as the "payment" ref
         pi.id,
         25.00
    FROM public.payment_installments pi
   WHERE pi.ticket_id = p_ticket_id
     AND pi.status = 'verified'
   ORDER BY pi.verified_at DESC
   LIMIT 1;

  -- Commission rows (only if sold via a seller)
  IF v_seller_id IS NOT NULL THEN
    -- L1 seller: $100
    INSERT INTO public.commissions(ticket_id, payment_id, seller_id, level, amount, status)
    SELECT p_ticket_id, pi.id, v_seller_id, 1, 100.00, 'pending'
      FROM public.payment_installments pi
     WHERE pi.ticket_id = p_ticket_id
       AND pi.status = 'verified'
     ORDER BY pi.verified_at DESC
     LIMIT 1;

    -- L2 recruiter: $25 (if recruiter exists)
    SELECT recruited_by INTO v_recruiter_id
      FROM public.sellers
     WHERE id = v_seller_id;

    IF v_recruiter_id IS NOT NULL THEN
      INSERT INTO public.commissions(ticket_id, payment_id, seller_id, level, amount, status)
      SELECT p_ticket_id, pi.id, v_recruiter_id, 2, 25.00, 'pending'
        FROM public.payment_installments pi
       WHERE pi.ticket_id = p_ticket_id
         AND pi.status = 'verified'
       ORDER BY pi.verified_at DESC
       LIMIT 1;
    END IF;

    -- Update seller's total_sales counter
    UPDATE public.sellers
       SET total_sales = total_sales + 1
     WHERE id = v_seller_id;
  END IF;

  -- Notify app layer if this is ticket #1000
  PERFORM pg_notify(
    'ticket_1000_sold',
    json_build_object('ticket_id', p_ticket_id)::text
  )
  FROM public.tickets
  WHERE id = p_ticket_id
    AND ticket_number = 1000;
END;
$$;

-- Trigger to automatically call record_full_payment_commissions when a
-- ticket's installment_status transitions to 'paid_full'
CREATE OR REPLACE FUNCTION public.trg_fn_commissions_on_paid_full()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.installment_status = 'paid_full'
     AND (OLD.installment_status IS DISTINCT FROM 'paid_full')
  THEN
    PERFORM public.record_full_payment_commissions(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_commissions_on_paid_full ON public.tickets;
CREATE TRIGGER trg_commissions_on_paid_full
  AFTER UPDATE OF installment_status ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_commissions_on_paid_full();

-- ============================================================
-- SECTION 7 — forfeit_overdue_tickets()
-- ============================================================
-- NOT a cron job.  Call this function periodically from the app layer
-- (e.g. a Vercel cron at midnight) or from an admin action.
-- Safe to call multiple times (idempotent).
--
-- What it does:
--   1. Marks overdue tickets as 'forfeited' and 'cancelled'
--   2. Sets buyer_id = NULL (releases the claim)
--   3. Sets ticket_number = NULL (number returns to the available pool)
--   4. The freed ticket number will be reassigned to the next buyer.
--
-- Returns a JSON summary of how many tickets were forfeited.

CREATE OR REPLACE FUNCTION public.forfeit_overdue_tickets()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT := 0;
BEGIN
  UPDATE public.tickets
     SET installment_status = 'forfeited',
         status             = 'cancelled',
         ticket_number      = NULL,
         buyer_id           = NULL
   WHERE installment_status IN ('partial', 'overdue')
     AND payment_deadline IS NOT NULL
     AND payment_deadline < now();

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN json_build_object(
    'forfeited_count', v_count,
    'executed_at',     now()
  );
END;
$$;

-- ============================================================
-- SECTION 8 — RLS: ENABLE + POLICIES for payment_installments
-- ============================================================

ALTER TABLE public.payment_installments ENABLE ROW LEVEL SECURITY;

-- Customers can read their own installments (via buyer_id = their profile id)
-- This is a direct check: buyer_id on payment_installments = auth.uid()
CREATE POLICY "installments: buyer read own"
  ON public.payment_installments FOR SELECT
  USING (buyer_id = auth.uid());

-- Sellers can read installments for tickets they sold
CREATE POLICY "installments: seller read sold tickets"
  ON public.payment_installments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = payment_installments.ticket_id
        AND t.seller_id = public.my_seller_id()
    )
  );

-- Customers can create new installment records (pending status only)
-- The CHECK ensures they can only insert for their own buyer_id
-- and cannot self-approve (status must be 'pending' on insert)
CREATE POLICY "installments: buyer insert"
  ON public.payment_installments FOR INSERT
  WITH CHECK (
    buyer_id = auth.uid()
    AND status = 'pending'
  );

-- Only admins can UPDATE installments (verify / reject)
-- This is the critical gate: no customer or seller can self-verify
CREATE POLICY "installments: admin update"
  ON public.payment_installments FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can read all installments
CREATE POLICY "installments: admin read all"
  ON public.payment_installments FOR SELECT
  USING (public.is_admin());

-- Admins can delete (for cleanup / fraud removal)
CREATE POLICY "installments: admin delete"
  ON public.payment_installments FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- SECTION 9 — RLS: tickets — customer can read own tickets
-- ============================================================
-- The existing schema has:
--   "tickets: public grid read" → USING (true) — everyone sees all rows
--   "tickets: buyer read own"   → USING (buyer_id = auth.uid())
--   "tickets: admin all"        → full access
--
-- buyer_id = auth.uid() already covers customer access for email auth.
-- For phone auth, auth.uid() is still the profiles.id (Supabase maps both).
-- The existing policy is sufficient.  We add a clearer named policy that
-- explicitly documents the installment context:

-- Guard: only create if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename   = 'tickets'
      AND policyname  = 'tickets: customer installment read own'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "tickets: customer installment read own"
        ON public.tickets FOR SELECT
        USING (buyer_id = auth.uid())
    $policy$;
  END IF;
END;
$$;

-- ============================================================
-- SECTION 10 — INDEXES
-- ============================================================

-- payment_installments
CREATE INDEX IF NOT EXISTS idx_installments_ticket_id
  ON public.payment_installments(ticket_id);

CREATE INDEX IF NOT EXISTS idx_installments_buyer_id
  ON public.payment_installments(buyer_id);

CREATE INDEX IF NOT EXISTS idx_installments_status
  ON public.payment_installments(status);

CREATE INDEX IF NOT EXISTS idx_installments_stripe_intent
  ON public.payment_installments(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- tickets — new columns
CREATE INDEX IF NOT EXISTS idx_tickets_installment_status
  ON public.tickets(installment_status);

CREATE INDEX IF NOT EXISTS idx_tickets_payment_deadline
  ON public.tickets(payment_deadline)
  WHERE payment_deadline IS NOT NULL;

-- profiles — phone lookup (used by Supabase phone auth resolver)
CREATE INDEX IF NOT EXISTS idx_profiles_phone
  ON public.profiles(phone)
  WHERE phone IS NOT NULL AND phone <> '';

-- ============================================================
-- SECTION 11 — COMMENTS (documentation baked into the DB)
-- ============================================================

COMMENT ON COLUMN public.tickets.total_paid IS
  'Running total of all verified installment payments in cents. Max 50000 (= $500).';

COMMENT ON COLUMN public.tickets.balance_due IS
  'Remaining balance owed in cents. Computed as MAX(0, 50000 - total_paid).';

COMMENT ON COLUMN public.tickets.installment_status IS
  'Installment lifecycle: unpaid → partial (≥$200 paid) → paid_full ($500 paid). '
  'Overdue if partial and deadline passed. Forfeited if deadline missed — '
  'ticket number is released back to pool.';

COMMENT ON COLUMN public.tickets.payment_deadline IS
  'Set to (initial_payment_at + 30 days) on first verified payment. Never extended.';

COMMENT ON COLUMN public.tickets.initial_payment_at IS
  'Timestamp of the first verified installment. Sets the 30-day deadline clock.';

COMMENT ON TABLE public.payment_installments IS
  'Individual payment installments toward a ticket. '
  'First payment must be ≥ $200 (enforced at API layer). '
  'Commissions are NOT created until installment_status = paid_full on the ticket.';

COMMENT ON FUNCTION public.forfeit_overdue_tickets() IS
  'Call from app-layer cron (e.g. Vercel cron at midnight). '
  'Forfeits tickets where installment_status IN (partial, overdue) AND payment_deadline < now(). '
  'Releases ticket number back to available pool. Idempotent.';

COMMENT ON FUNCTION public.record_full_payment_commissions(UUID) IS
  'Creates commission rows (L1=$100, L2=$25) and prize pool entry ($25) '
  'ONLY when ticket.installment_status = paid_full. '
  'Called automatically by trg_commissions_on_paid_full trigger. Idempotent.';
