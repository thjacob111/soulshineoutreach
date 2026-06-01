-- Run this in Supabase Dashboard > SQL Editor

create table if not exists leads (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  user_id uuid references auth.users(id),
  name text,
  email text,
  phone text,
  address text,
  status text default 'prospect',
  notes text,
  att_order_id uuid references att_orders(id)
);

alter table leads enable row level security;
create policy "Users manage own leads" on leads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
