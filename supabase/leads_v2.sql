-- Run this in Supabase Dashboard > SQL Editor
-- Adds connection type, nurture sequence, and next action columns to leads

alter table leads
  add column if not exists connection text,
  add column if not exists nurture_sequence text,
  add column if not exists next_action text;
