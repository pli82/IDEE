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
      },
      orderBy: { startedAt: 'desc' },
    })

    const rows = attempts.map((a: any) => ({
      'Nume': a.user.profile?.nume || '—',
      'Prenume': a.user.profile?.prenume || '—',
      'Email': a.user.email,
      'Județ': a.user.profile?.judetCode || '—',
      'Test': a.test.title,
      'Scor': a.score,
      'Scor maxim': a.maxScore,
      'Prag promovare': a.test.passingScore,
      'Promovat': a.passed ? 'DA' : 'NU',
      'Procent (%)': Math.round((a.score / a.maxScore) * 100),
      'Data susținerii': a.submittedAt?.toISOString().split('T')[0] || '—',
    }))

    if (format === 'csv') {
      const headers = Object.keys(rows[0] || {}).join(',')
      const csvRows = rows.map((r: any) => Object.values(r).map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      const csv = '\uFEFF' + [headers, ...csvRows].join('\n')
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="rezultate_teste.csv"',
        },
      })
    }

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Rezultate Teste')
    if (rows.length > 0) {
      sheet.columns = Object.keys(rows[0]).map(key => ({ header: key, key, width: 22 }))
      const headerRow = sheet.getRow(1)
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a4480' } }
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      rows.forEach((row: any, i: number) => {
        const r = sheet.addRow(row)
        const passed = row['Promovat'] === 'DA'
        r.getCell('Promovat').fill = {
          type: 'pattern', pattern: 'solid',
          fgColor: { argb: passed ? 'FFd4edda' : 'FFf8d7da' },
        }
        if (i % 2 === 1) r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F8' } }
      })
      sheet.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + Object.keys(rows[0]).length)}1` }
      sheet.views = [{ state: 'frozen', ySplit: 1 }]
    } else {
      sheet.addRow(['Nu există date pentru perioada selectată'])
    }

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
