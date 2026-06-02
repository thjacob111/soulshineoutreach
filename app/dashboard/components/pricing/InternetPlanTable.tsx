'use client'
import { useEditMode } from './EditModeContext'
import { INTERNET_PLAN_COLUMNS } from '@/lib/pricing/constants'
import type { InternetPlanRow } from '@/lib/pricing/types'

interface Props { rows: InternetPlanRow[]; onRowTitleClick?: (row: InternetPlanRow) => void; onChange?: (rows: InternetPlanRow[]) => void }

const LEAF_COLS: { key: string; label: string }[] = INTERNET_PLAN_COLUMNS.flatMap(g => g.children.map(c => ({ key: c.key as string, label: c.label as string })))

function getVal(obj: unknown, path: string): string {
  return path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], obj) as string ?? ''
}
function setVal(row: InternetPlanRow, path: string, value: string): InternetPlanRow {
  const result = JSON.parse(JSON.stringify(row)) as InternetPlanRow
  const keys = path.split('.')
  let cur: Record<string, unknown> = result as unknown as Record<string, unknown>
  for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]] as Record<string, unknown>
  cur[keys[keys.length - 1]] = value
  return result
}
const BLANK: Omit<InternetPlanRow, 'id' | 'title'> = {
  usage: { term: '', speeds: { down: { min: '', max: '' }, up: { min: '', max: '' } }, data: { cap: '', extraCharge: { tier1: { data: '', charge: '' }, tier2: { data: '', charge: '' } } } },
  install: { linesRun: { phase1: { type: '', routing: '' }, phase2: { type: '', routing: '' } } },
  equipment: { cost: '', router: { provided: '', cost: '' }, backupPower: '' },
  price: { standard: '', bundled: '', promo: '', promoDuration: '' },
}

export function InternetPlanTable({ rows, onRowTitleClick, onChange }: Props) {
  const { isEditing } = useEditMode()
  return (
    <div className="overflow-x-auto">
      <table className="text-sm border-collapse w-full">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-200 px-2 py-1 text-xs text-gray-600" rowSpan={2}>Plan</th>
            {INTERNET_PLAN_COLUMNS.map(g => <th key={g.label} className="border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700" colSpan={g.children.length}>{g.label}</th>)}
            <th className="border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700" colSpan={3}>Price</th>
            {isEditing && <th className="w-8 border border-gray-200" rowSpan={2} />}
          </tr>
          <tr className="bg-gray-50">
            {LEAF_COLS.map(col => <th key={col.key} className="border border-gray-200 px-2 py-1 text-[10px] text-gray-500 whitespace-nowrap">{col.label}</th>)}
            {['Standard', 'Bundled', 'Promo'].map(p => <th key={p} className="border border-gray-200 px-2 py-1 text-[10px] text-gray-500">{p}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={row.id} className="hover:bg-gray-50">
              <td className="border border-gray-200 px-2 py-1">
                <button className="text-xs font-semibold text-blue-700 hover:underline text-left w-full" onClick={() => !isEditing && onRowTitleClick?.(row)}>
                  {isEditing ? <input className="border-b border-blue-400 outline-none w-full text-xs" value={row.title} onChange={e => onChange?.(rows.map((r, i) => i === rowIdx ? { ...r, title: e.target.value } : r))} /> : row.title}
                </button>
              </td>
              {LEAF_COLS.map(col => (
                <td key={col.key} className="border border-gray-200 px-2 py-1">
                  {isEditing
                    ? <input className="border-b border-blue-400 text-xs outline-none w-full min-w-[60px]" value={getVal(row, col.key)} onChange={e => onChange?.(rows.map((r, i) => i === rowIdx ? setVal(r, col.key, e.target.value) : r))} />
                    : <span className="text-xs text-gray-700">{getVal(row, col.key) || '—'}</span>}
                </td>
              ))}
              {(['standard', 'bundled', 'promo'] as const).map(pk => (
                <td key={pk} className="border border-gray-200 px-2 py-1">
                  {isEditing ? (
                    <div className="flex flex-col gap-0.5">
                      <input className="border-b border-blue-400 text-xs outline-none w-full min-w-[70px]" value={row.price[pk]} onChange={e => onChange?.(rows.map((r, i) => i === rowIdx ? { ...r, price: { ...r.price, [pk]: e.target.value } } : r))} />
                      {pk === 'promo' && <input className="border-b border-blue-300 text-[10px] outline-none w-full text-gray-400" placeholder="duration" value={row.price.promoDuration} onChange={e => onChange?.(rows.map((r, i) => i === rowIdx ? { ...r, price: { ...r.price, promoDuration: e.target.value } } : r))} />}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-800">{row.price[pk] || '—'}{pk === 'promo' && row.price.promoDuration && <div className="text-[10px] text-gray-400">{row.price.promoDuration}</div>}</div>
                  )}
                </td>
              ))}
              {isEditing && <td className="border border-gray-200 px-1 text-center"><button onClick={() => onChange?.(rows.filter((_, i) => i !== rowIdx))} className="text-red-400 hover:text-red-600 text-xs">x</button></td>}
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={LEAF_COLS.length + (isEditing ? 5 : 4)} className="border border-gray-200 px-2 py-4 text-xs text-gray-400 italic text-center">No plans</td></tr>}
        </tbody>
      </table>
      {isEditing && <button onClick={() => onChange?.([...rows, { id: crypto.randomUUID(), title: 'New Plan', ...BLANK }])} className="mt-1 text-xs text-blue-500 hover:text-blue-700 px-2">+ Add Plan</button>}
    </div>
  )
}