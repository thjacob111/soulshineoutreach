'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// ── Types ───────────────────────────────────────────────────────────────────

export interface AccessoryItem {
  type: string
  balance: string
  service_plan: string
  service_price: string
}

export interface OrderForm {
  prepared_by: string; order_date: string
  account_holder: string; street_address: string; unit_number: string
  city: string; state: string; zip_code: string
  email: string; phone: string
  appt_date: string; appt_start_time: string; appt_end_time: string
  appt_duration: string; appt_duration_unit: string
  appt_location_type: string; appt_location_custom: string
  current_carrier: string; current_account_number: string; current_monthly_price: string
  att_quote_upfront: string; att_quote_prorate: string
  att_quote_promo_price: string; att_quote_promo_duration: string; att_quote_post_promo: string
  att_account_number: string; transfer_pin: string
  discount_type: string; discount_sub_type: string; discount_company: string
  line1_name: string; line1_phone: string
  line1_current_device_type: string; line1_current_device_model: string
  line1_current_device_storage: string; line1_current_device_condition: string
  line1_device_balance: string
  line1_new_device_type: string; line1_new_device_model: string
  line1_new_device_storage: string; line1_new_device_price: string
  line1_service_plan: string; line1_service_price: string; line1_promotions: string
  line1_imei: string; line1_insurance: string
  line1_accessories_json: string
  internet_provider: string; internet_monthly_price: string
  internet_tech: string; internet_speed: string
  internet_service_price: string; internet_install_date: string
  notes: string
}

export const EMPTY_FORM: OrderForm = {
  prepared_by: '', order_date: '',
  account_holder: '', street_address: '', unit_number: '',
  city: '', state: '', zip_code: '',
  email: '', phone: '',
  appt_date: '', appt_start_time: '', appt_end_time: '',
  appt_duration: '', appt_duration_unit: 'hours',
  appt_location_type: 'remote', appt_location_custom: '',
  current_carrier: '', current_account_number: '', current_monthly_price: '',
  att_quote_upfront: '', att_quote_prorate: '',
  att_quote_promo_price: '', att_quote_promo_duration: '', att_quote_post_promo: '',
  att_account_number: '', transfer_pin: '',
  discount_type: '', discount_sub_type: '', discount_company: '',
  line1_name: '', line1_phone: '',
  line1_current_device_type: '', line1_current_device_model: '',
  line1_current_device_storage: '', line1_current_device_condition: '',
  line1_device_balance: '',
  line1_new_device_type: '', line1_new_device_model: '',
  line1_new_device_storage: '', line1_new_device_price: '',
  line1_service_plan: '', line1_service_price: '', line1_promotions: '',
  line1_imei: '', line1_insurance: '',
  line1_accessories_json: '[]',
  internet_provider: '', internet_monthly_price: '',
  internet_tech: '', internet_speed: '',
  internet_service_price: '', internet_install_date: '',
  notes: '',
}

// ── Constants ───────────────────────────────────────────────────────────────

const CARRIERS = ['Verizon','AT&T','T-Mobile','Sprint','US Cellular','Cricket Wireless',
  'Boost Mobile','Metro by T-Mobile','Straight Talk','TracFone','Consumer Cellular',
  'Mint Mobile','Visible','Xfinity Mobile','Spectrum Mobile','Google Fi',
  'Total Wireless','Simple Mobile','Net10','Ting','Republic Wireless','Dish Wireless','Other']

const DEVICE_TYPES = [
  { value: 'iphone', label: 'iPhone' },
  { value: 'samsung', label: 'Samsung' },
  { value: 'pixel', label: 'Google Pixel' },
  { value: 'motorola', label: 'Motorola' },
  { value: 'other', label: 'Other' },
  { value: 'none', label: 'None' },
]

const DEVICE_MODELS: Record<string, string[]> = {
  iphone: ['17 Pro Max','17 Pro','17 Plus','17','16 Pro Max','16 Pro','16 Plus','16',
    '15 Pro Max','15 Pro','15 Plus','15','14 Pro Max','14 Pro','14 Plus','14',
    '13 Pro Max','13 Pro','13','13 mini','SE (3rd gen)','Other'],
  samsung: ['Galaxy S25 Ultra','S25+','S25','S24 Ultra','S24+','S24',
    'S23 Ultra','S23+','S23','A55 5G','A35','A15','Other'],
  pixel: ['Pixel 9 Pro XL','Pixel 9 Pro','Pixel 9','Pixel 8a',
    'Pixel 8 Pro','Pixel 8','Pixel 7a','Pixel 7','Other'],
  motorola: ['Edge 50 Ultra','Edge 50 Pro','Edge 50','Moto G Power (2024)','Moto G Play (2024)','Other'],
  other: ['Other'],
}

