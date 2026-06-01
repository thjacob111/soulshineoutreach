-- Run this in Supabase SQL Editor

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  address text,
  city text,
  state text,
  status text not null default 'new' check (status in ('new','contacted','assessed','enrolled','closed')),
  notes text,
  created_at timestamptz default now()
);

create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  energy_provider text,
  energy_bill numeric(10,2) default 0,
  gas_provider text,
  gas_bill numeric(10,2) default 0,
  water_bill numeric(10,2) default 0,
  internet_provider text,
  internet_bill numeric(10,2) default 0,
  security_provider text,
  security_bill numeric(10,2) default 0,
  wellness_goals text,
  notes text,
  created_at timestamptz default now()
);

alter table clients enable row level security;
alter table assessments enable row level security;

create policy "allow all for now" on clients for all using (true);
create policy "allow all for now" on assessments for all using (true);
