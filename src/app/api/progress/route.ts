export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/api'

export async function GET(_req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()

  try {
    const lessonProgress = await prisma.progress.findMany({
      where: { userId: session.id },
      include: {
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

    const totalLessons = await prisma.lesson.count({ where: { published: true } })
    const completedLessons = lessonProgress.filter(p => p.status === 'COMPLETED').length
    const passedTests = await prisma.testAttempt.count({ where: { userId: session.id, passed: true } })
    const failedTests = await prisma.testAttempt.count({ where: { userId: session.id, passed: false, submittedAt: { not: null } } })

    return ok({
      lessonProgress,
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
