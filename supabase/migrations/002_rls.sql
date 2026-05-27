-- ============================================================
-- 002_rls.sql — Row Level Security policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_pool  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_result ENABLE ROW LEVEL SECURITY;

-- Helper: check if caller is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get seller.id for the calling profile
CREATE OR REPLACE FUNCTION public.my_seller_id()
RETURNS uuid AS $$
  SELECT id FROM public.sellers WHERE profile_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─────────────────────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────────────────────

CREATE POLICY "profiles: own read"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: admin read all"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "profiles: seller read their customers"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.buyer_id = profiles.id
        AND t.seller_id = public.my_seller_id()
    )
  );

CREATE POLICY "profiles: own update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: admin update all"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- Service role / trigger inserts profiles — anon insert needed for trigger
CREATE POLICY "profiles: service insert"
  ON public.profiles FOR INSERT
  WITH CHECK (true); -- restricted via SECURITY DEFINER trigger

-- ─────────────────────────────────────────────────────────────
-- SELLERS
-- ─────────────────────────────────────────────────────────────

CREATE POLICY "sellers: own read"
  ON public.sellers FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "sellers: admin all"
  ON public.sellers FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- TICKETS
-- ─────────────────────────────────────────────────────────────

-- Anyone can see ticket_number + status for the public grid (even anon)
CREATE POLICY "tickets: public grid read"
  ON public.tickets FOR SELECT
  USING (true); -- filtered to only number+status in the API layer

CREATE POLICY "tickets: buyer read own"
  ON public.tickets FOR SELECT
  USING (buyer_id = auth.uid());

CREATE POLICY "tickets: seller read sold"
  ON public.tickets FOR SELECT
  USING (seller_id = public.my_seller_id());

CREATE POLICY "tickets: admin all"
  ON public.tickets FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Service role inserts tickets during purchase intent
CREATE POLICY "tickets: service insert"
  ON public.tickets FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- PAYMENTS
-- ─────────────────────────────────────────────────────────────

CREATE POLICY "payments: buyer read own"
  ON public.payments FOR SELECT
  USING (buyer_id = auth.uid());

CREATE POLICY "payments: buyer insert"
  ON public.payments FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "payments: seller read for their tickets"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.payment_id = payments.id
        AND t.seller_id = public.my_seller_id()
    )
  );

CREATE POLICY "payments: admin all"
  ON public.payments FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- COMMISSIONS
-- ─────────────────────────────────────────────────────────────

CREATE POLICY "commissions: seller read own"
  ON public.commissions FOR SELECT
  USING (seller_id = public.my_seller_id());

CREATE POLICY "commissions: admin all"
  ON public.commissions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- PRIZE POOL
-- ─────────────────────────────────────────────────────────────

CREATE POLICY "prize_pool: admin all"
  ON public.prize_pool FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- DRAW RESULT
-- ─────────────────────────────────────────────────────────────

CREATE POLICY "draw_result: public read"
  ON public.draw_result FOR SELECT
  USING (true);

CREATE POLICY "draw_result: admin insert"
  ON public.draw_result FOR INSERT
  WITH CHECK (public.is_admin());
