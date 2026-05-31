// src/app/api/admin/stats/route.ts
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ok, forbidden, serverError } from '@/lib/api'

export async function GET() {
  const session = await getSession()
  if (!session || !isAdmin(session)) return forbidden()

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000)

    const [
      totalUsers, activeUsers, pendingVerification,
      recentRegistrations, totalModules, totalLessons,
      totalAttempts, passedAttempts,
      usersByCounty, usersByCalitate,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { emailVerified: false } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.module.count({ where: { published: true } }),
      prisma.lesson.count({ where: { published: true } }),
      prisma.testAttempt.count({ where: { submittedAt: { not: null } } }),
      prisma.testAttempt.count({ where: { passed: true } }),
      prisma.userProfile.groupBy({ by: ['judetCode'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 15 }),
      prisma.userProfile.groupBy({ by: ['calitate'], _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
    ])

    const countyNames = await prisma.county.findMany({ select: { code: true, name: true } })
    const countyMap = Object.fromEntries(countyNames.map(c => [c.code, c.name]))

    return ok({
      totalUsers,
      activeUsers,
      pendingVerification,
      recentRegistrations,
      totalModules,
      totalLessons,
      completionRate: totalLessons > 0
        ? Math.round((await prisma.progress.count({ where: { status: 'COMPLETED' } })) / (totalLessons || 1) * 100)
        : 0,
      testPassRate: totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0,
      usersByCounty: usersByCounty.map(r => ({
        countyName: countyMap[r.judetCode || ''] || r.judetCode || 'Nespecificat',
        count: r._count.id,
      })),
      usersByCalitate: usersByCalitate.map(r => ({
        calitate: r.calitate || 'Nespecificat',
        count: r._count.id,
      })),
    })
  } catch (err) {
    console.error('Stats error:', err)
    return serverError()
  }
}
