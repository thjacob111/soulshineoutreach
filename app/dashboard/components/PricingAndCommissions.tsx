'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const ADMIN_EMAIL = 'thjacob111@gmail.com'
const PLAN_NAMES = ['Value', 'Extra 2.0', 'Premium 2.0', 'Senior']
const LINE_COUNTS = [1, 2, 3, 4, 5]
const FIRSTNET_NOTE = 'Includes FirstNet access — a satellite-backed priority network that gives first responders dedicated cell coverage even during emergencies and network congestion.'

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
  call_text_cell_tower_priority: '',
  call_text_calling_limit: '',
  call_text_texting_limit: '',
  data_limit: '',
  data_speed: '',
  hotspot_limit: '',
  hotspot_speed: '',
  intl_calling_limit: '',
  intl_coverage_map: '',
  intl_data_roaming_limit: '',
  intl_data_roaming_speed: '',
  ld_places: '',
  ld_calling_limit: '',
}

const PLAN_DETAIL_SECTIONS: { label: string; fields: { key: keyof PlanDetails; label: string }[] }[] = [
  {
    label: 'CALL & TEXT',
    fields: [
      { key: 'call_text_cell_tower_priority', label: 'Cell Tower Priority' },
      { key: 'call_text_calling_limit', label: 'Calling Limit' },
      { key: 'call_text_texting_limit', label: 'Texting Limit' },
    ],
  },
  {
    label: 'DATA',
    fields: [
      { key: 'data_limit', label: 'Data Limit' },
      { key: 'data_speed', label: 'Data Speed' },
    ],
  },
  {
    label: 'HOTSPOT',
    fields: [
      { key: 'hotspot_limit', label: 'Hotspot Limit' },
      { key: 'hotspot_speed', label: 'Hotspot Speed' },
    ],
  },
  {
    label: 'INTERNATIONAL',
    fields: [
      { key: 'intl_calling_limit', label: 'International Calling Limit' },
      { key: 'intl_coverage_map', label: 'International Coverage Map' },
      { key: 'intl_data_roaming_limit', label: 'International Data Roaming Limit' },
      { key: 'intl_data_roaming_speed', label: 'International Data Roaming Speed' },
    ],
  },
  {
    label: 'LONG DISTANCE',
    fields: [
      { key: 'ld_places', label: 'Long Distance Calling Place(s)' },
      { key: 'ld_calling_limit', label: 'Long Distance Calling Limit' },
    ],
  },
]

interface CommissionRow { plan: string; price?: string; commissions: Record<string, string> }
interface CommissionSection { name: string; rows: CommissionRow[] }
interface CommissionConfig { roles: string[]; sections: CommissionSection[] }

const DEFAULT_COMMISSION: CommissionConfig = {
  roles: ['Overall', 'Soul Shine', 'Agent', 'Rep'],
  sections: [
    {
      name: 'Phone Plans',
      rows: [
        { plan: 'Value', commissions: {} },
        { plan: 'Extra 2.0', commissions: {} },
        { plan: 'Premium 2.0', commissions: {} },
        { plan: 'Senior', commissions: {} },
      ],
    },
    {
      name: 'Phone Plan Adders',
      rows: [
        { plan: 'Nextup', commissions: {} },
        { plan: 'Insurance', commissions: {} },
      ],
    },
    {
      name: 'Fiber',
      rows: [
        { plan: '100 Mbps', commissions: {} },
        { plan: '300 Mbps', commissions: {} },
        { plan: '500 Mbps', commissions: {} },
        { plan: '1 Gb', commissions: {} },
        { plan: '2 Gb', commissions: {} },
        { plan: '5 Gb', commissions: {} },
      ],
    },
    {
      name: 'Coax',
      rows: [
        { plan: '100 Mbps', commissions: {} },
        { plan: '300 Mbps', commissions: {} },
        { plan: '500 Mbps', commissions: {} },
        { plan: '1 Gb', commissions: {} },
      ],
    },
    {
      name: '5G (Air)',
      rows: [{ plan: '5G Home Internet', commissions: {} }],
    },
    {
      name: 'Internet Riders',
      rows: [
        { plan: 'Extra Router', commissions: {} },
        { plan: 'Security Package', commissions: {} },
        { plan: 'Backup Service', commissions: {} },
      ],
    },
    {
      name: 'Cable / TV',
      rows: [{ plan: 'DirecTV Stream', commissions: {} }],
    },
    {
      name: 'Streaming',
      rows: [
        { plan: 'YouTube TV', commissions: {} },
        { plan: 'Netflix', commissions: {} },
        { plan: 'Hulu', commissions: {} },
        { plan: 'Prime', commissions: {} },
        { plan: 'HBO Max', commissions: {} },
        { plan: 'Paramount', commissions: {} },
        { plan: 'Disney+', commissions: {} },
      ],
    },
  ],
}