const STORAGE = ['64GB','128GB','256GB','512GB','1TB']
const CONDITIONS = ['Perfect','Minor Scuffs','Cracks']
const SERVICE_PLANS = ['Value','Extra 2.0','Premium 2.0','Senior']
const INSURANCE = ['None','PROTECT Advantage for 1 ($17/m)','PROTECT Advantage for 4 ($50/m)',
  'PROTECT Multi-Device ($55/m)','Other']
const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY']

const INTERNET_TECHS = [
  { value: 'fiber', label: 'Fiber' },
  { value: 'coax', label: 'Coax' },
  { value: '5g', label: '5G' },
]
const INTERNET_SPEEDS: Record<string, string[]> = {
  fiber: ['100 Mbps','300 Mbps','500 Mbps','1 Gb','2 Gb','5 Gb'],
  coax: ['100 Mbps','300 Mbps','500 Mbps','1 Gb'],
}
const ATT_AIR_SPEED = '25–100 Mbps (AT&T Air)'

const DISCOUNT_TYPES = [
  { value: 'military', label: 'Military' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'first_responder', label: 'First Responder' },
  { value: 'company', label: 'Company' },
]
const FIRST_RESPONDER_TYPES = [
  { value: 'police', label: 'Police' },
  { value: 'ems', label: 'EMS' },
  { value: 'firefighter', label: 'Firefighter' },
]
const ACCESSORY_SERVICE_PLANS: Record<string, string[]> = {
  tablet: ['NumberSync ($10/m)', 'TabletConnect ($20/m)', 'Other'],
  watch: ['NumberSync Watch ($10/m)', 'Other'],
}

// ── Main component ──────────────────────────────────────────────────────────

