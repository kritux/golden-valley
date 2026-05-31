-- Persistent cache for lottery results (survives server restarts)
CREATE TABLE IF NOT EXISTS lottery_cache (
  id TEXT PRIMARY KEY,          -- 'tris' or 'daily3'
  digits TEXT,                  -- 3-digit result for tris
  data JSONB DEFAULT '[]',      -- array of draws for daily3
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT DEFAULT 'auto'
);

-- Seed rows so routes can always upsert without checking existence
INSERT INTO lottery_cache (id, digits, data) VALUES ('tris', NULL, '[]') ON CONFLICT DO NOTHING;
INSERT INTO lottery_cache (id, digits, data) VALUES ('daily3', NULL, '[]') ON CONFLICT DO NOTHING;

-- Only admin/service role can write
ALTER TABLE lottery_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON lottery_cache FOR SELECT USING (true);
CREATE POLICY "service write" ON lottery_cache FOR ALL USING (auth.role() = 'service_role');
