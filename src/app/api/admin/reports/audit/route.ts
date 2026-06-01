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
    const logs = await prisma.auditLog.findMany({
      where: {
        createdAt: { gte: new Date(from), lte: new Date(to + 'T23:59:59') },
      },
      include: {
        actor: {
          include: {
            profile: { select: { nume: true, prenume: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    })

    const rows = (logs as any[]).map(l => ({
      'Data / Ora': l.createdAt.toISOString().replace('T', ' ').split('.')[0],
      'Utilizator': l.actor ? (`${l.actor.profile?.nume || ''} ${l.actor.profile?.prenume || ''}`.trim() || l.actor.email) : 'Sistem',
      'Email': l.actor?.email || '—',
      'Acțiune': l.action,
      'Tip entitate': l.entityType || '—',
      'ID entitate': l.entityId || '—',
      'IP': l.ip || '—',
    }))

    if (format === 'csv') {
      if (rows.length === 0) return new NextResponse('\uFEFFNu există date', { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="jurnal_audit.csv"' } })
      const headers = Object.keys(rows[0]).join(',')
      const csvRows = rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      const csv = '\uFEFF' + [headers, ...csvRows].join('\n')
      return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="jurnal_audit.csv"' } })
    }

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Jurnal Audit')
    if (rows.length > 0) {
      sheet.columns = Object.keys(rows[0]).map(key => ({ header: key, key, width: 24 }))
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF343a40' } }
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
      rows.forEach((row, i) => {
        const r = sheet.addRow(row)
        if (i % 2 === 1) r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } }
      })
      sheet.views = [{ state: 'frozen', ySplit: 1 }]
    } else {
      sheet.addRow(['Nu există date pentru perioada selectată'])
    }
    const buffer = await workbook.xlsx.writeBuffer()
    return new NextResponse(buffer as any, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="jurnal_audit.xlsx"' } })
  } catch (e) {
    console.error('Audit report error:', e)
    return new NextResponse('Export failed: ' + String(e), { status: 500 })
  }
}
