export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/api'

export async function GET(_req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()

  try {
    const attempts = await prisma.testAttempt.findMany({
      where: { userId: session.id, submittedAt: { not: null } },
      include: {
        test: { select: { title: true } },
      },
      orderBy: { submittedAt: 'desc' },
    })

    return ok({ attempts })
  } catch (err) {
    console.error('Tests GET error:', err)
    return serverError()
  }
}
