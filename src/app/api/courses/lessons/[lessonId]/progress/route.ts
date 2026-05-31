// src/app/api/courses/lessons/[lessonId]/progress/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/api'
import { z } from 'zod'

const ProgressUpdateSchema = z.object({
  watchedPercent: z.number().min(0).max(100),
  lastPositionSeconds: z.number().min(0).optional(),
})

export async function GET(_req: NextRequest, { params }: { params: { lessonId: string } }) {
  const session = await getSession()
  if (!session) return unauthorized()

  try {
    const progress = await prisma.progress.findUnique({
      where: { userId_lessonId: { userId: session.id, lessonId: params.lessonId } },
    })
    return ok(progress)
  } catch {
    return serverError()
  }
}

export async function PUT(req: NextRequest, { params }: { params: { lessonId: string } }) {
  const session = await getSession()
  if (!session) return unauthorized()

  try {
    const body = await req.json()
    const parsed = ProgressUpdateSchema.safeParse(body)
    if (!parsed.success) return ok(null)

    const { watchedPercent, lastPositionSeconds = 0 } = parsed.data
    const status = watchedPercent >= 95 ? 'COMPLETED' : watchedPercent > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'

    const progress = await prisma.progress.upsert({
      where: { userId_lessonId: { userId: session.id, lessonId: params.lessonId } },
      create: {
        userId: session.id,
        lessonId: params.lessonId,
        watchedPercent,
        lastPositionSeconds,
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
      },
      update: {
        watchedPercent,
        lastPositionSeconds,
        status,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    })
    return ok(progress)
  } catch (err) {
    console.error('Progress update error:', err)
    return serverError()
  }
}
