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
    const progress = await prisma.progress.findMany({
      where: {
        updatedAt: { gte: new Date(from), lte: new Date(to + 'T23:59:59') },
      },
      include: {
        user: {
          include: {
            profile: { select: { nume: true, prenume: true, judetCode: true } },
          },
        },
        lesson: {
          select: {
            title: true,
            module: {
              select: {
                title: true,
                category: { select: { title: true } },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const rows = (progress as any[]).map(p => ({
  'Nume': p.user.profile?.nume || '—',
  'Prenume': p.user.profile?.prenume || '—',
  'Email': p.user.email,
  'Județ': p.user.profile?.judetCode || '—',
  'Categorie': p.lesson?.module?.category?.title || '—',
  'Modul': p.lesson?.module?.title || '—',
  'Lecție': p.lesson?.title || '—',
  'Status': p.status === 'COMPLETED' ? 'Completat' : p.status === 'IN_PROGRESS' ? 'În curs' : 'Neînceput',
  'Progres (%)': Math.round(p.watchedPercent),
  'Ultima accesare': p.updatedAt.toISOString().split('T')[0],
}))

if (format === 'json') {
  return NextResponse.json({ data: rows })
}

    if (format === 'csv') {
      if (rows.length === 0) return new NextResponse('\uFEFFNu există date', { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="progres_instruire.csv"' } })
      const headers = Object.keys(rows[0]).join(',')
      const csvRows = rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      const csv = '\uFEFF' + [headers, ...csvRows].join('\n')
      return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="progres_instruire.csv"' } })
    }

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Progres Instruire')
    if (rows.length > 0) {
      sheet.columns = Object.keys(rows[0]).map(key => ({ header: key, key, width: 22 }))
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a4480' } }
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
      rows.forEach((row, i) => {
        const r = sheet.addRow(row)
        if (i % 2 === 1) r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F8' } }
      })
      sheet.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + Object.keys(rows[0]).length)}1` }
      sheet.views = [{ state: 'frozen', ySplit: 1 }]
    } else {
      sheet.addRow(['Nu există date pentru perioada selectată'])
    }
    const buffer = await workbook.xlsx.writeBuffer()
    return new NextResponse(buffer as any, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="progres_instruire.xlsx"' } })
  } catch (e) {
    console.error('Progress report error:', e)
    return new NextResponse('Export failed: ' + String(e), { status: 500 })
  }
}
