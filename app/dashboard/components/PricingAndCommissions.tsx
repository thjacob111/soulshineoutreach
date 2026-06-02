'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { EditModeProvider, useEditMode } from './pricing/EditModeContext'
import { TradeInCalculator } from './pricing/TradeInCalculator'
import type { TradeInCalculator as TIData } from '@/lib/pricing/types'

// ── CONSTANTS ─────────────────────────────────────────────
const ADMIN_EMAIL = 'thjacob111@gmail.com'
const PLAN_NAMES = ['Value', 'Extra 2.0', 'Premium 2.0', 'Senior']
const LINE_COUNTS = [1, 2, 3, 4, 5]
const FIRSTNET_NOTE = 'Includes FirstNet access — a satellite-backed priority network that gives first responders dedicated cell coverage even during emergencies and network congestion.'
const CARRIERS = ['AT&T', 'Verizon', 'T-Mobile', 'Spectrum', 'Mint', 'Cox', 'Frontier', 'Ezee'] as const
const USER_TYPES = ['Personal', 'Business'] as const
type UserType = typeof USER_TYPES[number]

const INTERNET_GROUPS = [
  { plan: 'Fiber',    riders: 'Fiber Riders',    discounts: 'Fiber Discounts',    promotions: 'Fiber Promotions'    },
  { plan: 'Coax',     riders: 'Coax Riders',     discounts: 'Coax Discounts',     promotions: 'Coax Promotions'     },
  { plan: '5G (Air)', riders: '5G Riders',        discounts: '5G Discounts',       promotions: '5G Promotions'       },
]

// ── PRICING TYPES ─────────────────────────────────────────
type PricingGrid = { [plan: string]: { [line: number]: string } }
type DiscountRow = { label: string; value: string; notes?: string }
type CompanyDiscount = { company: string; discount: string }
type RetailBenefit = { benefit: string; discount: string; duration: string }

const RETAIL_AGENT_BENEFITS: RetailBenefit[] = [
  { benefit: 'Line Credit (Best Buy)',  discount: '$150 (−$4.17/mo)',  duration: '36 months'              },
  { benefit: 'Apple Care (Best Buy)',   discount: 'Free',              duration: '12 months'              },
  { benefit: 'Line Credit (Costco)',    discount: '$250 (−$6.94/mo)',  duration: '36 months'              },
  { benefit: 'Gift Card (Costco)',      discount: '$100',              duration: 'Upfront (upgrades too)' },
  { benefit: 'Waived Activation Fee',  discount: '−$35',              duration: '1st bill'               },
  { benefit: 'Pay Off Phone',          discount: '',                   duration: ''                       },
  { benefit: 'Trade In',               discount: '',                   duration: ''                       },
  { benefit: 'BYOD',                   discount: '',                   duration: ''                       },
]

const DEFAULT_DISCOUNTS: DiscountRow[] = [
  { label: 'Military', value: '', notes: '' },
  { label: 'Nurse', value: '', notes: '' },
  { label: 'First Responder — Police', value: '', notes: FIRSTNET_NOTE },
  { label: 'First Responder — EMS', value: '', notes: FIRSTNET_NOTE },
  { label: 'First Responder — Firefighter', value: '', notes: FIRSTNET_NOTE },
  { label: 'Employee', value: '', notes: '' },
  { label: 'Company (FAN)', value: '', notes: '' },
]

// ── PHONE PLAN DETAILS ────────────────────────────────────
interface PlanDetails {
  calling_coverage: string; calling_strength: string; calling_call_limit: string
  text_limit: string
  data_limit: string; data_lowered_speed: string; data_speed: string
  hotspot_limit: string; hotspot_speed: string
  intl_calling_limit: string; intl_coverage_map: string; intl_data_roaming_limit: string; intl_data_roaming_speed: string
  ld_places: string; ld_calling_limit: string
}
type PlanDetailsMap = { [plan: string]: PlanDetails }
const EMPTY_PLAN_DETAILS: PlanDetails = {
  calling_coverage: '', calling_strength: '', calling_call_limit: '',
  text_limit: '',
  data_limit: '', data_lowered_speed: '', data_speed: '',
  hotspot_limit: '', hotspot_speed: '',
  intl_calling_limit: '', intl_coverage_map: '', intl_data_roaming_limit: '', intl_data_roaming_speed: '',
  ld_places: '', ld_calling_limit: '',
}
const PLAN_DETAIL_SECTIONS: { label: string; fields: { key: keyof PlanDetails; label: string }[] }[] = [
  { label: 'CALLING', fields: [
    { key: 'calling_coverage', label: 'Coverage' },
    { key: 'calling_strength', label: 'Strength' },
    { key: 'calling_call_limit', label: 'Call Limit' },
  ]},
  { label: 'TEXT', fields: [
    { key: 'text_limit', label: 'Text Limit' },
  ]},
  { label: 'DATA', fields: [
    { key: 'data_limit', label: 'Data Limit' },
    { key: 'data_lowered_speed', label: 'Lowered Speed After Limit' },
    { key: 'data_speed', label: 'Data Speed' },
  ]},
  { label: 'HOTSPOT', fields: [
    { key: 'hotspot_limit', label: 'Limit' },
    { key: 'hotspot_speed', label: 'Speed' },
  ]},
  { label: 'INTERNATIONAL', fields: [
    { key: 'intl_calling_limit', label: 'Calling Limit' },
    { key: 'intl_coverage_map', label: 'Coverage Map' },
    { key: 'intl_data_roaming_limit', label: 'Data Roaming Limit' },
    { key: 'intl_data_roaming_speed', label: 'Data Roaming Speed' },
  ]},
  { label: 'LONG DISTANCE', fields: [
    { key: 'ld_places', label: 'Calling Place(s)' },
    { key: 'ld_calling_limit', label: 'Calling Limit' },
  ]},
]

// ── INTERNET PLAN DETAILS ─────────────────────────────────
interface InternetPlanDetails {
  contract_term: string; install_fee: string; equipment_fee: string
  speed_range: string; data_cap: string; backup_power: string
  network_description: string; equipment_description: string
  speed_down_min: string; speed_down_max: string
  speed_up_min: string; speed_up_max: string
  extra_data_t1_data: string; extra_data_t1_charge: string
  extra_data_t2_data: string; extra_data_t2_charge: string
  install_p1_type: string; install_p1_routing: string
  install_p2_type: string; install_p2_routing: string
  equipment_cost: string
  router_provided: string; router_cost: string
}
const EMPTY_INTERNET_DETAILS: InternetPlanDetails = {
  contract_term: '', install_fee: '', equipment_fee: '',
  speed_range: '', data_cap: '', backup_power: '',
  network_description: '', equipment_description: '',
  speed_down_min: '', speed_down_max: '',
  speed_up_min: '', speed_up_max: '',
  extra_data_t1_data: '', extra_data_t1_charge: '',
  extra_data_t2_data: '', extra_data_t2_charge: '',
  install_p1_type: '', install_p1_routing: '',
  install_p2_type: '', install_p2_routing: '',
  equipment_cost: '',
  router_provided: '', router_cost: '',
}
const INTERNET_INLINE_FIELDS: { key: keyof InternetPlanDetails; label: string }[] = [
  { key: 'contract_term', label: 'Contract' }, { key: 'install_fee', label: 'Install Fee' },
  { key: 'equipment_fee', label: 'Equip. Fee' }, { key: 'speed_range', label: 'Speed' },
  { key: 'data_cap', label: 'Data Cap' }, { key: 'backup_power', label: 'Backup' },
]

const INTERNET_DETAIL_LEAF_KEYS: (keyof InternetPlanDetails)[] = [
  'contract_term',
  'speed_down_min', 'speed_down_max',
  'speed_up_min', 'speed_up_max',
  'data_cap',
  'extra_data_t1_data', 'extra_data_t1_charge',
  'extra_data_t2_data', 'extra_data_t2_charge',
  'install_p1_type', 'install_p1_routing',
  'install_p2_type', 'install_p2_routing',
  'equipment_cost',
  'router_provided', 'router_cost',
  'backup_power',
]

// ── CABLE PLAN DETAILS ────────────────────────────────────
interface CablePlanDetails { channels_included: string }

// ── ADDER / ACCESSORY DETAIL TYPES ───────────────────────
interface AdderDetails {
  description: string; price_per_line: string; eligibility: string; notes: string
}
const EMPTY_ADDER_DETAILS: AdderDetails = { description: '', price_per_line: '', eligibility: '', notes: '' }
const ADDER_INLINE_FIELDS: { key: keyof AdderDetails; label: string }[] = [
  { key: 'description', label: 'Benefit' },
  { key: 'eligibility', label: 'Eligibility' },
]

// ── RIDER DETAIL TYPES ────────────────────────────────────
interface RiderDetails {
  value: string; description: string
}
const EMPTY_RIDER_DETAILS: RiderDetails = { value: '', description: '' }

// ── COMMISSION TYPES ──────────────────────────────────────
interface CommissionRow {
  plan: string
  price?: string
  standard?: string; bundled?: string; promoAmount?: string; promoDuration?: string
  commissions: Record<string, string>
  internetDetails?: Partial<InternetPlanDetails>
  cableDetails?: Partial<CablePlanDetails>
  adderDetails?: Partial<AdderDetails>
  riderDetails?: Partial<RiderDetails>
}
interface CommissionSection {
  name: string
  type?: 'default' | 'cellular-plans' | 'cellular-adders' | 'cellular-accessory' | 'device-pricing'
       | 'internet' | 'internet-riders' | 'internet-discounts'
       | 'cable' | 'cable-adders' | 'streaming'
  sectionDetails?: string
  rows: CommissionRow[]
}
interface CommissionConfig { roles: string[]; sections: CommissionSection[] }

