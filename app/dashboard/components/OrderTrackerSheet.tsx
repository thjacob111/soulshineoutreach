'use client'

import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'

type ViewMode = 'phone' | 'tablet' | 'desktop'

interface ParsedCell {
  display: string
  formula: string | null
  isBoolean: boolean
  boolValue: boolean
  bgColor: string | null
  colSpan: number
  rowSpan: number
  hidden: boolean
}

interface SheetView {
  name: string
  rows: ParsedCell[][]
  rowOffset: number
  colOffset: number
  colWidths: number[]
  rowHeights: number[]
}

const VIEW_SCALE: Record<ViewMode, number> = {
  phone:   0.6,
  tablet:  0.8,
  desktop: 1.0,
}

function colLabel(c: number): string {
  let s = ''
  for (let n = c; n >= 0; n = Math.floor(n / 26) - 1) {
    s = String.fromCharCode(65 + (n % 26)) + s
  }
  return s
}

function isLightBg(rgb: string): boolean {
  const r = parseInt(rgb.slice(0, 2), 16)
  const g = parseInt(rgb.slice(2, 4), 16)
  const b = parseInt(rgb.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 160
}

export default function OrderTrackerSheet() {
  const [sheets, setSheets] = useState<SheetView[]>([])
  const [activeSheet, setActiveSheet] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('desktop')
  const [boolState, setBoolState] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch('/spreadsheets/order-tracker.xlsx')
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.arrayBuffer() })
      .then(buf => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wb = XLSX.read(buf, { type: 'array', cellFormula: true, cellNF: true, cellStyles: true }) as any
        const initialBools: Record<string, boolean> = {}

        const result: SheetView[] = (wb.SheetNames as string[]).map(sheetName => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ws = wb.Sheets[sheetName] as any
          const ref = ws['!ref'] as string | undefined
          if (!ref) return { name: sheetName, rows: [], rowOffset: 0, colOffset: 0, colWidths: [], rowHeights: [] }

          const range = XLSX.utils.decode_range(ref)

          const mergeStart = new Map<string, { colSpan: number; rowSpan: number }>()
          const mergeCovered = new Set<string>()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const m of ((ws['!merges'] ?? []) as any[])) {
            mergeStart.set(`${m.s.r},${m.s.c}`, {
              colSpan: m.e.c - m.s.c + 1,
              rowSpan: m.e.r - m.s.r + 1,
            })
            for (let r = m.s.r; r <= m.e.r; r++) {
              for (let c = m.s.c; c <= m.e.c; c++) {
                if (r !== m.s.r || c !== m.s.c) mergeCovered.add(`${r},${c}`)
              }
            }
          }

          const rows: ParsedCell[][] = []
          for (let r = range.s.r; r <= range.e.r; r++) {
            const row: ParsedCell[] = []
            for (let c = range.s.c; c <= range.e.c; c++) {
              const addr = XLSX.utils.encode_cell({ r, c })
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const cell = ws[addr] as any
              const key = `${r},${c}`
              const isBoolean = cell?.t === 'b'
              const boolValue = isBoolean ? Boolean(cell.v) : false
              const merge = mergeStart.get(key)

              if (isBoolean) {
                initialBools[`${sheetName}:${addr}`] = boolValue
              }

              row.push({
                display: !cell || cell.t === 'z' ? '' : (cell.w ?? String(cell.v ?? '')),
                formula: cell?.f ?? null,
                isBoolean,
                boolValue,
                bgColor: (cell?.s?.fgColor?.rgb as string | undefined) ?? null,
                colSpan: merge?.colSpan ?? 1,
                rowSpan: merge?.rowSpan ?? 1,
                hidden: mergeCovered.has(key),
              })
            }
            rows.push(row)
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const colWidths = ((ws['!cols'] ?? []) as any[]).map((col: any) => (col?.wpx as number | undefined) ?? 64)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rowHeights = ((ws['!rows'] ?? []) as any[]).map((row: any) => (row?.hpx as number | undefined) ?? 18)

          return { name: sheetName, rows, rowOffset: range.s.r, colOffset: range.s.c, colWidths, rowHeights }
        })

        setSheets(result)
        setBoolState(initialBools)
        setLoading(false)
      })
      .catch(() => { setError('Could not load spreadsheet'); setLoading(false) })
  }, [])

  if (loading) return <p className="text-gray-400 text-sm py-6 text-center">Loading spreadsheet...</p>
  if (error)   return <p className="text-red-500 text-sm py-6 text-center">{error}</p>
  if (!sheets.length) return <p className="text-gray-400 text-sm py-6 text-center">No data found.</p>

  const sheet = sheets[activeSheet]
  const scale = VIEW_SCALE[viewMode]

  const selCell = selected ? sheet.rows[selected.r]?.[selected.c] ?? null : null
  const cellAddr = selected
    ? `${colLabel(sheet.colOffset + selected.c)}${sheet.rowOffset + selected.r + 1}`
    : ''
  const formulaBarText = selCell?.formula ? `=${selCell.formula}` : (selCell?.display ?? '')

  return (
    <div className="space-y-2">

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <a
          href="/spreadsheets/order-tracker.xlsx"
          download="Order Tracker.xlsx"
          className="text-xs text-blue-600 border border-blue-600 rounded px-2 py-1 hover:bg-blue-50 transition-colors shrink-0"
        >
          ⬇ Download
        </a>
        <div className="flex items-center gap-1 ml-auto shrink-0">
          <label className="text-xs text-gray-500">View</label>
          <select
            value={viewMode}
            onChange={e => setViewMode(e.target.value as ViewMode)}
            className="text-xs border border-gray-300 rounded px-1.5 py-1 bg-white"
          >
            <option value="phone">Phone</option>
            <option value="tablet">Tablet</option>
            <option value="desktop">Desktop</option>
          </select>
        </div>
      </div>

      {/* Sheet tabs */}
      {sheets.length > 1 && (
        <div className="flex gap-1 flex-wrap">
          {sheets.map((s, i) => (
            <button
              key={s.name}
              onClick={() => { setActiveSheet(i); setSelected(null) }}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                activeSheet === i ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Formula bar */}
      <div className="flex items-center gap-1.5 border border-gray-300 rounded px-2 py-[5px] bg-gray-50">
        <span className="text-[10px] text-gray-400 font-mono w-8 shrink-0 text-center">{cellAddr}</span>
        <span className="w-px h-3.5 bg-gray-300 shrink-0" />
        <span className={`text-xs font-mono flex-1 truncate ${selCell?.formula ? 'text-green-700' : 'text-gray-800'}`}>
          {formulaBarText || <span className="text-gray-300 select-none">Click a cell</span>}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="border-collapse" style={{ fontSize: Math.round(11 * scale) }}>
          <colgroup>
            {sheet.colWidths.map((w, i) => (
              <col key={i} style={{ width: Math.round(w * scale) }} />
            ))}
          </colgroup>
          <tbody>
            {sheet.rows.map((row, ri) => {
              const rowH = Math.round((sheet.rowHeights[ri] ?? 18) * scale)
              return (
                <tr key={ri} style={{ height: rowH }}>
                  {row.map((cell, ci) => {
                    if (cell.hidden) return null
                    const isSel = selected?.r === ri && selected?.c === ci
                    const bg = cell.bgColor ? `#${cell.bgColor}` : (ri % 2 === 0 ? '#ffffff' : '#f9fafb')
                    const textColor = cell.bgColor && !isLightBg(cell.bgColor) ? '#ffffff' : '#111827'
                    const addr = XLSX.utils.encode_cell({ r: sheet.rowOffset + ri, c: sheet.colOffset + ci })
                    const boolKey = `${sheet.name}:${addr}`

                    return (
                      <td
                        key={ci}
                        colSpan={cell.colSpan > 1 ? cell.colSpan : undefined}
                        rowSpan={cell.rowSpan > 1 ? cell.rowSpan : undefined}
                        onClick={() => { if (!cell.isBoolean) setSelected({ r: ri, c: ci }) }}
                        title={cell.formula ? `=${cell.formula}` : cell.display}
                        className={[
                          'border border-gray-300 whitespace-nowrap overflow-hidden',
                          cell.isBoolean ? 'text-center' : 'truncate cursor-pointer',
                          isSel ? 'ring-2 ring-inset ring-blue-500' : '',
                        ].join(' ')}
                        style={{
                          backgroundColor: isSel ? '#eff6ff' : bg,
                          color: isSel ? '#1e40af' : textColor,
                          padding: `1px ${Math.round(4 * scale)}px`,
                          height: rowH,
                          fontWeight: ri <= 1 ? '600' : undefined,
                          textAlign: cell.colSpan > 1 ? 'center' : undefined,
                        }}
                      >
                        {cell.isBoolean ? (
                          <input
                            type="checkbox"
                            checked={boolState[boolKey] ?? cell.boolValue}
                            onChange={() => setBoolState(prev => ({
                              ...prev,
                              [boolKey]: !(prev[boolKey] ?? cell.boolValue),
                            }))}
                            onClick={e => e.stopPropagation()}
                            style={{
                              width: Math.round(12 * scale),
                              height: Math.round(12 * scale),
                              cursor: 'pointer',
                              accentColor: '#1d4ed8',
                            }}
                          />
                        ) : cell.display}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
