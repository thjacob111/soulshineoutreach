'use client'
import { useEditMode } from './EditModeContext'

interface PriceCellProps {
  standard: string
  bundled: string
  promo: string
  promoDuration: string
  onChange?: (field: 'standard' | 'bundled' | 'promo' | 'promoDuration', value: string) => void
}

export function PriceCell({ standard, bundled, promo, promoDuration, onChange }: PriceCellProps) {
  const { isEditing } = useEditMode()

  const row = (label: string, value: string, key: 'standard' | 'bundled' | 'promo') => (
    <div className="flex items-center gap-1 text-xs">
      <span className="text-gray-400 w-12 shrink-0">{label}</span>
      {isEditing
        ? <input className="border-b border-blue-400 text-xs outline-none w-full text-gray-800" value={value} onChange={e => onChange?.(key, e.target.value)} />
        : <span className="text-gray-800 font-medium">{value || '—'}</span>}
    </div>
  )

  return (
    <div className="flex flex-col gap-0.5 min-w-[100px]">
      {row('Std', standard, 'standard')}
      {row('Bndl', bundled, 'bundled')}
      {row('Promo', promo, 'promo')}
      <div className="pl-14 text-[10px] text-gray-400">
        {isEditing
          ? <input className="border-b border-blue-300 text-[10px] outline-none w-full" value={promoDuration} placeholder="duration" onChange={e => onChange?.('promoDuration', e.target.value)} />
          : promoDuration || null}
      </div>
    </div>
  )
}