const DEFAULT_COMMISSION: CommissionConfig = {
  roles: ['Overall', 'Soul Shine', 'Agent', 'Rep'],
  sections: [
    // ── CELLULAR ────────────────────────────────────────
    { name: 'Phone Plans', type: 'cellular-plans', rows: [
      { plan: 'Value', commissions: {} }, { plan: 'Extra 2.0', commissions: {} },
      { plan: 'Premium 2.0', commissions: {} }, { plan: 'Senior', commissions: {} },
    ]},
    { name: 'Phone Plan Adders', type: 'cellular-adders', rows: [
      { plan: 'Nextup', commissions: {} }, { plan: 'Insurance', commissions: {} },
    ]},
    { name: 'Accessories', type: 'cellular-accessory', rows: [
      { plan: 'Data Only', price: '', commissions: {} },
      { plan: 'Shared Number', price: '', commissions: {} },
      { plan: 'New Number', price: '', commissions: {} },
    ]},
    { name: 'Device Pricing & Trade-In', type: 'device-pricing', rows: [] },
    // ── INTERNET ────────────────────────────────────────
    { name: 'Fiber', type: 'internet', sectionDetails: '', rows: [
      { plan: '100 Mbps', standard: '', bundled: '', promoAmount: '', promoDuration: '', commissions: {} },
      { plan: '300 Mbps', standard: '', bundled: '', promoAmount: '', promoDuration: '', commissions: {} },
      { plan: '500 Mbps', standard: '', bundled: '', promoAmount: '', promoDuration: '', commissions: {} },
      { plan: '1 Gb',     standard: '', bundled: '', promoAmount: '', promoDuration: '', commissions: {} },
      { plan: '2 Gb',     standard: '', bundled: '', promoAmount: '', promoDuration: '', commissions: {} },
      { plan: '5 Gb',     standard: '', bundled: '', promoAmount: '', promoDuration: '', commissions: {} },
    ]},
    { name: 'Fiber Riders', type: 'internet-riders', rows: [
      { plan: 'Extra Router',    price: '', commissions: {} },
      { plan: 'Security Package',price: '', commissions: {} },
      { plan: 'Backup Service',  price: '', commissions: {} },
    ]},
    { name: 'Fiber Discounts', type: 'internet-discounts', rows: [
      { plan: 'Autopay', price: '', commissions: {} },
      { plan: 'Low Income', price: '', commissions: {} },
    ]},
    { name: 'Fiber Promotions', type: 'internet-discounts', rows: [
      { plan: 'New Customer Promo', price: '', commissions: {} },
    ]},
    { name: 'Coax', type: 'internet', sectionDetails: '', rows: [
      { plan: '100 Mbps', standard: '', bundled: '', promoAmount: '', promoDuration: '', commissions: {} },
      { plan: '300 Mbps', standard: '', bundled: '', promoAmount: '', promoDuration: '', commissions: {} },
      { plan: '500 Mbps', standard: '', bundled: '', promoAmount: '', promoDuration: '', commissions: {} },
      { plan: '1 Gb',     standard: '', bundled: '', promoAmount: '', promoDuration: '', commissions: {} },
    ]},
    { name: 'Coax Riders', type: 'internet-riders', rows: [
      { plan: 'Extra Router',    price: '', commissions: {} },
      { plan: 'Security Package',price: '', commissions: {} },
      { plan: 'Backup Service',  price: '', commissions: {} },
    ]},
    { name: 'Coax Discounts', type: 'internet-discounts', rows: [
      { plan: 'Autopay', price: '', commissions: {} },
      { plan: 'Low Income', price: '', commissions: {} },
    ]},
    { name: 'Coax Promotions', type: 'internet-discounts', rows: [
      { plan: 'New Customer Promo', price: '', commissions: {} },
    ]},
    { name: '5G (Air)', type: 'internet', sectionDetails: '', rows: [
      { plan: '5G Home Internet', standard: '', bundled: '', promoAmount: '', promoDuration: '', commissions: {} },
    ]},
    { name: '5G Riders', type: 'internet-riders', rows: [
      { plan: 'Extra Router', price: '', commissions: {} },
    ]},
    { name: '5G Discounts', type: 'internet-discounts', rows: [
      { plan: 'Autopay', price: '', commissions: {} },
      { plan: 'Low Income', price: '', commissions: {} },
    ]},
    { name: '5G Promotions', type: 'internet-discounts', rows: [
      { plan: 'New Customer Promo', price: '', commissions: {} },
    ]},
    // ── TV ──────────────────────────────────────────────
    { name: 'Cable / TV', type: 'cable', sectionDetails: '', rows: [
      { plan: 'SELECT Package',  standard: '', bundled: '', promoAmount: '', promoDuration: '', commissions: {}, cableDetails: { channels_included: '' } },
      { plan: 'CHOICE Package',  standard: '', bundled: '', promoAmount: '', promoDuration: '', commissions: {}, cableDetails: { channels_included: '' } },
      { plan: 'PREMIER Package', standard: '', bundled: '', promoAmount: '', promoDuration: '', commissions: {}, cableDetails: { channels_included: '' } },
    ]},
    { name: 'Cable Adders', type: 'cable-adders', rows: [
      { plan: 'Sports Pack', standard: '', bundled: '', promoAmount: '', promoDuration: '', commissions: {} },
      { plan: 'HBO Max',     standard: '', bundled: '', promoAmount: '', promoDuration: '', commissions: {} },
      { plan: 'Showtime',    standard: '', bundled: '', promoAmount: '', promoDuration: '', commissions: {} },
      { plan: 'Starz',       standard: '', bundled: '', promoAmount: '', promoDuration: '', commissions: {} },
    ]},
    { name: 'Streaming', type: 'streaming', rows: [
      { plan: 'YouTube TV', standard: '', bundled: '', promoAmount: '', promoDuration: '', commissions: {} },
      { plan: 'Netflix',    standard: '', bundled: '', promoAmount: '', promoDuration: '', commissions: {} },
      { plan: 'Hulu',       standard: '', bundled: '', promoAmount: '', promoDuration: '', commissions: {} },
      { plan: 'Prime',      standard: '', bundled: '', promoAmount: '', promoDuration: '', commissions: {} },
      { plan: 'HBO Max',    standard: '', bundled: '', promoAmount: '', promoDuration: '', commissions: {} },
      { plan: 'Paramount',  standard: '', bundled: '', promoAmount: '', promoDuration: '', commissions: {} },
      { plan: 'Disney+',    standard: '', bundled: '', promoAmount: '', promoDuration: '', commissions: {} },
    ]},
  ],
}

function migrateCommissionConfig(saved: CommissionConfig): CommissionConfig {
  const savedByName = new Map(saved.sections.map(s => [s.name, s]))
  return {
    roles: saved.roles?.length ? saved.roles : DEFAULT_COMMISSION.roles,
    sections: DEFAULT_COMMISSION.sections.map(def => {
      const sv = savedByName.get(def.name)
      if (!sv) return def
      return { ...sv, type: def.type, sectionDetails: sv.sectionDetails ?? def.sectionDetails ?? '' }
    }),
  }
}

// ── TRADE-IN EMPTY STATE ──────────────────────────────────
const EMPTY_TRADE_IN: TIData = {
  currentDevice: { device: '', brand: '', year: '', model: '', submodel: '', storage: '', condition: '' },
  tradeInStandard: '',
  tradeInPromo: '',
  translatorTiers: { lessThan: '', rangeMin: '', rangeMax: '', greaterThan: '', promoLessThan: '', promoRange: '', promoGreaterThan: '' },
  newDevice: { device: '', brand: '', year: '', model: '', submodel: '', storage: '', condition: '' },
  cost: '',
  customerTotal: '',
  customerMonthly: '',
  customerMonths: '',
}

// ── TRADE-IN SECTION COMPONENTS ───────────────────────────
function TradeInSectionInner({ data, onChange }: { data: TIData; onChange: (d: TIData) => void }) {
  const { isAdmin, isEditing, startEdit, saveEdit, cancelEdit } = useEditMode()
  return (
    <div>
      {isAdmin && (
        <div className="flex justify-end gap-2 px-3 pt-2">
          {!isEditing && (
            <button onClick={startEdit} className="text-xs border border-blue-300 text-blue-600 rounded px-2 py-0.5 hover:bg-blue-50">Edit</button>
          )}
          {isEditing && (
            <>
              <button onClick={cancelEdit} className="text-xs border border-gray-300 text-gray-600 rounded px-2 py-0.5 hover:bg-gray-50">Cancel</button>
              <button onClick={saveEdit} className="text-xs bg-blue-600 text-white rounded px-2 py-0.5 hover:bg-blue-700">Save</button>
            </>
          )}
        </div>
      )}
      <div className="p-3">
        <TradeInCalculator data={data} onChange={onChange} />
      </div>
      <div className="px-4 py-4 text-center space-y-1 border-t border-gray-100">
        <p className="text-xs text-gray-400 italic">Device pricing database — coming soon.</p>
        <p className="text-[11px] text-gray-300">AT&amp;T trade-in values and current device retail prices will appear here.</p>
      </div>
    </div>
  )
}

function DevicePricingSection({ isAdmin }: { isAdmin: boolean }) {
  const [data, setData] = useState<TIData>(EMPTY_TRADE_IN)
  return (
    <EditModeProvider isAdmin={isAdmin} onSave={() => {}}>
      <TradeInSectionInner data={data} onChange={setData} />
    </EditModeProvider>
  )
}

