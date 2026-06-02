'use client'
import { useState } from 'react'
import { GroupBox } from './GroupBox'
import { WIRELESS_PLAN_COLUMNS, INTERNET_PLAN_COLUMNS } from '@/lib/pricing/constants'

type AnyPlanRow = { id: string; title: string } & Record<string, unknown>
export type PanelSchema = typeof WIRELESS_PLAN_COLUMNS | typeof INTERNET_PLAN_COLUMNS

interface Props { row: AnyPlanRow | null; schema: PanelSchema; source: string; onClose: () => void }

function getVal(obj: unknown, path: string): string {
  return path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], obj) as string ?? ''
}

export function PlanDetailsPanel({ row, schema, source, onClose }: Props) {
  const [description, setDescription] = useState('')
  if (!row) return null
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-50 w-full max-w-xl h-full bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 shrink-0">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">{source}</p>
            <h2 className="text-sm font-bold text-gray-800">{row.title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">X</button>
        </div>
        <div className="p-4 flex flex-col gap-4 flex-1 overflow-y-auto">
          {schema.map(group => (
            <GroupBox key={group.label} label={group.label} variant="parent">
              {group.children.map(col => {
                const c = col as { key: string; label: string }
                return (
                  <div key={c.key} className="flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-xs text-gray-400 w-44 shrink-0">{c.label}</span>
                    <span className="text-xs text-gray-800 font-medium">{getVal(row, c.key) || '—'}</span>
                  </div>
                )
              })}
            </GroupBox>
          ))}
          <GroupBox label="Description" variant="child">
            <textarea className="w-full text-xs text-gray-800 resize-none border-none outline-none min-h-[100px] bg-transparent placeholder-gray-300" placeholder="Add a description for this plan..." value={description} onChange={e => setDescription(e.target.value)} />
          </GroupBox>
        </div>
      </div>
    </div>
  )
}