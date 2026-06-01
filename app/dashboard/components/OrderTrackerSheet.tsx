'use client'

import React, { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'

// Lookup data (mirrors the Lookup sheet)
const PLAN_COMMISSION: Record<string, number> = {
  Extra: 95,
  Premium: 105,
  Value: 50,
  Senior: 95,
}
const PLAN_OPTIONS = ['', 'Extra', 'Premium', 'Value', 'Senior']
const NU_BONUS = 10
const I_BONUS = 7

const INTERNET_COMMISSION: Record<string, number> = {
  '100 Mbps': 135,
  '300 Mbps': 145,
  '500 Mbps': 155,
  '1Gb': 165,
}
const INTERNET_OPTIONS = ['', '100 Mbps', '300 Mbps', '500 Mbps', '1Gb']

interface LineData {
  plan: string
  nu: boolean
  i: boolean
}

interface OrderRow {
  id: number
  customerName: string
  orderNum: string
  orderDate: string
  activationStatus: string
  lines: [LineData, LineData, LineData, LineData, LineData]
  internetPlan: string
  splitPercent: number
  notes: string
}

// Mirrors the spreadsheet formula exactly:
// - If any line has Senior → all lines use $95, NU bonus suppressed
// - If this line is Value: $50 only if 2+ total lines AND at least one Extra/Premium
// - NU bonus ($10) excluded when any line has Senior
// - Insurance bonus ($7) always applies if checked
function computeLineComm(allLines: LineData[], lineIdx: number): number | null {
  const line = allLines[lineIdx]
  if (!line.plan) return null

  const plans = allLines.map(l => l.plan)
  const hasSenior = plans.some(p => p === 'Senior')
  const lineCount = plans.filter(p => p !== '').length
  const hasExtraOrPremium = plans.some(p => p === 'Extra' || p === 'Premium')

  let base: number
  if (hasSenior) {
    base = 95
  } else if (line.plan === 'Value') {
    base = lineCount >= 2 && hasExtraOrPremium ? 50 : 0
  } else {
    base = PLAN_COMMISSION[line.plan] ?? 0
  }

  const nuBonus = line.nu && !hasSenior ? NU_BONUS : 0
  const iBonus = line.i ? I_BONUS : 0
  return base + nuBonus + iBonus
}

function computeInternetComm(plan: string): number | null {
  if (!plan) return null
  return INTERNET_COMMISSION[plan] ?? null
}

function fmt(val: number | null): string {
  if (val === null) return '-'
  return `$${val.toLocaleString()}`
}

function parseBool(val: unknown): boolean {
  return val === 'TRUE' || val === true || val === 1
}

function parseSplit(val: unknown): number {
  const s = String(val ?? '')
  if (!s) return 0
  if (s.includes('%')) return parseFloat(s) / 100
  const n = parseFloat(s)
  return isNaN(n) ? 0 : n
}

function buildRows(data: unknown[][]): OrderRow[] {
  return data.slice(2).map((r, idx) => ({
    id: idx + 2,
    customerName: String(r[0] ?? ''),
    orderNum: String(r[1] ?? ''),
    orderDate: String(r[2] ?? ''),
    activationStatus: String(r[3] ?? ''),
    lines: [
      { plan: String(r[4] ?? ''), nu: parseBool(r[5]), i: parseBool(r[6]) },
      { plan: String(r[8] ?? ''), nu: parseBool(r[9]), i: parseBool(r[10]) },
      { plan: String(r[12] ?? ''), nu: parseBool(r[13]), i: parseBool(r[14]) },
      { plan: String(r[16] ?? ''), nu: parseBool(r[17]), i: parseBool(r[18]) },
      { plan: String(r[20] ?? ''), nu: parseBool(r[21]), i: parseBool(r[22]) },
    ],
    internetPlan: String(r[24] ?? ''),
    splitPercent: parseSplit(r[27]),
    notes: String(r[30] ?? ''),
  }))
}

const TH: React.CSSProperties = {
  padding: '4px 6px',
  border: '1px solid #4b5563',
  textAlign: 'center',
  whiteSpace: 'nowrap',
  fontSize: 11,
  color: '#fff',
  fontWeight: 600,
}

const TD: React.CSSProperties = {
  padding: '2px 4px',
  border: '1px solid #e5e7eb',
  whiteSpace: 'nowrap',
  fontSize: 11,
  color: '#111827',
}

const SEL: React.CSSProperties = {
  fontSize: 11,
  border: '1px solid #d1d5db',
  borderRadius: 3,
  padding: '1px 2px',
  background: 'white',
  width: '100%',
  color: '#111827',
}

export default function OrderTrackerSheet() {
  const [rows, setRows] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/spreadsheets/order-tracker.xlsx')
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.arrayBuffer() })
      .then(buf => {
        const wb = XLSX.read(buf, { type: 'array', raw: false })
        const ws = wb.Sheets['Order Tracker']
        const data = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, defval: '' })
        setRows(buildRows(data))
        setLoading(false)
      })
      .catch(() => { setError('Could not load spreadsheet'); setLoading(false) })
  }, [])

  function setLine(rowId: number, li: number, field: keyof LineData, val: string | boolean) {
    setRows(prev => prev.map(row => {
      if (row.id !== rowId) return row
      const lines = row.lines.map((line, i) =>
        i === li ? { ...line, [field]: val } : line
      ) as [LineData, LineData, LineData, LineData, LineData]
      return { ...row, lines }
    }))
  }

  function setInternet(rowId: number, plan: string) {
    setRows(prev => prev.map(row =>
      row.id === rowId ? { ...row, internetPlan: plan } : row
    ))
  }

  if (loading) return <p className="text-gray-400 text-sm py-6 text-center">Loading spreadsheet...</p>
  if (error)   return <p className="text-red-500 text-sm py-6 text-center">{error}</p>
  if (!rows.length) return <p className="text-gray-400 text-sm py-6 text-center">No data found.</p>

  return (
    <div className="space-y-2">
      <a
        href="/spreadsheets/order-tracker.xlsx"
        download="Order Tracker.xlsx"
        className="inline-block text-xs text-blue-600 border border-blue-600 rounded px-2 py-1 hover:bg-blue-50 transition-colors"
      >
        ⬇ Download
      </a>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="border-collapse" style={{ fontSize: 11, minWidth: 'max-content' }}>
          <colgroup>
            <col style={{ width: 120 }} /><col style={{ width: 80 }} />
            <col style={{ width: 90 }} /><col style={{ width: 95 }} />
            {[0,1,2,3,4].map(i => (
              <React.Fragment key={i}>
                <col style={{ width: 88 }} /><col style={{ width: 32 }} />
                <col style={{ width: 32 }} /><col style={{ width: 72 }} />
              </React.Fragment>
            ))}
            <col style={{ width: 92 }} /><col style={{ width: 76 }} />
            <col style={{ width: 72 }} /><col style={{ width: 60 }} />
            <col style={{ width: 70 }} /><col style={{ width: 70 }} />
            <col style={{ width: 120 }} />
          </colgroup>
          <thead>
            <tr style={{ backgroundColor: '#1e3a5f' }}>
              <th style={TH} colSpan={4}>CUSTOMER</th>
              {(['LINE 1','LINE 2','LINE 3','LINE 4','LINE 5'] as const).map(l => (
                <th key={l} style={TH} colSpan={4}>{l}</th>
              ))}
              <th style={TH} colSpan={2}>INTERNET</th>
              <th style={TH} colSpan={4}>COMMISSION</th>
              <th style={TH}>NOTES</th>
            </tr>
            <tr style={{ backgroundColor: '#374151' }}>
              {['Customer Name','Order #','Order Date','Activation'].map(h => (
                <th key={h} style={TH}>{h}</th>
              ))}
              {[0,1,2,3,4].map(i => (
                <React.Fragment key={i}>
                  <th style={TH}>Plan</th>
                  <th style={TH}>NU</th>
                  <th style={TH}>I</th>
                  <th style={TH}>Comm.</th>
                </React.Fragment>
              ))}
              <th style={TH}>Plan</th><th style={TH}>Comm.</th>
              <th style={TH}>Total</th><th style={TH}>Split%</th>
              <th style={TH}>Thomas</th><th style={TH}>Mario</th>
              <th style={TH}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => {
              const lineComms = row.lines.map((_, li) => computeLineComm(row.lines, li))
              const internetComm = computeInternetComm(row.internetPlan)
              const hasData = row.lines.some(l => l.plan !== '') || row.internetPlan !== ''
              const totalComm = hasData
                ? lineComms.reduce<number>((s, c) => s + (c ?? 0), 0) + (internetComm ?? 0)
                : null
              const thomas = totalComm !== null && row.splitPercent
                ? Math.round(totalComm * row.splitPercent) : null
              const mario = totalComm !== null && row.splitPercent
                ? Math.round(totalComm * (1 - row.splitPercent)) : null
              const bg = ri % 2 === 0 ? '#fff' : '#f9fafb'
              const statusColor =
                row.activationStatus === 'Activated' ? '#059669' :
                row.activationStatus === 'Pending' ? '#d97706' : '#111827'

              return (
                <tr key={row.id} style={{ backgroundColor: bg }}>
                  <td style={TD}>{row.customerName}</td>
                  <td style={TD}>{row.orderNum}</td>
                  <td style={TD}>{row.orderDate}</td>
                  <td style={{ ...TD, color: statusColor, fontWeight: row.activationStatus ? 500 : undefined }}>
                    {row.activationStatus}
                  </td>

                  {row.lines.map((line, li) => (
                    <React.Fragment key={li}>
                      <td style={TD}>
                        <select
                          value={line.plan}
                          onChange={e => setLine(row.id, li, 'plan', e.target.value)}
                          style={SEL}
                        >
                          {PLAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </td>
                      <td style={{ ...TD, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={line.nu}
                          onChange={e => setLine(row.id, li, 'nu', e.target.checked)}
                          style={{ width: 12, height: 12, cursor: 'pointer', accentColor: '#1d4ed8' }}
                        />
                      </td>
                      <td style={{ ...TD, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={line.i}
                          onChange={e => setLine(row.id, li, 'i', e.target.checked)}
                          style={{ width: 12, height: 12, cursor: 'pointer', accentColor: '#1d4ed8' }}
                        />
                      </td>
                      <td style={{ ...TD, color: lineComms[li] !== null ? '#059669' : '#9ca3af', fontWeight: 500 }}>
                        {fmt(lineComms[li])}
                      </td>
                    </React.Fragment>
                  ))}

                  <td style={TD}>
                    <select
                      value={row.internetPlan}
                      onChange={e => setInternet(row.id, e.target.value)}
                      style={SEL}
                    >
                      {INTERNET_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                  <td style={{ ...TD, color: internetComm !== null ? '#059669' : '#9ca3af', fontWeight: 500 }}>
                    {fmt(internetComm)}
                  </td>

                  <td style={{ ...TD, fontWeight: 700 }}>{fmt(totalComm)}</td>
                  <td style={TD}>{row.splitPercent ? `${Math.round(row.splitPercent * 100)}%` : '-'}</td>
                  <td style={{ ...TD, color: '#2563eb', fontWeight: 600 }}>{fmt(thomas)}</td>
                  <td style={{ ...TD, color: '#7c3aed', fontWeight: 600 }}>{fmt(mario)}</td>
                  <td style={TD}>{row.notes}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