function migrateCommissionConfig(saved: CommissionConfig): CommissionConfig {
  const savedByName = new Map(saved.sections.map(s => [s.name, s]))
  return {
    roles: saved.roles?.length ? saved.roles : DEFAULT_COMMISSION.roles,
    sections: DEFAULT_COMMISSION.sections.map(s => savedByName.get(s.name) ?? s),
  }
}

function PlanDetailView({
  plan, details, isAdmin, onBack, onChange,
}: {
  plan: string
  details: PlanDetails
  isAdmin: boolean
  onBack: () => void
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
                {isAdmin ? (
                  <input
                    className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                    value={details[field.key]}
                    placeholder="—"
                    onChange={e => onChange(field.key, e.target.value)}
                  />
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

export default function PricingAndCommissions({ onBack }: { onBack: () => void }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [grid, setGrid] = useState<PricingGrid>({})
  const [discounts, setDiscounts] = useState<DiscountRow[]>(DEFAULT_DISCOUNTS)
  const [companyDiscounts, setCompanyDiscounts] = useState<CompanyDiscount[]>([])
  const [companySearch, setCompanySearch] = useState('')
  const [showCompanyDb, setShowCompanyDb] = useState(false)
  const [newCompany, setNewCompany] = useState<CompanyDiscount>({ company: '', discount: '' })
  const [agentDiscounts, setAgentDiscounts] = useState<DiscountRow[]>([])
  const [checkedBenefits, setCheckedBenefits] = useState<Set<string>>(new Set())
  const [planDetails, setPlanDetails] = useState<PlanDetailsMap>({})
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [detailsExpanded, setDetailsExpanded] = useState(false)
  const [expandedDiscount, setExpandedDiscount] = useState<number | null>(null)
  const [commissionConfig, setCommissionConfig] = useState<CommissionConfig>(DEFAULT_COMMISSION)
  const [selectedRole, setSelectedRole] = useState('')
  const [newRole, setNewRole] = useState('')
  const [showPricing, setShowPricing] = useState(true)
  const [showCommissions, setShowCommissions] = useState(true)
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
      setSaving(true)
      setSaveError(null)
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
    setPlanDetails(prev => ({
      ...prev,
      [plan]: { ...(prev[plan] || EMPTY_PLAN_DETAILS), [field]: value },
    }))
  }

  function setPhoneCommCell(plan: string, role: string, value: string) {
    setCommissionConfig(prev => ({
      ...prev,
      sections: prev.sections.map((s, si) =>
        si !== 0 ? s : {
          ...s,
          rows: s.rows.map(r => r.plan === plan ? { ...r, commissions: { ...r.commissions, [role]: value } } : r),
        }
      ),
    }))
  }

  function setCommCell(si: number, ri: number, role: string, value: string) {
    setCommissionConfig(prev => ({
      ...prev,
      sections: prev.sections.map((s, idx) =>
        idx !== si ? s : {
          ...s,
          rows: s.rows.map((r, ridx) =>
            ridx !== ri ? r : { ...r, commissions: { ...r.commissions, [role]: value } }
          ),
        }
      ),
    }))
  }

  function setRowPrice(si: number, ri: number, value: string) {
    setCommissionConfig(prev => ({
      ...prev,
      sections: prev.sections.map((s, idx) =>
        idx !== si ? s : {
          ...s,
          rows: s.rows.map((r, ridx) => ridx !== ri ? r : { ...r, price: value }),
        }
      ),
    }))
  }

  function setRowPlanName(si: number, ri: number, value: string) {
    setCommissionConfig(prev => ({
      ...prev,
      sections: prev.sections.map((s, idx) =>
        idx !== si ? s : {
          ...s,
          rows: s.rows.map((r, ridx) => ridx !== ri ? r : { ...r, plan: value }),
        }
      ),
    }))
  }

  function addPlanRow(si: number) {
    setCommissionConfig(prev => ({
      ...prev,
      sections: prev.sections.map((s, idx) =>
        idx !== si ? s : { ...s, rows: [...s.rows, { plan: '', commissions: {} }] }
      ),
    }))
  }

  function removePlanRow(si: number, ri: number) {
    setCommissionConfig(prev => ({
      ...prev,
      sections: prev.sections.map((s, idx) =>
        idx !== si ? s : { ...s, rows: s.rows.filter((_, ridx) => ridx !== ri) }
      ),
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
        ...s,
        rows: s.rows.map(r => {
          const { [role]: _removed, ...rest } = r.commissions
          return { ...r, commissions: rest }
        }),
      })),
    }))
    if (selectedRole === role) setSelectedRole(commissionConfig.roles.find(r => r !== role) ?? '')
  }

  if (loading) return <div className="text-sm text-gray-400 p-4">Loading...</div>

  if (selectedPlan !== null) return (
    <PlanDetailView
      plan={selectedPlan}
      details={planDetails[selectedPlan] || EMPTY_PLAN_DETAILS}
      isAdmin={isAdmin}
      onBack={() => setSelectedPlan(null)}
      onChange={(field, value) => setPlanDetail(selectedPlan, field, value)}
    />
  )

  const phoneSection = commissionConfig.sections[0]
  const rs = detailsExpanded ? 2 : 1

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

      {/* Role selector — only relevant when commissions are visible */}
      {showCommissions && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide shrink-0">Your Role</label>
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-green-400"
          >
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
            <input
              className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-green-400"
              placeholder="Add role..."
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRole()}
            />
            <button onClick={addRole} className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Add</button>
          </div>
        </div>
      )}

      {/* Monthly Plan Pricing + Commissions */}
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
                  <th
                    rowSpan={rs}
                    className="border border-gray-300 px-1 py-1 font-semibold text-blue-700 text-center whitespace-nowrap w-14 bg-blue-50 cursor-pointer hover:bg-blue-100 select-none"
                    onClick={() => setDetailsExpanded(x => !x)}
                  >
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
                  <th
                    rowSpan={rs}
                    key={role}
                    className={`border border-gray-300 px-1 py-1 font-semibold text-center whitespace-nowrap w-16 transition-colors ${
                      role === selectedRole ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700'
                    }`}
                  >{role}</th>
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
                    <td
                      className="border border-gray-300 px-1 py-0.5 font-medium text-gray-700 hover:text-blue-700 cursor-pointer whitespace-nowrap"
                      onClick={() => setSelectedPlan(plan)}
                    >{plan}</td>
                    {showPricing && LINE_COUNTS.map(n => (
                      <td key={n} className="border border-gray-300 p-0 text-center bg-blue-50/40">
                        {isAdmin ? (
                          <input
                            className="w-full text-xs text-center px-1 py-0.5 focus:outline-none focus:bg-blue-100 bg-transparent"
                            value={grid[plan]?.[n] ?? ''}
                            placeholder="—"
                            onChange={e => setPricingCell(plan, n, e.target.value)}
                          />
                        ) : (
                          <span className="block px-1 py-0.5 text-blue-800">{grid[plan]?.[n] || '—'}</span>
                        )}
                      </td>
                    ))}
                    {showPricing && <td className="border border-gray-300 px-1 py-0.5 text-center text-xs text-gray-300 bg-blue-50/20">—</td>}
                    {showPricing && detailsExpanded && PLAN_DETAIL_SECTIONS.flatMap(s => s.fields).map(f => (
                      <td key={f.key} className="border border-gray-300 p-0 text-center bg-blue-50/30">
                        {isAdmin ? (
                          <input
                            className="w-full text-xs text-center px-1 py-0.5 focus:outline-none focus:bg-blue-100 bg-transparent min-w-[60px]"
                            value={planDetails[plan]?.[f.key] ?? ''}
                            placeholder="—"
                            onChange={e => setPlanDetail(plan, f.key, e.target.value)}
                          />
                        ) : (
                          <span className="block px-1 py-0.5 text-blue-800 min-w-[60px]">{planDetails[plan]?.[f.key] || '—'}</span>
                        )}
                      </td>
                    ))}
                    {showPricing && showCommissions && <td className="bg-gray-200 w-0.5 p-0 border-0" />}
                    {showCommissions && commissionConfig.roles.map(role => (
                      <td
                        key={role}
                        className={`border border-gray-300 p-0 text-center transition-colors ${role === selectedRole ? 'bg-green-50' : 'bg-green-50/30'}`}
                      >
                        {isAdmin ? (
                          <input
                            className={`w-full text-xs text-center px-1 py-0.5 focus:outline-none bg-transparent ${
                              role === selectedRole ? 'focus:bg-green-100' : 'focus:bg-green-50'
                            }`}
                            value={commRow?.commissions[role] ?? ''}
                            placeholder="—"
                            onChange={e => setPhoneCommCell(plan, role, e.target.value)}
                          />
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

      {/* Pricing-only sections: Occupational Discounts, Agent Applied Discounts, Retail Agent Benefits */}
      {showPricing && (
        <>
      {/* Occupational Discounts */}
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
                    <input
                      className="w-28 text-xs border border-blue-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                      value={companySearch}
                      placeholder="Search company..."
                      onChange={e => {
                        const val = e.target.value
                        setCompanySearch(val)
                        const match = companyDiscounts.find(c => c.company.toLowerCase() === val.toLowerCase())
                        setDiscount(i, match?.discount ?? '')
                      }}
                      onClick={() => setShowCompanyDb(true)}
                    />
                    {d.value && <span className="text-xs font-semibold text-white bg-blue-600 rounded px-2 py-0.5 shrink-0">{d.value}</span>}
                  </div>
                  <span className="text-gray-300 text-[10px]">{isExpanded ? '▲' : '▼'}</span>
                </div>
                {isExpanded && (
                  <div className="px-3 pb-2 pt-1 bg-blue-50/30 border-t border-blue-100">
                    {isAdmin ? (
                      <textarea
                        className="w-full text-xs border border-blue-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400 resize-none"
                        rows={2}
                        value={d.notes ?? ''}
                        placeholder="Special features or notes..."
                        onChange={e => setDiscountNotes(i, e.target.value)}
                      />
                    ) : d.notes ? <p className="text-xs text-gray-500 italic">{d.notes}</p> : null}
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
                      <input
                        className="w-28 text-xs text-right border border-blue-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                        value={d.value}
                        placeholder="e.g. 25% off"
                        onChange={e => setDiscount(i, e.target.value)}
                      />
                    ) : d.value ? (
                      <span className="text-xs font-semibold text-white bg-blue-600 rounded px-2 py-0.5">{d.value}</span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                    <span className="text-gray-300 text-[10px]">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-3 pb-2 pt-1 bg-blue-50/30 border-t border-blue-100">
                    {isAdmin ? (
                      <textarea
                        className="w-full text-xs border border-blue-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400 resize-none"
                        rows={2}
                        value={d.notes ?? ''}
                        placeholder="Special features or notes..."
                        onChange={e => setDiscountNotes(i, e.target.value)}
                      />
                    ) : d.notes ? <p className="text-xs text-gray-500 italic">{d.notes}</p> : null}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Agent Applied Discounts */}
      <div>
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Agent Applied Discounts</p>
        <div className="rounded-lg border border-blue-100 divide-y divide-blue-50 bg-blue-50/20">
          {agentDiscounts.map((d, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2">
              <input
                className="flex-1 min-w-0 text-xs border border-blue-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                value={d.label}
                placeholder="Discount name..."
                onChange={e => setAgentDiscount(i, 'label', e.target.value)}
              />
              <input
                className="w-24 text-xs text-right border border-blue-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                value={d.value}
                placeholder="Amount..."
                onChange={e => setAgentDiscount(i, 'value', e.target.value)}
              />
              <button
                onClick={() => setAgentDiscounts(prev => prev.filter((_, j) => j !== i))}
                className="text-gray-300 hover:text-red-400 text-xs shrink-0"
              >✕</button>
            </div>
          ))}
          <button
            onClick={() => setAgentDiscounts(prev => [...prev, { label: '', value: '' }])}
            className="w-full text-xs text-blue-600 py-2 hover:bg-blue-50 text-center"
          >
            + Add Discount
          </button>
        </div>
      </div>

      {/* Retail Agent Benefits */}
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
                    <tr
                      key={key}
                      className={`cursor-pointer transition-colors ${checked ? 'bg-blue-100' : 'hover:bg-blue-50/50'}`}
                      onClick={() => setCheckedBenefits(prev => {
                        const next = new Set(prev)
                        next.has(key) ? next.delete(key) : next.add(key)
                        return next
                      })}
                    >
                      <td className="border border-blue-200 px-1 text-center">
                        <input type="checkbox" readOnly checked={checked} className="accent-blue-600 cursor-pointer" />
                      </td>
                      {i === 0 ? (
                        <td rowSpan={arr.length} className="border border-blue-200 px-2 py-1 font-semibold text-gray-700 align-middle">{agentGroup}</td>
                      ) : null}
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

      {/* Internet, TV, Streaming sections — show when either toggle is on */}
      {(showPricing || showCommissions) && commissionConfig.sections.slice(1).map((section, offset) => {
        const si = offset + 1
        return (
          <div key={si}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{section.name}</p>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="text-xs w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap min-w-[80px]">Plan</th>
                    {showPricing && <th className="border border-gray-200 px-3 py-2 font-semibold text-center whitespace-nowrap min-w-[70px] bg-blue-50 text-blue-700">Price</th>}
                    {showPricing && showCommissions && <th className="bg-gray-300 w-0.5 p-0 border-0" />}
                    {showCommissions && commissionConfig.roles.map(role => (
                      <th
                        key={role}
                        className={`border border-gray-200 px-3 py-2 font-semibold text-center whitespace-nowrap min-w-[70px] transition-colors ${
                          role === selectedRole ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700'
                        }`}
                      >{role}</th>
                    ))}
                    {isAdmin && <th className="border border-gray-200 w-7" />}
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row, ri) => (
                    <tr key={ri} className="bg-white hover:bg-gray-50">
                      <td className="border border-gray-200 px-1 py-0.5 text-center">
                        {isAdmin ? (
                          <input
                            className="w-full text-xs text-center px-1 py-0.5 focus:outline-none focus:bg-blue-50 bg-transparent"
                            value={row.plan}
                            placeholder="Plan name..."
                            onChange={e => setRowPlanName(si, ri, e.target.value)}
                          />
                        ) : (
                          <span className="font-medium text-gray-700">{row.plan}</span>
                        )}
                      </td>
                      {showPricing && (
                        <td className="border border-gray-200 p-0 text-center bg-blue-50/40">
                          {isAdmin ? (
                            <input
                              className="w-full text-xs text-center px-1 py-0.5 focus:outline-none focus:bg-blue-100 bg-transparent"
                              value={row.price ?? ''}
                              placeholder="—"
                              onChange={e => setRowPrice(si, ri, e.target.value)}
                            />
                          ) : (
                            <span className="block px-1 py-0.5 text-blue-800">{row.price || '—'}</span>
                          )}
                        </td>
                      )}
                      {showPricing && showCommissions && <td className="bg-gray-200 w-0.5 p-0 border-0" />}
                      {showCommissions && commissionConfig.roles.map(role => (
                        <td
                          key={role}
                          className={`border border-gray-200 p-0 text-center transition-colors ${role === selectedRole ? 'bg-green-50' : 'bg-green-50/30'}`}
                        >
                          {isAdmin ? (
                            <input
                              className={`w-full text-xs text-center px-1 py-0.5 focus:outline-none bg-transparent ${
                                role === selectedRole ? 'focus:bg-green-100' : 'focus:bg-green-50'
                              }`}
                              value={row.commissions[role] ?? ''}
                              placeholder="—"
                              onChange={e => setCommCell(si, ri, role, e.target.value)}
                            />
                          ) : (
                            <span className={`block px-1 py-0.5 ${role === selectedRole ? 'font-semibold text-green-700' : 'text-green-800'}`}>
                              {row.commissions[role] || '—'}
                            </span>
                          )}
                        </td>
                      ))}
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
              <button
                onClick={() => addPlanRow(si)}
                className="mt-1 w-full text-xs text-blue-600 py-1.5 hover:bg-blue-50 rounded border border-dashed border-blue-200 text-center"
              >
                + Add Plan
              </button>
            )}
          </div>
        )
      })}

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
                        <td
                          className="border border-gray-200 px-1 text-center"
                          onClick={e => { e.stopPropagation(); setCompanyDiscounts(prev => prev.filter((_, j) => j !== i)) }}
                        >
                          <button className="text-gray-300 hover:text-red-400">✕</button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {isAdmin && (
                    <tr>
                      <td className="border border-gray-200 p-0">
                        <input
                          className="w-full px-2 py-1 text-xs focus:outline-none focus:bg-blue-50"
                          placeholder="Company name..."
                          value={newCompany.company}
                          onChange={e => setNewCompany(prev => ({ ...prev, company: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && addCompany()}
                        />
                      </td>
                      <td className="border border-gray-200 p-0">
                        <input
                          className="w-full px-2 py-1 text-xs focus:outline-none focus:bg-blue-50"
                          placeholder="e.g. 18%"
                          value={newCompany.discount}
                          onChange={e => setNewCompany(prev => ({ ...prev, discount: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && addCompany()}
                        />
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
