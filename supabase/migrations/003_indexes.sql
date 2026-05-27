-- ============================================================
-- 003_indexes.sql — Performance indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number   ON public.tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_status          ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_seller_id       ON public.tickets(seller_id);
CREATE INDEX IF NOT EXISTS idx_tickets_buyer_id        ON public.tickets(buyer_id);
CREATE INDEX IF NOT EXISTS idx_sellers_referral_code   ON public.sellers(referral_code);
CREATE INDEX IF NOT EXISTS idx_sellers_recruited_by    ON public.sellers(recruited_by);
CREATE INDEX IF NOT EXISTS idx_sellers_profile_id      ON public.sellers(profile_id);
CREATE INDEX IF NOT EXISTS idx_commissions_seller_status ON public.commissions(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_commissions_ticket_id   ON public.commissions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_payments_status         ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_buyer_id       ON public.payments(buyer_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent  ON public.payments(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_email          ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role           ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_prize_pool_ticket       ON public.prize_pool(ticket_id);
