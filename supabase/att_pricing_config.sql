-- att_pricing_config.sql  (run via supabase-migrate agent or Supabase Dashboard > SQL Editor)

CREATE TABLE IF NOT EXISTS att_pricing_config (
  id int PRIMARY KEY DEFAULT 1,
  grid jsonb NOT NULL DEFAULT '{}',
  discounts jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz DEFAULT now()
);

-- Seed the single shared config row
INSERT INTO att_pricing_config (id, grid, discounts)
VALUES (1, '{}', '[]')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE att_pricing_config ENABLE ROW LEVEL SECURITY;

-- All authenticated users (reps) can read pricing
CREATE POLICY "Authenticated users can read pricing" ON att_pricing_config
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only the admin can write pricing
CREATE POLICY "Admin can modify pricing" ON att_pricing_config
  FOR ALL USING ((auth.jwt() ->> 'email') = 'thjacob111@gmail.com');
