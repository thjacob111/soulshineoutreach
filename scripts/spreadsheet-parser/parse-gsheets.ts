// scripts/spreadsheet-parser/parse-gsheets.ts
import { google } from 'googleapis'
import * as XLSX from 'xlsx'
import type { SheetSchema, ColumnDef, RowData, CellType, CellStyleMap, MergeRange, CFRule, CellStyle } from './types.ts'
import { sanitizeName, emptySchema } from './parse-xlsx.ts'

function extractSheetId(url: string): string {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  if (!match) throw new Error(`Cannot extract sheet ID from URL: ${url}`)
  return match[1]
}

async function getAuth(): Promise<unknown> {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (keyPath) {
    const auth = new google.auth.GoogleAuth({
      keyFile: keyPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })
    return auth.getClient()
  }
  const apiKey = process.env.GOOGLE_API_KEY
  if (apiKey) return apiKey
  return null
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${Math.round(r * 255).toString(16).padStart(2, '0')}${Math.round(g * 255).toString(16).padStart(2, '0')}${Math.round(b * 255).toString(16).padStart(2, '0')}`
}

export async function parseGoogleSheet(url: string): Promise<SheetSchema> {
  const sheetId = extractSheetId(url)
  const auth = await getAuth()
  const sheetsApi = google.sheets({ version: 'v4', auth })

  const response = await sheetsApi.spreadsheets.get({
    spreadsheetId: sheetId,
    includeGridData: true,
  })

  const sheet = response.data.sheets?.[0]
  if (!sheet) throw new Error('No sheets found')

  const sheetName = sheet.properties?.title ?? 'Sheet1'
  const gridData = sheet.data?.[0]
  if (!gridData) throw new Error('No grid data')

  const rowData: unknown[] = (gridData as { rowData?: unknown[] }).rowData ?? []
  if (rowData.length === 0) return emptySchema(sheetName)

  const firstRow = rowData[0] as { values?: { formattedValue?: string }[] }
  const headers: string[] = (firstRow?.values ?? []).map((c) => c?.formattedValue ?? '')
  const seen = new Set<string>()
  const colNames: string[] = headers.map((h, i) => {
    let name = h ? sanitizeName(h) : `col_${i}`
    let d = name; let n = 2
    while (seen.has(d)) d = `${name}_${n++}`
    seen.add(d); return d
  })

  const sheetColMeta: { pixelSize?: number }[] = (gridData as { columnMetadata?: { pixelSize?: number }[] }).columnMetadata ?? []
  const columns: ColumnDef[] = colNames.map((name, i) => ({
    name, header: headers[i],
    type: 'text' as CellType,
    index: i,
    widthPx: sheetColMeta[i]?.pixelSize ?? 100,
    hasFormula: false,
  }))

  const typeCounts: Record<number, Record<CellType, number>> = {}
  columns.forEach((_, i) => { typeCounts[i] = { text: 0, number: 0, date: 0, boolean: 0 } })

  const rows: RowData[] = []
  for (const rowEntry of rowData.slice(1)) {
    const cells: unknown[] = (rowEntry as { values?: unknown[] })?.values ?? []
    const row: RowData = {}
    columns.forEach((col, i) => {
      const cell = cells[i] as {
        effectiveValue?: { numberValue?: number; boolValue?: boolean; stringValue?: string }
        userEnteredValue?: { formulaValue?: string }
      } | undefined
      if (!cell) { row[col.name] = null; return }
      const ev = cell.effectiveValue
      if (ev?.numberValue != null) { row[col.name] = ev.numberValue; typeCounts[i].number++ }
      else if (ev?.boolValue != null) { row[col.name] = ev.boolValue; typeCounts[i].boolean++ }
      else if (ev?.stringValue != null) { row[col.name] = ev.stringValue; typeCounts[i].text++ }
      else { row[col.name] = null }
      if (cell.userEnteredValue?.formulaValue) {
        col.hasFormula = true
        col.formula = cell.userEnteredValue.formulaValue.replace(/^=/, '')
      }
    })
    rows.push(row)
  }
  columns.forEach((col, i) => {
    col.type = (Object.entries(typeCounts[i]) as [CellType, number][]).reduce((a, b) => b[1] > a[1] ? b : a)[0]
  })

  const styles: CellStyleMap = {}
  rowData.forEach((rowEntry: unknown, r: number) => {
    const cells = (rowEntry as { values?: unknown[] })?.values ?? []
    cells.forEach((cell: unknown, c: number) => {
      const fmt = (cell as { effectiveFormat?: Record<string, unknown> })?.effectiveFormat
      if (!fmt) return
      const addr = XLSX.utils.encode_cell({ r, c })
      const style: CellStyle = {}
      const bg = fmt.backgroundColor as { red?: number; green?: number; blue?: number } | undefined
      if (bg && (bg.red || bg.green || bg.blue))
        style.backgroundColor = rgbToHex(bg.red ?? 0, bg.green ?? 0, bg.blue ?? 0)
      const font = fmt.textFormat as { bold?: boolean; italic?: boolean; fontSize?: number; foregroundColor?: { red?: number; green?: number; blue?: number } } | undefined
      if (font?.bold) style.bold = true
      if (font?.italic) style.italic = true
      if (font?.fontSize) style.fontSize = font.fontSize
      const fc = font?.foregroundColor
      if (fc && (fc.red || fc.green || fc.blue))
        style.color = rgbToHex(fc.red ?? 0, fc.green ?? 0, fc.blue ?? 0)
      if (fmt.horizontalAlignment) style.horizontalAlign = (fmt.horizontalAlignment as string).toLowerCase() as CellStyle['horizontalAlign']
      if (Object.keys(style).length) styles[addr] = style
    })
  })

  const gridProps = sheet.properties?.gridProperties ?? {}
  const frozenRows: number = (gridProps as { frozenRowCount?: number }).frozenRowCount ?? 0
  const frozenCols: number = (gridProps as { frozenColumnCount?: number }).frozenColumnCount ?? 0

  const mergedCells: MergeRange[] = ((sheet as { merges?: unknown[] }).merges ?? []).map((m: unknown) => {
    const merge = m as { startRowIndex: number; startColumnIndex: number; endRowIndex: number; endColumnIndex: number }
    return {
      startRow: merge.startRowIndex,
      startCol: merge.startColumnIndex,
      endRow: merge.endRowIndex - 1,
      endCol: merge.endColumnIndex - 1,
    }
  })

  const conditionalFormatting: CFRule[] = ((sheet as { conditionalFormats?: unknown[] }).conditionalFormats ?? []).flatMap((cf: unknown) => {
    const cfEntry = cf as {
      booleanRule?: {
        format?: { backgroundColor?: { red?: number; green?: number; blue?: number } }
        condition?: { type?: string; values?: { userEnteredValue?: string }[] }
      }
      ranges?: { startRowIndex: number; endRowIndex: number }[]
    }
    const rule = cfEntry.booleanRule
    if (!rule) return []
    const style: CellStyle = {}
    const bg = rule.format?.backgroundColor
    if (bg) style.backgroundColor = rgbToHex(bg.red ?? 0, bg.green ?? 0, bg.blue ?? 0)
    const cond = rule.condition
    const typeMap: Record<string, string> = {
      NUMBER_GREATER: 'CELL_VALUE >',
      NUMBER_LESS: 'CELL_VALUE <',
      NUMBER_GREATER_THAN_EQ: 'CELL_VALUE >=',
      NUMBER_LESS_THAN_EQ: 'CELL_VALUE <=',
      NUMBER_EQ: 'CELL_VALUE ===',
    }
    const op = cond?.type ? typeMap[cond.type] : undefined
    const val = cond?.values?.[0]?.userEnteredValue
    const condition = op ? `${op} ${val}` : cond?.type === 'CUSTOM_FORMULA' ? `FORMULA:${val}` : ''
    const range = (cfEntry.ranges ?? []).map((r) => `${r.startRowIndex + 1}:${r.endRowIndex}`).join(',')
    return condition ? [{ range, condition, style }] : []
  })

  // --- Row heights ---
  const rowMeta: any[] = (gridData as any).rowMetadata ?? []
  const rowHeights: number[] = rowMeta.map((r: any) => r?.pixelSize ?? 20)

  // --- Data validation (extracted from cell-level dataValidation) ---
  const dvMap: Map<string, import('./types.ts').ValidationRule> = new Map()
  rowData.slice(1).forEach((rowEntry: unknown, ri: number) => {
    ((rowEntry as { values?: unknown[] })?.values ?? []).forEach((cell: unknown, ci: number) => {
      const dv = (cell as { dataValidation?: any })?.dataValidation
      if (!dv) return
      const col = columns[ci]
      if (!col || dvMap.has(col.name)) return  // only record first occurrence per column
      const cond = dv.condition ?? {}
      const rule: import('./types.ts').ValidationRule = {
        column: col.name,
        type: 'custom',
        required: dv.showCustomUi ?? false,
      }
      if (cond.type === 'ONE_OF_LIST' || cond.type === 'ONE_OF_RANGE') {
        rule.type = 'list'
        rule.values = (cond.values ?? []).map((v: any) => v.userEnteredValue ?? '')
      } else if (cond.type === 'NUMBER_BETWEEN' || cond.type === 'NUMBER_GREATER' || cond.type === 'NUMBER_LESS') {
        rule.type = 'decimal'
        if (cond.values?.[0]) rule.min = Number(cond.values[0].userEnteredValue)
        if (cond.values?.[1]) rule.max = Number(cond.values[1].userEnteredValue)
      }
      dvMap.set(col.name, rule)
    })
  })
  const dataValidation = Array.from(dvMap.values())

  // Google Sheets row/col groups (outline groups) are not exposed in the basic
  // spreadsheets.get response. They require a separate API call. Left empty for v1.
  const gsGroups: import('./types.ts').GroupDef[] = []

  return {
    tableName: sanitizeName(sheetName),
    columns, rows, styles,
    conditionalFormatting,
    dataValidation,
    groups: gsGroups, frozenRows, frozenCols, mergedCells,
    rowHeights,
  }
}