// ── DETAIL VIEW COMPONENTS ────────────────────────────────
function PhonePlanDetailView({ plan, details, isAdmin, onBack, onChange }: {
  plan: string; details: PlanDetails; isAdmin: boolean; onBack: () => void
  onChange: (field: keyof PlanDetails, value: string) => void
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
        <h2 className="font-bold text-gray-800 text-base">{plan} — Plan Details</h2>
      </div>
      {PLAN_DETAIL_SECTIONS.map(section => (
        <div key={section.label}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{section.label}</p>
          <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
            {section.fields.map(field => (
              <div key={field.key} className="flex items-center px-3 py-2 gap-3">
                <span className="text-xs text-gray-500 w-52 shrink-0">{field.label}</span>
                {isAdmin
                  ? <input className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                      value={details[field.key]} placeholder="—" onChange={e => onChange(field.key, e.target.value)} />
                  : <span className="text-xs text-gray-700 flex-1">{details[field.key] || '—'}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function InternetPlanDetailView({ plan, details, isAdmin, onBack, onUpdate }: {
  plan: string; details: Partial<InternetPlanDetails>; isAdmin: boolean; onBack: () => void
  onUpdate: (field: keyof InternetPlanDetails, value: string) => void
}) {
  const basicFields: { key: keyof InternetPlanDetails; label: string }[] = [
    { key: 'contract_term', label: 'Contract Term' }, { key: 'install_fee', label: 'Install / Activation Fee' },
    { key: 'equipment_fee', label: 'Equipment Fee' }, { key: 'speed_range', label: 'Speed Range' },
    { key: 'data_cap', label: 'Data Cap' }, { key: 'backup_power', label: 'Backup Power' },
  ]
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
        <h2 className="font-bold text-gray-800 text-base">{plan} — Plan Details</h2>
      </div>
      <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
        {basicFields.map(f => (
          <div key={f.key} className="flex items-center px-3 py-2 gap-3">
            <span className="text-xs text-gray-500 w-44 shrink-0">{f.label}</span>
            {isAdmin
              ? <input className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                  value={details[f.key] ?? ''} placeholder="—" onChange={e => onUpdate(f.key, e.target.value)} />
              : <span className="text-xs text-gray-700 flex-1">{details[f.key] || '—'}</span>}
          </div>
        ))}
      </div>
      {(['network_description', 'equipment_description'] as const).map(k => (
        <div key={k}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{k === 'network_description' ? 'Network Technology' : 'Equipment'}</p>
          {isAdmin
            ? <textarea className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 resize-none"
                rows={4} value={details[k] ?? ''} placeholder="..." onChange={e => onUpdate(k, e.target.value)} />
            : <p className="text-sm text-gray-700 whitespace-pre-wrap">{details[k] || '—'}</p>}
        </div>
      ))}
    </div>
  )
}

function CablePlanDetailView({ plan, details, isAdmin, onBack, onUpdate }: {
  plan: string; details: Partial<CablePlanDetails>; isAdmin: boolean; onBack: () => void; onUpdate: (v: string) => void
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
        <h2 className="font-bold text-gray-800 text-base">{plan} — Channels</h2>
      </div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Channels Included</p>
      {isAdmin
        ? <textarea className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 resize-none"
            rows={10} value={details.channels_included ?? ''} placeholder="List channels..." onChange={e => onUpdate(e.target.value)} />
        : <p className="text-sm text-gray-700 whitespace-pre-wrap">{details.channels_included || '—'}</p>}
    </div>
  )
}

function AdderPlanDetailView({ plan, details, isAdmin, onBack, onUpdate }: {
  plan: string; details: Partial<AdderDetails>; isAdmin: boolean; onBack: () => void
  onUpdate: (field: keyof AdderDetails, value: string) => void
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
        <h2 className="font-bold text-gray-800 text-base">{plan} — Details</h2>
      </div>
      <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
        {([{ key: 'price_per_line', label: 'Monthly Price / Line' }, { key: 'eligibility', label: 'Eligibility Requirements' }] as const).map(f => (
          <div key={f.key} className="flex items-center px-3 py-2 gap-3">
            <span className="text-xs text-gray-500 w-44 shrink-0">{f.label}</span>
            {isAdmin
              ? <input className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                  value={details[f.key] ?? ''} placeholder="—" onChange={e => onUpdate(f.key, e.target.value)} />
              : <span className="text-xs text-gray-700 flex-1">{details[f.key] || '—'}</span>}
          </div>
        ))}
      </div>
      {([{ key: 'description' as keyof AdderDetails, label: 'Description' }, { key: 'notes' as keyof AdderDetails, label: 'Notes' }]).map(f => (
        <div key={f.key}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{f.label}</p>
          {isAdmin
            ? <textarea className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 resize-none"
                rows={3} value={details[f.key] ?? ''} placeholder="..." onChange={e => onUpdate(f.key, e.target.value)} />
            : <p className="text-sm text-gray-700 whitespace-pre-wrap">{details[f.key] || '—'}</p>}
        </div>
      ))}
    </div>
  )
}

function SectionDetailView({ sectionName, description, isAdmin, onBack, onUpdate }: {
  sectionName: string; description: string; isAdmin: boolean; onBack: () => void; onUpdate: (v: string) => void
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
        <h2 className="font-bold text-gray-800 text-base">{sectionName} — Overview</h2>
      </div>
      {isAdmin
        ? <textarea className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 resize-none"
            rows={8} value={description} placeholder={`Overview for ${sectionName}...`} onChange={e => onUpdate(e.target.value)} />
        : <p className="text-sm text-gray-700 whitespace-pre-wrap">{description || 'No overview available.'}</p>}
    </div>
  )
}

type ActiveDetail =
  | null
  | { kind: 'phone-plan'; plan: string }
  | { kind: 'adder-plan'; si: number; ri: number }
  | { kind: 'internet-plan'; si: number; ri: number }
  | { kind: 'cable-plan'; si: number; ri: number }
  | { kind: 'section'; si: number }

// ── CARRIER DROPDOWN ──────────────────────────────────────
function CarrierDropdown({ selected, onChange }: { selected: Set<string>; onChange: (s: Set<string>) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handle(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])
  const label = selected.size === 0 ? 'Carrier'
    : selected.size === CARRIERS.length ? 'All Carriers'
    : [...selected].join(', ')
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs font-semibold border border-gray-300 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 focus:outline-none whitespace-nowrap max-w-[160px]">
        <span className="truncate">{label}</span>
        <span className="text-gray-400 shrink-0">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]">
          {CARRIERS.map(c => (
            <label key={c} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={selected.has(c)} className="accent-blue-600"
                onChange={() => { const n = new Set(selected); n.has(c) ? n.delete(c) : n.add(c); onChange(n) }} />
              <span className="text-xs text-gray-700">{c}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────
export default function PricingAndCommissions({ onBack }: { onBack: () => void }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [userType, setUserType] = useState<UserType>('Personal')
  const [selectedCarriers, setSelectedCarriers] = useState<Set<string>>(new Set(['AT&T']))
  const [selectedRole, setSelectedRole] = useState('')
  const [grid, setGrid] = useState<PricingGrid>({})
  const [discounts, setDiscounts] = useState<DiscountRow[]>(DEFAULT_DISCOUNTS)
  const [companyDiscounts, setCompanyDiscounts] = useState<CompanyDiscount[]>([])
  const [companySearch, setCompanySearch] = useState('')
  const [showCompanyDb, setShowCompanyDb] = useState(false)
  const [newCompany, setNewCompany] = useState<CompanyDiscount>({ company: '', discount: '' })
  const [agentDiscounts, setAgentDiscounts] = useState<DiscountRow[]>([])
  const [checkedBenefits, setCheckedBenefits] = useState<Set<string>>(new Set())
  const [planDetails, setPlanDetails] = useState<PlanDetailsMap>({})
  const [detailsExpanded, setDetailsExpanded] = useState(false)
  const [expandedDiscount, setExpandedDiscount] = useState<number | null>(null)
  const [commissionConfig, setCommissionConfig] = useState<CommissionConfig>(DEFAULT_COMMISSION)
  const [expandedSectionDetails, setExpandedSectionDetails] = useState<Set<string>>(new Set())
  const [activeDetail, setActiveDetail] = useState<ActiveDetail>(null)
  const [showPricing, setShowPricing] = useState(true)
  const [showCommissions, setShowCommissions] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLoadingRef = useRef(true)

  const canEdit = isAdmin && isEditing

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAdmin(user?.email === ADMIN_EMAIL)
      const { data } = await supabase.from('att_pricing_config').select('*').eq('id', 1).single()
      if (data) {
        setGrid(data.grid || {})
        setDiscounts(data.discounts?.length ? data.discounts : DEFAULT_DISCOUNTS)
        setCompanyDiscounts(data.company_discounts || [])
        setAgentDiscounts(data.agent_discounts || [])
        setPlanDetails(data.plan_details || {})
        const cfg = data.commission_config ? migrateCommissionConfig(data.commission_config) : DEFAULT_COMMISSION
        setCommissionConfig(cfg)
        setSelectedRole(cfg.roles[0] ?? '')
      }
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => { if (!loading) isLoadingRef.current = false }, [loading])

  useEffect(() => {
    if (isLoadingRef.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaved(false)
    saveTimer.current = setTimeout(async () => {
      setSaving(true); setSaveError(null)
      const { error } = await supabase.from('att_pricing_config').upsert({
        id: 1, grid, discounts, company_discounts: companyDiscounts,
        agent_discounts: agentDiscounts, plan_details: planDetails,
        commission_config: commissionConfig, updated_at: new Date().toISOString(),
      })
      setSaving(false)
      if (error) setSaveError(error.message)
      else { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    }, 1500)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [grid, discounts, companyDiscounts, agentDiscounts, planDetails, commissionConfig])

  const latestRef = useRef({ grid, discounts, companyDiscounts, agentDiscounts, planDetails, commissionConfig })
  latestRef.current = { grid, discounts, companyDiscounts, agentDiscounts, planDetails, commissionConfig }

  useEffect(() => {
    const handler = () => {
      if (isLoadingRef.current) return
      const s = latestRef.current
      supabase.from('att_pricing_config').upsert({
        id: 1, grid: s.grid, discounts: s.discounts, company_discounts: s.companyDiscounts,
        agent_discounts: s.agentDiscounts, plan_details: s.planDetails,
        commission_config: s.commissionConfig, updated_at: new Date().toISOString(),
      }).then(({ error }) => {
        if (error) setSaveError(error.message)
        else { setSaveError(null); setSaved(true); setTimeout(() => setSaved(false), 2000) }
      })
    }
    window.addEventListener('soul-shine:save', handler)
    return () => window.removeEventListener('soul-shine:save', handler)
  }, [])

  // ── SECTION LOOKUPS ───────────────────────────────────────
  function sec(name: string) { return commissionConfig.sections.find(s => s.name === name) }
  function si(name: string) { return commissionConfig.sections.findIndex(s => s.name === name) }

  // ── DATA HELPERS ──────────────────────────────────────────
  function setPricingCell(plan: string, line: number, value: string) {
    setGrid(prev => ({ ...prev, [plan]: { ...(prev[plan] || {}), [line]: value } }))
  }
  function setDiscount(idx: number, value: string) {
    setDiscounts(prev => prev.map((d, i) => i !== idx ? d : { ...d, value }))
  }
  function setDiscountNotes(idx: number, notes: string) {
    setDiscounts(prev => prev.map((d, i) => i !== idx ? d : { ...d, notes }))
  }
  function setAgentDiscount(idx: number, field: 'label' | 'value', value: string) {
    setAgentDiscounts(prev => prev.map((d, i) => i !== idx ? d : { ...d, [field]: value }))
  }
  function selectCompany(c: CompanyDiscount) {
    setCompanySearch(c.company)
    const fanIdx = discounts.findIndex(d => d.label === 'Company (FAN)')
    if (fanIdx >= 0) setDiscount(fanIdx, c.discount)
    setShowCompanyDb(false)
  }
  function addCompany() {
    if (!newCompany.company.trim()) return
    setCompanyDiscounts(prev => [...prev, { ...newCompany }])
    setNewCompany({ company: '', discount: '' })
  }
  function setPlanDetail(plan: string, field: keyof PlanDetails, value: string) {
    setPlanDetails(prev => ({ ...prev, [plan]: { ...(prev[plan] || EMPTY_PLAN_DETAILS), [field]: value } }))
  }
  function setPhoneCommCell(plan: string, role: string, value: string) {
    const phoneIdx = si('Phone Plans')
    setCommissionConfig(prev => ({
      ...prev,
      sections: prev.sections.map((s, idx) => idx !== phoneIdx ? s : {
        ...s, rows: s.rows.map(r => r.plan === plan ? { ...r, commissions: { ...r.commissions, [role]: value } } : r),
      }),
    }))
  }
  function setRowField(sIdx: number, ri: number, field: keyof CommissionRow, value: string) {
    setCommissionConfig(prev => ({
      ...prev,
      sections: prev.sections.map((s, idx) => idx !== sIdx ? s : {
        ...s, rows: s.rows.map((r, ridx) => ridx !== ri ? r : { ...r, [field]: value }),
      }),
    }))
  }
  function setCommCell(sIdx: number, ri: number, role: string, value: string) {
    setCommissionConfig(prev => ({
      ...prev,
      sections: prev.sections.map((s, idx) => idx !== sIdx ? s : {
        ...s, rows: s.rows.map((r, ridx) => ridx !== ri ? r : { ...r, commissions: { ...r.commissions, [role]: value } }),
      }),
    }))
  }
  function setRowPlanName(sIdx: number, ri: number, value: string) {
    setCommissionConfig(prev => ({
      ...prev,
      sections: prev.sections.map((s, idx) => idx !== sIdx ? s : {
        ...s, rows: s.rows.map((r, ridx) => ridx !== ri ? r : { ...r, plan: value }),
      }),
    }))
  }
  function addPlanRow(sIdx: number) {
    setCommissionConfig(prev => ({
      ...prev,
      sections: prev.sections.map((s, idx) => idx !== sIdx ? s : { ...s, rows: [...s.rows, { plan: '', commissions: {} }] }),
    }))
  }
  function removePlanRow(sIdx: number, ri: number) {
    setCommissionConfig(prev => ({
      ...prev,
      sections: prev.sections.map((s, idx) => idx !== sIdx ? s : { ...s, rows: s.rows.filter((_, ridx) => ridx !== ri) }),
    }))
  }
  function addRole() {
    const r = window.prompt('New role name:')?.trim()
    if (!r || commissionConfig.roles.includes(r)) return
    setCommissionConfig(prev => ({ ...prev, roles: [...prev.roles, r] }))
  }
  function updateInternetPlanDetail(sIdx: number, ri: number, field: keyof InternetPlanDetails, value: string) {
    setCommissionConfig(prev => ({
      ...prev,
      sections: prev.sections.map((s, idx) => idx !== sIdx ? s : {
        ...s, rows: s.rows.map((r, ridx) => ridx !== ri ? r : {
          ...r, internetDetails: { ...EMPTY_INTERNET_DETAILS, ...r.internetDetails, [field]: value },
        }),
      }),
    }))
  }
  function updateCablePlanDetail(sIdx: number, ri: number, value: string) {
    setCommissionConfig(prev => ({
      ...prev,
      sections: prev.sections.map((s, idx) => idx !== sIdx ? s : {
        ...s, rows: s.rows.map((r, ridx) => ridx !== ri ? r : { ...r, cableDetails: { channels_included: value } }),
      }),
    }))
  }
  function updateAdderPlanDetail(sIdx: number, ri: number, field: keyof AdderDetails, value: string) {
    setCommissionConfig(prev => ({
      ...prev,
      sections: prev.sections.map((s, idx) => idx !== sIdx ? s : {
        ...s, rows: s.rows.map((r, ridx) => ridx !== ri ? r : {
          ...r, adderDetails: { ...EMPTY_ADDER_DETAILS, ...r.adderDetails, [field]: value },
        }),
      }),
    }))
  }
  function updateRiderDetail(sIdx: number, ri: number, field: keyof RiderDetails, value: string) {
    setCommissionConfig(prev => ({
      ...prev,
      sections: prev.sections.map((s, idx) => idx !== sIdx ? s : {
        ...s, rows: s.rows.map((r, ridx) => ridx !== ri ? r : {
          ...r, riderDetails: { ...EMPTY_RIDER_DETAILS, ...r.riderDetails, [field]: value },
        }),
      }),
    }))
  }
  function updateSectionDetails(sIdx: number, value: string) {
    setCommissionConfig(prev => ({
      ...prev,
      sections: prev.sections.map((s, idx) => idx !== sIdx ? s : { ...s, sectionDetails: value }),
    }))
  }
  function toggleExp(name: string) {
    setExpandedSectionDetails(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n })
  }

  // ── DETAIL ROUTING ────────────────────────────────────────
  if (loading) return <div className="text-sm text-gray-400 p-4">Loading...</div>

  if (activeDetail?.kind === 'phone-plan') return (
    <PhonePlanDetailView plan={activeDetail.plan} details={planDetails[activeDetail.plan] || EMPTY_PLAN_DETAILS}
      isAdmin={isAdmin} onBack={() => setActiveDetail(null)}
      onChange={(field, value) => setPlanDetail(activeDetail.plan, field, value)} />
  )
  if (activeDetail?.kind === 'internet-plan') {
    const { si: sIdx, ri } = activeDetail
    const row = commissionConfig.sections[sIdx]?.rows[ri]
    return <InternetPlanDetailView plan={row?.plan ?? ''} details={row?.internetDetails ?? {}} isAdmin={isAdmin}
      onBack={() => setActiveDetail(null)} onUpdate={(f, v) => updateInternetPlanDetail(sIdx, ri, f, v)} />
  }
  if (activeDetail?.kind === 'adder-plan') {
    const { si: sIdx, ri } = activeDetail
    const row = commissionConfig.sections[sIdx]?.rows[ri]
    return <AdderPlanDetailView plan={row?.plan ?? ''} details={row?.adderDetails ?? {}} isAdmin={isAdmin}
      onBack={() => setActiveDetail(null)} onUpdate={(f, v) => updateAdderPlanDetail(sIdx, ri, f, v)} />
  }
  if (activeDetail?.kind === 'cable-plan') {
    const { si: sIdx, ri } = activeDetail
    const row = commissionConfig.sections[sIdx]?.rows[ri]
    return <CablePlanDetailView plan={row?.plan ?? ''} details={row?.cableDetails ?? {}} isAdmin={isAdmin}
      onBack={() => setActiveDetail(null)} onUpdate={v => updateCablePlanDetail(sIdx, ri, v)} />
  }
  if (activeDetail?.kind === 'section') {
    const { si: sIdx } = activeDetail
    const section = commissionConfig.sections[sIdx]
    return <SectionDetailView sectionName={section?.name ?? ''} description={section?.sectionDetails ?? ''}
      isAdmin={isAdmin} onBack={() => setActiveDetail(null)} onUpdate={v => updateSectionDetails(sIdx, v)} />
  }

  // ── RENDER PRIMITIVES ─────────────────────────────────────
  function commHeaderCols() {
    return commissionConfig.roles.map(role => (
      <th key={role} className={`border border-gray-200 px-1 py-1.5 font-semibold text-center whitespace-nowrap w-14 ${role === selectedRole ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700'}`}>
        {role}
      </th>
    ))
  }
  function commCols(sIdx: number, ri: number, row: CommissionRow) {
    return commissionConfig.roles.map(role => (
      <td key={role} className={`border border-gray-200 p-0 text-center ${role === selectedRole ? 'bg-green-50' : 'bg-green-50/30'}`}>
        {canEdit
          ? <input className={`w-full text-xs text-center px-1 py-0.5 focus:outline-none bg-transparent ${role === selectedRole ? 'focus:bg-green-100' : 'focus:bg-green-50'}`}
              value={row.commissions[role] ?? ''} placeholder="—" onChange={e => setCommCell(sIdx, ri, role, e.target.value)} />
          : <span className={`block px-1 py-0.5 ${role === selectedRole ? 'font-semibold text-green-700' : 'text-green-800'}`}>{row.commissions[role] || '—'}</span>}
      </td>
    ))
  }

  // Standard/Bundled/Promo header cells (Promo combines amount + duration)
  function priceHeaders() {
    if (!showPricing) return null
    return (
      <>
        <th className="border border-gray-200 px-1 py-1.5 font-semibold text-center bg-blue-50 text-blue-700 w-14">Standard</th>
        <th className="border border-gray-200 px-1 py-1.5 font-semibold text-center bg-blue-50 text-blue-700 w-14">Bundled</th>
        <th className="border border-gray-200 px-1 py-1 font-semibold text-center bg-blue-50 text-blue-700 w-20 text-[10px]">Promo</th>
      </>
    )
  }
  function priceCells(sIdx: number, ri: number, row: CommissionRow) {
    if (!showPricing) return null
    const promoDisplay = row.promoAmount && row.promoDuration
      ? `${row.promoAmount} / ${row.promoDuration}`
      : (row.promoAmount || row.promoDuration || '—')
    return (
      <>
        {(['standard', 'bundled'] as const).map(f => (
          <td key={f} className="border border-gray-200 p-0 text-center bg-blue-50/40 w-14">
            {canEdit
              ? <input className="w-full text-xs text-center px-1 py-0.5 focus:outline-none focus:bg-blue-100 bg-transparent"
                  value={(row[f] as string) ?? ''} placeholder="—" onChange={e => setRowField(sIdx, ri, f, e.target.value)} />
              : <span className="block px-1 py-0.5 text-blue-800">{(row[f] as string) || '—'}</span>}
          </td>
        ))}
        <td className="border border-gray-200 p-0 text-center bg-blue-50/40 w-20">
          {canEdit
            ? <div className="flex flex-col gap-px py-0.5 px-1">
                <input className="w-full text-xs text-center focus:outline-none focus:bg-blue-100 bg-transparent"
                  value={row.promoAmount ?? ''} placeholder="$" onChange={e => setRowField(sIdx, ri, 'promoAmount', e.target.value)} />
                <input className="w-full text-[10px] text-center text-gray-400 focus:outline-none focus:bg-blue-50 bg-transparent"
                  value={row.promoDuration ?? ''} placeholder="duration" onChange={e => setRowField(sIdx, ri, 'promoDuration', e.target.value)} />
              </div>
            : <span className="block px-1 py-0.5 text-blue-800 text-[10px]">{promoDisplay}</span>}
        </td>
      </>
    )
  }

  function singlePriceHeader() {
    if (!showPricing) return null
    return <th className="border border-gray-200 px-1 py-1.5 font-semibold text-center bg-blue-50 text-blue-700 w-14">Price</th>
  }
  function singlePriceCell(sIdx: number, ri: number, row: CommissionRow) {
    if (!showPricing) return null
    return (
      <td className="border border-gray-200 p-0 text-center bg-blue-50/40 w-14">
        {canEdit
          ? <input className="w-full text-xs text-center px-1 py-0.5 focus:outline-none focus:bg-blue-100 bg-transparent"
              value={row.price ?? ''} placeholder="—" onChange={e => setRowField(sIdx, ri, 'price', e.target.value)} />
          : <span className="block px-1 py-0.5 text-blue-800">{row.price || '—'}</span>}
      </td>
    )
  }

  function sep() {
    if (!showPricing || !showCommissions) return null
    return <td className="bg-gray-200 w-0.5 p-0 border-0" />
  }
  function sepTh() {
    if (!showPricing || !showCommissions) return null
    return <th className="bg-gray-300 w-0.5 p-0 border-0" />
  }

  function subLabel(label: string) {
    return (
      <div className="border-t border-gray-200 bg-gray-50 px-3 py-1">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
      </div>
    )
  }

  function addRowBtn(sIdx: number, label = '+ Add Plan') {
    if (!canEdit) return null
    return <button onClick={() => addPlanRow(sIdx)} className="w-full text-xs text-blue-500 py-1 hover:bg-blue-50 border-t border-dashed border-blue-100 text-center">{label}</button>
  }

  // Generic pricing+commission table (for adders, accessories, streaming, riders, cable)
  function genericTable(section: CommissionSection, sIdx: number, opts: {
    nameEditable?: boolean; isCable?: boolean; showDetails?: boolean
    skipPricing?: boolean; isAdder?: boolean; singlePrice?: boolean
  } = {}) {
    const detailExp = expandedSectionDetails.has(section.name)
    const showPrice = !opts.skipPricing && showPricing
    const showSep = showCommissions && (showPrice || (opts.skipPricing ? false : showPricing))

    return (
      <div className="overflow-x-auto">
        <table className="text-xs w-full border-collapse">
          <thead>
            <tr className="bg-white">
              <th className="border border-gray-200 px-1 py-1.5 text-left font-semibold text-gray-500 whitespace-nowrap w-32">Plan</th>
              {showPrice && (opts.singlePrice ? singlePriceHeader() : priceHeaders())}
              {showPricing && opts.showDetails && (
                <th className="border border-gray-200 px-1 py-1.5 font-semibold text-blue-700 text-center w-14 bg-blue-50 cursor-pointer hover:bg-blue-100 select-none"
                  onClick={() => toggleExp(section.name)}>Details {detailExp ? '▼' : '▶'}</th>
              )}
              {showPricing && opts.showDetails && detailExp && opts.isCable && (
                <th className="border border-gray-200 px-1 py-1 text-[10px] font-semibold text-blue-600 text-center bg-blue-50/50 min-w-[80px]">Channels</th>
              )}
              {showPricing && opts.showDetails && detailExp && opts.isAdder && ADDER_INLINE_FIELDS.map(f => (
                <th key={f.key} className="border border-gray-200 px-1 py-1 text-[10px] font-semibold text-blue-600 text-center bg-blue-50/50 w-20">{f.label}</th>
              ))}
              {showSep ? <th className="bg-gray-300 w-0.5 p-0 border-0" /> : null}
              {showCommissions && commHeaderCols()}
              {canEdit && <th className="border border-gray-200 w-6" />}
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row, ri) => (
              <tr key={ri} className="bg-white hover:bg-gray-50">
                <td className={`border border-gray-200 px-1 py-0.5 whitespace-nowrap ${
                  opts.isCable ? 'font-medium text-purple-600 hover:text-purple-800 cursor-pointer'
                  : opts.isAdder ? 'font-medium text-gray-700 hover:text-blue-600 cursor-pointer'
                  : 'text-gray-700'
                }`}
                  onClick={
                    opts.isCable ? () => setActiveDetail({ kind: 'cable-plan', si: sIdx, ri })
                    : opts.isAdder ? () => setActiveDetail({ kind: 'adder-plan', si: sIdx, ri })
                    : undefined
                  }>
                  {opts.nameEditable && canEdit && !opts.isAdder
                    ? <input className="w-full text-xs px-1 py-0.5 focus:outline-none bg-transparent" value={row.plan} placeholder="Plan…"
                        onChange={e => setRowPlanName(sIdx, ri, e.target.value)} />
                    : row.plan}
                </td>
                {showPrice && (opts.singlePrice ? singlePriceCell(sIdx, ri, row) : priceCells(sIdx, ri, row))}
                {showPricing && opts.showDetails && <td className="border border-gray-200 px-1 py-0.5 text-center text-xs text-gray-300 bg-blue-50/20 w-14">—</td>}
                {showPrice && opts.showDetails && detailExp && opts.isCable && (
                  <td className="border border-gray-200 p-0 text-center bg-blue-50/30 min-w-[80px]">
                    {canEdit
                      ? <input className="w-full text-xs text-center px-1 py-0.5 focus:outline-none focus:bg-blue-100 bg-transparent"
                          value={row.cableDetails?.channels_included ?? ''} placeholder="e.g. 150+"
                          onChange={e => updateCablePlanDetail(sIdx, ri, e.target.value)} />
                      : <span className="block px-1 py-0.5 text-blue-800 truncate">{row.cableDetails?.channels_included || '—'}</span>}
                  </td>
                )}
                {showPricing && opts.showDetails && detailExp && opts.isAdder && ADDER_INLINE_FIELDS.map(f => (
                  <td key={f.key} className="border border-gray-200 p-0 text-center bg-blue-50/30 w-20">
                    {canEdit
                      ? <input className="w-full text-xs text-center px-1 py-0.5 focus:outline-none focus:bg-blue-100 bg-transparent"
                          value={row.adderDetails?.[f.key] ?? ''} placeholder="—"
                          onChange={e => updateAdderPlanDetail(sIdx, ri, f.key, e.target.value)} />
                      : <span className="block px-1 py-0.5 text-blue-800">{row.adderDetails?.[f.key] || '—'}</span>}
                  </td>
                ))}
                {showSep ? <td className="bg-gray-200 w-0.5 p-0 border-0" /> : null}
                {showCommissions && commCols(sIdx, ri, row)}
                {canEdit && <td className="border border-gray-200 px-1 text-center">
                  <button onClick={() => removePlanRow(sIdx, ri)} className="text-gray-300 hover:text-red-400">✕</button>
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Internet group block (plan + riders + discounts + promotions, all touching)
  function renderInternetGroup(group: typeof INTERNET_GROUPS[number]) {
    const planSec = sec(group.plan); const planIdx = si(group.plan)
    const ridersSec = sec(group.riders); const ridersIdx = si(group.riders)
    const discSec = sec(group.discounts); const discIdx = si(group.discounts)
    const promoSec = sec(group.promotions); const promoIdx = si(group.promotions)
    if (!planSec) return null
    const detailExp = expandedSectionDetails.has(group.plan)
    const hasSep = showPricing && showCommissions

    return (
      <div key={group.plan}>
        <div className="bg-gray-50 border-b border-gray-200 px-3 py-1.5 flex items-center gap-2">
          <button onClick={() => setActiveDetail({ kind: 'section', si: planIdx })}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 uppercase tracking-wide">{group.plan}</button>
        </div>
        <div className="overflow-x-auto">
          <table className="text-xs w-full border-collapse">
            <thead>
              <tr className="bg-white">
                <th rowSpan={!showPricing ? 1 : detailExp ? 5 : 2} className="border border-gray-200 px-1 py-1.5 text-left font-semibold text-gray-500 whitespace-nowrap w-32">Plan</th>
                {showPricing && <th colSpan={3} className="border border-gray-200 px-1 py-0.5 font-semibold text-center bg-blue-50 text-blue-700 text-[10px] uppercase tracking-wide">Pricing</th>}
                {showPricing && (
                  <th rowSpan={detailExp ? 5 : 2} className="border border-gray-200 px-1 py-1.5 font-semibold text-blue-700 text-center w-14 bg-blue-50 cursor-pointer hover:bg-blue-100 select-none"
                    onClick={() => toggleExp(group.plan)}>Details {detailExp ? '▼' : '▶'}</th>
                )}
                {showPricing && detailExp && (
                  <>
                    <th colSpan={10} className="border border-gray-200 px-1 py-0.5 text-[10px] font-semibold text-blue-600 text-center bg-blue-50/50 uppercase tracking-wide">Usage</th>
                    <th colSpan={4} className="border border-gray-200 px-1 py-0.5 text-[10px] font-semibold text-blue-600 text-center bg-blue-50/50 uppercase tracking-wide">Install</th>
                    <th colSpan={4} className="border border-gray-200 px-1 py-0.5 text-[10px] font-semibold text-blue-600 text-center bg-blue-50/50 uppercase tracking-wide">Equipment</th>
                  </>
                )}
                {hasSep && <th rowSpan={!showPricing ? 1 : detailExp ? 5 : 2} className="bg-gray-300 w-0.5 p-0 border-0" />}
                {showCommissions && commissionConfig.roles.map(role => (
                  <th rowSpan={!showPricing ? 1 : detailExp ? 5 : 2} key={role} className={`border border-gray-200 px-1 py-1.5 font-semibold text-center whitespace-nowrap w-14 ${role === selectedRole ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700'}`}>{role}</th>
                ))}
                {canEdit && <th rowSpan={!showPricing ? 1 : detailExp ? 5 : 2} className="border border-gray-200 w-6" />}
              </tr>
              {showPricing && (
                <tr className="bg-blue-50/60">
                  <th rowSpan={detailExp ? 4 : 1} className="border border-gray-200 px-1 py-0.5 text-[10px] font-semibold text-blue-700 text-center w-14">Standard</th>
                  <th rowSpan={detailExp ? 4 : 1} className="border border-gray-200 px-1 py-0.5 text-[10px] font-semibold text-blue-700 text-center w-14">Bundled</th>
                  <th rowSpan={detailExp ? 4 : 1} className="border border-gray-200 px-1 py-0.5 text-[10px] font-semibold text-blue-700 text-center w-20">Promo</th>
                  {detailExp && (
                    <>
                      <th rowSpan={4} className="border border-gray-200 px-1 py-0.5 text-[10px] font-semibold text-blue-600 text-center bg-blue-50/50 w-12">Terms</th>
                      <th colSpan={4} className="border border-gray-200 px-1 py-0.5 text-[10px] font-semibold text-blue-600 text-center bg-blue-50/50">Speed</th>
                      <th colSpan={5} className="border border-gray-200 px-1 py-0.5 text-[10px] font-semibold text-blue-600 text-center bg-blue-50/50">Data</th>
                      <th colSpan={4} className="border border-gray-200 px-1 py-0.5 text-[10px] font-semibold text-blue-600 text-center bg-blue-50/50">Lines Run</th>
                      <th rowSpan={4} className="border border-gray-200 px-1 py-0.5 text-[10px] font-semibold text-blue-600 text-center bg-blue-50/50 w-12">Cost</th>
                      <th colSpan={2} className="border border-gray-200 px-1 py-0.5 text-[10px] font-semibold text-blue-600 text-center bg-blue-50/50">Router</th>
                      <th rowSpan={4} className="border border-gray-200 px-1 py-0.5 text-[10px] font-semibold text-blue-600 text-center bg-blue-50/50 w-14">Backup Power</th>
                    </>
                  )}
                </tr>
              )}
              {showPricing && detailExp && (
                <>
                  <tr>
                    <th colSpan={2} className="border border-gray-200 px-1 py-0.5 text-[10px] font-semibold text-blue-600 text-center bg-blue-50/40">Down</th>
                    <th colSpan={2} className="border border-gray-200 px-1 py-0.5 text-[10px] font-semibold text-blue-600 text-center bg-blue-50/40">Up</th>
                    <th rowSpan={3} className="border border-gray-200 px-1 py-0.5 text-[10px] font-semibold text-blue-600 text-center bg-blue-50/40 w-12">Data Cap</th>
                    <th colSpan={4} className="border border-gray-200 px-1 py-0.5 text-[10px] font-semibold text-blue-600 text-center bg-blue-50/40">Extra Data Charge</th>
                    <th colSpan={2} className="border border-gray-200 px-1 py-0.5 text-[10px] font-semibold text-blue-600 text-center bg-blue-50/40">Phase 1</th>
                    <th colSpan={2} className="border border-gray-200 px-1 py-0.5 text-[10px] font-semibold text-blue-600 text-center bg-blue-50/40">Phase 2</th>
                    <th rowSpan={3} className="border border-gray-200 px-1 py-0.5 text-[10px] font-semibold text-blue-600 text-center bg-blue-50/40 w-12">Provided</th>
                    <th rowSpan={3} className="border border-gray-200 px-1 py-0.5 text-[10px] font-semibold text-blue-600 text-center bg-blue-50/40 w-12">Cost</th>
                  </tr>
                  <tr>
                    <th rowSpan={2} className="border border-gray-200 px-1 py-0.5 text-[9px] font-medium text-blue-600 text-center bg-blue-50/30 w-10">Min</th>
                    <th rowSpan={2} className="border border-gray-200 px-1 py-0.5 text-[9px] font-medium text-blue-600 text-center bg-blue-50/30 w-10">Max</th>
                    <th rowSpan={2} className="border border-gray-200 px-1 py-0.5 text-[9px] font-medium text-blue-600 text-center bg-blue-50/30 w-10">Min</th>
                    <th rowSpan={2} className="border border-gray-200 px-1 py-0.5 text-[9px] font-medium text-blue-600 text-center bg-blue-50/30 w-10">Max</th>
                    <th colSpan={2} className="border border-gray-200 px-1 py-0.5 text-[9px] font-medium text-blue-600 text-center bg-blue-50/30">Tier 1</th>
                    <th colSpan={2} className="border border-gray-200 px-1 py-0.5 text-[9px] font-medium text-blue-600 text-center bg-blue-50/30">Tier 2</th>
                    <th rowSpan={2} className="border border-gray-200 px-1 py-0.5 text-[9px] font-medium text-blue-600 text-center bg-blue-50/30 w-10">Type</th>
                    <th rowSpan={2} className="border border-gray-200 px-1 py-0.5 text-[9px] font-medium text-blue-600 text-center bg-blue-50/30 w-10">Routing</th>
                    <th rowSpan={2} className="border border-gray-200 px-1 py-0.5 text-[9px] font-medium text-blue-600 text-center bg-blue-50/30 w-10">Type</th>
                    <th rowSpan={2} className="border border-gray-200 px-1 py-0.5 text-[9px] font-medium text-blue-600 text-center bg-blue-50/30 w-10">Routing</th>
                  </tr>
                  <tr>
                    <th className="border border-gray-200 px-1 py-0.5 text-[9px] font-medium text-blue-600 text-center bg-blue-50/20 w-10">Data</th>
                    <th className="border border-gray-200 px-1 py-0.5 text-[9px] font-medium text-blue-600 text-center bg-blue-50/20 w-10">Charge</th>
                    <th className="border border-gray-200 px-1 py-0.5 text-[9px] font-medium text-blue-600 text-center bg-blue-50/20 w-10">Data</th>
                    <th className="border border-gray-200 px-1 py-0.5 text-[9px] font-medium text-blue-600 text-center bg-blue-50/20 w-10">Charge</th>
                  </tr>
                </>
              )}
            </thead>
            <tbody>
              {planSec.rows.map((row, ri) => (
                <tr key={ri} className="bg-white hover:bg-gray-50">
                  <td className="border border-gray-200 px-1 py-0.5 font-medium text-blue-600 hover:text-blue-800 cursor-pointer whitespace-nowrap"
                    onClick={() => setActiveDetail({ kind: 'internet-plan', si: planIdx, ri })}>{row.plan}</td>
                  {priceCells(planIdx, ri, row)}
                  {showPricing && <td className="border border-gray-200 px-1 py-0.5 text-center text-xs text-gray-300 bg-blue-50/20 w-14">—</td>}
                  {showPricing && detailExp && INTERNET_DETAIL_LEAF_KEYS.map(key => (
                    <td key={key} className="border border-gray-200 p-0 text-center bg-blue-50/30 w-10">
                      {canEdit
                        ? <input className="w-full text-xs text-center px-1 py-0.5 focus:outline-none focus:bg-blue-100 bg-transparent"
                            value={row.internetDetails?.[key] ?? ''} placeholder="—"
                            onChange={e => updateInternetPlanDetail(planIdx, ri, key, e.target.value)} />
                        : <span className="block px-1 py-0.5 text-blue-800">{row.internetDetails?.[key] || '—'}</span>}
                    </td>
                  ))}
                  {sep()}
                  {showCommissions && commCols(planIdx, ri, row)}
                  {canEdit && <td className="border border-gray-200 px-1 text-center">
                    <button onClick={() => removePlanRow(planIdx, ri)} className="text-gray-300 hover:text-red-400">✕</button>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {addRowBtn(planIdx)}

        {ridersSec && (showPricing || showCommissions) && (
          <>
            {subLabel('Riders')}
            <div className="overflow-x-auto">
              <table className="text-xs w-full border-collapse">
                <thead>
                  <tr className="bg-white">
                    <th rowSpan={showPricing ? 2 : 1} className="border border-gray-200 px-1 py-1.5 text-left font-semibold text-gray-500 whitespace-nowrap w-32">Rider</th>
                    {showPricing && <th rowSpan={2} className="border border-gray-200 px-1 py-1.5 font-semibold text-center bg-blue-50 text-blue-700 w-14">Price</th>}
                    {showPricing && <th colSpan={2} className="border border-gray-200 px-1 py-1.5 font-semibold text-center bg-blue-50 text-blue-700">Details</th>}
                    {hasSep && <th rowSpan={showPricing ? 2 : 1} className="bg-gray-300 w-0.5 p-0 border-0" />}
                    {showCommissions && commissionConfig.roles.map(role => (
                      <th rowSpan={showPricing ? 2 : 1} key={role} className={`border border-gray-200 px-1 py-1.5 font-semibold text-center whitespace-nowrap w-14 ${role === selectedRole ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700'}`}>{role}</th>
                    ))}
                    {canEdit && <th rowSpan={showPricing ? 2 : 1} className="border border-gray-200 w-6" />}
                  </tr>
                  {showPricing && (
                    <tr className="bg-blue-50/30">
                      <th className="border border-gray-200 px-1 py-0.5 text-[10px] font-semibold text-blue-600 text-center w-20">Value</th>
                      <th className="border border-gray-200 px-1 py-0.5 text-[10px] font-semibold text-blue-600 text-center w-32">Description</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {ridersSec.rows.map((row, ri) => (
                    <tr key={ri} className="bg-white hover:bg-gray-50">
                      <td className="border border-gray-200 px-1 py-0.5 text-gray-600 whitespace-nowrap">
                        {canEdit
                          ? <input className="w-full text-xs px-1 py-0.5 focus:outline-none bg-transparent" value={row.plan} placeholder="Rider…"
                              onChange={e => setRowPlanName(ridersIdx, ri, e.target.value)} />
                          : row.plan}
                      </td>
                      {singlePriceCell(ridersIdx, ri, row)}
                      {showPricing && (
                        <td className="border border-gray-200 p-0 text-center bg-blue-50/30 w-20">
                          {canEdit
                            ? <input className="w-full text-xs text-center px-1 py-0.5 focus:outline-none focus:bg-blue-100 bg-transparent"
                                value={row.riderDetails?.value ?? ''} placeholder="—"
                                onChange={e => updateRiderDetail(ridersIdx, ri, 'value', e.target.value)} />
                            : <span className="block px-1 py-0.5 text-blue-800">{row.riderDetails?.value || '—'}</span>}
                        </td>
                      )}
                      {showPricing && (
                        <td className="border border-gray-200 p-0 bg-blue-50/30 w-32">
                          {canEdit
                            ? <input className="w-full text-xs px-1 py-0.5 focus:outline-none focus:bg-blue-100 bg-transparent"
                                value={row.riderDetails?.description ?? ''} placeholder="—"
                                onChange={e => updateRiderDetail(ridersIdx, ri, 'description', e.target.value)} />
                            : <span className="block px-1 py-0.5 text-blue-800">{row.riderDetails?.description || '—'}</span>}
                        </td>
                      )}
                      {hasSep && <td className="bg-gray-200 w-0.5 p-0 border-0" />}
                      {showCommissions && commCols(ridersIdx, ri, row)}
                      {canEdit && <td className="border border-gray-200 px-1 text-center">
                        <button onClick={() => removePlanRow(ridersIdx, ri)} className="text-gray-300 hover:text-red-400">✕</button>
                      </td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {addRowBtn(ridersIdx, '+ Add Rider')}
          </>
        )}

        {discSec && showPricing && (
          <>
            {subLabel('Discounts')}
            <div className="overflow-x-auto">
              <table className="text-xs w-full border-collapse">
                <tbody>
                  {discSec.rows.map((row, ri) => (
                    <tr key={ri} className="bg-white hover:bg-gray-50">
                      <td className="border border-gray-200 px-1 py-0.5 text-gray-600 whitespace-nowrap w-32">{row.plan}</td>
                      <td className="border border-gray-200 p-0 text-center bg-blue-50/40 w-14">
                        {canEdit
                          ? <input className="w-full text-xs text-center px-1 py-0.5 focus:outline-none focus:bg-blue-100 bg-transparent"
                              value={row.price ?? ''} placeholder="—" onChange={e => setRowField(discIdx, ri, 'price', e.target.value)} />
                          : <span className="block px-1 py-0.5 text-blue-800">{row.price || '—'}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {promoSec && showPricing && (
          <>
            {subLabel('Promotions')}
            <div className="overflow-x-auto">
              <table className="text-xs w-full border-collapse">
                <tbody>
                  {promoSec.rows.map((row, ri) => (
                    <tr key={ri} className="bg-white hover:bg-gray-50">
                      <td className="border border-gray-200 px-1 py-0.5 text-gray-600 whitespace-nowrap w-32">
                        {canEdit
                          ? <input className="w-full text-xs px-1 py-0.5 focus:outline-none bg-transparent" value={row.plan} placeholder="Promotion…"
                              onChange={e => setRowPlanName(promoIdx, ri, e.target.value)} />
                          : row.plan}
                      </td>
                      <td className="border border-gray-200 p-0 text-center bg-blue-50/40 w-14">
                        {canEdit
                          ? <input className="w-full text-xs text-center px-1 py-0.5 focus:outline-none focus:bg-blue-100 bg-transparent"
                              value={row.price ?? ''} placeholder="—" onChange={e => setRowField(promoIdx, ri, 'price', e.target.value)} />
                          : <span className="block px-1 py-0.5 text-blue-800">{row.price || '—'}</span>}
                      </td>
                      {canEdit && <td className="border border-gray-200 px-1 text-center">
                        <button onClick={() => removePlanRow(promoIdx, ri)} className="text-gray-300 hover:text-red-400">✕</button>
                      </td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {addRowBtn(promoIdx, '+ Add Promo')}
          </>
        )}
      </div>
    )
  }

  const phoneSec = sec('Phone Plans'); const phoneIdx = si('Phone Plans')
  const adderSec = sec('Phone Plan Adders'); const adderIdx = si('Phone Plan Adders')
  const accSec = sec('Accessories'); const accIdx = si('Accessories')
  const rsPhone = 2

  // ── MAIN RENDER ───────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-lg shrink-0">←</button>
        <h2 className="font-bold text-gray-800 text-base shrink-0">Pricing & Commissions</h2>
        <CarrierDropdown selected={selectedCarriers} onChange={setSelectedCarriers} />
        <select
          value={userType}
          onChange={e => setUserType(e.target.value as UserType)}
          className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-blue-400">
          {USER_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        {showCommissions && (
          <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-green-400">
            {commissionConfig.roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        )}
        {isAdmin && showCommissions && (
          <button onClick={addRole} className="text-xs text-green-600 border border-green-200 rounded px-2 py-1 hover:bg-green-50">+ Role</button>
        )}
        <div className="ml-auto flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" checked={showPricing} onChange={e => setShowPricing(e.target.checked)} className="accent-blue-600" />
            <span className="text-xs font-semibold text-blue-700">Pricing</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" checked={showCommissions} onChange={e => setShowCommissions(e.target.checked)} className="accent-green-600" />
            <span className="text-xs font-semibold text-green-700">Commissions</span>
          </label>
          {isAdmin && !isEditing && (
            <button onClick={() => setIsEditing(true)}
              className="text-xs font-medium border border-blue-400 text-blue-600 rounded px-3 py-1 hover:bg-blue-50">
              Edit
            </button>
          )}
          {isAdmin && isEditing && (
            <>
              <button onClick={() => setIsEditing(false)}
                className="text-xs font-medium border border-gray-300 text-gray-500 rounded px-3 py-1 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => { setIsEditing(false); window.dispatchEvent(new Event('soul-shine:save')) }}
                className="text-xs font-medium bg-blue-600 text-white rounded px-3 py-1 hover:bg-blue-700">
                Save
              </button>
            </>
          )}
          <span className="text-xs">
            {saving ? <span className="text-gray-400">Saving…</span>
              : saveError ? <span className="text-red-500">⚠ Error</span>
              : saved ? <span className="text-green-600">✓ Saved</span> : null}
          </span>
        </div>
      </div>

      {[...selectedCarriers].filter(c => c !== 'AT&T').length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-500">
          {[...selectedCarriers].filter(c => c !== 'AT&T').join(', ')} — pricing data coming soon.
        </div>
      )}

      {(showPricing || showCommissions) && selectedCarriers.has('AT&T') && (
        <>
          {/* ── CELLULAR ── */}
          <div className="rounded-xl border-2 border-blue-200 overflow-hidden">
            <div className="bg-blue-600 px-4 py-2">
              <span className="text-white font-bold text-sm tracking-wide">CELLULAR</span>
            </div>
            <div className="p-3 space-y-3">

              {/* Phone Plans */}
              {phoneSec && (
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 px-3 py-1.5">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Phone Plans</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="text-xs w-full min-w-max border-collapse">
                      <thead>
                        <tr className="bg-white">
                          <th rowSpan={rsPhone} className="border border-gray-200 px-1 py-1.5 text-left font-semibold text-gray-500 whitespace-nowrap w-32">Plan</th>
                          {showPricing && LINE_COUNTS.map(n => (
                            <th rowSpan={rsPhone} key={n} className="border border-gray-200 px-1 py-1.5 font-semibold text-blue-700 text-center whitespace-nowrap w-11 bg-blue-50">L{n}</th>
                          ))}
                          {showPricing && (
                            <th rowSpan={rsPhone} className="border border-gray-200 px-1 py-1.5 font-semibold text-blue-700 text-center w-14 bg-blue-50 cursor-pointer hover:bg-blue-100 select-none"
                              onClick={() => setDetailsExpanded(x => !x)}>Details {detailsExpanded ? '▼' : '▶'}</th>
                          )}
                          {showPricing && detailsExpanded && PLAN_DETAIL_SECTIONS.map(s => (
                            <th key={s.label} colSpan={s.fields.length} className="border border-gray-200 px-1 py-0.5 text-[10px] font-semibold text-blue-600 uppercase tracking-wide text-center bg-blue-50/50 whitespace-nowrap">{s.label}</th>
                          ))}
                          {sepTh() && <th rowSpan={rsPhone} className="bg-gray-300 w-0.5 p-0 border-0" />}
                          {showCommissions && commissionConfig.roles.map(role => (
                            <th colSpan={2} key={role} className={`border border-gray-200 px-1 py-1.5 font-semibold text-center whitespace-nowrap ${role === selectedRole ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700'}`}>{role}</th>
                          ))}
                        </tr>
                        <tr className="bg-blue-50/30">
                          {showPricing && detailsExpanded && PLAN_DETAIL_SECTIONS.flatMap(s => s.fields).map(f => (
                            <th key={f.key} className="border border-gray-200 px-1 py-0.5 text-[9px] font-medium text-blue-600 text-center whitespace-nowrap max-w-[60px]">{f.label}</th>
                          ))}
                          {showCommissions && commissionConfig.roles.flatMap(role => [
                            <th key={`${role}_new`} className={`border border-gray-200 px-1 py-0.5 text-[9px] font-semibold text-center whitespace-nowrap w-14 ${role === selectedRole ? 'bg-green-500 text-white' : 'bg-green-50/60 text-green-600'}`}>New device</th>,
                            <th key={`${role}_byod`} className={`border border-gray-200 px-1 py-0.5 text-[9px] font-semibold text-center whitespace-nowrap w-14 ${role === selectedRole ? 'bg-green-500 text-white' : 'bg-green-50/60 text-green-600'}`}>BYOD</th>,
                          ])}
                        </tr>
                      </thead>
                      <tbody>
                        {PLAN_NAMES.map(plan => {
                          const commRow = phoneSec?.rows.find(r => r.plan === plan)
                          return (
                            <tr key={plan} className="bg-white hover:bg-gray-50">
                              <td className="border border-gray-200 px-1 py-0.5 font-medium text-blue-600 hover:text-blue-800 cursor-pointer whitespace-nowrap"
                                onClick={() => setActiveDetail({ kind: 'phone-plan', plan })}>{plan}</td>
                              {showPricing && LINE_COUNTS.map(n => (
                                <td key={n} className="border border-gray-200 p-0 text-center bg-blue-50/40">
                                  {canEdit
                                    ? <input className="w-full text-xs text-center px-1 py-0.5 focus:outline-none focus:bg-blue-100 bg-transparent"
                                        value={grid[plan]?.[n] ?? ''} placeholder="—" onChange={e => setPricingCell(plan, n, e.target.value)} />
                                    : <span className="block px-1 py-0.5 text-blue-800">{grid[plan]?.[n] || '—'}</span>}
                                </td>
                              ))}
                              {showPricing && <td className="border border-gray-200 px-1 py-0.5 text-center text-xs text-gray-300 bg-blue-50/20">—</td>}
                              {showPricing && detailsExpanded && PLAN_DETAIL_SECTIONS.flatMap(s => s.fields).map(f => (
                                <td key={f.key} className="border border-gray-200 p-0 text-center bg-blue-50/30">
                                  {canEdit
                                    ? <input className="w-full text-xs text-center px-1 py-0.5 focus:outline-none focus:bg-blue-100 bg-transparent min-w-[55px]"
                                        value={planDetails[plan]?.[f.key] ?? ''} placeholder="—" onChange={e => setPlanDetail(plan, f.key, e.target.value)} />
                                    : <span className="block px-1 py-0.5 text-blue-800 min-w-[55px]">{planDetails[plan]?.[f.key] || '—'}</span>}
                                </td>
                              ))}
                              {sep()}
                              {showCommissions && commissionConfig.roles.flatMap(role => [
                                <td key={`${role}_new`} className={`border border-gray-200 p-0 text-center ${role === selectedRole ? 'bg-green-50' : 'bg-green-50/30'}`}>
                                  {canEdit
                                    ? <input className={`w-full text-xs text-center px-1 py-0.5 focus:outline-none bg-transparent ${role === selectedRole ? 'focus:bg-green-100' : 'focus:bg-green-50'}`}
                                        value={commRow?.commissions[`${role}_new`] ?? ''} placeholder="—" onChange={e => setPhoneCommCell(plan, `${role}_new`, e.target.value)} />
                                    : <span className={`block px-1 py-0.5 ${role === selectedRole ? 'font-semibold text-green-700' : 'text-green-800'}`}>{commRow?.commissions[`${role}_new`] || '—'}</span>}
                                </td>,
                                <td key={`${role}_byod`} className={`border border-gray-200 p-0 text-center ${role === selectedRole ? 'bg-green-50' : 'bg-green-50/30'}`}>
                                  {canEdit
                                    ? <input className={`w-full text-xs text-center px-1 py-0.5 focus:outline-none bg-transparent ${role === selectedRole ? 'focus:bg-green-100' : 'focus:bg-green-50'}`}
                                        value={commRow?.commissions[`${role}_byod`] ?? ''} placeholder="—" onChange={e => setPhoneCommCell(plan, `${role}_byod`, e.target.value)} />
                                    : <span className={`block px-1 py-0.5 ${role === selectedRole ? 'font-semibold text-green-700' : 'text-green-800'}`}>{commRow?.commissions[`${role}_byod`] || '—'}</span>}
                                </td>,
                              ])}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Phone Plan Adders */}
              {adderSec && (
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 px-3 py-1.5">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Phone Plan Adders</span>
                  </div>
                  {genericTable(adderSec, adderIdx, { singlePrice: true, showDetails: true, isAdder: true })}
                  {addRowBtn(adderIdx, '+ Add Adder')}
                </div>
              )}

              {/* Phone Plan Discounts */}
              <div className="rounded-lg border border-blue-200 overflow-hidden">
                <div className="bg-blue-600 px-3 py-1.5">
                  <span className="text-xs font-bold text-white uppercase tracking-wide">Phone Plan Discounts</span>
                </div>
                {showPricing && (
                  <div className="border-b border-blue-200 px-3 py-2 bg-blue-50 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-xs font-bold text-blue-700">Autopay</span>
                      <span className="text-[10px] font-semibold text-white bg-blue-500 rounded px-1.5 py-0.5">GLOBAL</span>
                    </span>
                    <span className="text-xs text-blue-500 italic">— applies to all cellular &amp; internet lines</span>
                  </div>
                )}
                {showPricing && (
                  <>
                    {subLabel('Occupational')}
                    <div className="divide-y divide-blue-50">
                      {discounts.map((d, idx) => {
                        const isExp = expandedDiscount === idx
                        const toggle = () => setExpandedDiscount(isExp ? null : idx)
                        if (d.label === 'Company (FAN)') return (
                          <div key={idx} className="bg-blue-50/10">
                            <div className="flex items-center px-3 py-2 gap-2 cursor-pointer hover:bg-blue-50/30" onClick={toggle}>
                              <span className="text-xs text-gray-600 shrink-0">Company (FAN)</span>
                              <div className="flex items-center gap-2 ml-auto" onClick={e => e.stopPropagation()}>
                                <input className="w-24 text-xs border border-blue-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                                  value={companySearch} placeholder="Search..."
                                  onChange={e => { const val = e.target.value; setCompanySearch(val); const m = companyDiscounts.find(c => c.company.toLowerCase() === val.toLowerCase()); setDiscount(idx, m?.discount ?? '') }}
                                  onClick={() => setShowCompanyDb(true)} />
                                {d.value && <span className="text-xs font-semibold text-white bg-blue-600 rounded px-2 py-0.5">{d.value}</span>}
                              </div>
                              <span className="text-gray-300 text-[10px]">{isExp ? '▲' : '▼'}</span>
                            </div>
                            {isExp && canEdit && <div className="px-3 pb-2 pt-1 border-t border-blue-100">
                              <textarea className="w-full text-xs border border-blue-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400 resize-none" rows={2}
                                value={d.notes ?? ''} placeholder="Notes..." onChange={e => setDiscountNotes(idx, e.target.value)} />
                            </div>}
                          </div>
                        )
                        return (
                          <div key={idx} className="bg-blue-50/10">
                            <div className="flex items-center justify-between px-3 py-2 gap-2 cursor-pointer hover:bg-blue-50/30" onClick={toggle}>
                              <span className="text-xs text-gray-600">{d.label}</span>
                              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                {canEdit
                                  ? <input className="w-24 text-xs text-right border border-blue-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                                      value={d.value} placeholder="e.g. 25% off" onChange={e => setDiscount(idx, e.target.value)} />
                                  : d.value
                                    ? <span className="text-xs font-semibold text-white bg-blue-600 rounded px-2 py-0.5">{d.value}</span>
                                    : <span className="text-xs text-gray-300">—</span>}
                                <span className="text-gray-300 text-[10px]">{isExp ? '▲' : '▼'}</span>
                              </div>
                            </div>
                            {isExp && (
                              <div className="px-3 pb-2 pt-1 border-t border-blue-100">
                                {canEdit
                                  ? <textarea className="w-full text-xs border border-blue-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400 resize-none" rows={2}
                                      value={d.notes ?? ''} placeholder="Notes..." onChange={e => setDiscountNotes(idx, e.target.value)} />
                                  : d.notes ? <p className="text-xs text-gray-500 italic">{d.notes}</p> : null}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Phone Plan Promotions */}
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-3 py-1.5">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Phone Plan Promotions</span>
                </div>
                {showPricing && (
                  <div className="overflow-x-auto">
                    <table className="text-xs w-full border-collapse">
                      <thead>
                        <tr className="bg-blue-50">
                          <th className="border border-blue-200 w-6 px-1"></th>
                          <th className="border border-blue-200 px-2 py-1.5 text-left font-semibold text-blue-700">Benefit</th>
                          <th className="border border-blue-200 px-2 py-1.5 text-left font-semibold text-blue-700">Discount</th>
                          <th className="border border-blue-200 px-2 py-1.5 text-left font-semibold text-blue-700">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {RETAIL_AGENT_BENEFITS.map(b => {
                          const key = b.benefit
                          const checked = checkedBenefits.has(key)
                          return (
                            <tr key={key} className={`cursor-pointer ${checked ? 'bg-blue-100' : 'hover:bg-blue-50/50'}`}
                              onClick={() => setCheckedBenefits(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })}>
                              <td className="border border-blue-200 px-1 text-center"><input type="checkbox" readOnly checked={checked} className="accent-blue-600 cursor-pointer" /></td>
                              <td className="border border-blue-200 px-2 py-1 text-gray-700">{b.benefit}</td>
                              <td className="border border-blue-200 px-2 py-1 text-blue-700 font-medium">{b.discount || '—'}</td>
                              <td className="border border-blue-200 px-2 py-1 text-gray-500">{b.duration || '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Accessories Plans */}
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-3 py-1.5">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Accessories Plans (Watches &amp; Tablets)</span>
                </div>
                {accSec && genericTable(accSec, accIdx, { singlePrice: true, showDetails: true, isAdder: true })}
                {addRowBtn(accIdx)}
              </div>

              <hr className="border-gray-300" />

              {/* Device Pricing & Trade-In */}
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-3 py-1.5">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Device Pricing &amp; Trade-In</span>
                </div>
                <DevicePricingSection isAdmin={isAdmin} />
              </div>

            </div>
          </div>

          {/* ── INTERNET ── */}
          <div className="rounded-xl border-2 border-blue-200 overflow-hidden">
            <div className="bg-blue-600 px-4 py-2">
              <span className="text-white font-bold text-sm tracking-wide">INTERNET</span>
            </div>
            <div className="p-3">
              <div className="rounded-lg border border-gray-200 overflow-hidden divide-y-2 divide-gray-200">
                {INTERNET_GROUPS.map(group => renderInternetGroup(group))}
              </div>
            </div>
          </div>

          {/* ── TV ── */}
          {(() => {
            const cableSec = sec('Cable / TV'); const cableIdx = si('Cable / TV')
            const cableAddSec = sec('Cable Adders'); const cableAddIdx = si('Cable Adders')
            const streamSec = sec('Streaming'); const streamIdx = si('Streaming')
            return (
              <div className="rounded-xl border-2 border-purple-200 overflow-hidden">
                <div className="bg-purple-600 px-4 py-2">
                  <span className="text-white font-bold text-sm tracking-wide">TV</span>
                </div>
                <div className="p-3 space-y-3">
                  {cableSec && (
                    <div className="rounded-lg border border-gray-200 overflow-hidden">
                      <div className="bg-gray-50 border-b border-gray-200 px-3 py-1.5 flex items-center gap-2">
                        <button onClick={() => setActiveDetail({ kind: 'section', si: cableIdx })}
                          className="text-xs font-semibold text-purple-600 hover:text-purple-800 uppercase tracking-wide">Cable / TV</button>
                      </div>
                      {genericTable(cableSec, cableIdx, { isCable: true, showDetails: true })}
                      {addRowBtn(cableIdx)}
                      {cableAddSec && (
                        <>
                          {subLabel('Adders')}
                          {genericTable(cableAddSec, cableAddIdx, { nameEditable: true })}
                          {addRowBtn(cableAddIdx, '+ Add Adder')}
                        </>
                      )}
                    </div>
                  )}
                  {streamSec && (
                    <div className="rounded-lg border border-gray-200 overflow-hidden">
                      <div className="bg-gray-50 border-b border-gray-200 px-3 py-1.5">
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Streaming</span>
                      </div>
                      {genericTable(streamSec, streamIdx, { nameEditable: true })}
                      {addRowBtn(streamIdx)}
                    </div>
                  )}
                </div>
              </div>
            )
          })()}
        </>
      )}

      {/* Company DB Modal */}
      {showCompanyDb && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCompanyDb(false)}>
          <div className="bg-white rounded-xl shadow-xl w-80 max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <span className="font-semibold text-sm text-gray-800">Company Discounts (FAN)</span>
              <button onClick={() => setShowCompanyDb(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="overflow-auto flex-1">
              <table className="text-xs w-full border-collapse">
                <thead className="sticky top-0 bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-600">Company</th>
                    <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-600">Discount</th>
                    {isAdmin && <th className="border border-gray-300 w-7"></th>}
                  </tr>
                </thead>
                <tbody>
                  {companyDiscounts.map((c, i) => (
                    <tr key={i} className="hover:bg-blue-50 cursor-pointer" onClick={() => selectCompany(c)}>
                      <td className="border border-gray-200 px-2 py-1">{c.company}</td>
                      <td className="border border-gray-200 px-2 py-1 text-blue-600 font-medium">{c.discount}</td>
                      {isAdmin && <td className="border border-gray-200 px-1 text-center"
                        onClick={e => { e.stopPropagation(); setCompanyDiscounts(prev => prev.filter((_, j) => j !== i)) }}>
                        <button className="text-gray-300 hover:text-red-400">✕</button>
                      </td>}
                    </tr>
                  ))}
                  {isAdmin && (
                    <tr>
                      <td className="border border-gray-200 p-0">
                        <input className="w-full px-2 py-1 text-xs focus:outline-none focus:bg-blue-50" placeholder="Company name..."
                          value={newCompany.company} onChange={e => setNewCompany(prev => ({ ...prev, company: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && addCompany()} />
                      </td>
                      <td className="border border-gray-200 p-0">
                        <input className="w-full px-2 py-1 text-xs focus:outline-none focus:bg-blue-50" placeholder="e.g. 18%"
                          value={newCompany.discount} onChange={e => setNewCompany(prev => ({ ...prev, discount: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && addCompany()} />
                      </td>
                      <td className="border border-gray-200 px-1 text-center">
                        <button onClick={addCompany} className="text-blue-600 hover:text-blue-800 font-bold">+</button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
