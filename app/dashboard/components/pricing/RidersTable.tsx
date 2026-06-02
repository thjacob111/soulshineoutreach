'use client'
import { useEditMode } from './EditModeContext'
import { PriceCell } from './PriceCell'
import type { RiderRow } from '@/lib/pricing/types'

interface RidersTableProps {
  riders: RiderRow[]
  onChange?: (riders: RiderRow[]) => void
}

export function RidersTable({ riders, onChange }: RidersTableProps) {
  const { isEditing } = useEditMode()
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 px-2 py-1 text-left text-xs font-semibold text-gray-600">Rider</th>
            <th className="border border-gray-200 px-2 py-1 text-left text-xs font-semibold text-gray-600">Notes</th>
            <th className="border border-gray-200 px-2 py-1 text-left text-xs font-semibold text-gray-600">Price</th>
            {isEditing && <th className="w-8 border border-gray-200" />}
          </tr>
        </thead>
        <tbody>
          {riders.map((rider, idx) => (
            <tr key={rider.id} className="hover:bg-gray-50">
              <td className="border border-gray-200 px-2 py-1">
                {isEditing
                  ? <input className="w-full border-b border-blue-400 text-xs outline-none" value={rider.title} onChange={e => onChange?.(riders.map((r, i) => i === idx ? { ...r, title: e.target.value } : r))} />
                  : <span className="text-xs text-gray-800 font-medium">{rider.title}</span>}
              </td>
              <td className="border border-gray-200 px-2 py-1">
                {isEditing
                  ? <input className="w-full border-b border-blue-400 text-xs outline-none" value={rider.notes} onChange={e => onChange?.(riders.map((r, i) => i === idx ? { ...r, notes: e.target.value } : r))} />
                  : <span className="text-xs text-gray-600">{rider.notes || '—'}</span>}
              </td>
              <td className="border border-gray-200 px-2 py-1">
                <PriceCell {...rider.price} onChange={(field, value) => onChange?.(riders.map((r, i) => i === idx ? { ...r, price: { ...r.price, [field]: value } } : r))} />
              </td>
              {isEditing && (
                <td className="border border-gray-200 px-1 text-center">
                  <button onClick={() => onChange?.(riders.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 text-xs">x</button>
                </td>
              )}
            </tr>
          ))}
          {riders.length === 0 && (
            <tr><td colSpan={isEditing ? 4 : 3} className="border border-gray-200 px-2 py-3 text-xs text-gray-400 italic text-center">No riders</td></tr>
          )}
        </tbody>
      </table>
      {isEditing && (
        <button onClick={() => onChange?.([...riders, { id: crypto.randomUUID(), title: 'New Rider', notes: '', price: { standard: '', bundled: '', promo: '', promoDuration: '' } }])} className="mt-1 text-xs text-blue-500 hover:text-blue-700 px-2">+ Add Rider</button>
      )}
    </div>
  )
}