export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Neautorizat' }, { status: 403 })

  try {
    // Utilizatori pe județe
    const profilesByCounty = await prisma.userProfile.groupBy({
      by: ['judetCode'],
      _count: { judetCode: true },
      where: { judetCode: { not: null } },
      orderBy: { _count: { judetCode: 'desc' } },
    })
    const usersByCounty = profilesByCounty.map(p => ({
      county: p.judetCode || '—',
      count: p._count.judetCode,
    }))

    // Utilizatori pe calitate
    const profilesByCalitate = await prisma.userProfile.groupBy({
      by: ['calitate'],
      _count: { calitate: true },
      where: { calitate: { not: null } },
      orderBy: { _count: { calitate: 'desc' } },
    })
    const usersByCalitate = profilesByCalitate.map(p => ({
      calitate: p.calitate || 'Nespecificat',
      count: p._count.calitate,
    }))

    // Rată promovare pe teste
    const tests = await prisma.test.findMany({
      select: {
        title: true,
        attempts: {
          select: { passed: true },
          where: { submittedAt: { not: null } },
        },
      },
    })
    const passRateByModule = tests
      .filter(t => t.attempts.length > 0)
      .map(t => ({
        test: t.title.length > 30 ? t.title.slice(0, 30) + '...' : t.title,
        passRate: Math.round((t.attempts.filter(a => a.passed).length / t.attempts.length) * 100),
        total: t.attempts.length,
      }))

    // Statistici generale
    const [totalUsers, activeUsers, totalAttempts, passedAttempts] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.testAttempt.count({ where: { submittedAt: { not: null } } }),
      prisma.testAttempt.count({ where: { submittedAt: { not: null }, passed: true } }),
    ])

    return NextResponse.json({
      usersByCounty,
      usersByCalitate,
      passRateByModule,
      summary: {
        totalUsers,
        activeUsers,
        totalAttempts,
        passedAttempts,
        globalPassRate: totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0,
      },
    })
  } catch (e) {
    console.error('Stats error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
