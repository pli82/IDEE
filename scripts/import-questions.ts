#!/usr/bin/env ts-node
/**
 * scripts/import-questions.ts
 * Utilizare: npm run import-questions -- --file intrebari.csv --testId <ID>
 *
 * Format CSV așteptat (cu header):
 *   text,optiune1,optiune2,optiune3,optiune4,corecta,explicatie
 *   "Câte circumscripții...",A,B,C,D,A,"Conform art. 5..."
 *
 * "corecta" = textul variantei corecte (ex: A, B, C sau D)
 */
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface QuestionRow {
  text: string
  optiune1: string
  optiune2: string
  optiune3: string
  optiune4: string
  corecta: string
  explicatie?: string
}

function parseCsv(content: string): QuestionRow[] {
  const lines = content.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map(line => {
    const vals: string[] = []
    let cur = '', inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ }
      else if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = '' }
      else cur += ch
    }
    vals.push(cur.trim())
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] || ''])) as unknown as QuestionRow
  })
}

async function main() {
  const args = process.argv.slice(2)
  const fileIdx = args.indexOf('--file')
  const testIdx = args.indexOf('--testId')

  if (fileIdx === -1 || testIdx === -1) {
    console.error('Utilizare: npm run import-questions -- --file intrebari.csv --testId <ID>')
    process.exit(1)
  }

  const filePath = path.resolve(args[fileIdx + 1])
  const testId = args[testIdx + 1]

  if (!fs.existsSync(filePath)) { console.error(`❌ Fișierul ${filePath} nu există.`); process.exit(1) }

  const test = await prisma.test.findUnique({ where: { id: testId } })
  if (!test) { console.error(`❌ Testul cu ID "${testId}" nu există.`); process.exit(1) }

  const content = fs.readFileSync(filePath, 'utf-8')
  const rows = parseCsv(content)

  console.log(`\n📥 Import ${rows.length} întrebări pentru testul "${test.title}"...\n`)

  let imported = 0, skipped = 0
  for (const row of rows) {
    if (!row.text || !row.optiune1) { skipped++; continue }
    const options = [
      { label: 'A', text: row.optiune1 },
      { label: 'B', text: row.optiune2 },
      { label: 'C', text: row.optiune3 },
      { label: 'D', text: row.optiune4 },
    ].filter(o => o.text)

    const correctLabel = row.corecta.trim().toUpperCase()

    await prisma.question.create({
      data: {
        testId,
        text: row.text,
        type: 'SINGLE',
        explanation: row.explicatie || undefined,
        active: true,
        options: {
          create: options.map((o, i) => ({
            text: o.text,
            isCorrect: o.label === correctLabel,
            order: i,
          })),
        },
      },
    })
    imported++
    process.stdout.write(`\r   Importate: ${imported}/${rows.length}`)
  }

  console.log(`\n\n✅ Import finalizat: ${imported} întrebări importate, ${skipped} ignorate.\n`)
}

main()
  .catch(e => { console.error('❌', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
