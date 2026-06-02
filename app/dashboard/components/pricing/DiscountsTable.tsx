'use client'
import { useEditMode } from './EditModeContext'
import { PriceCell } from './PriceCell'
import type { DiscountRow } from '@/lib/pricing/types'

interface DiscountsTableProps {
  rows: DiscountRow[]
  showHeader?: boolean
  onChange?: (rows: DiscountRow[]) => void
}

export function DiscountsTable({ rows, showHeader = true, onChange }: DiscountsTableProps) {
  const { isEditing } = useEditMode()
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        {showHeader && (
          <thead>
            <tr className="bg-gray-50">
              <th colSpan={2} className="border border-gray-200 px-2 py-1 text-left text-xs font-semibold text-gray-600">Perks</th>
              <th className="border border-gray-200 px-2 py-1 text-left text-xs font-semibold text-gray-600">Eligibility</th>
              <th className="border border-gray-200 px-2 py-1 text-left text-xs font-semibold text-gray-600">Price</th>
              {isEditing && <th className="w-8 border border-gray-200" />}
            </tr>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-2 py-1 text-left text-[10px] text-gray-500 w-32">Title</th>
              <th className="border border-gray-200 px-2 py-1 text-left text-[10px] text-gray-500">Description</th>
              <th className="border border-gray-200 px-2 py-1" />
              <th className="border border-gray-200 px-2 py-1" />
              {isEditing && <th />}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.id} className="hover:bg-gray-50">
              <td className="border border-gray-200 px-2 py-1">
                {isEditing ? <input className="w-full border-b border-blue-400 text-xs outline-none" value={row.title} onChange={e => onChange?.(rows.map((r, i) => i === idx ? { ...r, title: e.target.value } : r))} /> : <span className="text-xs font-medium text-gray-800">{row.title || '—'}</span>}
              </td>
              <td className="border border-gray-200 px-2 py-1">
                {isEditing ? <input className="w-full border-b border-blue-400 text-xs outline-none" value={row.description} onChange={e => onChange?.(rows.map((r, i) => i === idx ? { ...r, description: e.target.value } : r))} /> : <span className="text-xs text-gray-600">{row.description || '—'}</span>}
              </td>
              <td className="border border-gray-200 px-2 py-1">
                {isEditing ? <input className="w-full border-b border-blue-400 text-xs outline-none" value={row.eligibility} onChange={e => onChange?.(rows.map((r, i) => i === idx ? { ...r, eligibility: e.target.value } : r))} /> : <span className="text-xs text-gray-600">{row.eligibility || '—'}</span>}
              </td>
              <td className="border border-gray-200 px-2 py-1">
                <PriceCell {...row.price} onChange={(field, value) => onChange?.(rows.map((r, i) => i === idx ? { ...r, price: { ...r.price, [field]: value } } : r))} />
              </td>
              {isEditing && <td className="border border-gray-200 px-1 text-center"><button onClick={() => onChange?.(rows.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 text-xs">x</button></td>}
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={isEditing ? 5 : 4} className="border border-gray-200 px-2 py-3 text-xs text-gray-400 italic text-center">None added</td></tr>}
        </tbody>
      </table>
      {isEditing && (
        <button onClick={() => onChange?.([...rows, { id: crypto.randomUUID(), title: '', description: '', eligibility: '', price: { standard: '', bundled: '', promo: '', promoDuration: '' } }])} className="mt-1 text-xs text-blue-500 hover:text-blue-700 px-2">+ Add Row</button>
      )}
    </div>
  )
}