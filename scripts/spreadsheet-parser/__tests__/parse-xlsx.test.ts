// scripts/spreadsheet-parser/__tests__/parse-xlsx.test.ts
import assert from 'node:assert/strict'
import * as XLSX from 'xlsx'
import { parseXlsx } from '../parse-xlsx.ts'
import type { SheetSchema } from '../types.ts'

function makeTestWorkbook(): XLSX.WorkBook {
  const ws: XLSX.WorkSheet = {}
  ws['A1'] = { t: 's', v: 'Order ID' }
  ws['B1'] = { t: 's', v: 'Customer' }
  ws['C1'] = { t: 's', v: 'Total' }
  ws['D1'] = { t: 's', v: 'Date' }
  ws['A2'] = { t: 'n', v: 1001 }
  ws['B2'] = { t: 's', v: 'Acme Corp' }
  ws['C2'] = { t: 'n', v: 250.5 }
  ws['D2'] = { t: 'd', v: new Date('2026-01-15') }
  ws['!ref'] = 'A1:D2'
  return { SheetNames: ['Orders'], Sheets: { Orders: ws } }
}

const schema: SheetSchema = parseXlsx(makeTestWorkbook())

assert.equal(schema.columns.length, 4)
assert.equal(schema.columns[0].name, 'order_id')
assert.equal(schema.columns[1].name, 'customer')
assert.equal(schema.columns[0].type, 'number')
assert.equal(schema.columns[1].type, 'text')
assert.equal(schema.columns[3].type, 'date')
assert.equal(schema.rows.length, 1)
assert.equal(schema.rows[0]['order_id'], 1001)
assert.equal(schema.rows[0]['customer'], 'Acme Corp')
assert.equal(schema.tableName, 'orders')

console.log('parse-xlsx data layer: PASS')

// --- Layout tests ---

function makeLayoutWorkbook(): XLSX.WorkBook {
  const ws: XLSX.WorkSheet = {}
  ws['A1'] = { t: 's', v: 'Name' }
  ws['B1'] = { t: 's', v: 'Value' }
  ws['A2'] = { t: 's', v: 'Alpha' }
  ws['B2'] = { t: 'n', v: 42 }
  ws['!ref'] = 'A1:B2'
  ws['!cols'] = [{ wch: 20 }, { wch: 10 }]
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }]
  ws['!views'] = [{ state: 'frozen', xSplit: 1, ySplit: 2 }]
  return { SheetNames: ['Data'], Sheets: { Data: ws } }
}

const schema4 = parseXlsx(makeLayoutWorkbook())
assert.equal(schema4.frozenCols, 1)
assert.equal(schema4.frozenRows, 2)
assert.equal(schema4.mergedCells.length, 1)
assert.equal(schema4.mergedCells[0].startCol, 0)
assert.equal(schema4.mergedCells[0].endCol, 1)
assert.equal(schema4.columns[0].widthPx, 140)  // 20 * 7

console.log('parse-xlsx layout layer: PASS')
