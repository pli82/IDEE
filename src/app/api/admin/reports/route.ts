export const dynamic = 'force-dynamic'
// src/app/api/admin/reports/route.ts - Rapoarte și exporturi admin
import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateCsv, generateExcel } from '@/lib/export'
import { format, subDays } from 'date-fns'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 403 })
  }

  const { searchParams } = request.nextUrl
  const type = searchParams.get('type') || 'users'
  const exportFormat = searchParams.get('format') // 'csv' | 'xlsx' | null (JSON)
  const dateFrom = searchParams.get('from') ? new Date(searchParams.get('from')!) : subDays(new Date(), 30)
  const dateTo = searchParams.get('to') ? new Date(searchParams.get('to')!) : new Date()
  const countyFilter = searchParams.get('county')
  const calitateFiler = searchParams.get('calitate')

  try {
    if (type === 'users') {
      const users = await prisma.user.findMany({
        where: {
          createdAt: { gte: dateFrom, lte: dateTo },
          ...(countyFilter && { profile: { judetCode: countyFilter } }),
          ...(calitateFiler && { profile: { calitate: calitateFiler } }),
        },
        include: { profile: { include: { county: true } }, roles: true },
        orderBy: { createdAt: 'desc' },
      })

      const rows = users.map((u) => ({
        id: u.id,
        email: u.email,
        nume: u.profile?.nume || '',
        prenume: u.profile?.prenume || '',
        judet: u.profile?.county?.name || u.profile?.judetCode || '',
        sex: u.profile?.sex || '',
        studii: u.profile?.studii || '',
        calitate: u.profile?.calitate || '',
        status: u.status,
        emailVerified: u.emailVerified ? 'Da' : 'Nu',
        profileComplete: u.profile?.profileComplete ? 'Da' : 'Nu',
        createdAt: format(u.createdAt, 'dd.MM.yyyy HH:mm'),
        lastLoginAt: u.lastLoginAt ? format(u.lastLoginAt, 'dd.MM.yyyy HH:mm') : '',
      }))

      if (exportFormat === 'csv') {
        const headers = ['ID', 'Email', 'Nume', 'Prenume', 'Județ', 'Sex', 'Studii', 'Calitate', 'Status', 'Email verificat', 'Profil complet', 'Data înregistrare', 'Ultima autentificare']
        const csv = generateCsv(headers, rows.map((r) => Object.values(r)))
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="utilizatori_${format(new Date(), 'yyyyMMdd')}.csv"`,
          },
        })
      }

      if (exportFormat === 'xlsx') {
        const buffer = await generateExcel('Raport Utilizatori AEP Instruire', [{
          name: 'Utilizatori',
          headers: [
            { key: 'email', header: 'Email', width: 30 },
            { key: 'nume', header: 'Nume', width: 20 },
            { key: 'prenume', header: 'Prenume', width: 20 },
            { key: 'judet', header: 'Județ', width: 20 },
            { key: 'sex', header: 'Sex', width: 8 },
            { key: 'studii', header: 'Studii', width: 20 },
            { key: 'calitate', header: 'Calitate', width: 25 },
            { key: 'status', header: 'Status', width: 15 },
            { key: 'profileComplete', header: 'Profil complet', width: 15 },
            { key: 'createdAt', header: 'Data înregistrare', width: 20 },
            { key: 'lastLoginAt', header: 'Ultima autentificare', width: 20 },
          ],
          rows,
        }])
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="utilizatori_${format(new Date(), 'yyyyMMdd')}.xlsx"`,
          },
        })
      }

      return NextResponse.json({ data: rows, total: rows.length })
    }

    if (type === 'tests') {
      const attempts = await prisma.testAttempt.findMany({
        where: {
          submittedAt: { gte: dateFrom, lte: dateTo },
          ...(countyFilter && { user: { profile: { judetCode: countyFilter } } }),
        },
        include: {
          user: { include: { profile: { include: { county: true } } } },
          test: { include: { module: { include: { category: true } } } },
          answers: { include: { question: true } },
        },
        orderBy: { submittedAt: 'desc' },
      })

      const rows = attempts.map((a) => ({
        userId: a.userId,
        email: a.user.email,
        numeComplet: `${a.user.profile?.prenume || ''} ${a.user.profile?.nume || ''}`.trim(),
        judet: a.user.profile?.county?.name || '',
        calitate: a.user.profile?.calitate || '',
        test: a.test.title,
        modul: a.test.module?.title || '',
        categorie: a.test.module?.category?.title || '',
        score: a.score,
        maxScore: a.maxScore,
        rezultat: a.passed ? 'Promovat' : 'Nepromovat',
        data: a.submittedAt ? format(a.submittedAt, 'dd.MM.yyyy HH:mm') : '',
      }))

      if (exportFormat === 'xlsx') {
        const buffer = await generateExcel('Raport Teste AEP Instruire', [{
          name: 'Rezultate teste',
          headers: [
            { key: 'email', header: 'Email', width: 28 },
            { key: 'numeComplet', header: 'Nume complet', width: 22 },
            { key: 'judet', header: 'Județ', width: 18 },
            { key: 'calitate', header: 'Calitate', width: 25 },
            { key: 'categorie', header: 'Categorie', width: 30 },
            { key: 'modul', header: 'Modul', width: 25 },
            { key: 'test', header: 'Test', width: 25 },
            { key: 'score', header: 'Punctaj', width: 10 },
            { key: 'maxScore', header: 'Max', width: 8 },
            { key: 'rezultat', header: 'Rezultat', width: 14 },
            { key: 'data', header: 'Data', width: 18 },
          ],
          rows,
        }])
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="teste_${format(new Date(), 'yyyyMMdd')}.xlsx"`,
          },
        })
      }

      if (exportFormat === 'csv') {
        const headers = ['Email', 'Nume complet', 'Județ', 'Calitate', 'Categorie', 'Modul', 'Test', 'Punctaj', 'Max', 'Rezultat', 'Data']
        const csv = generateCsv(headers, rows.map((r) => Object.values(r)))
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="teste_${format(new Date(), 'yyyyMMdd')}.csv"`,
          },
        })
      }

      return NextResponse.json({ data: rows, total: rows.length })
    }

    if (type === 'stats') {
      // Statistici agregate pentru grafice
      const [usersByCounty, usersByStudii, usersByCalitate, testsByMonth, passRateByModule] = await Promise.all([
        prisma.userProfile.groupBy({ by: ['judetCode'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 20 }),
        prisma.userProfile.groupBy({ by: ['studii'], _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
        prisma.userProfile.groupBy({ by: ['calitate'], _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
        prisma.$queryRaw`
          SELECT DATE_TRUNC('month', "submittedAt") as month, COUNT(*) as total,
                 SUM(CASE WHEN passed THEN 1 ELSE 0 END) as passed
          FROM test_attempts WHERE "submittedAt" IS NOT NULL
          GROUP BY month ORDER BY month DESC LIMIT 12
        `.catch(() => []),
        prisma.test.findMany({
          include: {
            attempts: { select: { passed: true } },
            module: { select: { title: true } },
          },
          where: { published: true },
        }),
      ])

      return NextResponse.json({
        usersByCounty: usersByCounty.map((r) => ({ county: r.judetCode, count: r._count.id })),
        usersByStudii: usersByStudii.map((r) => ({ studii: r.studii || 'Nespecificat', count: r._count.id })),
        usersByCalitate: usersByCalitate.map((r) => ({ calitate: r.calitate || 'Nespecificat', count: r._count.id })),
        testsByMonth,
        passRateByModule: passRateByModule.map((t) => ({
          test: t.title,
          modul: t.module?.title,
          total: t.attempts.length,
          passed: t.attempts.filter((a) => a.passed).length,
          passRate: t.attempts.length > 0
            ? Math.round((t.attempts.filter((a) => a.passed).length / t.attempts.length) * 100)
            : 0,
        })),
      })
    }

    return NextResponse.json({ error: 'Tip raport invalid' }, { status: 400 })
  } catch (error) {
    console.error('Reports error:', error)
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}
