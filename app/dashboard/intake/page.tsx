'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const STATUSES = ['new', 'contacted', 'assessed', 'enrolled', 'closed']

export default function IntakePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [client, setClient] = useState({ name: '', email: '', phone: '', address: '', city: '', state: '', status: 'new', notes: '' })
  const [assessment, setAssessment] = useState({ energy_provider: '', energy_bill: '', gas_provider: '', gas_bill: '', water_bill: '', internet_provider: '', internet_bill: '', security_provider: '', security_bill: '', wellness_goals: '', notes: '' })

  const setC = (f: string, v: string) => setClient(p => ({ ...p, [f]: v } as typeof p))
  const setA = (f: string, v: string) => setAssessment(p => ({ ...p, [f]: v } as typeof p))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const { data: newClient, error: clientErr } = await supabase.from('clients').insert([client]).select().single()
      if (clientErr) throw clientErr
      const { error: aErr } = await supabase.from('assessments').insert([{
        client_id: newClient.id,
        energy_provider: assessment.energy_provider, energy_bill: parseFloat(assessment.energy_bill) || 0,
        gas_provider: assessment.gas_provider, gas_bill: parseFloat(assessment.gas_bill) || 0,
        water_bill: parseFloat(assessment.water_bill) || 0,
        internet_provider: assessment.internet_provider, internet_bill: parseFloat(assessment.internet_bill) || 0,
        security_provider: assessment.security_provider, security_bill: parseFloat(assessment.security_bill) || 0,
        wellness_goals: assessment.wellness_goals, notes: assessment.notes,
      }])
      if (aErr) throw aErr
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.')
    } finally { setSaving(false) }
  }

  const utilityRows = [
    { label: 'Energy', pf: 'energy_provider', bf: 'energy_bill' },
    { label: 'Gas', pf: 'gas_provider', bf: 'gas_bill' },
    { label: 'Internet', pf: 'internet_provider', bf: 'internet_bill' },
    { label: 'Home Security', pf: 'security_provider', bf: 'security_bill' },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">New Client Intake</h1>
        <p className="text-gray-500 text-sm mt-1">Record client info and their home utility details.</p>
      </div>
      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Client Information</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { l: 'Full Name', f: 'name',    t: 'text',  r: true, s: 2 },
              { l: 'Email',     f: 'email',   t: 'email', s: 1 },
              { l: 'Phone',     f: 'phone',   t: 'tel',   s: 1 },
              { l: 'Address',   f: 'address', t: 'text',  s: 2 },
              { l: 'City',      f: 'city',    t: 'text',  s: 1 },
              { l: 'State',     f: 'state',   t: 'text',  s: 1 },
            ].map(x => (
              <div key={x.f} className={x.s === 2 ? 'col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{x.l}</label>
                <input type={x.t} required={!!x.r} value={(client as Record<string,string>)[x.f]} onChange={e => setC(x.f, e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={client.status} onChange={e => setC('status', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={3} value={client.notes} onChange={e => setC('notes', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Home Utility Assessment</h2>
          <p className="text-xs text-gray-400 mb-4">Monthly bill amounts in dollars</p>
          <div className="space-y-4">
            {utilityRows.map(row => (
              <div key={row.label} className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{row.label} Provider</label>
                  <input type="text" value={(assessment as Record<string,string>)[row.pf]} onChange={e => setA(row.pf, e.target.value)} placeholder="e.g. ComEd"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Bill ($)</label>
                  <input type="number" min="0" step="0.01" value={(assessment as Record<string,string>)[row.bf]} onChange={e => setA(row.bf, e.target.value)} placeholder="0.00"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Water Monthly Bill ($)</label>
              <input type="number" min="0" step="0.01" value={assessment.water_bill} onChange={e => setA('water_bill', e.target.value)} placeholder="0.00"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Wellness and Lifestyle</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wellness Goals</label>
            <textarea rows={3} value={assessment.wellness_goals} onChange={e => setA('wellness_goals', e.target.value)}
              placeholder="Diet, exercise, sleep, stress management..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Notes</label>
            <textarea rows={3} value={assessment.notes} onChange={e => setA('notes', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
        </div>
        <div className="flex gap-3 pb-8">
          <button type="submit" disabled={saving}
            className="bg-amber-400 hover:bg-amber-500 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors">
            {saving ? 'Saving...' : 'Save Client'}
          </button>
          <button type="button" onClick={() => router.push('/dashboard')}
            className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium px-6 py-2.5 rounded-lg transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
