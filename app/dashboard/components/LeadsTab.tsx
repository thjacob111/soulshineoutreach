'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const CONNECTION_TYPES = ['D2D', 'Organic', 'Referral (D2D)', 'Referral (Organic)']

const DISPOSITIONS = [
  { value: '', label: '—' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'quote_sent', label: 'Quote Sent' },
  { value: 'order_submitted', label: 'Order Submitted' },
  { value: 'pending_install', label: 'Pending Install' },
  { value: 'installed', label: 'Installed' },
  { value: 'cancelled', label: 'Cancelled' },
]

interface Lead {
  id: string
  created_at: string
  name: string
  email: string
  phone: string
  address: string
  status: string
  connection: string | null
  nurture_sequence: string | null
  next_action: string | null
  notes: string
  att_order_id: string | null
}

const sel = 'text-xs border border-gray-200 rounded px-1 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400'
const inpt = 'w-full text-xs text-gray-700 focus:outline-none bg-transparent border-b border-transparent focus:border-gray-300'
const th1 = 'text-left px-2 py-1.5 font-semibold text-gray-600 whitespace-nowrap text-xs bg-gray-50'
const th2 = 'text-center px-2 py-1 font-semibold text-gray-500 text-xs bg-gray-100 border-b border-gray-200'

export default function LeadsTab({ onOpenOrder }: { onOpenOrder: (orderId: string) => void }) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadLeads() }, [])

  async function loadLeads() {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setLeads(data)
    setLoading(false)
  }

  async function updateField(id: string, field: string, value: string) {
    await supabase.from('leads').update({ [field]: value }).eq('id', id)
    setLeads(l => l.map(lead => lead.id === id ? { ...lead, [field]: value } : lead))
  }

  async function saveText(id: string, field: string, value: string) {
    await supabase.from('leads').update({ [field]: value }).eq('id', id)
  }

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-gray-800 text-base">My Leads</h2>

      {leads.length === 0 && (
        <p className="text-gray-400 text-sm">No leads yet. Submit an order in Portfolio → AT&T Wireless.</p>
      )}

      {leads.length > 0 && (
        <div className="overflow-x-auto -mx-4">
          <table className="min-w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className={`${th1} border-b border-gray-200`} rowSpan={2}>Name</th>
                <th className={`${th1} border-b border-gray-200 border-l border-gray-200`} rowSpan={2}>Connection</th>
                <th className={`${th2} border-l border-gray-200`} colSpan={3}>Contact Info</th>
                <th className={`${th2} border-l border-gray-200`}>AT&amp;T Wireless</th>
                <th className={`${th2} border-l border-gray-200`} colSpan={3}>Status &amp; Actions</th>
                <th className={`${th1} border-b border-gray-200 border-l border-gray-200`} rowSpan={2}>Notes</th>
              </tr>
              <tr className="border-b border-gray-200">
                <th className={`${th1} border-l border-gray-200`}>Phone</th>
                <th className={th1}>Email</th>
                <th className={th1}>Address</th>
                <th className={`${th1} border-l border-gray-200`}>Order</th>
                <th className={`${th1} border-l border-gray-200`}>Disposition</th>
                <th className={th1}>Nurture Seq.</th>
                <th className={th1}>Next Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-2 py-1.5 whitespace-nowrap font-medium text-gray-800">
                    {lead.name || '—'}
                  </td>

                  <td className="px-2 py-1.5 whitespace-nowrap border-l border-gray-100">
                    <select
                      value={lead.connection || ''}
                      onChange={e => updateField(lead.id, 'connection', e.target.value)}
                      className={`${sel} max-w-28`}
                    >
                      <option value="">—</option>
                      {CONNECTION_TYPES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </td>

                  <td className="px-2 py-1.5 whitespace-nowrap text-gray-600 border-l border-gray-100">
                    {lead.phone || '—'}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-gray-600">
                    {lead.email || '—'}
                  </td>
                  <td className="px-2 py-1.5 text-gray-600 max-w-36 truncate">
                    {lead.address || '—'}
                  </td>

                  <td className="px-2 py-1.5 whitespace-nowrap border-l border-gray-100">
                    {lead.att_order_id ? (
                      <button
                        onClick={() => onOpenOrder(lead.att_order_id!)}
                        className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-700 transition-colors"
                      >
                        View ›
                      </button>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>

                  <td className="px-2 py-1.5 whitespace-nowrap border-l border-gray-100">
                    <select
                      value={lead.status || ''}
                      onChange={e => updateField(lead.id, 'status', e.target.value)}
                      className={sel}
                    >
                      {DISPOSITIONS.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1.5 min-w-24">
                    <input
                      defaultValue={lead.nurture_sequence || ''}
                      onBlur={e => saveText(lead.id, 'nurture_sequence', e.target.value)}
                      placeholder="Sequence..."
                      className={inpt}
                    />
                  </td>
                  <td className="px-2 py-1.5 min-w-24">
                    <input
                      defaultValue={lead.next_action || ''}
                      onBlur={e => saveText(lead.id, 'next_action', e.target.value)}
                      placeholder="Next step..."
                      className={inpt}
                    />
                  </td>

                  <td className="px-2 py-1.5 border-l border-gray-100 min-w-28">
                    <input
                      defaultValue={lead.notes || ''}
                      onBlur={e => saveText(lead.id, 'notes', e.target.value)}
                      placeholder="Note..."
                      className={inpt}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
