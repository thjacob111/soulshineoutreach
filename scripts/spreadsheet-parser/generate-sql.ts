// scripts/spreadsheet-parser/generate-sql.ts
import type { SheetSchema } from './types.ts'

const TYPE_MAP: Record<string, string> = {
  text: 'text',
  number: 'numeric',
  date: 'timestamptz',
  boolean: 'boolean',
}

function escapeSql(val: string | number | boolean | null): string {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
  if (typeof val === 'number') return String(val)
  return `'${String(val).replace(/'/g, "''")}'`
}

export function generateSql(schema: SheetSchema): string {
  const { tableName, columns, rows } = schema

  const colDefs = [
    'id uuid PRIMARY KEY DEFAULT gen_random_uuid()',
    'user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE',
    ...columns.map(c => `${c.name} ${TYPE_MAP[c.type] ?? 'text'}`),
    'created_at timestamptz DEFAULT now()',
  ]

  const createTable = [
    `CREATE TABLE IF NOT EXISTS ${tableName} (`,
    colDefs.map(d => `  ${d}`).join(',\n'),
    ');',
  ].join('\n')

  const rls = [
    `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`,
    `CREATE POLICY "${tableName}_user_policy" ON ${tableName}`,
    `  USING (auth.uid() = user_id);`,
  ].join('\n')

  const colNames = columns.map(c => c.name)
  const inserts = rows.map(row => {
    const vals = colNames.map(n => escapeSql(row[n] ?? null)).join(', ')
    return `INSERT INTO ${tableName} (${colNames.join(', ')}) VALUES (${vals});`
  })

  return [createTable, '', rls, '', ...inserts].join('\n')
}
