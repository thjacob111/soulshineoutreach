'use client'
import { useState } from 'react'
import { useEditMode } from './EditModeContext'
import { TradeInTranslator } from './TradeInTranslator'
import { DEVICE_BRANDS, DEVICE_CONDITIONS, DEVICE_STORAGE_OPTIONS } from '@/lib/pricing/constants'
import type { TradeInCalculator as TIData, DeviceDropdowns } from '@/lib/pricing/types'

interface Props { data: TIData; onChange?: (data: TIData) => void }

function DeviceRow({ label, value, onChange }: { label: string; value: DeviceDropdowns; onChange?: (v: DeviceDropdowns) => void }) {
  const { isEditing } = useEditMode()
  const years = Array.from({ length: 10 }, (_, i) => String(2025 - i))
  const sel = (key: keyof DeviceDropdowns, opts: string[]) =>
    isEditing
      ? <select className="border border-gray-300 rounded px-1 py-0.5 text-xs text-gray-800" value={value[key]} onChange={e => onChange?.({ ...value, [key]: e.target.value })}>
          <option value="">—</option>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      : <span className="text-xs text-gray-800 border border-gray-200 rounded px-1.5 py-0.5 bg-gray-50">{value[key] || '—'}</span>
  return (
    <tr className="bg-gray-50">
      <td className="border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-700 w-40 whitespace-nowrap">{label}</td>
      <td className="border border-gray-200 px-2 py-2" colSpan={3}>
        <div className="flex flex-wrap items-center gap-2">
          {sel('device', ['Phone', 'Tablet', 'Watch', 'Laptop'])}
          {sel('brand', DEVICE_BRANDS)}
          {sel('year', years)}
          {isEditing
            ? <input className="border border-gray-300 rounded px-1 py-0.5 text-xs w-24" placeholder="Model" value={value.model} onChange={e => onChange?.({ ...value, model: e.target.value })} />
            : <span className="text-xs text-gray-800 border border-gray-200 rounded px-1.5 py-0.5 bg-gray-50">{value.model || '—'}</span>}
          {sel('storage', DEVICE_STORAGE_OPTIONS)}
          {sel('condition', DEVICE_CONDITIONS)}
        </div>
      </td>
    </tr>
  )
}

export function TradeInCalculator({ data, onChange }: Props) {
  const { isEditing } = useEditMode()
  const [showTranslator, setShowTranslator] = useState(false)
  const txt = (value: string, key: keyof TIData) =>
    isEditing
      ? <input className="border-b border-blue-400 text-xs outline-none w-full text-gray-800" value={value} onChange={e => onChange?.({ ...data, [key]: e.target.value })} />
      : <span className="text-xs text-gray-800">{value || '—'}</span>
  return (
    <>
      {showTranslator && <TradeInTranslator tiers={data.translatorTiers} onClose={() => setShowTranslator(false)} onChange={translatorTiers => onChange?.({ ...data, translatorTiers })} />}
      <table className="w-full text-sm border-collapse">
        <tbody>
          <DeviceRow label="Current Device" value={data.currentDevice} onChange={currentDevice => onChange?.({ ...data, currentDevice })} />
          <tr>
            <td className="border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-700">Trade-In Value</td>
            <td className="border border-gray-200 px-2 py-2" colSpan={3}>
              <div className="flex items-center gap-4">
                <div className="flex flex-col"><span className="text-[10px] text-gray-400">Standard</span>{txt(data.tradeInStandard, 'tradeInStandard')}</div>
                <button onClick={() => setShowTranslator(true)} className="text-xl text-blue-500 hover:text-blue-700 font-bold" title="Open Trade-In Translator">=&gt;</button>
                <div className="flex flex-col"><span className="text-[10px] text-gray-400">Promotional</span>{txt(data.tradeInPromo, 'tradeInPromo')}</div>
              </div>
            </td>
          </tr>
          <DeviceRow label="New Device" value={data.newDevice} onChange={newDevice => onChange?.({ ...data, newDevice })} />
          <tr>
            <td className="border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-700">Cost</td>
            <td className="border border-gray-200 px-2 py-2" colSpan={3}>{txt(data.cost, 'cost')}</td>
          </tr>
          <tr>
            <td className="border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-700">Customer Trade-In Cost</td>
            <td className="border border-gray-200 px-2 py-2"><span className="text-xs text-gray-500 mr-1">Total =</span>{txt(data.customerTotal, 'customerTotal')}</td>
            <td className="border border-gray-200 px-2 py-2"><span className="text-xs text-gray-500 mr-1">$</span>{txt(data.customerMonthly, 'customerMonthly')}<span className="text-xs text-gray-500 ml-1">/mo</span></td>
            <td className="border border-gray-200 px-2 py-2"><span className="text-xs text-gray-500 mr-1">x</span>{txt(data.customerMonths, 'customerMonths')}<span className="text-xs text-gray-500 ml-1">mo</span></td>
          </tr>
        </tbody>
      </table>
    </>
  )
}