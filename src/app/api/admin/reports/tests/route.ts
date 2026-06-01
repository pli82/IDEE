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
        test: { select: { title: true, passingScore: true } },
        answers: {
          include: {
            question: { select: { text: true } },
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    })

    // Un rând per răspuns (întrebare)
    const rows: any[] = []
    for (const a of attempts as any[]) {
      const nume = a.user.profile?.nume || '—'
      const prenume = a.user.profile?.prenume || '—'
      const email = a.user.email
      const judet = a.user.profile?.judetCode || '—'
      const test = a.test.title
      const scor = a.score
      const maxScor = a.maxScore
      const promovat = a.passed ? 'DA' : 'NU'
      const data = a.submittedAt?.toISOString().split('T')[0] || '—'

      if (a.answers.length === 0) {
        rows.push({ 'Nume': nume, 'Prenume': prenume, 'Email': email, 'Județ': judet, 'Test': test, 'Scor': `${scor}/${maxScor}`, 'Promovat': promovat, 'Data': data, 'Întrebare': '—', 'Răspuns': '—' })
      } else {
        for (const ans of a.answers) {
          rows.push({
            'Nume': nume,
            'Prenume': prenume,
            'Email': email,
            'Județ': judet,
            'Test': test,
            'Scor': `${scor}/${maxScor}`,
            'Promovat': promovat,
            'Data': data,
            'Întrebare': ans.question?.text || '—',
            'Răspuns': ans.isCorrect ? 'CORECT' : 'GREȘIT',
          })
        }
      }
    }

    if (format === 'csv') {
      if (rows.length === 0) return new NextResponse('\uFEFFNu există date', {
        headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="rezultate_teste.csv"' }
      })
      const headers = Object.keys(rows[0]).join(',')
      const csvRows = rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      const csv = '\uFEFF' + [headers, ...csvRows].join('\n')
      return new NextResponse(csv, {
        headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="rezultate_teste.csv"' }
      })
    }

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Rezultate Teste')
    if (rows.length > 0) {
      sheet.columns = Object.keys(rows[0]).map(key => ({ header: key, key, width: key === 'Întrebare' ? 50 : 22 }))
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a4480' } }
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
      rows.forEach((row, i) => {
        const r = sheet.addRow(row)
        const isCorrect = row['Răspuns'] === 'CORECT'
        const isWrong = row['Răspuns'] === 'GREȘIT'
        if (isCorrect) r.getCell('Răspuns').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFd4edda' } }
        if (isWrong) r.getCell('Răspuns').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf8d7da' } }
        if (i % 2 === 1) r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F8' } }
      })
      sheet.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + Object.keys(rows[0]).length)}1` }
      sheet.views = [{ state: 'frozen', ySplit: 1 }]
    } else {
      sheet.addRow(['Nu există date pentru perioada selectată'])
    }
    const buffer = await workbook.xlsx.writeBuffer()
    return new NextResponse(buffer as any, {
      headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="rezultate_teste.xlsx"' }
    })
  } catch (e) {
    console.error('Tests report error:', e)
    return new NextResponse('Export failed: ' + String(e), { status: 500 })
  }
}
