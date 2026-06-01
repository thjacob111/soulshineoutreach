// scripts/spreadsheet-parser/run.ts
import { parseXlsxFile } from './parse-xlsx.ts'
import { parseGoogleSheet } from './parse-gsheets.ts'
import { generateSql } from './generate-sql.ts'

async function main() {
  const input = process.argv[2]
  if (!input) {
    console.error('Usage: npx tsx scripts/spreadsheet-parser/run.ts <file.xlsx | google-sheets-url>')
    process.exit(1)
  }

  const schema = input.startsWith('https://docs.google.com/spreadsheets')
    ? await parseGoogleSheet(input)
    : parseXlsxFile(input)

  const sql = generateSql(schema)
  console.log(JSON.stringify({ schema, sql }, null, 2))
}

main().catch(err => {
  console.error('Parser error:', (err as Error).message)
  process.exit(1)
})
