-- ============================================================
-- ticket_reservations — persistent 15-min holds (replaces in-memory Map)
-- Survives Vercel cold starts and scales across multiple instances.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ticket_reservations (
  ticket_number  INTEGER      PRIMARY KEY CHECK (ticket_number BETWEEN 1 AND 1000),
  session_id     TEXT         NOT NULL,
  expires_at     TIMESTAMPTZ  NOT NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Auto-delete expired rows (Postgres TTL via periodic cleanup, called by forfeit_overdue_tickets)
CREATE INDEX IF NOT EXISTS idx_ticket_reservations_expires ON public.ticket_reservations (expires_at);

-- RLS: nobody reads/writes this from the client — API routes use service role only
ALTER TABLE public.ticket_reservations ENABLE ROW LEVEL SECURITY;

-- No client-side access at all (service role bypasses RLS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ticket_reservations' AND policyname = 'no_public_access'
  ) THEN
    CREATE POLICY no_public_access ON public.ticket_reservations
      FOR ALL TO authenticated, anon USING (false);
  END IF;
END $$;

-- Helper function to clean up expired reservations
CREATE OR REPLACE FUNCTION public.purge_expired_reservations()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE deleted INTEGER;
BEGIN
  DELETE FROM public.ticket_reservations WHERE expires_at < now();
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END $$;

COMMENT ON TABLE public.ticket_reservations IS
  '15-minute soft holds placed while a buyer fills out the purchase form. '
  'Replaced in-memory Map to survive serverless cold starts.';
