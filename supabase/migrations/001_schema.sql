-- ============================================================
-- 001_schema.sql — Golden Valley Members complete schema
-- ============================================================

-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'seller', 'customer');
CREATE TYPE ticket_status AS ENUM ('pending_payment', 'active', 'cancelled');
CREATE TYPE payment_method AS ENUM ('zelle', 'stripe', 'other');
CREATE TYPE payment_status AS ENUM ('pending', 'under_review', 'confirmed', 'rejected');
CREATE TYPE commission_status AS ENUM ('pending', 'approved', 'paid');

-- ── profiles ─────────────────────────────────────────────────
-- Extends auth.users. Created automatically via trigger on auth.users insert.
CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          user_role   NOT NULL DEFAULT 'customer',
  first_name    text        NOT NULL DEFAULT '',
  last_name     text        NOT NULL DEFAULT '',
  email         text        UNIQUE NOT NULL,
  phone         text        NOT NULL DEFAULT '',
  phone_alt     text,
  referred_by   uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  seller_id     uuid,                   -- FK added after sellers table (below)
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── sellers ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sellers (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id                uuid        UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code             text        UNIQUE NOT NULL,
  level                     int         NOT NULL CHECK (level >= 1 AND level <= 3),
  recruited_by              uuid        REFERENCES public.sellers(id) ON DELETE SET NULL,
  is_active                 boolean     NOT NULL DEFAULT true,
  total_sales               int         NOT NULL DEFAULT 0,
  total_commissions_earned  numeric(10,2) NOT NULL DEFAULT 0,
  created_at                timestamptz NOT NULL DEFAULT now()
);

-- Back-fill the FK from profiles → sellers
ALTER TABLE public.profiles
  ADD CONSTRAINT fk_profiles_seller_id
  FOREIGN KEY (seller_id) REFERENCES public.sellers(id) ON DELETE SET NULL;

-- ── payments (declared before tickets to avoid circular FK issue) ──
-- tickets.payment_id references payments, payments.ticket_id references tickets.
-- Solve: create payments first without ticket_id FK, then add it after tickets.
CREATE TABLE IF NOT EXISTS public.payments (
  id                        uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id                 uuid,         -- FK added after tickets table
  buyer_id                  uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount                    numeric(10,2) NOT NULL DEFAULT 500.00,
  method                    payment_method NOT NULL,
  status                    payment_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id  text          UNIQUE,
  zelle_receipt_url         text,
  zelle_confirmed_by        uuid          REFERENCES public.profiles(id) ON DELETE SET NULL,
  zelle_confirmed_at        timestamptz,
  notes                     text,
  created_at                timestamptz   NOT NULL DEFAULT now(),
  updated_at                timestamptz   NOT NULL DEFAULT now()
);

-- ── tickets ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tickets (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number int           UNIQUE CHECK (ticket_number >= 1 AND ticket_number <= 1000),
  status        ticket_status NOT NULL DEFAULT 'pending_payment',
  buyer_id      uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  seller_id     uuid          REFERENCES public.sellers(id) ON DELETE SET NULL,
  payment_id    uuid          REFERENCES public.payments(id) ON DELETE SET NULL,
  signature_url text,
  signature_ip  text,
  signed_at     timestamptz,
  activated_at  timestamptz,
  created_at    timestamptz   NOT NULL DEFAULT now()
);

-- Now add the FK from payments → tickets
ALTER TABLE public.payments
  ADD CONSTRAINT fk_payments_ticket_id
  FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE SET NULL;

-- ── commissions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.commissions (
  id          uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   uuid              NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  payment_id  uuid              NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  seller_id   uuid              NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  level       int               NOT NULL CHECK (level IN (1, 2)),
  amount      numeric(10,2)     NOT NULL,
  status      commission_status NOT NULL DEFAULT 'pending',
  paid_at     timestamptz,
  created_at  timestamptz       NOT NULL DEFAULT now()
);

-- ── prize_pool ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.prize_pool (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   uuid          NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  payment_id  uuid          NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  amount      numeric(10,2) NOT NULL DEFAULT 25.00,
  created_at  timestamptz   NOT NULL DEFAULT now()
);

-- ── draw_result (single row when draw occurs) ─────────────────
CREATE TABLE IF NOT EXISTS public.draw_result (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  winning_ticket_id uuid          NOT NULL REFERENCES public.tickets(id) ON DELETE RESTRICT,
  winner_id         uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  draw_date         timestamptz,
  total_pool_paid   numeric(10,2),
  created_at        timestamptz   NOT NULL DEFAULT now()
);

-- ── updated_at triggers ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
