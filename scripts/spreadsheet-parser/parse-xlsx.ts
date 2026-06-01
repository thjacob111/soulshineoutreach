// scripts/spreadsheet-parser/parse-xlsx.ts
import * as XLSX from 'xlsx'
import type {
  SheetSchema, ColumnDef, RowData, CellType,
  CellStyle, CellStyleMap, MergeRange, GroupDef, CFRule, ValidationRule,
} from './types.ts'

export function parseXlsx(workbook: XLSX.WorkBook): SheetSchema {
  const sheetName = workbook.SheetNames[0]
  return buildSchema(workbook.Sheets[sheetName], sheetName)
}

export function parseXlsxFile(filePath: string): SheetSchema {
  const workbook = XLSX.readFile(filePath, {
    cellStyles: true,
    cellDates: true,
    cellFormula: true,
  })
  return parseXlsx(workbook)
}

export function sanitizeName(header: string): string {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^(\d)/, '_$1')
}

function inferType(
  ws: XLSX.WorkSheet,
  colIndex: number,
  startRow: number,
  endRow: number,
): CellType {
  const counts: Record<CellType, number> = { number: 0, text: 0, date: 0, boolean: 0 }
  for (let r = startRow; r <= endRow; r++) {
    const cell = ws[XLSX.utils.encode_cell({ r, c: colIndex })]
    if (!cell) continue
    if (cell.t === 'n') counts.number++
    else if (cell.t === 'd') counts.date++
    else if (cell.t === 'b') counts.boolean++
    else counts.text++
  }
  return (Object.entries(counts) as [CellType, number][])
    .reduce((a, b) => (b[1] > a[1] ? b : a))[0]
}

