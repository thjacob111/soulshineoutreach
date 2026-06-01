-- Run this in Supabase Dashboard > SQL Editor

create table if not exists att_orders (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  user_id uuid references auth.users(id),
  prepared_by text, order_date text,
  account_holder text, address text, email text, phone text, appointment text,
  current_carrier text, current_monthly_price text, att_quote text,
  att_account_number text, transfer_pin text, discount text,
  line1_name text, line1_phone text, line1_current_device text, line1_device_balance text,
  line1_new_device text, line1_new_device_price text, line1_service_plan text,
  line1_service_price text, line1_promotions text, line1_imei text,
  line1_insurance text, line1_accessories text, line1_accessory_balance text,
  line1_accessory_service text, line1_accessory_service_price text,
  internet_provider text, internet_monthly_price text,
  internet_plan text, internet_service_price text, internet_install_date text,
  notes text
);

-- Allow logged-in users to read/write their own orders
alter table att_orders enable row level security;
create policy "Users manage own orders" on att_orders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
