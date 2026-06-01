'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import OrderFormFields, { OrderForm, AccessoryItem, EMPTY_FORM, Sect, Row } from './OrderFormFields'
import OrderTrackerSheet from './OrderTrackerSheet'

type View = 'home' | 'new-order' | 'log' | 'view-order' | 'edit-order' | 'pricing' | 'commission'

interface AttOrder extends OrderForm { id: string; created_at: string }

export default function AttWireless({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<View>('home')
  const [form, setForm] = useState<OrderForm>(EMPTY_FORM)
  const [orders, setOrders] = useState<AttOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<AttOrder | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function set(field: keyof OrderForm, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function startNewOrder() {
    const { data: { user } } = await supabase.auth.getUser()
    const name = user?.user_metadata?.full_name || user?.email || ''
    const today = new Date().toISOString().split('T')[0]
    setForm({ ...EMPTY_FORM, prepared_by: name, order_date: today })
    setView('new-order')
  }

  async function loadOrders() {
    const { data } = await supabase.from('att_orders').select('*').order('created_at', { ascending: false })
    if (data) setOrders(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: orderData } = await supabase
      .from('att_orders')
      .insert({ ...form, user_id: user?.id })
      .select('id')
      .single()
    if (orderData?.id) {
      const address = [
        form.street_address,
        form.unit_number ? `Unit ${form.unit_number}` : null,
        `${form.city}, ${form.state} ${form.zip_code}`,
      ].filter(Boolean).join(', ')
      await supabase.from('leads').insert({
        user_id: user?.id,
        name: form.account_holder,
        email: form.email,
        phone: form.phone,
        address,
        status: 'order_submitted',
        att_order_id: orderData.id,
      })
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); setForm(EMPTY_FORM); setView('log'); loadOrders() }, 1500)
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedOrder) return
    setSaving(true)
    await supabase.from('att_orders').update({ ...form }).eq('id', selectedOrder.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      setSelectedOrder({ ...selectedOrder, ...form })
      setView('view-order')
      loadOrders()
    }, 1500)
  }

  function copyOrderSummary(o: OrderForm) {
    const address = [
      o.street_address,
      o.unit_number ? `Unit ${o.unit_number}` : null,
      `${o.city}, ${o.state} ${o.zip_code}`,
    ].filter(Boolean).join(', ')
    const apptLocation = o.appt_location_type === 'custom' ? o.appt_location_custom : 'Remote'
    const currentDevice = [o.line1_current_device_type, o.line1_current_device_model, o.line1_current_device_storage, o.line1_current_device_condition].filter(Boolean).join(' ')
    const newDevice = [o.line1_new_device_type, o.line1_new_device_model, o.line1_new_device_storage].filter(Boolean).join(' ')
    const discountDisplay = (() => {
      if (!o.discount_type) return 'None'
      if (o.discount_type === 'military') return 'Military'
      if (o.discount_type === 'nurse') return 'Nurse'
      if (o.discount_type === 'first_responder') {
        const sub = o.discount_sub_type ? ` — ${o.discount_sub_type.charAt(0).toUpperCase() + o.discount_sub_type.slice(1)}` : ''
        return `First Responder${sub}`
      }
      if (o.discount_type === 'company') return `Company — ${o.discount_company}`
      return o.discount_type
    })()
    const accessories: AccessoryItem[] = (() => { try { return JSON.parse(o.line1_accessories_json) } catch { return [] } })()
    const accessoryLines = accessories.length
      ? accessories.map((a, i) => `  Acc ${i+1}: ${a.type} | Balance: ${a.balance} | Plan: ${a.service_plan} | Price: ${a.service_price}`).join('\n')
      : '  None'
    const internetPlan = [o.internet_tech.toUpperCase(), o.internet_speed].filter(Boolean).join(' · ')
    const text = `SOUL SHINE SUSTAINABILITY — AT&T ORDER SUMMARY
Prepared by: ${o.prepared_by}   Date: ${o.order_date}

CUSTOMER
Name: ${o.account_holder}
Address: ${address}
Email: ${o.email}
Phone: ${o.phone}
Appointment: ${o.appt_date} ${o.appt_start_time}–${o.appt_end_time} (${o.appt_duration} ${o.appt_duration_unit}) @ ${apptLocation}

PHONE ORDER
Current Carrier: ${o.current_carrier}   Account #: ${o.current_account_number}   Current Price: ${o.current_monthly_price}
AT&T Quote — Upfront: ${o.att_quote_upfront} | First Bill: ${o.att_quote_prorate} | Promo: ${o.att_quote_promo_price} for ${o.att_quote_promo_duration} | After Promo: ${o.att_quote_post_promo}
AT&T Account #: ${o.att_account_number}   Transfer PIN: ${o.transfer_pin}
Discount: ${discountDisplay}

Line 1 — ${o.line1_name} (${o.line1_phone})
Current Device: ${currentDevice}   Balance: ${o.line1_device_balance}
New Device: ${newDevice}   Price: ${o.line1_new_device_price}
Plan: ${o.line1_service_plan}   Line Price: ${o.line1_service_price}
Promotions: ${o.line1_promotions}
IMEI: ${o.line1_imei}   Insurance: ${o.line1_insurance}
Accessories:
${accessoryLines}

INTERNET ORDER
Current Provider: ${o.internet_provider}   Current Price: ${o.internet_monthly_price}
AT&T Plan: ${internetPlan}   Price: ${o.internet_service_price}
Install Date: ${o.internet_install_date}

NOTES: ${o.notes}`
    navigator.clipboard.writeText(text)
  }

  // ── VIEWS ──────────────────────────────────────────────

  if (view === 'home') return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
        <h2 className="font-bold text-gray-800 text-base">AT&T Wireless</h2>
      </div>
      <div className="rounded-xl border-2 border-blue-600 overflow-hidden">
        <div className="bg-blue-600 px-4 py-3">
          <span className="text-white font-bold text-sm tracking-wide">AT&T</span>
        </div>
        <div className="p-3 space-y-2">
          <button
            onClick={startNewOrder}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            + New Order Summary
          </button>
          <button
            onClick={() => { loadOrders(); setView('log') }}
            className="w-full bg-white border border-blue-600 text-blue-600 rounded-lg py-2 text-sm font-semibold hover:bg-blue-50 transition-colors"
          >
            Order Log
          </button>
          <button
            onClick={() => setView('pricing')}
            className="w-full bg-white border border-blue-600 text-blue-600 rounded-lg py-2 text-sm font-semibold hover:bg-blue-50 transition-colors"
          >
            Pricing & Promotions
          </button>
          <button
            onClick={() => setView('commission')}
            className="w-full bg-white border border-blue-600 text-blue-600 rounded-lg py-2 text-sm font-semibold hover:bg-blue-50 transition-colors"
          >
            Commission
          </button>
        </div>
      </div>
    </div>
  )

  if (view === 'log') return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={() => setView('home')} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
        <h2 className="font-bold text-gray-800 text-base">Order Log</h2>
        <button onClick={startNewOrder} className="ml-auto text-xs bg-blue-600 text-white px-3 py-1 rounded-lg">+ New</button>
      </div>
      <OrderTrackerSheet />
    </div>
  )

  if (view === 'view-order' && selectedOrder) return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={() => setView('log')} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
        <h2 className="font-bold text-gray-800 text-base">{selectedOrder.account_holder}</h2>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => { setForm({ ...selectedOrder }); setView('edit-order') }}
            className="text-xs border border-blue-600 text-blue-600 px-3 py-1 rounded-lg"
          >Edit</button>
          <button onClick={() => copyOrderSummary(selectedOrder)}
            className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg">Copy</button>
        </div>
      </div>
      <OrderSummaryView o={selectedOrder} />
    </div>
  )

  if (view === 'edit-order' && selectedOrder) return (
    <form onSubmit={handleUpdate} className="space-y-5">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setView('view-order')} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
        <h2 className="font-bold text-gray-800 text-base">Edit Order</h2>
      </div>
      <OrderFormFields form={form} onChange={set} />
      <button
        type="submit"
        disabled={saving || saved}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
      >
        {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )

  if (view === 'pricing') return <PricingView onBack={() => setView('home')} />
  if (view === 'commission') return <CommissionView onBack={() => setView('home')} />

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setView('home')} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
        <h2 className="font-bold text-gray-800 text-base">New Order Summary</h2>
      </div>
      <OrderFormFields form={form} onChange={set} />
      <button
        type="submit"
        disabled={saving || saved}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
      >
        {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Order Summary'}
      </button>
    </form>
  )
}

