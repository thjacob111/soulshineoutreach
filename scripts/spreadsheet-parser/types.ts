// scripts/spreadsheet-parser/types.ts

export type CellType = 'text' | 'number' | 'date' | 'boolean'

export interface CellStyle {
  backgroundColor?: string   // hex e.g. '#FF0000'
  color?: string             // hex e.g. '#000000'
  bold?: boolean
  italic?: boolean
  fontSize?: number
  borderTop?: string         // e.g. 'thin'
  borderBottom?: string
  borderLeft?: string
  borderRight?: string
  horizontalAlign?: 'left' | 'center' | 'right'
}

export interface ColumnDef {
  name: string               // sanitized JS identifier e.g. 'order_total'
  header: string             // original header text e.g. 'Order Total'
  type: CellType
  index: number              // 0-based column index
  widthPx: number            // pixel width
  hasFormula: boolean
  formula?: string           // e.g. 'A2*B2' (without leading =)
}

export interface RowData {
  [columnName: string]: string | number | boolean | null
}

export interface CellStyleMap {
  [cellRef: string]: CellStyle  // key is 'A1', 'B3', etc.
}

export interface CFRule {
  range: string              // e.g. 'A1:Z100'
  condition: string          // e.g. 'CELL_VALUE > 0'
  style: CellStyle
}

export interface ValidationRule {
  column: string             // column name
  type: 'list' | 'whole' | 'decimal' | 'date' | 'custom'
  values?: string[]          // for 'list' type
  min?: number
  max?: number
  required?: boolean
  errorMessage?: string
}

export interface GroupDef {
  type: 'row' | 'col'
  start: number              // 0-based
  end: number                // 0-based inclusive
  collapsed: boolean
}

export interface MergeRange {
  startRow: number           // 0-based
  startCol: number
  endRow: number
  endCol: number
}

export interface SheetSchema {
  tableName: string          // snake_case e.g. 'order_tracking'
  columns: ColumnDef[]
  rows: RowData[]
  styles: CellStyleMap
  conditionalFormatting: CFRule[]
  dataValidation: ValidationRule[]
  groups: GroupDef[]
  frozenRows: number
  frozenCols: number
  mergedCells: MergeRange[]
}
