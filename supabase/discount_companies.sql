-- discount_companies.sql
-- Eligible company discount partners. Run in Supabase Dashboard > SQL Editor.

CREATE TABLE IF NOT EXISTS discount_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  notes text DEFAULT ''
);

INSERT INTO discount_companies (name) VALUES
  ('Amazon'),
  ('Apple'),
  ('Boeing'),
  ('Chevron'),
  ('Delta Air Lines'),
  ('ExxonMobil'),
  ('FedEx'),
  ('Ford Motor Company'),
  ('General Electric'),
  ('General Motors'),
  ('Goldman Sachs'),
  ('Google'),
  ('Home Depot'),
  ('IBM'),
  ('JPMorgan Chase'),
  ('Lockheed Martin'),
  ('McDonald''s'),
  ('Microsoft'),
  ('Nike'),
  ('Raytheon'),
  ('Shell'),
  ('Starbucks'),
  ('Target'),
  ('UPS'),
  ('UnitedHealth Group'),
  ('Walmart'),
  ('Walt Disney Company'),
  ('Wells Fargo');
