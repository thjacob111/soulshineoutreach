'use client'
import { useState } from 'react'
import { useEditMode } from './EditModeContext'
import { WIRELESS_PLAN_COLUMNS } from '@/lib/pricing/constants'
import type { WirelessPlanRow, WirelessPlanSubRow } from '@/lib/pricing/types'

interface PlanTableProps {
  rows: WirelessPlanRow[]
  onRowTitleClick?: (row: WirelessPlanRow) => void
  onChange?: (rows: WirelessPlanRow[]) => void
}

const SUBROW_KEYS = [
  { key: 'domestic' as const, label: 'Domestic' },
  { key: 'international' as const, label: 'International' },
  { key: 'longDistance' as const, label: 'Long Distance' },
]
const LEAF_COLS: { key: string; label: string }[] = WIRELESS_PLAN_COLUMNS.flatMap(g => g.children.map(c => ({ key: c.key as string, label: c.label as string })))

function getVal(obj: unknown, path: string): string {
  return path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], obj) as string ?? ''
}
function setVal(obj: WirelessPlanSubRow, path: string, value: string): WirelessPlanSubRow {
  const result = JSON.parse(JSON.stringify(obj)) as WirelessPlanSubRow
  const keys = path.split('.')
  let cur: Record<string, unknown> = result as unknown as Record<string, unknown>
  for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]] as Record<string, unknown>
  cur[keys[keys.length - 1]] = value
  return result
}

const BLANK: WirelessPlanSubRow = {
  calling: { coverage: '', strength: '', callLimit: '' },
  text: { textLimit: '' },
  data: { dataLimit: '', loweredSpeed: '', dataSpeed: '' },
  hotspot: { limit: '', speed: '' },
  price: { standard: '', bundled: '', promo: '', promoDuration: '' },
}

export function PlanTable({ rows, onRowTitleClick, onChange }: PlanTableProps) {
  const { isEditing } = useEditMode()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggle = (id: string) => setExpanded(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })

  return (
    <div className="overflow-x-auto">
      <table className="text-sm border-collapse w-full">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-200 px-2 py-1 text-xs text-gray-600" rowSpan={2}>Plan</th>
            <th className="border border-gray-200 px-2 py-1 text-xs" rowSpan={2} />
            <th className="border border-gray-200 px-2 py-1 text-[10px] text-gray-400 w-20" rowSpan={2}>Scope</th>
            {WIRELESS_PLAN_COLUMNS.map(g => (
              <th key={g.label} className="border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700" colSpan={g.children.length}>{g.label}</th>
            ))}
            <th className="border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700" colSpan={3}>Price</th>
            {isEditing && <th className="w-8 border border-gray-200" rowSpan={2} />}
          </tr>
          <tr className="bg-gray-50">
            {LEAF_COLS.map(col => (
              <th key={col.key} className="border border-gray-200 px-2 py-1 text-[10px] text-gray-500 whitespace-nowrap">{col.label}</th>
            ))}
            {['Standard', 'Bundled', 'Promo'].map(p => <th key={p} className="border border-gray-200 px-2 py-1 text-[10px] text-gray-500">{p}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => {
            const isOpen = expanded.has(row.id)
            const visible = isOpen ? SUBROW_KEYS : [SUBROW_KEYS[0]]
            return visible.map(({ key, label }, subIdx) => (
              <tr key={`${row.id}-${key}`} className="hover:bg-gray-50">
                {subIdx === 0 && (
                  <>
                    <td className="border border-gray-200 px-2 py-1 align-top" rowSpan={visible.length}>
                      <button className="text-left text-xs font-semibold text-blue-700 hover:underline w-full" onClick={() => !isEditing && onRowTitleClick?.(row)}>
                        {isEditing ? <input className="border-b border-blue-400 outline-none w-full text-xs" value={row.title} onChange={e => onChange?.(rows.map((r, i) => i === rowIdx ? { ...r, title: e.target.value } : r))} /> : row.title}
                      </button>
                    </td>
                    <td className="border border-gray-200 px-1 py-1 text-center align-top" rowSpan={visible.length}>
                      <button onClick={() => toggle(row.id)} className="text-gray-400 hover:text-gray-600 text-[10px]">{isOpen ? 'v' : '>'}</button>
                    </td>
                  </>
                )}
                <td className="border border-gray-200 px-1 py-1 text-[10px] text-gray-400 bg-gray-50">{label}</td>
                {LEAF_COLS.map(col => (
                  <td key={col.key} className="border border-gray-200 px-2 py-1">
                    {isEditing
                      ? <input className="border-b border-blue-400 text-xs outline-none w-full min-w-[60px]" value={getVal(row[key], col.key)} onChange={e => onChange?.(rows.map((r, i) => i === rowIdx ? { ...r, [key]: setVal(r[key], col.key, e.target.value) } : r))} />
                      : <span className="text-xs text-gray-700">{getVal(row[key], col.key) || '—'}</span>}
                  </td>
                ))}
                {subIdx === 0 && (
                  <>
                    {(['standard', 'bundled', 'promo'] as const).map(pk => (
                      <td key={pk} className="border border-gray-200 px-2 py-1 align-top" rowSpan={visible.length}>
                        {isEditing ? (
                          <div className="flex flex-col gap-0.5">
                            <input className="border-b border-blue-400 text-xs outline-none w-full min-w-[70px]" value={row.domestic.price[pk]} onChange={e => onChange?.(rows.map((r, i) => i === rowIdx ? { ...r, domestic: { ...r.domestic, price: { ...r.domestic.price, [pk]: e.target.value } } } : r))} />
                            {pk === 'promo' && <input className="border-b border-blue-300 text-[10px] outline-none w-full text-gray-400" placeholder="duration" value={row.domestic.price.promoDuration} onChange={e => onChange?.(rows.map((r, i) => i === rowIdx ? { ...r, domestic: { ...r.domestic, price: { ...r.domestic.price, promoDuration: e.target.value } } } : r))} />}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-800">
                            {row.domestic.price[pk] || '—'}
                            {pk === 'promo' && row.domestic.price.promoDuration && <div className="text-[10px] text-gray-400">{row.domestic.price.promoDuration}</div>}
                          </div>
                        )}
                      </td>
                    ))}
                    {isEditing && <td className="border border-gray-200 px-1 py-1 text-center align-top" rowSpan={visible.length}><button onClick={() => onChange?.(rows.filter((_, i) => i !== rowIdx))} className="text-red-400 hover:text-red-600 text-xs">x</button></td>}
                  </>
                )}
              </tr>
            ))
          })}
          {rows.length === 0 && <tr><td colSpan={LEAF_COLS.length + (isEditing ? 6 : 5)} className="border border-gray-200 px-2 py-4 text-xs text-gray-400 italic text-center">No plans — click + Add Plan</td></tr>}
        </tbody>
      </table>
      {isEditing && (
        <button onClick={() => onChange?.([...rows, { id: crypto.randomUUID(), title: 'New Plan', domestic: { ...BLANK, price: { ...BLANK.price } }, international: { ...BLANK, price: { ...BLANK.price } }, longDistance: { ...BLANK, price: { ...BLANK.price } } }])} className="mt-1 text-xs text-blue-500 hover:text-blue-700 px-2">+ Add Plan</button>
      )}
    </div>
  )
}