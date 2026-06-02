'use client'
import { useEditMode } from './EditModeContext'
import type { TradeInTier } from '@/lib/pricing/types'

interface Props {
  tiers: TradeInTier
  onClose: () => void
  onChange?: (tiers: TradeInTier) => void
}

export function TradeInTranslator({ tiers, onClose, onChange }: Props) {
  const { isEditing } = useEditMode()
  const cell = (value: string, key: keyof TradeInTier) =>
    isEditing
      ? <input className="border-b border-blue-400 text-xs outline-none w-16 text-gray-800" value={value} onChange={e => onChange?.({ ...tiers, [key]: e.target.value })} />
      : <span className="text-xs text-gray-800 font-medium">{value || '___'}</span>

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 min-w-[360px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-800">Trade-In Value Translator</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">X</button>
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-3 py-2 text-xs text-gray-600 text-left">Standard Price</th>
              <th className="border border-gray-200 px-3 py-2 text-xs text-gray-600 text-left">Promo Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-200 px-3 py-2 text-xs text-gray-600">&lt; {cell(tiers.lessThan, 'lessThan')}</td>
              <td className="border border-gray-200 px-3 py-2 text-xs text-gray-600">= {cell(tiers.promoLessThan, 'promoLessThan')}</td>
            </tr>
            <tr>
              <td className="border border-gray-200 px-3 py-2 text-xs text-gray-600">{cell(tiers.rangeMin, 'rangeMin')} &ndash; {cell(tiers.rangeMax, 'rangeMax')}</td>
              <td className="border border-gray-200 px-3 py-2 text-xs text-gray-600">= {cell(tiers.promoRange, 'promoRange')}</td>
            </tr>
            <tr>
              <td className="border border-gray-200 px-3 py-2 text-xs text-gray-600">&gt; {cell(tiers.greaterThan, 'greaterThan')}</td>
              <td className="border border-gray-200 px-3 py-2 text-xs text-gray-600">= {cell(tiers.promoGreaterThan, 'promoGreaterThan')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}