'use client'
import { useState } from 'react'
import { useEditMode } from './EditModeContext'
import { TradeInTranslator } from './TradeInTranslator'
import { DEVICE_CONDITIONS } from '@/lib/pricing/constants'
import type { TradeInCalculator as TIData, DeviceDropdowns } from '@/lib/pricing/types'

// ── DEVICE MODEL DATA ─────────────────────────────────────
type BrandData = { years: string[]; modelMap: Record<string, string[]>; storage: string[] }
const MODEL_DATA: Record<string, Record<string, BrandData>> = {
  Phone: {
    Apple: {
      years: ['17', '16', '15', '14', '13', '12', '11', '10'],
      modelMap: {
        '17': ['Standard', 'Plus', 'Pro', 'Pro Max'],
        '16': ['Standard', 'Plus', 'Pro', 'Pro Max', 'E'],
        '15': ['Standard', 'Plus', 'Pro', 'Pro Max'],
        '14': ['Standard', 'Plus', 'Pro', 'Pro Max'],
        '13': ['Standard', 'Mini', 'Pro', 'Pro Max'],
        '12': ['Standard', 'Mini', 'Pro', 'Pro Max'],
        '11': ['Standard', 'Pro', 'Pro Max'],
        '10': ['X', 'XS', 'XS Max', 'XR'],
      },
      storage: ['64GB', '128GB', '256GB', '512GB'],
    },
    Samsung: {
      years: ['S25', 'S24', 'S23', 'S22', 'S21', 'S20'],
      modelMap: {
        'S25': ['Standard', 'Plus', 'Ultra'],
        'S24': ['Standard', 'Plus', 'Ultra', 'FE'],
        'S23': ['Standard', 'Plus', 'Ultra', 'FE'],
        'S22': ['Standard', 'Plus', 'Ultra'],
        'S21': ['Standard', 'Plus', 'Ultra', 'FE'],
        'S20': ['Standard', 'Plus', 'Ultra'],
      },
      storage: ['128GB', '256GB', '512GB'],
    },
    Google: {
      years: ['9', '8', '7', '6', '5', '4'],
      modelMap: {
        '9': ['Standard', 'Pro', 'Pro XL', 'Pro Fold'],
        '8': ['Standard', 'Pro', 'Pro XL', 'Fold'],
        '7': ['Standard', 'Pro', 'Pro XL', 'Fold'],
        '6': ['Standard', 'Pro', 'Pro XL'],
        '5': ['Standard'],
        '4': ['Standard', 'XL'],
      },
      storage: ['128GB', '256GB'],
    },
    Motorola: {
      years: ['Edge 50', 'Edge 40', 'G85', 'G54', 'Razr 50', 'Razr 40'],
      modelMap: {
        'Edge 50': ['Standard', 'Pro', 'Fusion', 'Neo'],
        'Edge 40': ['Standard', 'Pro', 'Fusion', 'Neo'],
        'G85': ['Standard'],
        'G54': ['Standard'],
        'Razr 50': ['Standard', 'Ultra'],
        'Razr 40': ['Standard', 'Ultra'],
      },
      storage: ['128GB', '256GB'],
    },
  },
  Tablet: {
    Apple: {
      years: ['Air 6', 'Air 5', 'Pro M4', 'Pro M2', 'Mini 7', 'Mini 6', 'iPad 10', 'iPad 9'],
      modelMap: {
        'Air 6': ['WiFi', 'WiFi + Cellular'],
        'Air 5': ['WiFi', 'WiFi + Cellular'],
        'Pro M4': ['11"', '13"'],
        'Pro M2': ['11"', '12.9"'],
        'Mini 7': ['WiFi', 'WiFi + Cellular'],
        'Mini 6': ['WiFi', 'WiFi + Cellular'],
        'iPad 10': ['WiFi', 'WiFi + Cellular'],
        'iPad 9': ['WiFi'],
      },
      storage: ['64GB', '128GB', '256GB', '512GB', '1TB', '2TB'],
    },
    Samsung: {
      years: ['Tab S10', 'Tab S9', 'Tab S8', 'Tab A9+', 'Tab A9'],
      modelMap: {
        'Tab S10': ['Standard', 'Plus', 'Ultra', 'FE'],
        'Tab S9': ['Standard', 'Plus', 'Ultra', 'FE'],
        'Tab S8': ['Standard', 'Plus', 'Ultra'],
        'Tab A9+': ['WiFi', 'LTE'],
        'Tab A9': ['WiFi', 'LTE'],
      },
      storage: ['64GB', '128GB', '256GB', '512GB'],
    },
  },
  Watch: {
    Apple: {
      years: ['Series 10', 'Series 9', 'Series 8', 'Series 7', 'Ultra 2', 'SE 2'],
      modelMap: {
        'Series 10': ['42mm', '46mm'],
        'Series 9': ['41mm', '45mm'],
        'Series 8': ['41mm', '45mm'],
        'Series 7': ['41mm', '45mm'],
        'Ultra 2': ['49mm'],
        'SE 2': ['40mm', '44mm'],
      },
      storage: ['N/A'],
    },
    Samsung: {
      years: ['Watch 7', 'Watch 6', 'Watch 5', 'Watch Ultra'],
      modelMap: {
        'Watch 7': ['40mm', '44mm'],
        'Watch 6': ['40mm', '44mm', 'Classic 43mm', 'Classic 47mm'],
        'Watch 5': ['40mm', '44mm', 'Pro 45mm'],
        'Watch Ultra': ['47mm'],
      },
      storage: ['N/A'],
    },
  },
}

