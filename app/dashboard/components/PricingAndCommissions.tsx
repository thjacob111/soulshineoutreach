'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

// ── CONSTANTS ─────────────────────────────────────────────
const ADMIN_EMAIL = 'thjacob111@gmail.com'
const PLAN_NAMES = ['Value', 'Extra 2.0', 'Premium 2.0', 'Senior']
const LINE_COUNTS = [1, 2, 3, 4, 5]
const FIRSTNET_NOTE = 'Includes FirstNet access — a satellite-backed priority network that gives first responders dedicated cell coverage even during emergencies and network congestion.'

const INTERNET_SECTION_NAMES = new Set([
  'Fiber', 'Fiber Riders', 'Fiber Discounts',
  'Coax', 'Coax Riders', 'Coax Discounts',
  '5G (Air)', '5G Riders', '5G Discounts',
])
const TV_SECTION_NAMES = new Set(['Cable / TV', 'Cable Adders', 'Streaming'])

const INTERNET_GROUPS = [
  { plan: 'Fiber',    riders: 'Fiber Riders',    discounts: 'Fiber Discounts'    },
  { plan: 'Coax',     riders: 'Coax Riders',     discounts: 'Coax Discounts'     },
  { plan: '5G (Air)', riders: '5G Riders',        discounts: '5G Discounts'       },
]

// ── PRICING TYPES ─────────────────────────────────────────
type PricingGrid = { [plan: string]: { [line: number]: string } }
type DiscountRow = { label: string; value: string; notes?: string }
type CompanyDiscount = { company: string; discount: string }
type RetailBenefit = { agent: string; benefit: string; discount: string; duration: string }

const RETAIL_AGENT_BENEFITS: RetailBenefit[] = [
  { agent: 'Best Buy', benefit: 'Line Credit',           discount: '$150 (−$4.17/mo)',  duration: '36 months'              },
  { agent: 'Best Buy', benefit: 'Waived Activation Fee', discount: '−$35',              duration: '1st bill'               },
  { agent: 'Best Buy', benefit: 'Apple Care',            discount: 'Free',              duration: '12 months'              },
  { agent: 'Costco',   benefit: 'Line Credit',           discount: '$250 (−$6.94/mo)',  duration: '36 months'              },
  { agent: 'Costco',   benefit: 'Waived Activation Fee', discount: '−$35',              duration: '1st bill'               },
  { agent: 'Costco',   benefit: 'Gift Card',             discount: '$100',              duration: 'Upfront (upgrades too)' },
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
  call_text_cell_tower_priority: string
  call_text_calling_limit: string
  call_text_texting_limit: string
  data_limit: string
  data_speed: string
  hotspot_limit: string
  hotspot_speed: string
  intl_calling_limit: string
  intl_coverage_map: string
  intl_data_roaming_limit: string
  intl_data_roaming_speed: string
  ld_places: string
  ld_calling_limit: string
}

type PlanDetailsMap = { [plan: string]: PlanDetails }

const EMPTY_PLAN_DETAILS: PlanDetails = {
  call_text_cell_tower_priority: '', call_text_calling_limit: '', call_text_texting_limit: '',
  data_limit: '', data_speed: '', hotspot_limit: '', hotspot_speed: '',
  intl_calling_limit: '', intl_coverage_map: '', intl_data_roaming_limit: '', intl_data_roaming_speed: '',
  ld_places: '', ld_calling_limit: '',
}

const PLAN_DETAIL_SECTIONS: { label: string; fields: { key: keyof PlanDetails; label: string }[] }[] = [
  { label: 'CALL & TEXT', fields: [
    { key: 'call_text_cell_tower_priority', label: 'Cell Tower Priority' },
    { key: 'call_text_calling_limit', label: 'Calling Limit' },
    { key: 'call_text_texting_limit', label: 'Texting Limit' },
  ]},
  { label: 'DATA', fields: [
    { key: 'data_limit', label: 'Data Limit' },
    { key: 'data_speed', label: 'Data Speed' },
  ]},
  { label: 'HOTSPOT', fields: [
    { key: 'hotspot_limit', label: 'Hotspot Limit' },
    { key: 'hotspot_speed', label: 'Hotspot Speed' },
  ]},
  { label: 'INTERNATIONAL', fields: [
    { key: 'intl_calling_limit', label: 'International Calling Limit' },
    { key: 'intl_coverage_map', label: 'International Coverage Map' },
    { key: 'intl_data_roaming_limit', label: 'International Data Roaming Limit' },
    { key: 'intl_data_roaming_speed', label: 'International Data Roaming Speed' },
  ]},
  { label: 'LONG DISTANCE', fields: [
    { key: 'ld_places', label: 'Long Distance Calling Place(s)' },
    { key: 'ld_calling_limit', label: 'Long Distance Calling Limit' },
  ]},
]

// ── INTERNET PLAN DETAILS ─────────────────────────────────
interface InternetPlanDetails {
  contract_term: string
  install_fee: string
  equipment_fee: string
  speed_range: string
  data_cap: string
  backup_power: string
  network_description: string
  equipment_description: string
}

const EMPTY_INTERNET_DETAILS: InternetPlanDetails = {
  contract_term: '', install_fee: '', equipment_fee: '',
  speed_range: '', data_cap: '', backup_power: '',
  network_description: '', equipment_description: '',
}

const INTERNET_INLINE_FIELDS: { key: keyof InternetPlanDetails; label: string }[] = [
  { key: 'contract_term',  label: 'Contract'    },
  { key: 'install_fee',    label: 'Install Fee'  },
  { key: 'equipment_fee',  label: 'Equip. Fee'  },
  { key: 'speed_range',    label: 'Speed'        },
  { key: 'data_cap',       label: 'Data Cap'     },
  { key: 'backup_power',   label: 'Backup'       },
]

// ── CABLE PLAN DETAILS ────────────────────────────────────
interface CablePlanDetails { channels_included: string }
const EMPTY_CABLE_DETAILS: CablePlanDetails = { channels_included: '' }

// ── COMMISSION TYPES ──────────────────────────────────────
interface CommissionRow {
  plan: string
  price?: string
  standard?: string
  bundled?: string
  commissions: Record<string, string>
  internetDetails?: Partial<InternetPlanDetails>
  cableDetails?: Partial<CablePlanDetails>
}

interface CommissionSection {
  name: string
  type?: 'default' | 'internet' | 'internet-riders' | 'internet-discounts' | 'cable' | 'cable-adders' | 'streaming'
  sectionDetails?: string
  rows: CommissionRow[]
}

interface CommissionConfig { roles: string[]; sections: CommissionSection[] }

