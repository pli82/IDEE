export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Neautorizat' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format') || 'xlsx'
  const from = searchParams.get('from') || '2024-01-01'
  const to = searchParams.get('to') || new Date().toISOString().slice(0, 10)

  try {
    const attempts = await prisma.testAttempt.findMany({
      where: {
        startedAt: { gte: new Date(from), lte: new Date(to + 'T23:59:59') },
        submittedAt: { not: null },
      },
      include: {
        user: {
          include: {
            profile: { select: { nume: true, prenume: true, judetCode: true } },
          },
        },
        test: { select: { id: true, title: true, passingScore: true } },
answers: true,
      },
      orderBy: [{ test: { id: 'asc' } }, { startedAt: 'desc' }],
    })

// Obține textul întrebărilor separat (inclusiv cele șterse nu vor fi găsite)
    const allAnsweredQuestionIds = [...new Set(
      (attempts as any[]).flatMap(a => a.answers.map((ans: any) => ans.questionId))
    )]
    const existingQuestions = await prisma.question.findMany({
      where: { id: { in: allAnsweredQuestionIds } },
      select: { id: true, text: true, order: true },
    })
    const questionLookup = new Map(existingQuestions.map(q => [q.id, q]))

    if (attempts.length === 0) {
      if (format === 'json') return NextResponse.json({ data: [] })
      const empty = '\uFEFFNu există date pentru perioada selectată'
      if (format === 'csv') return new NextResponse(empty, {
        headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="rezultate_teste.csv"' }
      })
      const wb = new ExcelJS.Workbook()
      wb.addWorksheet('Rezultate').addRow([empty])
      const buf = await wb.xlsx.writeBuffer()
      return new NextResponse(buf as any, {
        headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="rezultate_teste.xlsx"' }
      })
    }

    // Colectează toate întrebările unice din răspunsuri
    // Cheia: questionId, valoarea: textul întrebării (sau marcat șters)
    const questionMap = new Map<string, { text: string; order: number; deleted: boolean }>()

    for (const a of attempts as any[]) {
for (const ans of a.answers) {
        if (!questionMap.has(ans.questionId)) {
          const q = questionLookup.get(ans.questionId)
          if (q) {
            // Întrebare există încă
questionMap.set(ans.questionId, {
              text: q.text,
              order: q.order ?? 0,
              deleted: false,
            })
} else {
            // Întrebare ștearsă — folosim textul salvat în răspuns
            questionMap.set(ans.questionId, {
              text: ans.questionText || `[Întrebare ștearsă - ${ans.questionId.slice(0, 8)}]`,
              order: 9999,
              deleted: true,
            })
          }
        }
      }
    }

    // Sortează întrebările: mai întâi existente (după order), apoi șterse
    const sortedQuestions = Array.from(questionMap.entries())
      .sort((a, b) => {
        if (a[1].deleted !== b[1].deleted) return a[1].deleted ? 1 : -1
        return a[1].order - b[1].order
      })

    // Construiește rândurile
    const rows: any[] = []
    for (const a of attempts as any[]) {
      const answerMap: Record<string, boolean | null> = {}
      for (const ans of a.answers) {
        answerMap[ans.questionId] = ans.isCorrect
      }

      const row: any = {
        'Nume': (a.user as any).profile?.nume || '—',
        'Prenume': (a.user as any).profile?.prenume || '—',
        'Email': (a.user as any).email,
        'Județ': (a.user as any).profile?.judetCode || '—',
        'Test': (a.test as any).title,
        'Scor': `${a.score}/${a.maxScore}`,
        'Promovat': a.passed ? 'DA' : 'NU',
        'Data': a.submittedAt?.toISOString().split('T')[0] || '—',
      }

      // Adaugă coloană per întrebare
      for (const [qId, qInfo] of sortedQuestions) {
        const colName = qInfo.deleted
          ? `❌ ${qInfo.text}`
          : qInfo.text.length > 60
            ? qInfo.text.slice(0, 60) + '...'
            : qInfo.text

        if (qId in answerMap) {
          row[colName] = answerMap[qId] ? 'CORECT' : 'GREȘIT'
        } else {
          row[colName] = '—' // Nu a răspuns la această întrebare (nu era în setul random)
        }
      }

      rows.push(row)
    }

if (format === 'json') {
  return NextResponse.json({ data: rows })
}

    if (format === 'csv') {
      const headers = Object.keys(rows[0]).join(',')
      const csvRows = rows.map(r =>
        Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
      )
      const csv = '\uFEFF' + [headers, ...csvRows].join('\n')
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="rezultate_teste.csv"',
        },
      })
    }

    // Excel
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Rezultate Teste')

    const columnKeys = Object.keys(rows[0])
    const fixedCols = ['Nume', 'Prenume', 'Email', 'Județ', 'Test', 'Scor', 'Promovat', 'Data']

    sheet.columns = columnKeys.map(key => ({
      header: key,
      key,
      width: fixedCols.includes(key) ? 18 : Math.min(key.length, 40),
    }))

    // Header styling
    const headerRow = sheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    columnKeys.forEach((key, i) => {
      const cell = headerRow.getCell(i + 1)
      const isDeleted = key.startsWith('❌')
      cell.fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: isDeleted ? 'FF6c757d' : 'FF1a4480' },
      }
    })

    // Data rows
    rows.forEach((row, i) => {
      const r = sheet.addRow(row)

      // Colorează Promovat
      const promovatIdx = columnKeys.indexOf('Promovat') + 1
      if (promovatIdx > 0) {
        r.getCell(promovatIdx).fill = {
          type: 'pattern', pattern: 'solid',
          fgColor: { argb: row['Promovat'] === 'DA' ? 'FFd4edda' : 'FFf8d7da' },
        }
      }

      // Colorează CORECT/GREȘIT per întrebare
      columnKeys.forEach((key, colIdx) => {
        if (!fixedCols.includes(key)) {
          const val = row[key]
          if (val === 'CORECT') {
            r.getCell(colIdx + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFd4edda' } }
          } else if (val === 'GREȘIT') {
            r.getCell(colIdx + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf8d7da' } }
          }
        }
      })

      // Zebra
      if (i % 2 === 1) {
        r.eachCell({ includeEmpty: true }, (cell, colNum) => {
          if (!cell.fill || (cell.fill as any).fgColor?.argb === undefined) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F8' } }
          }
        })
      }
    })

    sheet.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + Math.min(columnKeys.length, 26))}1` }
    sheet.views = [{ state: 'frozen', xSplit: fixedCols.length, ySplit: 1 }]

    const buffer = await workbook.xlsx.writeBuffer()
    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="rezultate_teste.xlsx"',
      },
    })
  } catch (e) {
    console.error('Tests report error:', e)
    return new NextResponse('Export failed: ' + String(e), { status: 500 })
  }
}
