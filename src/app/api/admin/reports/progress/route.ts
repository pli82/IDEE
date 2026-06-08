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
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      include: {
        profile: { select: { nume: true, prenume: true, judetCode: true, calitate: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    const modules = await prisma.module.findMany({
      where: { published: true },
      orderBy: [{ category: { order: 'asc' } }, { order: 'asc' }],
      include: {
        category: { select: { title: true } },
        lessons: {
          where: { published: true },
          include: {
            tests: { where: { published: true }, select: { id: true } },
          },
        },
        materials: { select: { id: true } },
      },
    })

    const rows: any[] = []

    for (const user of users) {
      const videoProgress = await prisma.$queryRaw`
        SELECT p."lessonId", p.status FROM progress p
        WHERE p."userId" = ${user.id}
      ` as any[]

      const materialProgress = await prisma.$queryRaw`
        SELECT mp."materialId" FROM material_progress mp
        WHERE mp."userId" = ${user.id}
      ` as any[]

      const testAttempts = await prisma.$queryRaw`
        SELECT ta."testId", ta.passed FROM test_attempts ta
        WHERE ta."userId" = ${user.id}
        AND ta."submittedAt" IS NOT NULL
        ORDER BY ta."submittedAt" DESC
      ` as any[]

      const completedLessons = new Set(videoProgress.filter((p: any) => p.status === 'COMPLETED').map((p: any) => p.lessonId))
      const viewedMaterials = new Set(materialProgress.map((m: any) => m.materialId))
      const passedTests = new Set(testAttempts.filter((a: any) => a.passed).map((a: any) => a.testId))

      for (const mod of modules) {
        const videoLessons = mod.lessons.filter(l => l.videoUrl)
        const totalVideos = videoLessons.length
        const completedVideos = videoLessons.filter(l => completedLessons.has(l.id)).length

        const totalMaterials = mod.materials.length
        const viewedCount = mod.materials.filter(m => viewedMaterials.has(m.id)).length

        const allTestIds = mod.lessons.flatMap(l => l.tests.map(t => t.id))
        const hasTests = allTestIds.length > 0
        const testPassed = hasTests && allTestIds.some(id => passedTests.has(id))

        const components = (totalVideos > 0 ? 1 : 0) + (totalMaterials > 0 ? 1 : 0) + (hasTests ? 1 : 0)
        if (components === 0) continue

        const completedComponents =
          (totalVideos > 0 && completedVideos === totalVideos ? 1 : 0) +
          (totalMaterials > 0 && viewedCount === totalMaterials ? 1 : 0) +
          (hasTests && testPassed ? 1 : 0)

        const hasAnyProgress = completedVideos > 0 || viewedCount > 0 || testPassed
        if (!hasAnyProgress) continue

        rows.push({
          'Nume': user.profile?.nume || '—',
          'Prenume': user.profile?.prenume || '—',
          'Email': user.email,
          'Județ': user.profile?.judetCode || '—',
          'Calitate': user.profile?.calitate || '—',
          'Categorie': mod.category.title,
          'Modul': mod.title,
          'Video': `${completedVideos}/${totalVideos}`,
          'Materiale': `${viewedCount}/${totalMaterials}`,
          'Test': hasTests ? (testPassed ? 'Promovat' : 'Nesusținut/Nepromovat') : 'N/A',
          'Progres': `${completedComponents}/${components}`,
          'Procent': `${Math.round((completedComponents / components) * 100)}%`,
        })
      }
    }

    if (format === 'json') return NextResponse.json({ data: rows })

    if (format === 'csv') {
      if (rows.length === 0) return new NextResponse('\uFEFFNu există date', {
        headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="progres_instruire.csv"' }
      })
      const headers = Object.keys(rows[0]).join(',')
      const csvRows = rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      const csv = '\uFEFF' + [headers, ...csvRows].join('\n')
      return new NextResponse(csv, {
        headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="progres_instruire.csv"' }
      })
    }

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Progres Instruire')
    if (rows.length > 0) {
      sheet.columns = Object.keys(rows[0]).map(key => ({ header: key, key, width: key === 'Categorie' ? 40 : 22 }))
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
    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="progres_instruire.xlsx"'
      }
    })
  } catch (e) {
    console.error('Progress report error:', e)
    return new NextResponse('Export failed: ' + String(e), { status: 500 })
  }
}