const DEFAULT_COMMISSION: CommissionConfig = {
  roles: ['Overall', 'Soul Shine', 'Agent', 'Rep'],
  sections: [
    { name: 'Phone Plans', type: 'default', rows: [
      { plan: 'Value', commissions: {} }, { plan: 'Extra 2.0', commissions: {} },
      { plan: 'Premium 2.0', commissions: {} }, { plan: 'Senior', commissions: {} },
    ]},
    { name: 'Phone Plan Adders', type: 'default', rows: [
      { plan: 'Nextup', commissions: {} }, { plan: 'Insurance', commissions: {} },
    ]},
    { name: 'Fiber', type: 'internet', sectionDetails: '', rows: [
      { plan: '100 Mbps', standard: '', bundled: '', commissions: {} },
      { plan: '300 Mbps', standard: '', bundled: '', commissions: {} },
      { plan: '500 Mbps', standard: '', bundled: '', commissions: {} },
      { plan: '1 Gb', standard: '', bundled: '', commissions: {} },
      { plan: '2 Gb', standard: '', bundled: '', commissions: {} },
      { plan: '5 Gb', standard: '', bundled: '', commissions: {} },
    ]},
    { name: 'Fiber Riders', type: 'internet-riders', rows: [
      { plan: 'Extra Router', price: '', commissions: {} },
      { plan: 'Security Package', price: '', commissions: {} },
      { plan: 'Backup Service', price: '', commissions: {} },
    ]},
    { name: 'Fiber Discounts', type: 'internet-discounts', rows: [
      { plan: 'Autopay', price: '', commissions: {} },
      { plan: 'Low Income', price: '', commissions: {} },
    ]},
    { name: 'Coax', type: 'internet', sectionDetails: '', rows: [
      { plan: '100 Mbps', standard: '', bundled: '', commissions: {} },
      { plan: '300 Mbps', standard: '', bundled: '', commissions: {} },
      { plan: '500 Mbps', standard: '', bundled: '', commissions: {} },
      { plan: '1 Gb', standard: '', bundled: '', commissions: {} },
    ]},
    { name: 'Coax Riders', type: 'internet-riders', rows: [
      { plan: 'Extra Router', price: '', commissions: {} },
      { plan: 'Security Package', price: '', commissions: {} },
      { plan: 'Backup Service', price: '', commissions: {} },
    ]},
    { name: 'Coax Discounts', type: 'internet-discounts', rows: [
      { plan: 'Autopay', price: '', commissions: {} },
      { plan: 'Low Income', price: '', commissions: {} },
    ]},
    { name: '5G (Air)', type: 'internet', sectionDetails: '', rows: [
      { plan: '5G Home Internet', standard: '', bundled: '', commissions: {} },
    ]},
    { name: '5G Riders', type: 'internet-riders', rows: [
      { plan: 'Extra Router', price: '', commissions: {} },
    ]},
    { name: '5G Discounts', type: 'internet-discounts', rows: [
      { plan: 'Autopay', price: '', commissions: {} },
      { plan: 'Low Income', price: '', commissions: {} },
    ]},
    { name: 'Cable / TV', type: 'cable', sectionDetails: '', rows: [
      { plan: 'SELECT Package', price: '', commissions: {}, cableDetails: { channels_included: '' } },
      { plan: 'CHOICE Package', price: '', commissions: {}, cableDetails: { channels_included: '' } },
      { plan: 'PREMIER Package', price: '', commissions: {}, cableDetails: { channels_included: '' } },
    ]},
    { name: 'Cable Adders', type: 'cable-adders', rows: [
      { plan: 'Sports Pack', price: '', commissions: {} },
      { plan: 'HBO Max', price: '', commissions: {} },
      { plan: 'Showtime', price: '', commissions: {} },
      { plan: 'Starz', price: '', commissions: {} },
    ]},
    { name: 'Streaming', type: 'streaming', rows: [
      { plan: 'YouTube TV', price: '', commissions: {} }, { plan: 'Netflix', price: '', commissions: {} },
      { plan: 'Hulu', price: '', commissions: {} }, { plan: 'Prime', price: '', commissions: {} },
      { plan: 'HBO Max', price: '', commissions: {} }, { plan: 'Paramount', price: '', commissions: {} },
      { plan: 'Disney+', price: '', commissions: {} },
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

// ── PHONE PLAN DETAIL VIEW ────────────────────────────────
function PhonePlanDetailView({ plan, details, isAdmin, onBack, onChange }: {
  plan: string; details: PlanDetails; isAdmin: boolean
  onBack: () => void; onChange: (field: keyof PlanDetails, value: string) => void
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
                {isAdmin ? (
                  <input className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                    value={details[field.key]} placeholder="—" onChange={e => onChange(field.key, e.target.value)} />
                ) : (
                  <span className="text-xs text-gray-700 flex-1">{details[field.key] || '—'}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── INTERNET PLAN DETAIL VIEW ─────────────────────────────
function InternetPlanDetailView({ plan, details, isAdmin, onBack, onUpdate }: {
  plan: string; details: Partial<InternetPlanDetails>; isAdmin: boolean
  onBack: () => void; onUpdate: (field: keyof InternetPlanDetails, value: string) => void
}) {
  const basicFields: { key: keyof InternetPlanDetails; label: string }[] = [
    { key: 'contract_term', label: 'Contract Term' },
    { key: 'install_fee', label: 'Install / Activation Fee' },
    { key: 'equipment_fee', label: 'Equipment Fee' },
    { key: 'speed_range', label: 'Speed Range' },
    { key: 'data_cap', label: 'Data Cap' },
    { key: 'backup_power', label: 'Backup Power' },
  ]
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
        <h2 className="font-bold text-gray-800 text-base">{plan} — Plan Details</h2>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Plan Info</p>
        <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
          {basicFields.map(f => (
            <div key={f.key} className="flex items-center px-3 py-2 gap-3">
              <span className="text-xs text-gray-500 w-44 shrink-0">{f.label}</span>
              {isAdmin ? (
                <input className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                  value={details[f.key] ?? ''} placeholder="—" onChange={e => onUpdate(f.key, e.target.value)} />
              ) : (
                <span className="text-xs text-gray-700 flex-1">{details[f.key] || '—'}</span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Network Technology</p>
        {isAdmin ? (
          <textarea className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 resize-none"
            rows={4} value={details.network_description ?? ''} placeholder="Describe the network technology..."
            onChange={e => onUpdate('network_description', e.target.value)} />
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{details.network_description || '—'}</p>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Equipment</p>
        {isAdmin ? (
          <textarea className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 resize-none"
            rows={4} value={details.equipment_description ?? ''} placeholder="Describe the provided equipment..."
            onChange={e => onUpdate('equipment_description', e.target.value)} />
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{details.equipment_description || '—'}</p>
        )}
      </div>
    </div>
  )
}

// ── CABLE PLAN DETAIL VIEW ────────────────────────────────
function CablePlanDetailView({ plan, details, isAdmin, onBack, onUpdate }: {
  plan: string; details: Partial<CablePlanDetails>; isAdmin: boolean
  onBack: () => void; onUpdate: (value: string) => void
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
        <h2 className="font-bold text-gray-800 text-base">{plan} — Channels</h2>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Channels Included</p>
        {isAdmin ? (
          <textarea className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 resize-none"
            rows={10} value={details.channels_included ?? ''} placeholder="List the channels included in this package..."
            onChange={e => onUpdate(e.target.value)} />
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{details.channels_included || '—'}</p>
        )}
      </div>
    </div>
  )
}

// ── SECTION DETAIL VIEW ───────────────────────────────────
function SectionDetailView({ sectionName, description, isAdmin, onBack, onUpdate }: {
  sectionName: string; description: string; isAdmin: boolean
  onBack: () => void; onUpdate: (value: string) => void
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
        <h2 className="font-bold text-gray-800 text-base">{sectionName} — Overview</h2>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</p>
        {isAdmin ? (
          <textarea className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 resize-none"
            rows={8} value={description} placeholder={`Enter overview and key information about ${sectionName}...`}
            onChange={e => onUpdate(e.target.value)} />
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{description || 'No overview available.'}</p>
        )}
      </div>
    </div>
  )
}

// ── DETAIL PAGE STATE TYPE ────────────────────────────────
type ActiveDetail =
  | null
  | { kind: 'phone-plan'; plan: string }
  | { kind: 'internet-plan'; si: number; ri: number }
  | { kind: 'cable-plan'; si: number; ri: number }
  | { kind: 'section'; si: number }

// ── MAIN COMPONENT ────────────────────────────────────────
export default function PricingAndCommissions({ onBack }: { onBack: () => void }) {
  const [isAdmin, setIsAdmin] = useState(false)
  // Pricing state
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
  // Commission state
  const [commissionConfig, setCommissionConfig] = useState<CommissionConfig>(DEFAULT_COMMISSION)
  const [selectedRole, setSelectedRole] = useState('')
  const [newRole, setNewRole] = useState('')
  // Expandable section detail columns (per section name)
  const [expandedSectionDetails, setExpandedSectionDetails] = useState<Set<string>>(new Set())
  // Detail pages
  const [activeDetail, setActiveDetail] = useState<ActiveDetail>(null)
  // View toggles
  const [showPricing, setShowPricing] = useState(true)
  const [showCommissions, setShowCommissions] = useState(true)
  // Common
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLoadingRef = useRef(true)

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
        const cfg = data.commission_config
          ? migrateCommissionConfig(data.commission_config)
          : DEFAULT_COMMISSION
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

  // ── PRICING HELPERS ───────────────────────────────────────
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

  // ── COMMISSION HELPERS ────────────────────────────────────
  function setPhoneCommCell(plan: string, role: string, value: string) {
    setCommissionConfig(prev => ({
      ...prev,
      sections: prev.sections.map((s, si) => si !== 0 ? s : {
        ...s, rows: s.rows.map(r => r.plan === plan ? { ...r, commissions: { ...r.commissions, [role]: value } } : r),
      }),
    }))
  }
  function setRowField(si: number, ri: number, field: 'price' | 'standard' | 'bundled', value: string) {
    setCommissionConfig(prev => ({
      ...prev,
      sections: prev.sections.map((s, idx) => idx !== si ? s : {
        ...s, rows: s.rows.map((r, ridx) => ridx !== ri ? r : { ...r, [field]: value }),
      }),
    }))
  }
  function setCommCell(si: number, ri: number, role: string, value: string) {
    setCommissionConfig(prev => ({
      ...prev,
      sections: prev.sections.map((s, idx) => idx !== si ? s : {
        ...s, rows: s.rows.map((r, ridx) => ridx !== ri ? r : { ...r, commissions: { ...r.commissions, [role]: value } }),
      }),
    }))
  }
  function setRowPlanName(si: number, ri: number, value: string) {
    setCommissionConfig(prev => ({
      ...prev,
      sections: prev.sections.map((s, idx) => idx !== si ? s : {
        ...s, rows: s.rows.map((r, ridx) => ridx !== ri ? r : { ...r, plan: value }),
      }),
    }))
  }
  function addPlanRow(si: number) {
    setCommissionConfig(prev => ({
      ...prev,
      sections: prev.sections.map((s, idx) => idx !== si ? s : { ...s, rows: [...s.rows, { plan: '', commissions: {} }] }),
    }))
  }
  function removePlanRow(si: number, ri: number) {
    setCommissionConfig(prev => ({
      ...prev,
      sections: prev.sections.map((s, idx) => idx !== si ? s : { ...s, rows: s.rows.filter((_, ridx) => ridx !== ri) }),
    }))
  }
  function addRole() {
    const role = newRole.trim()
    if (!role || commissionConfig.roles.includes(role)) return
    setCommissionConfig(prev => ({ ...prev, roles: [...prev.roles, role] }))
    setNewRole('')
  }
  function removeRole(role: string) {
    setCommissionConfig(prev => ({
      ...prev,
      roles: prev.roles.filter(r => r !== role),
      sections: prev.sections.map(s => ({
        ...s, rows: s.rows.map(r => {
          const { [role]: _removed, ...rest } = r.commissions
          return { ...r, commissions: rest }
        }),
      })),
    }))
    if (selectedRole === role) setSelectedRole(commissionConfig.roles.find(r => r !== role) ?? '')
  }
  function updateInternetPlanDetail(si: number, ri: number, field: keyof InternetPlanDetails, value: string) {
    setCommissionConfig(prev => ({
      ...prev,
      sections: prev.sections.map((s, idx) => idx !== si ? s : {
        ...s, rows: s.rows.map((r, ridx) => ridx !== ri ? r : {
          ...r, internetDetails: { ...EMPTY_INTERNET_DETAILS, ...r.internetDetails, [field]: value },
        }),
      }),
    }))
  }
  function updateCablePlanDetail(si: number, ri: number, value: string) {
    setCommissionConfig(prev => ({
      ...prev,
      sections: prev.sections.map((s, idx) => idx !== si ? s : {
        ...s, rows: s.rows.map((r, ridx) => ridx !== ri ? r : { ...r, cableDetails: { channels_included: value } }),
      }),
    }))
  }
  function updateSectionDetails(si: number, value: string) {
    setCommissionConfig(prev => ({
      ...prev,
      sections: prev.sections.map((s, idx) => idx !== si ? s : { ...s, sectionDetails: value }),
    }))
  }

  // ── DETAIL PAGE ROUTING ───────────────────────────────────
  if (loading) return <div className="text-sm text-gray-400 p-4">Loading...</div>

  if (activeDetail?.kind === 'phone-plan') return (
    <PhonePlanDetailView
      plan={activeDetail.plan}
      details={planDetails[activeDetail.plan] || EMPTY_PLAN_DETAILS}
      isAdmin={isAdmin}
      onBack={() => setActiveDetail(null)}
      onChange={(field, value) => setPlanDetail(activeDetail.plan, field, value)}
    />
  )

  if (activeDetail?.kind === 'internet-plan') {
    const { si, ri } = activeDetail
    const row = commissionConfig.sections[si]?.rows[ri]
    return (
      <InternetPlanDetailView
        plan={row?.plan ?? ''}
        details={row?.internetDetails ?? {}}
        isAdmin={isAdmin}
        onBack={() => setActiveDetail(null)}
        onUpdate={(field, value) => updateInternetPlanDetail(si, ri, field, value)}
      />
    )
  }

  if (activeDetail?.kind === 'cable-plan') {
    const { si, ri } = activeDetail
    const row = commissionConfig.sections[si]?.rows[ri]
    return (
      <CablePlanDetailView
        plan={row?.plan ?? ''}
        details={row?.cableDetails ?? {}}
        isAdmin={isAdmin}
        onBack={() => setActiveDetail(null)}
        onUpdate={value => updateCablePlanDetail(si, ri, value)}
      />
    )
  }

  if (activeDetail?.kind === 'section') {
    const { si } = activeDetail
    const section = commissionConfig.sections[si]
    return (
      <SectionDetailView
        sectionName={section?.name ?? ''}
        description={section?.sectionDetails ?? ''}
        isAdmin={isAdmin}
        onBack={() => setActiveDetail(null)}
        onUpdate={value => updateSectionDetails(si, value)}
      />
    )
  }

  const phoneSection = commissionConfig.sections[0]
  const rs = detailsExpanded ? 2 : 1

  // ── RENDER HELPERS ────────────────────────────────────────

  function toggleSectionDetails(name: string) {
    setExpandedSectionDetails(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  function commCols(si: number, ri: number, row: CommissionRow) {
    return commissionConfig.roles.map(role => (
      <td key={role} className={`border border-gray-300 p-0 text-center transition-colors ${role === selectedRole ? 'bg-green-50' : 'bg-green-50/30'}`}>
        {isAdmin ? (
          <input
            className={`w-full text-xs text-center px-1 py-0.5 focus:outline-none bg-transparent ${role === selectedRole ? 'focus:bg-green-100' : 'focus:bg-green-50'}`}
            value={row.commissions[role] ?? ''} placeholder="—"
            onChange={e => setCommCell(si, ri, role, e.target.value)}
          />
        ) : (
          <span className={`block px-1 py-0.5 ${role === selectedRole ? 'font-semibold text-green-700' : 'text-green-800'}`}>
            {row.commissions[role] || '—'}
          </span>
        )}
      </td>
    ))
  }

  function commHeaderCols() {
    return commissionConfig.roles.map(role => (
      <th key={role} className={`border border-gray-300 px-1 py-1 font-semibold text-center whitespace-nowrap w-16 transition-colors ${role === selectedRole ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700'}`}>
        {role}
      </th>
    ))
  }

  // Renders a generic section (adders, streaming, internet riders, internet discounts)
  function renderGenericSection(section: CommissionSection, si: number) {
    const isDiscounts = section.type === 'internet-discounts'
    return (
      <div key={si}>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{section.name}</p>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="text-xs w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-1 py-1.5 text-left font-semibold text-gray-500 whitespace-nowrap w-20">
                  {isDiscounts ? 'Discount' : 'Plan'}
                </th>
                {showPricing && <th className="border border-gray-200 px-3 py-2 font-semibold text-center whitespace-nowrap min-w-[70px] bg-blue-50 text-blue-700">
                  {isDiscounts ? 'Amount' : 'Price'}
                </th>}
                {showPricing && showCommissions && !isDiscounts && <th className="bg-gray-300 w-0.5 p-0 border-0" />}
                {showCommissions && !isDiscounts && commHeaderCols()}
                {isAdmin && !isDiscounts && <th className="border border-gray-200 w-7" />}
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row, ri) => (
                <tr key={ri} className="bg-white hover:bg-gray-50">
                  <td className="border border-gray-200 px-1 py-0.5 text-center">
                    {isAdmin && !isDiscounts ? (
                      <input className="w-full text-xs text-center px-1 py-0.5 focus:outline-none focus:bg-blue-50 bg-transparent"
                        value={row.plan} placeholder="Plan name..." onChange={e => setRowPlanName(si, ri, e.target.value)} />
                    ) : (
                      <span className="font-medium text-gray-700">{row.plan}</span>
                    )}
                  </td>
                  {showPricing && (
                    <td className="border border-gray-200 p-0 text-center bg-blue-50/40">
                      {isAdmin ? (
                        <input className="w-full text-xs text-center px-1 py-0.5 focus:outline-none focus:bg-blue-100 bg-transparent"
                          value={row.price ?? ''} placeholder="—" onChange={e => setRowField(si, ri, 'price', e.target.value)} />
                      ) : (
                        <span className="block px-1 py-0.5 text-blue-800">{row.price || '—'}</span>
                      )}
                    </td>
                  )}
                  {showPricing && showCommissions && !isDiscounts && <td className="bg-gray-200 w-0.5 p-0 border-0" />}
                  {showCommissions && !isDiscounts && commCols(si, ri, row)}
                  {isAdmin && !isDiscounts && (
                    <td className="border border-gray-200 px-1 text-center">
                      <button onClick={() => removePlanRow(si, ri)} className="text-gray-300 hover:text-red-400">✕</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isAdmin && !isDiscounts && (
          <button onClick={() => addPlanRow(si)} className="mt-1 w-full text-xs text-blue-600 py-1.5 hover:bg-blue-50 rounded border border-dashed border-blue-200 text-center">
            + Add Plan
          </button>
        )}
      </div>
    )
  }

  // Renders one internet type (Fiber/Coax/5G) as a single connected block with plans, riders, discounts
  function renderInternetGroupBlock(group: { plan: string; riders: string; discounts: string }) {
    const planSec = commissionConfig.sections.find(s => s.name === group.plan)
    const planIdx = commissionConfig.sections.findIndex(s => s.name === group.plan)
    const ridersSec = commissionConfig.sections.find(s => s.name === group.riders)
    const ridersIdx = commissionConfig.sections.findIndex(s => s.name === group.riders)
    const discSec = commissionConfig.sections.find(s => s.name === group.discounts)
    const discIdx = commissionConfig.sections.findIndex(s => s.name === group.discounts)
    if (!planSec) return null
    const detailExpanded = expandedSectionDetails.has(group.plan)

    return (
      <div key={group.plan} className="rounded-lg border border-gray-200 overflow-hidden">
        {/* Section header with overview link */}
        <div className="bg-gray-50 border-b border-gray-200 px-3 py-1.5 flex items-center gap-2">
          <button onClick={() => setActiveDetail({ kind: 'section', si: planIdx })}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 uppercase tracking-wide">
            {group.plan}
          </button>
          {planSec.sectionDetails && (
            <span className="text-[10px] text-gray-400 italic truncate">{planSec.sectionDetails.slice(0, 50)}{planSec.sectionDetails.length > 50 ? '…' : ''}</span>
          )}
        </div>

        {/* Plans table */}
        <div className="overflow-x-auto">
          <table className="text-xs w-full border-collapse">
            <thead>
              <tr className="bg-white">
                <th className="border border-gray-200 px-1 py-1.5 text-left font-semibold text-gray-500 whitespace-nowrap w-20">Plan</th>
                {showPricing && <>
                  <th className="border border-gray-200 px-1 py-1.5 font-semibold text-center whitespace-nowrap w-16 bg-blue-50 text-blue-700">Standard</th>
                  <th className="border border-gray-200 px-1 py-1.5 font-semibold text-center whitespace-nowrap w-16 bg-blue-50 text-blue-700">Bundled</th>
                  <th className="border border-gray-200 px-1 py-1.5 font-semibold text-blue-700 text-center w-14 bg-blue-50 cursor-pointer hover:bg-blue-100 select-none"
                    onClick={() => toggleSectionDetails(group.plan)}>
                    Details {detailExpanded ? '▼' : '▶'}
                  </th>
                  {detailExpanded && INTERNET_INLINE_FIELDS.map(f => (
                    <th key={f.key} className="border border-gray-200 px-1 py-1 text-[10px] font-semibold text-blue-600 text-center bg-blue-50/50 whitespace-nowrap w-14">{f.label}</th>
                  ))}
                </>}
                {showPricing && showCommissions && <th className="bg-gray-300 w-0.5 p-0 border-0" />}
                {showCommissions && commHeaderCols()}
                {isAdmin && <th className="border border-gray-200 w-6" />}
              </tr>
            </thead>
            <tbody>
              {planSec.rows.map((row, ri) => (
                <tr key={ri} className="bg-white hover:bg-gray-50">
                  <td className="border border-gray-200 px-1 py-0.5 font-medium text-blue-600 hover:text-blue-800 cursor-pointer whitespace-nowrap w-20"
                    onClick={() => setActiveDetail({ kind: 'internet-plan', si: planIdx, ri })}>{row.plan}</td>
                  {showPricing && <>
                    <td className="border border-gray-200 p-0 text-center bg-blue-50/40 w-16">
                      {isAdmin ? <input className="w-full text-xs text-center px-1 py-0.5 focus:outline-none focus:bg-blue-100 bg-transparent"
                        value={row.standard ?? ''} placeholder="—" onChange={e => setRowField(planIdx, ri, 'standard', e.target.value)} />
                      : <span className="block px-1 py-0.5 text-blue-800">{row.standard || '—'}</span>}
                    </td>
                    <td className="border border-gray-200 p-0 text-center bg-blue-50/40 w-16">
                      {isAdmin ? <input className="w-full text-xs text-center px-1 py-0.5 focus:outline-none focus:bg-blue-100 bg-transparent"
                        value={row.bundled ?? ''} placeholder="—" onChange={e => setRowField(planIdx, ri, 'bundled', e.target.value)} />
                      : <span className="block px-1 py-0.5 text-blue-800">{row.bundled || '—'}</span>}
                    </td>
                    <td className="border border-gray-200 px-1 py-0.5 text-center text-xs text-gray-300 bg-blue-50/20 w-14">—</td>
                    {detailExpanded && INTERNET_INLINE_FIELDS.map(f => (
                      <td key={f.key} className="border border-gray-200 p-0 text-center bg-blue-50/30 w-14">
                        {isAdmin ? <input className="w-full text-xs text-center px-1 py-0.5 focus:outline-none focus:bg-blue-100 bg-transparent"
                          value={row.internetDetails?.[f.key] ?? ''} placeholder="—"
                          onChange={e => updateInternetPlanDetail(planIdx, ri, f.key, e.target.value)} />
                        : <span className="block px-1 py-0.5 text-blue-800">{row.internetDetails?.[f.key] || '—'}</span>}
                      </td>
                    ))}
                  </>}
                  {showPricing && showCommissions && <td className="bg-gray-200 w-0.5 p-0 border-0" />}
                  {showCommissions && commCols(planIdx, ri, row)}
                  {isAdmin && <td className="border border-gray-200 px-1 text-center">
                    <button onClick={() => removePlanRow(planIdx, ri)} className="text-gray-300 hover:text-red-400">✕</button>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isAdmin && (
          <button onClick={() => addPlanRow(planIdx)} className="w-full text-xs text-blue-500 py-1 hover:bg-blue-50 border-t border-dashed border-blue-100 text-center">+ Add Plan</button>
        )}

        {/* Riders sub-section — touches plans above */}
        {ridersSec && (showPricing || showCommissions) && (
          <>
            <div className="border-t border-gray-200 bg-gray-50 px-3 py-1">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Riders</span>
            </div>
            <div className="overflow-x-auto">
              <table className="text-xs w-full border-collapse">
                <tbody>
                  {ridersSec.rows.map((row, ri) => (
                    <tr key={ri} className="bg-white hover:bg-gray-50">
                      <td className="border border-gray-200 px-1 py-0.5 font-medium text-gray-600 whitespace-nowrap w-20">
                        {isAdmin ? <input className="w-full text-xs px-1 py-0.5 focus:outline-none bg-transparent"
                          value={row.plan} placeholder="Rider name…" onChange={e => setRowPlanName(ridersIdx, ri, e.target.value)} />
                        : row.plan}
                      </td>
                      {showPricing && <>
                        <td className="border border-gray-200 p-0 text-center bg-blue-50/40 w-16">
                          {isAdmin ? <input className="w-full text-xs text-center px-1 py-0.5 focus:outline-none focus:bg-blue-100 bg-transparent"
                            value={row.price ?? ''} placeholder="—" onChange={e => setRowField(ridersIdx, ri, 'price', e.target.value)} />
                          : <span className="block px-1 py-0.5 text-blue-800">{row.price || '—'}</span>}
                        </td>
                        <td className="border border-gray-200 w-16 bg-blue-50/10" />
                        <td className="border border-gray-200 w-14 bg-blue-50/10" />
                      </>}
                      {showPricing && showCommissions && <td className="bg-gray-200 w-0.5 p-0 border-0" />}
                      {showCommissions && commCols(ridersIdx, ri, row)}
                      {isAdmin && <td className="border border-gray-200 px-1 text-center">
                        <button onClick={() => removePlanRow(ridersIdx, ri)} className="text-gray-300 hover:text-red-400">✕</button>
                      </td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {isAdmin && (
              <button onClick={() => addPlanRow(ridersIdx)} className="w-full text-xs text-blue-500 py-1 hover:bg-blue-50 border-t border-dashed border-blue-100 text-center">+ Add Rider</button>
            )}
          </>
        )}

        {/* Discounts sub-section — touches riders above */}
        {discSec && showPricing && (
          <>
            <div className="border-t border-gray-200 bg-gray-50 px-3 py-1">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Discounts</span>
            </div>
            <div className="overflow-x-auto">
              <table className="text-xs w-full border-collapse">
                <tbody>
                  {discSec.rows.map((row, ri) => (
                    <tr key={ri} className="bg-white hover:bg-gray-50">
                      <td className="border border-gray-200 px-1 py-0.5 font-medium text-gray-600 whitespace-nowrap w-20">{row.plan}</td>
                      <td className="border border-gray-200 p-0 text-center bg-blue-50/40 w-16">
                        {isAdmin ? <input className="w-full text-xs text-center px-1 py-0.5 focus:outline-none focus:bg-blue-100 bg-transparent"
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
      </div>
    )
  }

  // Renders the cable section with 3 plans + expandable channels column
  function renderCableSection(section: CommissionSection, si: number) {
    const detailExpanded = expandedSectionDetails.has(section.name)
    const isCableAdders = section.type === 'cable-adders'
    return (
      <div key={si}>
        <div className="flex items-center gap-2 mb-2">
          {!isCableAdders ? (
            <button
              onClick={() => setActiveDetail({ kind: 'section', si })}
              className="text-xs font-semibold text-purple-600 hover:text-purple-800 uppercase tracking-wide underline-offset-2 hover:underline"
            >{section.name}</button>
          ) : (
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{section.name}</p>
          )}
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="text-xs w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-1 py-1.5 text-left font-semibold text-gray-500 whitespace-nowrap w-20">Plan</th>
                {showPricing && <>
                  <th className="border border-gray-200 px-2 py-2 font-semibold text-center whitespace-nowrap min-w-[70px] bg-blue-50 text-blue-700">Price</th>
                  {!isCableAdders && (
                    <th
                      className="border border-gray-200 px-2 py-2 font-semibold text-blue-700 text-center whitespace-nowrap w-14 bg-blue-50 cursor-pointer hover:bg-blue-100 select-none"
                      onClick={() => toggleSectionDetails(section.name)}
                    >Details {detailExpanded ? '▼' : '▶'}</th>
                  )}
                  {!isCableAdders && detailExpanded && (
                    <th className="border border-gray-200 px-1 py-1 text-[10px] font-semibold text-blue-600 text-center bg-blue-50/50 whitespace-nowrap min-w-[100px]">Channels</th>
                  )}
                </>}
                {showPricing && showCommissions && <th className="bg-gray-300 w-0.5 p-0 border-0" />}
                {showCommissions && commHeaderCols()}
                {isAdmin && <th className="border border-gray-200 w-7" />}
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row, ri) => (
                <tr key={ri} className="bg-white hover:bg-gray-50">
                  <td className={`border border-gray-200 px-1 py-0.5 whitespace-nowrap text-center ${!isCableAdders ? 'font-medium text-purple-600 hover:text-purple-800 cursor-pointer' : 'font-medium text-gray-700'}`}
                    onClick={!isCableAdders ? () => setActiveDetail({ kind: 'cable-plan', si, ri }) : undefined}>{row.plan}</td>
                  {showPricing && <>
                    <td className="border border-gray-200 p-0 text-center bg-blue-50/40">
                      {isAdmin ? (
                        <input className="w-full text-xs text-center px-1 py-0.5 focus:outline-none focus:bg-blue-100 bg-transparent"
                          value={row.price ?? ''} placeholder="—" onChange={e => setRowField(si, ri, 'price', e.target.value)} />
                      ) : <span className="block px-1 py-0.5 text-blue-800">{row.price || '—'}</span>}
                    </td>
                    {!isCableAdders && <td className="border border-gray-200 px-1 py-0.5 text-center text-xs text-gray-300 bg-blue-50/20">—</td>}
                    {!isCableAdders && detailExpanded && (
                      <td className="border border-gray-200 p-0 text-center bg-blue-50/30">
                        {isAdmin ? (
                          <input className="w-full text-xs text-center px-1 py-0.5 focus:outline-none focus:bg-blue-100 bg-transparent min-w-[100px]"
                            value={row.cableDetails?.channels_included ?? ''} placeholder="e.g. 150+ channels"
                            onChange={e => updateCablePlanDetail(si, ri, e.target.value)} />
                        ) : <span className="block px-1 py-0.5 text-blue-800 min-w-[100px] truncate">{row.cableDetails?.channels_included || '—'}</span>}
                      </td>
                    )}
                  </>}
                  {showPricing && showCommissions && <td className="bg-gray-200 w-0.5 p-0 border-0" />}
                  {showCommissions && commCols(si, ri, row)}
                  {isAdmin && (
                    <td className="border border-gray-200 px-1 text-center">
                      <button onClick={() => removePlanRow(si, ri)} className="text-gray-300 hover:text-red-400">✕</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isAdmin && (
          <button onClick={() => addPlanRow(si)} className="mt-1 w-full text-xs text-blue-600 py-1.5 hover:bg-blue-50 rounded border border-dashed border-blue-200 text-center">
            + Add Plan
          </button>
        )}
      </div>
    )
  }

  const internetSections = commissionConfig.sections
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => INTERNET_SECTION_NAMES.has(s.name))

  const tvSections = commissionConfig.sections
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => TV_SECTION_NAMES.has(s.name))

  // ── MAIN RENDER ───────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
        <h2 className="font-bold text-gray-800 text-base">Pricing & Commissions</h2>
        <span className="ml-auto text-xs">
          {saving ? <span className="text-gray-400">Saving…</span>
            : saveError ? <span className="text-red-500" title={saveError}>⚠ Save failed</span>
            : saved ? <span className="text-green-600">✓ Saved</span>
            : !isAdmin ? <span className="text-gray-400">View only</span>
            : null}
        </span>
      </div>

      {/* View toggles */}
      <div className="flex items-center gap-5 bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-200">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={showPricing} onChange={e => setShowPricing(e.target.checked)} className="w-4 h-4 accent-blue-600 cursor-pointer" />
          <span className="text-sm font-semibold text-blue-700">Pricing</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={showCommissions} onChange={e => setShowCommissions(e.target.checked)} className="w-4 h-4 accent-green-600 cursor-pointer" />
          <span className="text-sm font-semibold text-green-700">Commissions</span>
        </label>
      </div>

      {/* Role selector */}
      {showCommissions && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide shrink-0">Your Role</label>
          <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}
            className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-green-400">
            {commissionConfig.roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      )}

      {/* Admin: manage roles */}
      {isAdmin && showCommissions && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Roles</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {commissionConfig.roles.map(r => (
              <span key={r} className="flex items-center gap-1 text-xs bg-green-50 border border-green-200 text-green-700 rounded-full px-2.5 py-1">
                {r}
                <button onClick={() => removeRole(r)} className="text-green-300 hover:text-red-400 ml-1 leading-none">✕</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-green-400"
              placeholder="Add role..." value={newRole} onChange={e => setNewRole(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRole()} />
            <button onClick={addRole} className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Add</button>
          </div>
        </div>
      )}

      {/* ── PHONE PLANS ── */}
      {(showPricing || showCommissions) && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Monthly Plan Pricing & Commissions</p>
          <div className="overflow-x-auto">
            <table className="text-xs w-full min-w-max border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th rowSpan={rs} className="border border-gray-300 px-1 py-1 text-left font-semibold text-gray-600 whitespace-nowrap w-24">Plan</th>
                  {showPricing && LINE_COUNTS.map(n => (
                    <th rowSpan={rs} key={n} className="border border-gray-300 px-1 py-1 font-semibold text-blue-700 text-center whitespace-nowrap w-11 bg-blue-50">L{n}</th>
                  ))}
                  {showPricing && (
                    <th rowSpan={rs} className="border border-gray-300 px-1 py-1 font-semibold text-blue-700 text-center whitespace-nowrap w-14 bg-blue-50 cursor-pointer hover:bg-blue-100 select-none"
                      onClick={() => setDetailsExpanded(x => !x)}>
                      Details {detailsExpanded ? '▼' : '▶'}
                    </th>
                  )}
                  {showPricing && detailsExpanded && PLAN_DETAIL_SECTIONS.map(s => (
                    <th key={s.label} colSpan={s.fields.length} className="border border-gray-300 px-1 py-0.5 text-[10px] font-semibold text-blue-600 uppercase tracking-wide text-center bg-blue-50/50 whitespace-nowrap">
                      {s.label}
                    </th>
                  ))}
                  {showPricing && showCommissions && <th rowSpan={rs} className="bg-gray-300 w-0.5 p-0 border-0" />}
                  {showCommissions && commissionConfig.roles.map(role => (
                    <th rowSpan={rs} key={role} className={`border border-gray-300 px-1 py-1 font-semibold text-center whitespace-nowrap w-16 transition-colors ${role === selectedRole ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700'}`}>
                      {role}
                    </th>
                  ))}
                </tr>
                {showPricing && detailsExpanded && (
                  <tr className="bg-blue-50/30">
                    {PLAN_DETAIL_SECTIONS.flatMap(s => s.fields).map(f => (
                      <th key={f.key} className="border border-gray-300 px-1 py-0.5 text-[9px] font-medium text-blue-600 text-center whitespace-nowrap max-w-[72px]">
                        {f.label}
                      </th>
                    ))}
                  </tr>
                )}
              </thead>
              <tbody>
                {PLAN_NAMES.map(plan => {
                  const commRow = phoneSection?.rows.find(r => r.plan === plan)
                  return (
                    <tr key={plan} className="bg-white hover:bg-gray-50/80">
                      <td className="border border-gray-300 px-1 py-0.5 font-medium text-blue-600 hover:text-blue-800 cursor-pointer whitespace-nowrap"
                        onClick={() => setActiveDetail({ kind: 'phone-plan', plan })}>{plan}</td>
                      {showPricing && LINE_COUNTS.map(n => (
                        <td key={n} className="border border-gray-300 p-0 text-center bg-blue-50/40">
                          {isAdmin ? (
                            <input className="w-full text-xs text-center px-1 py-0.5 focus:outline-none focus:bg-blue-100 bg-transparent"
                              value={grid[plan]?.[n] ?? ''} placeholder="—" onChange={e => setPricingCell(plan, n, e.target.value)} />
                          ) : <span className="block px-1 py-0.5 text-blue-800">{grid[plan]?.[n] || '—'}</span>}
                        </td>
                      ))}
                      {showPricing && <td className="border border-gray-300 px-1 py-0.5 text-center text-xs text-gray-300 bg-blue-50/20">—</td>}
                      {showPricing && detailsExpanded && PLAN_DETAIL_SECTIONS.flatMap(s => s.fields).map(f => (
                        <td key={f.key} className="border border-gray-300 p-0 text-center bg-blue-50/30">
                          {isAdmin ? (
                            <input className="w-full text-xs text-center px-1 py-0.5 focus:outline-none focus:bg-blue-100 bg-transparent min-w-[60px]"
                              value={planDetails[plan]?.[f.key] ?? ''} placeholder="—" onChange={e => setPlanDetail(plan, f.key, e.target.value)} />
                          ) : <span className="block px-1 py-0.5 text-blue-800 min-w-[60px]">{planDetails[plan]?.[f.key] || '—'}</span>}
                        </td>
                      ))}
                      {showPricing && showCommissions && <td className="bg-gray-200 w-0.5 p-0 border-0" />}
                      {showCommissions && commissionConfig.roles.map(role => (
                        <td key={role} className={`border border-gray-300 p-0 text-center transition-colors ${role === selectedRole ? 'bg-green-50' : 'bg-green-50/30'}`}>
                          {isAdmin ? (
                            <input className={`w-full text-xs text-center px-1 py-0.5 focus:outline-none bg-transparent ${role === selectedRole ? 'focus:bg-green-100' : 'focus:bg-green-50'}`}
                              value={commRow?.commissions[role] ?? ''} placeholder="—" onChange={e => setPhoneCommCell(plan, role, e.target.value)} />
                          ) : (
                            <span className={`block px-1 py-0.5 ${role === selectedRole ? 'font-semibold text-green-700' : 'text-green-800'}`}>
                              {commRow?.commissions[role] || '—'}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Phone Plan Adders */}
      {(showPricing || showCommissions) && (() => {
        const adderSec = commissionConfig.sections.find(s => s.name === 'Phone Plan Adders')
        const adderIdx = commissionConfig.sections.findIndex(s => s.name === 'Phone Plan Adders')
        if (!adderSec) return null
        return renderGenericSection(adderSec, adderIdx)
      })()}

      {/* ── INTERNET GROUP ── */}
      {(showPricing || showCommissions) && internetSections.length > 0 && (
        <div className="rounded-xl border-2 border-blue-200 overflow-hidden">
          <div className="bg-blue-600 px-4 py-2">
            <span className="text-white font-bold text-sm tracking-wide">INTERNET</span>
          </div>
          <div className="p-3 space-y-3">
            {INTERNET_GROUPS.map(group => renderInternetGroupBlock(group))}
          </div>
        </div>
      )}

      {/* ── TV GROUP ── */}
      {(showPricing || showCommissions) && tvSections.length > 0 && (
        <div className="rounded-xl border-2 border-purple-200 overflow-hidden">
          <div className="bg-purple-600 px-4 py-2">
            <span className="text-white font-bold text-sm tracking-wide">TV</span>
          </div>
          <div className="p-3 space-y-4">
            {tvSections.map(({ s, i }) => {
              if (s.type === 'cable' || s.type === 'cable-adders') return renderCableSection(s, i)
              return renderGenericSection(s, i)
            })}
          </div>
        </div>
      )}

      {/* ── PRICING-ONLY SECTIONS ── */}
      {showPricing && (
        <>
          <div>
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Occupational Discounts</p>
            <div className="rounded-lg border border-blue-100 divide-y divide-blue-50">
              {discounts.map((d, i) => {
                const isExpanded = expandedDiscount === i
                const toggle = () => setExpandedDiscount(isExpanded ? null : i)
                if (d.label === 'Company (FAN)') return (
                  <div key={i} className="bg-blue-50/20">
                    <div className="flex items-center px-3 py-2 gap-3 cursor-pointer hover:bg-blue-50/50" onClick={toggle}>
                      <span className="text-xs text-gray-600 shrink-0">Company (FAN)</span>
                      <div className="flex items-center gap-2 ml-auto" onClick={e => e.stopPropagation()}>
                        <input className="w-28 text-xs border border-blue-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                          value={companySearch} placeholder="Search company..."
                          onChange={e => {
                            const val = e.target.value; setCompanySearch(val)
                            const match = companyDiscounts.find(c => c.company.toLowerCase() === val.toLowerCase())
                            setDiscount(i, match?.discount ?? '')
                          }}
                          onClick={() => setShowCompanyDb(true)} />
                        {d.value && <span className="text-xs font-semibold text-white bg-blue-600 rounded px-2 py-0.5 shrink-0">{d.value}</span>}
                      </div>
                      <span className="text-gray-300 text-[10px]">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                    {isExpanded && (
                      <div className="px-3 pb-2 pt-1 bg-blue-50/30 border-t border-blue-100">
                        {isAdmin ? <textarea className="w-full text-xs border border-blue-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400 resize-none"
                          rows={2} value={d.notes ?? ''} placeholder="Special features or notes..." onChange={e => setDiscountNotes(i, e.target.value)} />
                          : d.notes ? <p className="text-xs text-gray-500 italic">{d.notes}</p> : null}
                      </div>
                    )}
                  </div>
                )
                return (
                  <div key={i} className="bg-blue-50/20">
                    <div className="flex items-center justify-between px-3 py-2 gap-3 cursor-pointer hover:bg-blue-50/50" onClick={toggle}>
                      <span className="text-xs text-gray-600">{d.label}</span>
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        {isAdmin ? (
                          <input className="w-28 text-xs text-right border border-blue-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                            value={d.value} placeholder="e.g. 25% off" onChange={e => setDiscount(i, e.target.value)} />
                        ) : d.value ? (
                          <span className="text-xs font-semibold text-white bg-blue-600 rounded px-2 py-0.5">{d.value}</span>
                        ) : <span className="text-xs text-gray-300">—</span>}
                        <span className="text-gray-300 text-[10px]">{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-3 pb-2 pt-1 bg-blue-50/30 border-t border-blue-100">
                        {isAdmin ? <textarea className="w-full text-xs border border-blue-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400 resize-none"
                          rows={2} value={d.notes ?? ''} placeholder="Special features or notes..." onChange={e => setDiscountNotes(i, e.target.value)} />
                          : d.notes ? <p className="text-xs text-gray-500 italic">{d.notes}</p> : null}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Agent Applied Discounts</p>
            <div className="rounded-lg border border-blue-100 divide-y divide-blue-50 bg-blue-50/20">
              {agentDiscounts.map((d, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2">
                  <input className="flex-1 min-w-0 text-xs border border-blue-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                    value={d.label} placeholder="Discount name..." onChange={e => setAgentDiscount(i, 'label', e.target.value)} />
                  <input className="w-24 text-xs text-right border border-blue-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                    value={d.value} placeholder="Amount..." onChange={e => setAgentDiscount(i, 'value', e.target.value)} />
                  <button onClick={() => setAgentDiscounts(prev => prev.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400 text-xs shrink-0">✕</button>
                </div>
              ))}
              <button onClick={() => setAgentDiscounts(prev => [...prev, { label: '', value: '' }])}
                className="w-full text-xs text-blue-600 py-2 hover:bg-blue-50 text-center">+ Add Discount</button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Retail Agent Benefits</p>
            <div className="overflow-x-auto rounded-lg border border-blue-100">
              <table className="text-xs w-full border-collapse">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-blue-200 w-6 px-1"></th>
                    <th className="border border-blue-200 px-2 py-1.5 text-left font-semibold text-blue-700">Agent</th>
                    <th className="border border-blue-200 px-2 py-1.5 text-left font-semibold text-blue-700">Benefit</th>
                    <th className="border border-blue-200 px-2 py-1.5 text-left font-semibold text-blue-700">Discount</th>
                    <th className="border border-blue-200 px-2 py-1.5 text-left font-semibold text-blue-700">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {['Best Buy', 'Costco'].map(agentGroup =>
                    RETAIL_AGENT_BENEFITS.filter(b => b.agent === agentGroup).map((b, i, arr) => {
                      const key = `${b.agent}|${b.benefit}`
                      const checked = checkedBenefits.has(key)
                      return (
                        <tr key={key} className={`cursor-pointer transition-colors ${checked ? 'bg-blue-100' : 'hover:bg-blue-50/50'}`}
                          onClick={() => setCheckedBenefits(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next })}>
                          <td className="border border-blue-200 px-1 text-center">
                            <input type="checkbox" readOnly checked={checked} className="accent-blue-600 cursor-pointer" />
                          </td>
                          {i === 0 ? <td rowSpan={arr.length} className="border border-blue-200 px-2 py-1 font-semibold text-gray-700 align-middle">{agentGroup}</td> : null}
                          <td className="border border-blue-200 px-2 py-1 text-gray-700">{b.benefit}</td>
                          <td className="border border-blue-200 px-2 py-1 text-blue-700 font-medium">{b.discount}</td>
                          <td className="border border-blue-200 px-2 py-1 text-gray-500">{b.duration}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Company DB Modal */}
      {showCompanyDb && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCompanyDb(false)}>
          <div className="bg-white rounded-xl shadow-xl w-80 max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <span className="font-semibold text-sm text-gray-800">Company Discounts (FAN)</span>
              <button onClick={() => setShowCompanyDb(false)} className="text-gray-400 hover:text-gray-600 text-base leading-none">✕</button>
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
                      {isAdmin && (
                        <td className="border border-gray-200 px-1 text-center"
                          onClick={e => { e.stopPropagation(); setCompanyDiscounts(prev => prev.filter((_, j) => j !== i)) }}>
                          <button className="text-gray-300 hover:text-red-400">✕</button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {isAdmin && (
                    <tr>
                      <td className="border border-gray-200 p-0">
                        <input className="w-full px-2 py-1 text-xs focus:outline-none focus:bg-blue-50"
                          placeholder="Company name..." value={newCompany.company}
                          onChange={e => setNewCompany(prev => ({ ...prev, company: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && addCompany()} />
                      </td>
                      <td className="border border-gray-200 p-0">
                        <input className="w-full px-2 py-1 text-xs focus:outline-none focus:bg-blue-50"
                          placeholder="e.g. 18%" value={newCompany.discount}
                          onChange={e => setNewCompany(prev => ({ ...prev, discount: e.target.value }))}
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
