export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/api'
export async function GET(_req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  try {
    const lessonProgress = await prisma.$queryRaw`
      SELECT
        p.id, p."lessonId", p.status, p."watchedPercent", p."completedAt", p."updatedAt",
        l.title as lesson_title,
        m.title as module_title,
        c.title as category_title
      FROM progress p
      JOIN lessons l ON p."lessonId" = l.id
      JOIN modules m ON l."moduleId" = m.id
      JOIN content_categories c ON m."categoryId" = c.id
      WHERE p."userId" = ${session.id}
      ORDER BY p."updatedAt" DESC
    ` as any[]
    const mapped = lessonProgress.map((p: any) => ({
      lessonId: p.lessonId,
      watchedPercent: Number(p.watchedPercent),
      status: p.status,
      completedAt: p.completedAt,
      lesson: {
        title: p.lesson_title,
        module: {
          title: p.module_title,
          category: { title: p.category_title },
        },
      },
    }))
    const totalLessons = await prisma.lesson.count({
      where: {
        published: true,
        module: { published: true },
      },
    })
    const completedLessons = new Set(
      mapped.filter((p: any) => p.status === 'COMPLETED').map((p: any) => p.lessonId)
    ).size
    const passedTests = await prisma.testAttempt.count({ where: { userId: session.id, passed: true } })
    const failedTests = await prisma.testAttempt.count({ where: { userId: session.id, passed: false, submittedAt: { not: null } } })
    return ok({
      lessonProgress: mapped,
      totalLessons,
      completedLessons,
      passedTests,
      failedTests,
    })
  } catch (err) {
    console.error('Progress GET error:', err)
    return serverError()
  }
}