export function buildSchema(ws: XLSX.WorkSheet, sheetName: string): SheetSchema {
  const ref = ws['!ref']
  if (!ref) return emptySchema(sheetName)

  const range = XLSX.utils.decode_range(ref)

  const colMeta: { wch?: number }[] = (ws['!cols'] as { wch?: number }[]) ?? []

  // --- Columns ---
  const columns: ColumnDef[] = []
  const seen = new Set<string>()
  for (let c = range.s.c; c <= range.e.c; c++) {
    const headerCell = ws[XLSX.utils.encode_cell({ r: range.s.r, c })]
    const rawHeader = headerCell?.v != null ? String(headerCell.v) : `col_${c}`
    let name = sanitizeName(rawHeader)
    let deduped = name
    let n = 2
    while (seen.has(deduped)) deduped = `${name}_${n++}`
    seen.add(deduped)

    let hasFormula = false
    let formula: string | undefined
    for (let r = range.s.r + 1; r <= range.e.r; r++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })] as XLSX.CellObject & { f?: string }
      if (cell?.f) { hasFormula = true; formula = cell.f; break }
    }

    const colWidth = colMeta[c - range.s.c]
    const widthPx = colWidth?.wch != null ? Math.round(colWidth.wch * 7) : 100

    columns.push({
      name: deduped,
      header: rawHeader,
      type: range.e.r > range.s.r
        ? inferType(ws, c, range.s.r + 1, range.e.r)
        : 'text',
      index: c - range.s.c,
      widthPx,
      hasFormula,
      formula,
    })
  }

  // --- Rows ---
  const rows: RowData[] = []
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const row: RowData = {}
    for (let c = range.s.c; c <= range.e.c; c++) {
      const col = columns[c - range.s.c]
      const cell = ws[XLSX.utils.encode_cell({ r, c })]
      if (!cell || cell.v == null) {
        row[col.name] = null
        continue
      }
      if (col.type === 'date') {
        row[col.name] = cell.v instanceof Date ? cell.v.toISOString() : String(cell.v)
      } else if (col.type === 'number') {
        row[col.name] = Number(cell.v)
      } else if (col.type === 'boolean') {
        row[col.name] = Boolean(cell.v)
      } else {
        row[col.name] = String(cell.v)
      }
    }
    rows.push(row)
  }

  // --- Styles ---
  const styles: CellStyleMap = {}
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c })
      const s = (ws[addr] as XLSX.CellObject & { s?: Record<string, unknown> })?.s
      if (!s) continue
      const style: CellStyle = {}
      const fill = s.fgColor as { rgb?: string } | undefined
      if (fill?.rgb) style.backgroundColor = `#${fill.rgb.slice(-6)}`
      const font = s.font as { color?: { rgb?: string }; bold?: boolean; italic?: boolean; sz?: number } | undefined
      if (font?.color?.rgb) style.color = `#${font.color.rgb.slice(-6)}`
      if (font?.bold) style.bold = true
      if (font?.italic) style.italic = true
      if (font?.sz != null) style.fontSize = font.sz
      const border = s.border as {
        top?: { style?: string }; bottom?: { style?: string }
        left?: { style?: string }; right?: { style?: string }
      } | undefined
      if (border?.top?.style) style.borderTop = border.top.style
      if (border?.bottom?.style) style.borderBottom = border.bottom.style
      if (border?.left?.style) style.borderLeft = border.left.style
      if (border?.right?.style) style.borderRight = border.right.style
      const alignment = s.alignment as { horizontal?: 'left' | 'center' | 'right' } | undefined
      if (alignment?.horizontal) style.horizontalAlign = alignment.horizontal
      if (Object.keys(style).length) styles[addr] = style
    }
  }

  // --- Frozen panes ---
  const views = (ws['!views'] as { ySplit?: number; xSplit?: number }[]) ?? []
  const frozenRows: number = views[0]?.ySplit ?? 0
  const frozenCols: number = views[0]?.xSplit ?? 0

  // --- Merged cells ---
  const mergedCells: MergeRange[] = ((ws['!merges'] as XLSX.Range[]) ?? []).map(m => ({
    startRow: m.s.r,
    startCol: m.s.c,
    endRow: m.e.r,
    endCol: m.e.c,
  }))

  // --- Row/column groups ---
  const groups: GroupDef[] = []
  const rowMeta = (ws['!rows'] as { level?: number }[]) ?? []
  const colGroupMeta = (ws['!cols'] as { level?: number }[]) ?? []

  let groupStart = -1
  rowMeta.forEach((row, i) => {
    if (row?.level && row.level > 0) {
      if (groupStart === -1) groupStart = i
    } else if (groupStart !== -1) {
      groups.push({ type: 'row', start: groupStart, end: i - 1, collapsed: false })
      groupStart = -1
    }
  })
  if (groupStart !== -1) {
    groups.push({ type: 'row', start: groupStart, end: rowMeta.length - 1, collapsed: false })
  }

  let colGroupStart = -1
  colGroupMeta.forEach((col, i) => {
    if (col?.level && col.level > 0) {
      if (colGroupStart === -1) colGroupStart = i
    } else if (colGroupStart !== -1) {
      groups.push({ type: 'col', start: colGroupStart, end: i - 1, collapsed: false })
      colGroupStart = -1
    }
  })
  if (colGroupStart !== -1) {
    groups.push({ type: 'col', start: colGroupStart, end: colGroupMeta.length - 1, collapsed: false })
  }

  // --- Conditional formatting ---
  const conditionalFormatting: CFRule[] = []
  const cfRaw = ((ws as Record<string, unknown>)['!cf'] as {
    ref: string
    rules?: {
      type?: string
      operator?: string
      formula?: string[]
      dxf?: {
        fill?: { fgColor?: { rgb?: string } }
        font?: { color?: { rgb?: string }; bold?: boolean }
      }
    }[]
  }[]) ?? []

  const opMap: Record<string, string> = {
    greaterThan: '>',
    lessThan: '<',
    greaterThanOrEqual: '>=',
    lessThanOrEqual: '<=',
    equal: '===',
    notEqual: '!==',
  }

  for (const cf of cfRaw) {
    for (const rule of (cf.rules ?? [])) {
      const style: CellStyle = {}
      const fillRgb = rule.dxf?.fill?.fgColor?.rgb
      if (fillRgb) style.backgroundColor = `#${fillRgb.slice(-6)}`
      if (rule.dxf?.font?.color?.rgb) style.color = `#${rule.dxf.font.color.rgb.slice(-6)}`
      if (rule.dxf?.font?.bold) style.bold = true

      let condition = ''
      if (rule.type === 'cellIs') {
        condition = `CELL_VALUE ${opMap[rule.operator ?? ''] ?? rule.operator} ${rule.formula?.[0] ?? ''}`
      } else if (rule.type === 'expression') {
        condition = `FORMULA:${rule.formula?.[0] ?? ''}`
      }
      if (condition) conditionalFormatting.push({ range: cf.ref, condition, style })
    }
  }

  // --- Data validation ---
  const dataValidation: ValidationRule[] = []
  const dvRaw = ((ws as Record<string, unknown>)['!dataValidation'] as Record<string, {
    type?: string
    formula1?: string
    formula2?: string
    showErrorMessage?: boolean
    error?: string
  }>) ?? {}

  for (const [ref, dv] of Object.entries(dvRaw)) {
    const colIndex = XLSX.utils.decode_cell(ref.split(':')[0]).c
    const col = columns[colIndex - range.s.c]
    if (!col) continue
    const rule: ValidationRule = {
      column: col.name,
      type: (dv.type as ValidationRule['type']) ?? 'custom',
      required: dv.showErrorMessage ?? false,
      errorMessage: dv.error,
    }
    if (dv.type === 'list' && dv.formula1) {
      rule.values = dv.formula1
        .replace(/^"(.*)"$/, '$1')
        .split(',')
        .map((s: string) => s.trim())
    }
    if ((dv.type === 'whole' || dv.type === 'decimal') && dv.formula1 != null) {
      rule.min = Number(dv.formula1)
      if (dv.formula2 != null) rule.max = Number(dv.formula2)
    }
    dataValidation.push(rule)
  }

  return {
    tableName: sanitizeName(sheetName),
    columns,
    rows,
    styles,
    conditionalFormatting,
    dataValidation,
    groups,
    frozenRows,
    frozenCols,
    mergedCells,
  }
}

export function emptySchema(sheetName: string): SheetSchema {
  return {
    tableName: sanitizeName(sheetName),
    columns: [],
    rows: [],
    styles: {},
    conditionalFormatting: [],
    dataValidation: [],
    groups: [],
    frozenRows: 0,
    frozenCols: 0,
    mergedCells: [],
  }
}
