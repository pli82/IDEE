import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { ok, unauthorized, notFound, serverError } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { lessonId: string } }) {
  const session = await getSession()
  if (!session) return unauthorized()

  try {
    const lesson = await prisma.lesson.findFirst({
      where: { id: params.lessonId, published: true },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            category: { select: { title: true, slug: true } },
            lessons: {
              where: { published: true },
              select: { id: true, title: true, order: true },
              orderBy: { order: 'asc' },
            },
          },
        },
        tests: {
          where: { published: true },
          select: { id: true, title: true, questionsPerAttempt: true, passingScore: true },
        },
        progress: {
          where: { userId: session.id },
          select: { status: true, watchedPercent: true, lastPositionSeconds: true },
        },
      },
    })

    if (!lesson) return notFound('Lecție inexistentă')
    return ok(lesson)
  } catch (err) {
    console.error('Lesson detail error:', err)
    return serverError()
  }
}