export default function OrderFormFields({ form, onChange }: {
  form: OrderForm
  onChange: (k: keyof OrderForm, v: string) => void
}) {
  const accessories: AccessoryItem[] = (() => {
    try { return JSON.parse(form.line1_accessories_json) } catch { return [] }
  })()

  function setAccessories(items: AccessoryItem[]) {
    onChange('line1_accessories_json', JSON.stringify(items))
  }

  function addAccessory() {
    setAccessories([...accessories, { type: '', balance: '', service_plan: '', service_price: '' }])
  }

  function updateAccessory(i: number, field: keyof AccessoryItem, value: string) {
    const updated = accessories.map((a, idx) => {
      if (idx !== i) return a
      const next = { ...a, [field]: value }
      if (field === 'type') next.service_plan = ''
      return next
    })
    setAccessories(updated)
  }

  function removeAccessory(i: number) {
    setAccessories(accessories.filter((_, idx) => idx !== i))
  }

  function handleTechChange(tech: string) {
    onChange('internet_tech', tech)
    onChange('internet_speed', tech === '5g' ? ATT_AIR_SPEED : '')
  }

  function resetModel(typeField: keyof OrderForm, modelField: keyof OrderForm, value: string) {
    onChange(typeField, value)
    onChange(modelField, '')
  }

  const hasCurrentDevice = form.line1_current_device_type && form.line1_current_device_type !== 'none'

  return (
    <div className="space-y-5">

      <Sect label="Order Info">
        <Row label="Prepared By"><TI value={form.prepared_by} onChange={v => onChange('prepared_by', v)} /></Row>
        <Row label="Date"><TI type="date" value={form.order_date} onChange={v => onChange('order_date', v)} /></Row>
      </Sect>

      <Sect label="Customer Information">
        <Row label="Account Holder"><TI value={form.account_holder} onChange={v => onChange('account_holder', v)} /></Row>
        <Row label="Street Address"><TI value={form.street_address} onChange={v => onChange('street_address', v)} placeholder="123 Main St" /></Row>
        <Row label="Unit / Apt #"><TI value={form.unit_number} onChange={v => onChange('unit_number', v)} placeholder="Optional" /></Row>
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          <div className="px-3 py-1.5">
            <div className="text-xs text-gray-400 mb-0.5">City</div>
            <TI value={form.city} onChange={v => onChange('city', v)} />
          </div>
          <div className="px-3 py-1.5">
            <div className="text-xs text-gray-400 mb-0.5">State</div>
            <Sel value={form.state} onChange={v => onChange('state', v)}>
              <option value="">—</option>
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </Sel>
          </div>
          <div className="px-3 py-1.5">
            <div className="text-xs text-gray-400 mb-0.5">ZIP</div>
            <TI value={form.zip_code} onChange={v => onChange('zip_code', v)} />
          </div>
        </div>
        <Row label="Email"><TI type="email" value={form.email} onChange={v => onChange('email', v)} /></Row>
        <Row label="Phone"><TI value={form.phone} onChange={v => onChange('phone', v)} /></Row>
      </Sect>

      <Sect label="Appointment">
        <Row label="Date"><TI type="date" value={form.appt_date} onChange={v => onChange('appt_date', v)} /></Row>
        <div className="flex divide-x divide-gray-100">
          <div className="flex-1 px-3 py-1.5">
            <div className="text-xs text-gray-400 mb-0.5">Start Time</div>
            <TI type="time" value={form.appt_start_time} onChange={v => onChange('appt_start_time', v)} />
          </div>
          <div className="flex-1 px-3 py-1.5">
            <div className="text-xs text-gray-400 mb-0.5">End Time</div>
            <TI type="time" value={form.appt_end_time} onChange={v => onChange('appt_end_time', v)} />
          </div>
        </div>
        <div className="flex divide-x divide-gray-100">
          <div className="flex-1 px-3 py-1.5">
            <div className="text-xs text-gray-400 mb-0.5">Duration</div>
            <TI value={form.appt_duration} onChange={v => onChange('appt_duration', v)} placeholder="1.5" />
          </div>
          <div className="flex-1 px-3 py-1.5">
            <div className="text-xs text-gray-400 mb-0.5">Unit</div>
            <Sel value={form.appt_duration_unit} onChange={v => onChange('appt_duration_unit', v)}>
              <option value="minutes">minutes</option>
              <option value="hours">hours</option>
            </Sel>
          </div>
        </div>
        <Row label="Location">
          <Sel value={form.appt_location_type} onChange={v => onChange('appt_location_type', v)}>
            <option value="remote">Remote</option>
            <option value="custom">Custom</option>
          </Sel>
        </Row>
        {form.appt_location_type === 'custom' && (
          <Row label="Location Name">
            <TI value={form.appt_location_custom} onChange={v => onChange('appt_location_custom', v)} placeholder="e.g. BB Metairie" />
          </Row>
        )}
      </Sect>

      <Sect label="Current Service">
        <Row label="Carrier">
          <SearchSel value={form.current_carrier} onChange={v => onChange('current_carrier', v)} options={CARRIERS} placeholder="Search carrier..." />
        </Row>
        <Row label="Account Number"><TI value={form.current_account_number} onChange={v => onChange('current_account_number', v)} /></Row>
        <Row label="Monthly Price"><TI value={form.current_monthly_price} onChange={v => onChange('current_monthly_price', v)} placeholder="$0" /></Row>
      </Sect>

      <Sect label="AT&T Quote">
        <Row label="Upfront Cost" hl><TI value={form.att_quote_upfront} onChange={v => onChange('att_quote_upfront', v)} placeholder="$125" /></Row>
        <Row label="First Prorate Bill" hl><TI value={form.att_quote_prorate} onChange={v => onChange('att_quote_prorate', v)} placeholder="$80" /></Row>
        <div className="flex divide-x divide-gray-100 bg-green-50">
          <div className="flex-1 px-3 py-1.5">
            <div className="text-xs text-gray-500 mb-0.5">Promo Price</div>
            <TI value={form.att_quote_promo_price} onChange={v => onChange('att_quote_promo_price', v)} placeholder="$140/m" />
          </div>
          <div className="flex-1 px-3 py-1.5">
            <div className="text-xs text-gray-500 mb-0.5">Promo Duration</div>
            <TI value={form.att_quote_promo_duration} onChange={v => onChange('att_quote_promo_duration', v)} placeholder="12 months" />
          </div>
        </div>
        <Row label="After Promo" hl><TI value={form.att_quote_post_promo} onChange={v => onChange('att_quote_post_promo', v)} placeholder="$185/m" /></Row>
      </Sect>

      <Sect label="AT&T Account Info">
        <Row label="Account Number"><TI value={form.att_account_number} onChange={v => onChange('att_account_number', v)} /></Row>
        <Row label="Transfer PIN"><TI value={form.transfer_pin} onChange={v => onChange('transfer_pin', v)} /></Row>
        <Row label="Discount">
          <Sel value={form.discount_type} onChange={v => { onChange('discount_type', v); onChange('discount_sub_type', ''); onChange('discount_company', '') }}>
            <option value="">None</option>
            {DISCOUNT_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </Sel>
        </Row>
        {form.discount_type === 'first_responder' && (
          <Row label="Role">
            <Sel value={form.discount_sub_type} onChange={v => onChange('discount_sub_type', v)}>
              <option value="">Select role...</option>
              {FIRST_RESPONDER_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Sel>
          </Row>
        )}
        {form.discount_type === 'company' && (
          <Row label="Company">
            <CompanySearch value={form.discount_company} onChange={v => onChange('discount_company', v)} />
          </Row>
        )}
      </Sect>

      <Sect label="Line 1 — Current Device">
        <Row label="Name"><TI value={form.line1_name} onChange={v => onChange('line1_name', v)} /></Row>
        <Row label="Phone Number"><TI value={form.line1_phone} onChange={v => onChange('line1_phone', v)} /></Row>
        <div className="flex gap-1.5 px-3 py-1.5 flex-wrap">
          <div className="min-w-[90px] flex-1">
            <div className="text-xs text-gray-400 mb-0.5">Type</div>
            <Sel value={form.line1_current_device_type}
              onChange={v => { resetModel('line1_current_device_type','line1_current_device_model', v); onChange('line1_current_device_storage', ''); onChange('line1_current_device_condition', '') }}>
              <option value="">—</option>
              {DEVICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Sel>
          </div>
          {hasCurrentDevice && (<>
            <div className="min-w-[110px] flex-[2]">
              <div className="text-xs text-gray-400 mb-0.5">Model</div>
              {DEVICE_MODELS[form.line1_current_device_type] ? (
                <Sel value={form.line1_current_device_model} onChange={v => onChange('line1_current_device_model', v)}>
                  <option value="">—</option>
                  {DEVICE_MODELS[form.line1_current_device_type].map(m => <option key={m} value={m}>{m}</option>)}
                </Sel>
              ) : (
                <TI value={form.line1_current_device_model} onChange={v => onChange('line1_current_device_model', v)} />
              )}
            </div>
            <div className="min-w-[80px] flex-1">
              <div className="text-xs text-gray-400 mb-0.5">Storage</div>
              <Sel value={form.line1_current_device_storage} onChange={v => onChange('line1_current_device_storage', v)}>
                <option value="">—</option>
                {STORAGE.map(s => <option key={s} value={s}>{s}</option>)}
              </Sel>
            </div>
            <div className="min-w-[90px] flex-1">
              <div className="text-xs text-gray-400 mb-0.5">Condition</div>
              <Sel value={form.line1_current_device_condition} onChange={v => onChange('line1_current_device_condition', v)}>
                <option value="">—</option>
                {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </Sel>
            </div>
          </>)}
        </div>
        <Row label="Device Balance"><TI value={form.line1_device_balance} onChange={v => onChange('line1_device_balance', v)} placeholder="~$250" /></Row>
      </Sect>

      <Sect label="Line 1 — New Device">
        <Row label="Device Type">
          <Sel value={form.line1_new_device_type}
            onChange={v => { resetModel('line1_new_device_type','line1_new_device_model', v); onChange('line1_new_device_storage', '') }}>
            <option value="">—</option>
            {DEVICE_TYPES.filter(t => t.value !== 'none').map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Sel>
        </Row>
        {form.line1_new_device_type && (<>
          <Row label="Model">
            {DEVICE_MODELS[form.line1_new_device_type] ? (
              <Sel value={form.line1_new_device_model} onChange={v => onChange('line1_new_device_model', v)}>
                <option value="">—</option>
                {DEVICE_MODELS[form.line1_new_device_type].map(m => <option key={m} value={m}>{m}</option>)}
              </Sel>
            ) : (
              <TI value={form.line1_new_device_model} onChange={v => onChange('line1_new_device_model', v)} />
            )}
          </Row>
          <Row label="Storage">
            <Sel value={form.line1_new_device_storage} onChange={v => onChange('line1_new_device_storage', v)}>
              <option value="">—</option>
              {STORAGE.map(s => <option key={s} value={s}>{s}</option>)}
            </Sel>
          </Row>
        </>)}
        <Row label="New Device Price" hl><TI value={form.line1_new_device_price} onChange={v => onChange('line1_new_device_price', v)} placeholder="~$125 upfront" /></Row>
      </Sect>

      <Sect label="Line 1 — Plan & Details">
        <Row label="Service Plan">
          <Sel value={form.line1_service_plan} onChange={v => onChange('line1_service_plan', v)}>
            <option value="">Select...</option>
            {SERVICE_PLANS.map(p => <option key={p} value={p}>{p}</option>)}
          </Sel>
        </Row>
        <Row label="Line Service Price" hl><TI value={form.line1_service_price} onChange={v => onChange('line1_service_price', v)} placeholder="$72/m" /></Row>
        <Row label="Promotions"><TI value={form.line1_promotions} onChange={v => onChange('line1_promotions', v)} placeholder="$250 payoff..." /></Row>
        <Row label="IMEI"><TI value={form.line1_imei} onChange={v => onChange('line1_imei', v)} /></Row>
        <Row label="Insurance">
          <Sel value={form.line1_insurance} onChange={v => onChange('line1_insurance', v)}>
            <option value="">None</option>
            {INSURANCE.map(i => <option key={i} value={i}>{i}</option>)}
          </Sel>
        </Row>

        {accessories.map((acc, i) => (
          <div key={i} className="border-t border-gray-100">
            <div className="flex items-center px-3 py-1.5 gap-2 bg-gray-50">
              <span className="text-xs text-gray-500 w-32 shrink-0">Accessory {i + 1}</span>
              <div className="flex-1">
                <Sel value={acc.type} onChange={v => updateAccessory(i, 'type', v)}>
                  <option value="">Type...</option>
                  <option value="tablet">Tablet</option>
                  <option value="watch">Watch</option>
                </Sel>
              </div>
              <button type="button" onClick={() => removeAccessory(i)}
                className="text-gray-400 hover:text-red-500 text-xs font-bold leading-none shrink-0">✕</button>
            </div>
            {acc.type && (<>
              <div className="flex items-center px-3 py-1.5 gap-2">
                <span className="text-xs text-gray-500 w-32 shrink-0">Balance</span>
                <div className="flex-1 text-sm"><TI value={acc.balance} onChange={v => updateAccessory(i, 'balance', v)} placeholder="~$0" /></div>
              </div>
              <div className="flex items-center px-3 py-1.5 gap-2">
                <span className="text-xs text-gray-500 w-32 shrink-0">Service Plan</span>
                <div className="flex-1 text-sm">
                  <Sel value={acc.service_plan} onChange={v => updateAccessory(i, 'service_plan', v)}>
                    <option value="">Select...</option>
                    {(ACCESSORY_SERVICE_PLANS[acc.type] || []).map(p => <option key={p} value={p}>{p}</option>)}
                  </Sel>
                </div>
              </div>
              <div className="flex items-center px-3 py-1.5 gap-2 bg-green-50">
                <span className="text-xs text-gray-500 w-32 shrink-0">Monthly Price</span>
                <div className="flex-1 text-sm"><TI value={acc.service_price} onChange={v => updateAccessory(i, 'service_price', v)} placeholder="$10/m" /></div>
              </div>
            </>)}
          </div>
        ))}

        <div className="border-t border-gray-100">
          <button type="button" onClick={addAccessory}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 transition-colors">
            <span className="w-4 h-4 rounded-full border border-blue-600 flex items-center justify-center font-bold text-[10px] shrink-0">+</span>
            Add Shared Number Accessory
          </button>
        </div>
      </Sect>

      <Sect label="Internet — Current">
        <Row label="Provider"><TI value={form.internet_provider} onChange={v => onChange('internet_provider', v)} /></Row>
        <Row label="Monthly Price"><TI value={form.internet_monthly_price} onChange={v => onChange('internet_monthly_price', v)} placeholder="$100" /></Row>
      </Sect>

      <Sect label="AT&T Internet">
        <Row label="Plan">
          <div className="flex gap-2">
            <div className="flex-1">
              <Sel value={form.internet_tech} onChange={handleTechChange}>
                <option value="">Tech...</option>
                {INTERNET_TECHS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Sel>
            </div>
            <div className="flex-[2]">
              {!form.internet_tech ? (
                <div className="w-full text-sm text-gray-300 bg-gray-50 border border-gray-200 rounded px-2 py-[3px]">Speed...</div>
              ) : form.internet_tech === '5g' ? (
                <input disabled value={ATT_AIR_SPEED}
                  className="w-full text-sm text-gray-600 bg-gray-100 border border-gray-200 rounded px-2 py-[3px] cursor-default" />
              ) : (
                <Sel value={form.internet_speed} onChange={v => onChange('internet_speed', v)}>
                  <option value="">Speed...</option>
                  {(INTERNET_SPEEDS[form.internet_tech] || []).map(s => <option key={s} value={s}>{s}</option>)}
                </Sel>
              )}
            </div>
          </div>
        </Row>
        <Row label="Service Price" hl><TI value={form.internet_service_price} onChange={v => onChange('internet_service_price', v)} placeholder="$60 for 12m, then $80" /></Row>
        <Row label="Install Date"><TI type="date" value={form.internet_install_date} onChange={v => onChange('internet_install_date', v)} /></Row>
      </Sect>

      <Sect label="Notes / Special Instructions">
        <textarea value={form.notes} onChange={e => onChange('notes', e.target.value)} rows={3}
          className="w-full px-3 py-2 text-sm focus:outline-none resize-none" />
      </Sect>

    </div>
  )
}

// ── Exported shared primitives ──────────────────────────────────────────────

export function Sect({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200">
      <div className="bg-blue-800 px-3 py-1.5">
        <span className="text-white text-xs font-bold tracking-wide uppercase">{label}</span>
      </div>
      <div className="divide-y divide-gray-100">{children}</div>
    </div>
  )
}

export function Row({ label, children, hl }: { label: string; children: React.ReactNode; hl?: boolean }) {
  return (
    <div className={`flex items-center px-3 py-1.5 gap-2 ${hl ? 'bg-green-50' : ''}`}>
      <span className="text-xs text-gray-500 w-32 shrink-0">{label}</span>
      <div className="flex-1 text-sm min-w-0">{children}</div>
    </div>
  )
}

// ── Private components ──────────────────────────────────────────────────────

function TI({ value, onChange, type = 'text', placeholder }: {
  value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full text-sm text-gray-800 focus:outline-none bg-transparent placeholder-gray-300" />
  )
}

function Sel({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode
}) {
  return (
    <div className="relative w-full">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full text-sm text-gray-800 bg-white border border-gray-300 rounded px-2 py-[3px] pr-6 appearance-none focus:outline-none focus:border-blue-400 cursor-pointer">
        {children}
      </select>
      <span className="pointer-events-none absolute right-0 top-0 bottom-0 flex items-center px-1.5 border-l border-gray-200 text-gray-400 text-[10px] bg-white rounded-r">▾</span>
    </div>
  )
}

function SearchSel({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState(value)
  useEffect(() => { setQ(value) }, [value])
  const filtered = q ? options.filter(o => o.toLowerCase().includes(q.toLowerCase())) : options
  return (
    <div className="relative w-full">
      <div className="flex border border-gray-300 rounded overflow-hidden bg-white">
        <input value={q} onChange={e => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="flex-1 text-sm text-gray-800 focus:outline-none bg-transparent px-2 py-[3px] placeholder-gray-300" />
        <span className="flex items-center px-1.5 border-l border-gray-200 text-gray-400 text-[10px] pointer-events-none">▾</span>
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-44 overflow-y-auto">
          {filtered.map(opt => (
            <button key={opt} type="button"
              onMouseDown={() => { onChange(opt); setQ(opt); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-gray-700">{opt}</button>
          ))}
        </div>
      )}
    </div>
  )
}

function CompanySearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (value.length < 2) { setSuggestions([]); return }
    supabase.from('discount_companies')
      .select('name')
      .ilike('name', `%${value}%`)
      .limit(8)
      .then(({ data }) => setSuggestions(data?.map((d: { name: string }) => d.name) || []))
  }, [value])

  return (
    <div className="relative w-full">
      <div className="flex border border-gray-300 rounded overflow-hidden bg-white">
        <input value={value}
          onChange={e => { onChange(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Type company name..."
          className="flex-1 text-sm text-gray-800 focus:outline-none bg-transparent px-2 py-[3px] placeholder-gray-300" />
        <span className="flex items-center px-1.5 border-l border-gray-200 text-gray-400 text-[10px] pointer-events-none">▾</span>
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
          {suggestions.map(s => (
            <button key={s} type="button"
              onMouseDown={() => { onChange(s); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-gray-700">{s}</button>
          ))}
        </div>
      )}
    </div>
  )
}
