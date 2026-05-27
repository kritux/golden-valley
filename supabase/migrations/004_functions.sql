-- ============================================================
-- 004_functions.sql — DB functions, triggers, auth hook
-- ============================================================

-- ── get_next_ticket_number ────────────────────────────────────
-- Atomically returns the next available ticket number.
-- Must be called inside a transaction with FOR UPDATE lock.
CREATE OR REPLACE FUNCTION public.get_next_ticket_number()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_num int;
BEGIN
  SELECT COALESCE(MAX(ticket_number), 0) + 1
    INTO next_num
    FROM public.tickets
   WHERE status != 'cancelled';

  IF next_num > 1000 THEN
    RAISE EXCEPTION 'All 1,000 tickets have been sold.';
  END IF;

  RETURN next_num;
END;
$$;

-- ── activate_ticket ───────────────────────────────────────────
-- Called when a payment is confirmed (Stripe webhook or admin Zelle approval).
-- Atomically: assigns ticket number, activates ticket, creates commissions, updates prize pool.
CREATE OR REPLACE FUNCTION public.activate_ticket(p_payment_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ticket_id    uuid;
  v_ticket_number int;
  v_seller_id    uuid;
  v_recruiter_id uuid;
  v_result       json;
BEGIN
  -- Fetch confirmed payment + its ticket in one shot
  SELECT t.id, t.seller_id
    INTO v_ticket_id, v_seller_id
    FROM public.payments p
    JOIN public.tickets  t ON t.id = p.ticket_id
   WHERE p.id = p_payment_id
     AND p.status = 'confirmed'
   FOR UPDATE OF t;         -- lock row to prevent race condition

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment % is not confirmed or ticket not found.', p_payment_id;
  END IF;

  -- Guard: already activated
  IF EXISTS (SELECT 1 FROM public.tickets WHERE id = v_ticket_id AND status = 'active') THEN
    SELECT row_to_json(r) INTO v_result
      FROM (SELECT ticket_number, id AS ticket_id FROM public.tickets WHERE id = v_ticket_id) r;
    RETURN v_result;
  END IF;

  -- Assign next sequential ticket number
  v_ticket_number := public.get_next_ticket_number();

  -- Activate ticket
  UPDATE public.tickets
     SET ticket_number = v_ticket_number,
         status        = 'active',
         activated_at  = now()
   WHERE id = v_ticket_id;

  -- Commissions (only if sold by a seller)
  IF v_seller_id IS NOT NULL THEN
    -- L1: direct seller earns $100
    INSERT INTO public.commissions(ticket_id, payment_id, seller_id, level, amount, status)
    VALUES(v_ticket_id, p_payment_id, v_seller_id, 1, 100.00, 'pending');

    -- L2: recruiter earns $25 (if exists)
    SELECT recruited_by INTO v_recruiter_id
      FROM public.sellers
     WHERE id = v_seller_id;

    IF v_recruiter_id IS NOT NULL THEN
      INSERT INTO public.commissions(ticket_id, payment_id, seller_id, level, amount, status)
      VALUES(v_ticket_id, p_payment_id, v_recruiter_id, 2, 25.00, 'pending');
    END IF;

    -- Increment seller's total_sales counter
    UPDATE public.sellers
       SET total_sales = total_sales + 1
     WHERE id = v_seller_id;
  END IF;

  -- Always accumulate $25 in the prize pool
  INSERT INTO public.prize_pool(ticket_id, payment_id, amount)
  VALUES(v_ticket_id, p_payment_id, 25.00);

  -- Check if this was ticket #1000 — raise notice so the app layer can trigger draw
  IF v_ticket_number = 1000 THEN
    PERFORM pg_notify('ticket_1000_sold', json_build_object(
      'ticket_id', v_ticket_id,
      'ticket_number', v_ticket_number,
      'payment_id', p_payment_id
    )::text);
  END IF;

  v_result := json_build_object(
    'ticket_number', v_ticket_number,
    'ticket_id',     v_ticket_id
  );

  RETURN v_result;
END;
$$;

-- ── handle_new_user ───────────────────────────────────────────
-- Fires on INSERT to auth.users — creates the matching profile row.
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
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name',  ''),
    COALESCE(NEW.raw_user_meta_data->>'phone',       ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer')
  )
  ON CONFLICT (id) DO NOTHING;   -- idempotent

  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ── get_prize_pool_total ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_prize_pool_total()
RETURNS numeric
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(SUM(amount), 0) FROM public.prize_pool;
$$;

-- ── get_admin_stats ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT json_build_object(
    'total_revenue',        COALESCE((SELECT SUM(amount) FROM public.payments WHERE status = 'confirmed'), 0),
    'tickets_sold',         (SELECT COUNT(*) FROM public.tickets WHERE status = 'active'),
    'tickets_pending',      (SELECT COUNT(*) FROM public.tickets WHERE status = 'pending_payment'),
    'tickets_available',    1000 - (SELECT COUNT(*) FROM public.tickets WHERE status != 'cancelled'),
    'pending_zelle_count',  (SELECT COUNT(*) FROM public.payments WHERE status = 'under_review' AND method = 'zelle'),
    'prize_pool_total',     public.get_prize_pool_total(),
    'active_sellers',       (SELECT COUNT(*) FROM public.sellers WHERE is_active = true)
  );
$$;
