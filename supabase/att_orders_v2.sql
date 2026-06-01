-- att_orders_v2.sql  (updated schema — run in Supabase Dashboard > SQL Editor)

DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS att_orders;

CREATE TABLE att_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),

  prepared_by text DEFAULT '',
  order_date text DEFAULT '',

  account_holder text DEFAULT '',
  street_address text DEFAULT '',
  unit_number text DEFAULT '',
  city text DEFAULT '',
  state text DEFAULT '',
  zip_code text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',

  appt_date text DEFAULT '',
  appt_start_time text DEFAULT '',
  appt_end_time text DEFAULT '',
  appt_duration text DEFAULT '',
  appt_duration_unit text DEFAULT 'hours',
  appt_location_type text DEFAULT 'remote',
  appt_location_custom text DEFAULT '',

  current_carrier text DEFAULT '',
  current_account_number text DEFAULT '',
  current_monthly_price text DEFAULT '',

  att_quote_upfront text DEFAULT '',
  att_quote_prorate text DEFAULT '',
  att_quote_promo_price text DEFAULT '',
  att_quote_promo_duration text DEFAULT '',
  att_quote_post_promo text DEFAULT '',

  att_account_number text DEFAULT '',
  transfer_pin text DEFAULT '',

  discount_type text DEFAULT '',
  discount_sub_type text DEFAULT '',
  discount_company text DEFAULT '',

  line1_name text DEFAULT '',
  line1_phone text DEFAULT '',

  line1_current_device_type text DEFAULT '',
  line1_current_device_model text DEFAULT '',
  line1_current_device_storage text DEFAULT '',
  line1_current_device_condition text DEFAULT '',
  line1_device_balance text DEFAULT '',

  line1_new_device_type text DEFAULT '',
  line1_new_device_model text DEFAULT '',
  line1_new_device_storage text DEFAULT '',
  line1_new_device_price text DEFAULT '',

  line1_service_plan text DEFAULT '',
  line1_service_price text DEFAULT '',
  line1_promotions text DEFAULT '',
  line1_imei text DEFAULT '',
  line1_insurance text DEFAULT '',

  line1_accessories_json text DEFAULT '[]',

  internet_provider text DEFAULT '',
  internet_monthly_price text DEFAULT '',
  internet_tech text DEFAULT '',
  internet_speed text DEFAULT '',
  internet_service_price text DEFAULT '',
  internet_install_date text DEFAULT '',

  notes text DEFAULT ''
);

CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  name text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  status text DEFAULT 'new',
  notes text DEFAULT '',
  att_order_id uuid REFERENCES att_orders(id) ON DELETE SET NULL
);

ALTER TABLE att_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own att_orders" ON att_orders
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own leads" ON leads
  FOR ALL USING (auth.uid() = user_id);