// ── PRICING VIEW ──────────────────────────────────────────
const ADMIN_EMAIL = 'thjacob111@gmail.com'
const PLAN_NAMES = ['Value', 'Extra 2.0', 'Premium 2.0', 'Senior']
const LINE_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const DEFAULT_DISCOUNTS = [
  { label: 'Military', value: '' },
  { label: 'Nurse', value: '' },
  { label: 'First Responder — Police', value: '' },
  { label: 'First Responder — EMS', value: '' },
  { label: 'First Responder — Firefighter', value: '' },
  { label: 'Employee', value: '' },
  { label: 'Company (FAN)', value: '' },
]

type PricingGrid = { [plan: string]: { [line: number]: string } }
type DiscountRow = { label: string; value: string }
type CompanyDiscount = { company: string; discount: string }
const DEFAULT_AGENT_DISCOUNTS: DiscountRow[] = []

function PricingView({ onBack }: { onBack: () => void }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [grid, setGrid] = useState<PricingGrid>({})
  const [discounts, setDiscounts] = useState<DiscountRow[]>(DEFAULT_DISCOUNTS)
  const [companyDiscounts, setCompanyDiscounts] = useState<CompanyDiscount[]>([])
  const [companySearch, setCompanySearch] = useState('')
  const [showCompanyDb, setShowCompanyDb] = useState(false)
  const [newCompany, setNewCompany] = useState<CompanyDiscount>({ company: '', discount: '' })
  const [agentDiscounts, setAgentDiscounts] = useState<DiscountRow[]>(DEFAULT_AGENT_DISCOUNTS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAdmin(user?.email === ADMIN_EMAIL)
      const { data } = await supabase.from('att_pricing_config').select('grid, discounts, company_discounts, agent_discounts').eq('id', 1).single()
      if (data) {
        setGrid(data.grid || {})
        setDiscounts(data.discounts?.length ? data.discounts : DEFAULT_DISCOUNTS)
        setCompanyDiscounts(data.company_discounts || [])
        setAgentDiscounts(data.agent_discounts || DEFAULT_AGENT_DISCOUNTS)
      }
      setLoading(false)
    }
    load()
  }, [])

  function setCell(plan: string, line: number, value: string) {
    setGrid(prev => ({ ...prev, [plan]: { ...(prev[plan] || {}), [line]: value } }))
  }

  function setDiscount(idx: number, value: string) {
    setDiscounts(prev => prev.map((d, i) => i !== idx ? d : { ...d, value }))
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

  async function handleSave() {
    setSaving(true)
    await supabase.from('att_pricing_config').upsert({
      id: 1, grid, discounts, company_discounts: companyDiscounts,
      agent_discounts: agentDiscounts, updated_at: new Date().toISOString()
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <div className="text-sm text-gray-400 p-4">Loading...</div>

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
        <h2 className="font-bold text-gray-800 text-base">Pricing & Promotions</h2>
        {!isAdmin && <span className="ml-auto text-xs text-gray-400">View only</span>}
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Monthly Plan Pricing</p>
        <div className="overflow-x-auto">
          <table className="text-xs w-full min-w-max border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-gray-600 whitespace-nowrap">Plan</th>
                {LINE_COUNTS.map(n => (
                  <th key={n} className="border border-gray-300 px-1 py-1 font-semibold text-gray-500 text-center whitespace-nowrap w-11">L{n}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLAN_NAMES.map(plan => (
                <tr key={plan} className="bg-white hover:bg-blue-50/30">
                  <td className="border border-gray-300 px-2 py-0.5 font-medium text-gray-700 whitespace-nowrap">{plan}</td>
                  {LINE_COUNTS.map(n => (
                    <td key={n} className="border border-gray-300 p-0 text-center">
                      {isAdmin ? (
                        <input
                          className="w-full text-xs text-center px-1 py-0.5 focus:outline-none focus:bg-blue-50 bg-transparent"
                          value={grid[plan]?.[n] ?? ''}
                          placeholder="—"
                          onChange={e => setCell(plan, n, e.target.value)}
                        />
                      ) : (
                        <span className="block px-1 py-0.5 text-gray-700">{grid[plan]?.[n] || '—'}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Occupational Discounts</p>
        <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
          {discounts.map((d, i) => d.label === 'Company (FAN)' ? (
            <div
              key={i}
              className="flex items-center px-3 py-2 gap-3 cursor-pointer hover:bg-gray-50"
              onClick={() => setShowCompanyDb(true)}
            >
              <span className="text-xs text-gray-600 shrink-0">Company (FAN)</span>
              <div className="flex items-center gap-2 ml-auto" onClick={e => e.stopPropagation()}>
                <input
                  className="w-28 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                  value={companySearch}
                  placeholder="Search company..."
                  onChange={e => {
                    const val = e.target.value
                    setCompanySearch(val)
                    const match = companyDiscounts.find(c => c.company.toLowerCase() === val.toLowerCase())
                    setDiscount(i, match?.discount ?? '')
                  }}
                />
                <span className="text-xs font-medium text-gray-700 w-14 text-right">{d.value || '—'}</span>
              </div>
            </div>
          ) : (
            <div key={i} className="flex items-center justify-between px-3 py-2 gap-3">
              <span className="text-xs text-gray-600">{d.label}</span>
              {isAdmin ? (
                <input
                  className="w-32 text-xs text-right border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                  value={d.value}
                  placeholder="e.g. 25% off"
                  onChange={e => setDiscount(i, e.target.value)}
                />
              ) : (
                <span className="text-xs font-medium text-gray-700">{d.value || '—'}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Agent Applied Discounts</p>
        <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
          {agentDiscounts.map((d, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2">
              <input
                className="flex-1 min-w-0 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                value={d.label}
                placeholder="Discount name..."
                onChange={e => setAgentDiscount(i, 'label', e.target.value)}
              />
              <input
                className="w-24 text-xs text-right border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
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

      <button
        onClick={handleSave}
        disabled={saving || saved}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
      >
        {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Pricing'}
      </button>

      {showCompanyDb && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setShowCompanyDb(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-80 max-h-[70vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
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

// ── COMMISSION VIEW ───────────────────────────────────────

interface CommissionRow { plan: string; commissions: Record<string, string> }
interface CommissionSection { name: string; rows: CommissionRow[] }
interface CommissionConfig { roles: string[]; sections: CommissionSection[] }

const DEFAULT_COMMISSION: CommissionConfig = {
  roles: ['Rep', 'Senior Rep', 'Team Lead', 'Manager'],
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
      name: 'Internet',
      rows: [
        { plan: '1Gb Fiber', commissions: {} },
        { plan: 'Fixed Wireless (IFWA)', commissions: {} },
      ],
    },
    {
      name: 'Cable / TV',
      rows: [
        { plan: 'DirecTV Stream', commissions: {} },
      ],
    },
  ],
}

function CommissionView({ onBack }: { onBack: () => void }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [config, setConfig] = useState<CommissionConfig>(DEFAULT_COMMISSION)
  const [selectedRole, setSelectedRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newRole, setNewRole] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAdmin(user?.email === ADMIN_EMAIL)
      const { data } = await supabase
        .from('att_pricing_config')
        .select('commission_config')
        .eq('id', 1)
        .single()
      const cfg: CommissionConfig = data?.commission_config ?? DEFAULT_COMMISSION
      setConfig(cfg)
      setSelectedRole(cfg.roles[0] ?? '')
      setLoading(false)
    }
    load()
  }, [])

  function setCell(sectionIdx: number, rowIdx: number, role: string, value: string) {
    setConfig(prev => {
      const sections = prev.sections.map((s, si) =>
        si !== sectionIdx ? s : {
          ...s,
          rows: s.rows.map((r, ri) =>
            ri !== rowIdx ? r : { ...r, commissions: { ...r.commissions, [role]: value } }
          ),
        }
      )
      return { ...prev, sections }
    })
  }

  function addRole() {
    const role = newRole.trim()
    if (!role || config.roles.includes(role)) return
    setConfig(prev => ({ ...prev, roles: [...prev.roles, role] }))
    setNewRole('')
  }

  function removeRole(role: string) {
    setConfig(prev => ({
      ...prev,
      roles: prev.roles.filter(r => r !== role),
      sections: prev.sections.map(s => ({
        ...s,
        rows: s.rows.map(r => {
          const { [role]: _, ...rest } = r.commissions
          return { ...r, commissions: rest }
        }),
      })),
    }))
    if (selectedRole === role) setSelectedRole(config.roles.find(r => r !== role) ?? '')
  }

  function addPlanRow(sectionIdx: number) {
    setConfig(prev => {
      const sections = prev.sections.map((s, si) =>
        si !== sectionIdx ? s : { ...s, rows: [...s.rows, { plan: '', commissions: {} }] }
      )
      return { ...prev, sections }
    })
  }

  function setPlanName(sectionIdx: number, rowIdx: number, value: string) {
    setConfig(prev => {
      const sections = prev.sections.map((s, si) =>
        si !== sectionIdx ? s : {
          ...s,
          rows: s.rows.map((r, ri) => ri !== rowIdx ? r : { ...r, plan: value }),
        }
      )
      return { ...prev, sections }
    })
  }

  function removePlanRow(sectionIdx: number, rowIdx: number) {
    setConfig(prev => {
      const sections = prev.sections.map((s, si) =>
        si !== sectionIdx ? s : { ...s, rows: s.rows.filter((_, ri) => ri !== rowIdx) }
      )
      return { ...prev, sections }
    })
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('att_pricing_config').upsert({ id: 1, commission_config: config, updated_at: new Date().toISOString() })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <div className="text-sm text-gray-400 p-4">Loading...</div>

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
        <h2 className="font-bold text-gray-800 text-base">Commission</h2>
        {!isAdmin && <span className="ml-auto text-xs text-gray-400">View only</span>}
      </div>

      {/* Role selector */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide shrink-0">Your Role</label>
        <select
          value={selectedRole}
          onChange={e => setSelectedRole(e.target.value)}
          className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-400"
        >
          {config.roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Admin: manage roles */}
      {isAdmin && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Roles</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {config.roles.map(r => (
              <span key={r} className="flex items-center gap-1 text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-2.5 py-1">
                {r}
                <button onClick={() => removeRole(r)} className="text-blue-300 hover:text-red-400 ml-1 leading-none">✕</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
              placeholder="Add role..."
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRole()}
            />
            <button onClick={addRole} className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Add</button>
          </div>
        </div>
      )}

      {/* Commission table per section */}
      {config.sections.map((section, si) => (
        <div key={si}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{section.name}</p>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="text-xs w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap min-w-[120px]">Plan</th>
                  {config.roles.map(role => (
                    <th
                      key={role}
                      className={`border border-gray-200 px-3 py-2 font-semibold text-center whitespace-nowrap min-w-[80px] transition-colors ${
                        role === selectedRole ? 'bg-blue-600 text-white' : 'text-gray-500'
                      }`}
                    >
                      {role}
                    </th>
                  ))}
                  {isAdmin && <th className="border border-gray-200 w-7" />}
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row, ri) => (
                  <tr key={ri} className="bg-white hover:bg-gray-50">
                    <td className="border border-gray-200 px-2 py-0.5">
                      {isAdmin ? (
                        <input
                          className="w-full text-xs px-1 py-0.5 focus:outline-none focus:bg-blue-50 bg-transparent"
                          value={row.plan}
                          placeholder="Plan name..."
                          onChange={e => setPlanName(si, ri, e.target.value)}
                        />
                      ) : (
                        <span className="font-medium text-gray-700">{row.plan}</span>
                      )}
                    </td>
                    {config.roles.map(role => (
                      <td
                        key={role}
                        className={`border border-gray-200 p-0 text-center transition-colors ${
                          role === selectedRole ? 'bg-blue-50' : ''
                        }`}
                      >
                        {isAdmin ? (
                          <input
                            className={`w-full text-xs text-center px-1 py-0.5 focus:outline-none bg-transparent ${
                              role === selectedRole ? 'bg-blue-50 focus:bg-blue-100' : 'focus:bg-blue-50'
                            }`}
                            value={row.commissions[role] ?? ''}
                            placeholder="—"
                            onChange={e => setCell(si, ri, role, e.target.value)}
                          />
                        ) : (
                          <span className={`block px-1 py-0.5 ${role === selectedRole ? 'font-semibold text-blue-700' : 'text-gray-600'}`}>
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
      ))}

      {isAdmin && (
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
        >
          {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Commission'}
        </button>
      )}
    </div>
  )
}

function OrderSummaryView({ o }: { o: OrderForm }) {
  const address = [
    o.street_address,
    o.unit_number ? `Unit ${o.unit_number}` : null,
    `${o.city}, ${o.state} ${o.zip_code}`,
  ].filter(Boolean).join(', ')
  const apptLocation = o.appt_location_type === 'custom' ? o.appt_location_custom : 'Remote'
  const currentDevice = [o.line1_current_device_type, o.line1_current_device_model, o.line1_current_device_storage, o.line1_current_device_condition].filter(Boolean).join(' ')
  const newDevice = [o.line1_new_device_type, o.line1_new_device_model, o.line1_new_device_storage].filter(Boolean).join(' ')

  return (
    <div className="space-y-4 text-sm">
      <Sect label="Customer">
        <Row label="Name"><span className="text-gray-800">{o.account_holder}</span></Row>
        <Row label="Address"><span className="text-gray-800">{address}</span></Row>
        <Row label="Email"><span className="text-gray-800">{o.email}</span></Row>
        <Row label="Phone"><span className="text-gray-800">{o.phone}</span></Row>
      </Sect>
      <Sect label="Appointment">
        <Row label="Date"><span className="text-gray-800">{o.appt_date}</span></Row>
        <Row label="Time"><span className="text-gray-800">{o.appt_start_time}–{o.appt_end_time}</span></Row>
        <Row label="Duration"><span className="text-gray-800">{o.appt_duration} {o.appt_duration_unit}</span></Row>
        <Row label="Location"><span className="text-gray-800">{apptLocation}</span></Row>
      </Sect>
      <Sect label="Phone Order">
        <Row label="Current Carrier"><span className="text-gray-800">{o.current_carrier}</span></Row>
        <Row label="Current Price"><span className="text-gray-800">{o.current_monthly_price}</span></Row>
        <Row label="Upfront" hl><span className="text-blue-600 font-semibold">{o.att_quote_upfront}</span></Row>
        <Row label="First Bill" hl><span className="text-blue-600 font-semibold">{o.att_quote_prorate}</span></Row>
        <Row label="Promo Price" hl><span className="text-blue-600 font-semibold">{o.att_quote_promo_price} for {o.att_quote_promo_duration}</span></Row>
        <Row label="After Promo" hl><span className="text-blue-600 font-semibold">{o.att_quote_post_promo}</span></Row>
        <Row label="Account #"><span className="text-gray-800">{o.att_account_number}</span></Row>
        <Row label="Transfer PIN"><span className="text-gray-800">{o.transfer_pin}</span></Row>
        <Row label="Discount"><span className="text-gray-800">{
          o.discount_type === 'company' ? `Company — ${o.discount_company}` :
          o.discount_type === 'first_responder' ? `First Responder${o.discount_sub_type ? ` — ${o.discount_sub_type}` : ''}` :
          o.discount_type === 'military' ? 'Military' :
          o.discount_type === 'nurse' ? 'Nurse' : '—'
        }</span></Row>
      </Sect>
      <Sect label={`Line 1 — ${o.line1_name}`}>
        <Row label="Phone"><span className="text-gray-800">{o.line1_phone}</span></Row>
        <Row label="Current Device"><span className="text-gray-800">{currentDevice}</span></Row>
        <Row label="Device Balance"><span className="text-gray-800">{o.line1_device_balance}</span></Row>
        <Row label="New Device"><span className="text-gray-800">{newDevice}</span></Row>
        <Row label="New Device Price"><span className="text-gray-800">{o.line1_new_device_price}</span></Row>
        <Row label="Service Plan"><span className="text-gray-800">{o.line1_service_plan}</span></Row>
        <Row label="Line Price" hl><span className="text-blue-600 font-semibold">{o.line1_service_price}</span></Row>
        <Row label="Promotions"><span className="text-gray-800">{o.line1_promotions}</span></Row>
        <Row label="IMEI"><span className="text-gray-800">{o.line1_imei}</span></Row>
        <Row label="Insurance"><span className="text-gray-800">{o.line1_insurance}</span></Row>
        {(() => { try { return JSON.parse(o.line1_accessories_json) } catch { return [] } })().map((a: AccessoryItem, i: number) => (
          <Row key={i} label={`Acc ${i+1} (${a.type})`} hl><span className="text-blue-600 font-semibold">{a.service_price}</span></Row>
        ))}
      </Sect>
      <Sect label="Internet">
        <Row label="Current Provider"><span className="text-gray-800">{o.internet_provider}</span></Row>
        <Row label="Current Price"><span className="text-gray-800">{o.internet_monthly_price}</span></Row>
        <Row label="AT&T Plan"><span className="text-gray-800">{[o.internet_tech?.toUpperCase(), o.internet_speed].filter(Boolean).join(' · ')}</span></Row>
        <Row label="Internet Price" hl><span className="text-blue-600 font-semibold">{o.internet_service_price}</span></Row>
        <Row label="Install Date"><span className="text-gray-800">{o.internet_install_date}</span></Row>
      </Sect>
      {o.notes && <Sect label="Notes"><p className="px-3 py-2 text-gray-700 text-sm">{o.notes}</p></Sect>}
    </div>
  )
}
