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

    // Rata de finalizare = media procentelor individuale per user activ
    // COUNT(DISTINCT "lessonId") per user pentru a evita duplicate din tabela progress
    // Userii fara nicio lectie completata contribuie cu 0% la medie
    const completedPerUser = await prisma.$queryRaw<{ userId: string; distinctCount: bigint }[]>`
      SELECT "userId", COUNT(DISTINCT "lessonId") as "distinctCount"
      FROM progress
      WHERE status = 'COMPLETED'
      GROUP BY "userId"
    `
    const completionRate = activeUsers > 0 && totalLessons > 0
      ? Math.round(
          completedPerUser.reduce((sum, u) => {
            const userPct = Math.min(Number(u.distinctCount) / totalLessons * 100, 100)
            return sum + userPct
          }, 0) / activeUsers
        )
      : 0

    return ok({
      totalUsers,
      activeUsers,
      pendingVerification,
      recentRegistrations,
      totalModules,
      totalLessons,
      completionRate,
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
