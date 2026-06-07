export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/api'

export async function GET(_req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()

  try {
    const [lessonProgress, totalLessons, passedTests, failedTests] = await Promise.all([
      prisma.progress.findMany({
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
      }),
      prisma.lesson.count({ where: { published: true } }),
      prisma.testAttempt.count({ where: { userId: session.id, passed: true } }),
      prisma.testAttempt.count({ where: { userId: session.id, passed: false, submittedAt: { not: null } } }),
    ])