const DEVICES = ['Phone', 'Tablet', 'Watch']

interface Props { data: TIData; onChange?: (data: TIData) => void }

function DeviceRow({ label, value, onChange }: { label: string; value: DeviceDropdowns; onChange?: (v: DeviceDropdowns) => void }) {
  const { isEditing } = useEditMode()

  const brands = Object.keys(MODEL_DATA[value.device] ?? {})
  const brandData = MODEL_DATA[value.device]?.[value.brand]
  const years = brandData?.years ?? []
  const models = brandData?.modelMap[value.year] ?? []
  const storageOpts = brandData?.storage ?? ['64GB', '128GB', '256GB', '512GB']

  function update(patch: Partial<DeviceDropdowns>) {
    const next = { ...value, ...patch }
    if (patch.device !== undefined) { next.brand = ''; next.year = ''; next.model = ''; next.submodel = ''; next.storage = '' }
    else if (patch.brand !== undefined) { next.year = ''; next.model = ''; next.submodel = ''; next.storage = '' }
    else if (patch.year !== undefined) { next.model = ''; next.submodel = '' }
    else if (patch.model !== undefined) { next.submodel = '' }
    onChange?.(next)
  }

  const sel = (key: keyof DeviceDropdowns, opts: string[], placeholder: string) =>
    isEditing
      ? <select className="border border-gray-300 rounded px-1 py-0.5 text-xs text-gray-800"
          value={value[key]} onChange={e => update({ [key]: e.target.value })}>
          <option value="">{placeholder}</option>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      : <span className="text-xs text-gray-800 border border-gray-200 rounded px-1.5 py-0.5 bg-gray-50">{value[key] || '—'}</span>

  return (
    <tr className="bg-gray-50">
      <td className="border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">{label}</td>
      <td className="border border-gray-200 px-2 py-2" colSpan={3}>
        <div className="flex flex-wrap items-center gap-2">
          {sel('device', DEVICES, 'Device')}
          {value.device && sel('brand', brands, 'Brand')}
          {value.brand && sel('year', years, 'Year / Gen')}
          {value.year && models.length > 0 && sel('model', models, 'Model')}
          {value.brand && storageOpts[0] !== 'N/A' && sel('storage', storageOpts, 'Storage')}
          {sel('condition', DEVICE_CONDITIONS, 'Condition')}
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
      ? <input className="border-b border-blue-400 text-xs outline-none w-full text-gray-800" value={value}
          onChange={e => onChange?.({ ...data, [key]: e.target.value })} />
      : <span className="text-xs text-gray-800">{value || '—'}</span>
  return (
    <>
      {showTranslator && (
        <TradeInTranslator tiers={data.translatorTiers} onClose={() => setShowTranslator(false)}
          onChange={translatorTiers => onChange?.({ ...data, translatorTiers })} />
      )}
      <table className="w-full text-sm border-collapse">
        <tbody>
          <DeviceRow label="Current Device" value={data.currentDevice}
            onChange={currentDevice => onChange?.({ ...data, currentDevice })} />
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
          <DeviceRow label="New Device" value={data.newDevice}
            onChange={newDevice => onChange?.({ ...data, newDevice })} />
          <tr>
            <td className="border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-700">Cost</td>
            <td className="border border-gray-200 px-2 py-2" colSpan={3}>{txt(data.cost, 'cost')}</td>
          </tr>
          <tr>
            <td className="border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">Customer Trade-In Cost</td>
            <td className="border border-gray-200 px-2 py-2 w-28">
              <span className="text-xs text-gray-500 mr-1">Total =</span>{txt(data.customerTotal, 'customerTotal')}
            </td>
            <td className="border border-gray-200 px-2 py-2 w-24">
              <span className="text-xs text-gray-500 mr-1">$</span>{txt(data.customerMonthly, 'customerMonthly')}<span className="text-xs text-gray-500 ml-1">/mo</span>
            </td>
            <td className="border border-gray-200 px-2 py-2 w-20">
              <span className="text-xs text-gray-500 mr-1">x</span>{txt(data.customerMonths, 'customerMonths')}<span className="text-xs text-gray-500 ml-1">mo</span>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  )
}
