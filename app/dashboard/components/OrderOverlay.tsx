'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import OrderFormFields, { OrderForm } from './OrderFormFields'

export default function OrderOverlay({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const [form, setForm] = useState<OrderForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('att_orders').select('*').eq('id', orderId).single()
      .then(({ data }) => { if (data) setForm(data) })
  }, [orderId])

  function set(field: keyof OrderForm, value: string) {
    setForm(f => f ? { ...f, [field]: value } : f)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    await supabase.from('att_orders').update({ ...form }).eq('id', orderId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  if (!form) return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col max-w-lg mx-auto">
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600">
        <h2 className="text-white font-bold text-base">AT&T Order — {form.account_holder}</h2>
        <button onClick={onClose} className="text-white text-xl leading-none">✕</button>
      </div>
      <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 space-y-5">
        <OrderFormFields form={form} onChange={set} />
        <button type="submit" disabled={saving || saved}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60">
          {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
