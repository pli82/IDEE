// src/app/api/events/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/api'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { searchParams } = req.nextUrl
  const county = searchParams.get('county')
  const limit = parseInt(searchParams.get('limit') || '50', 10)

  try {
    const events = await prisma.event.findMany({
      where: {
        published: true,
        ...(county ? { countyCode: county } : {}),
        startAt: { gte: new Date() },
      },
      include: { county: true },
      orderBy: { startAt: 'asc' },
      take: limit,
    })
    return ok(events)
  } catch (err) {
    console.error('Events error:', err)
    return serverError()
  }
}
