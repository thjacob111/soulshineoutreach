// scripts/spreadsheet-parser/__tests__/generate-sql.test.ts
import assert from 'node:assert/strict'
import { generateSql } from '../generate-sql.ts'
import type { SheetSchema } from '../types.ts'

const schema: SheetSchema = {
  tableName: 'orders',
  columns: [
    { name: 'order_id', header: 'Order ID', type: 'number', index: 0, widthPx: 100, hasFormula: false },
    { name: 'customer', header: 'Customer', type: 'text', index: 1, widthPx: 150, hasFormula: false },
    { name: 'total', header: 'Total', type: 'number', index: 2, widthPx: 100, hasFormula: true, formula: 'A2*B2' },
    { name: 'active', header: 'Active', type: 'boolean', index: 3, widthPx: 80, hasFormula: false },
    { name: 'created_at', header: 'Created At', type: 'date', index: 4, widthPx: 120, hasFormula: false },
  ],
  rows: [
    { order_id: 1001, customer: "Acme's Corp", total: 250, active: true, created_at: '2026-01-15T00:00:00.000Z' },
  ],
  styles: {}, conditionalFormatting: [], dataValidation: [],
  groups: [], frozenRows: 0, frozenCols: 0, mergedCells: [],
}

const sql = generateSql(schema)

assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS orders'))
assert.ok(sql.includes('order_id numeric'))
assert.ok(sql.includes('customer text'))
assert.ok(sql.includes('active boolean'))
assert.ok(sql.includes('user_id uuid'))
assert.ok(sql.includes('ENABLE ROW LEVEL SECURITY'))
assert.ok(sql.includes("Acme''s Corp"))
assert.ok(sql.includes('total'))

console.log('generate-sql: PASS')
