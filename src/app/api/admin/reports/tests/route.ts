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
    const attempts = await prisma.$queryRaw`
      SELECT 
        ta.id, ta.score, ta."maxScore", ta.passed, ta."startedAt", ta."submittedAt",
        u.email,
        up.nume, up.prenume, up."judetCode",
        t.title as test_title, t."passingScore"
      FROM test_attempts ta
      JOIN users u ON ta."userId" = u.id
      LEFT JOIN user_profiles up ON u.id = up."userId"
      JOIN tests t ON ta."testId" = t.id
      WHERE ta."startedAt" >= ${new Date(from)}
        AND ta."startedAt" <= ${new Date(to + 'T23:59:59')}
        AND ta."submittedAt" IS NOT NULL
      ORDER BY t.id ASC, ta."startedAt" DESC
    ` as any[]

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

    // Obține răspunsurile separat
    const attemptIds = attempts.map((a: any) => a.id)
    const answers = await prisma.$queryRaw`
      SELECT aa."attemptId", aa."questionId", aa."isCorrect", aa."questionText"
      FROM attempt_answers aa
      WHERE aa."attemptId" = ANY(${attemptIds}::text[])
    ` as any[]

    // Grupează răspunsurile pe attempt
    const answersByAttempt: Record<string, any[]> = {}
    for (const ans of answers) {
      if (!answersByAttempt[ans.attemptId]) answersByAttempt[ans.attemptId] = []
      answersByAttempt[ans.attemptId].push(ans)
    }

    // Obține întrebările existente
    const allQuestionIds = [...new Set(answers.map((a: any) => a.questionId))]
    const existingQuestions = allQuestionIds.length > 0
      ? await prisma.question.findMany({
          where: { id: { in: allQuestionIds } },
          select: { id: true, text: true, order: true },
        })
      : []
    const questionLookup = new Map(existingQuestions.map(q => [q.id, q]))

    // Construiește mapa de întrebări
    const questionMap = new Map<string, { text: string; order: number; deleted: boolean }>()
    for (const ans of answers) {
      if (!questionMap.has(ans.questionId)) {
        const q = questionLookup.get(ans.questionId)
        if (q) {
          questionMap.set(ans.questionId, { text: q.text, order: q.order ?? 0, deleted: false })
        } else {
          questionMap.set(ans.questionId, {
            text: ans.questionText || `[Întrebare ștearsă - ${ans.questionId.slice(0, 8)}]`,
            order: 9999, deleted: true,
          })
        }
      }
    }

    const sortedQuestions = Array.from(questionMap.entries())
      .sort((a, b) => {
        if (a[1].deleted !== b[1].deleted) return a[1].deleted ? 1 : -1
        return a[1].order - b[1].order
      })

    const rows: any[] = []
    for (const a of attempts) {
      const attemptAnswers = answersByAttempt[a.id] || []
      const answerMap: Record<string, boolean> = {}
      for (const ans of attemptAnswers) {
        answerMap[ans.questionId] = ans.isCorrect
      }

      const row: any = {
        'Nume': a.nume || '—',
        'Prenume': a.prenume || '—',
        'Email': a.email,
        'Județ': a.judetCode || '—',
        'Test': a.test_title,
        'Scor': `${a.score}/${a.maxScore}`,
        'Promovat': a.passed ? 'DA' : 'NU',
        'Data': a.submittedAt ? new Date(a.submittedAt).toISOString().split('T')[0] : '—',
      }

      for (const [qId, qInfo] of sortedQuestions) {
        const colName = qInfo.deleted
          ? `❌ ${qInfo.text}`
          : qInfo.text.length > 60 ? qInfo.text.slice(0, 60) + '...' : qInfo.text
        row[colName] = qId in answerMap ? (answerMap[qId] ? 'CORECT' : 'GREȘIT') : '—'
      }

      rows.push(row)
    }

    if (format === 'json') return NextResponse.json({ data: rows })

    if (format === 'csv') {
      const headers = Object.keys(rows[0]).join(',')
      const csvRows = rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      const csv = '\uFEFF' + [headers, ...csvRows].join('\n')
      return new NextResponse(csv, {
        headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="rezultate_teste.csv"' }
      })
    }

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Rezultate Teste')
    const columnKeys = Object.keys(rows[0])
    const fixedCols = ['Nume', 'Prenume', 'Email', 'Județ', 'Test', 'Scor', 'Promovat', 'Data']

    sheet.columns = columnKeys.map(key => ({ header: key, key, width: fixedCols.includes(key) ? 18 : Math.min(key.length, 40) }))
    const headerRow = sheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    columnKeys.forEach((key, i) => {
      headerRow.getCell(i + 1).fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: key.startsWith('❌') ? 'FF6c757d' : 'FF1a4480' },
      }
    })

    rows.forEach((row) => {
      const r = sheet.addRow(row)
      const promovatIdx = columnKeys.indexOf('Promovat') + 1
      if (promovatIdx > 0) {
        r.getCell(promovatIdx).fill = {
          type: 'pattern', pattern: 'solid',
          fgColor: { argb: row['Promovat'] === 'DA' ? 'FFd4edda' : 'FFf8d7da' },
        }
      }
      columnKeys.forEach((key, colIdx) => {
        if (!fixedCols.includes(key)) {
          const val = row[key]
          if (val === 'CORECT') r.getCell(colIdx + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFd4edda' } }
          else if (val === 'GREȘIT') r.getCell(colIdx + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf8d7da' } }
        }
      })
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
    return NextResponse.json({ error: 'Eroare server: ' + String(e) }, { status: 500 })
  }
}
