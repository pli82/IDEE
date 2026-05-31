// src/app/api/counties/route.ts
import { prisma } from '@/lib/prisma'
import { ok, serverError } from '@/lib/api'

export async function GET() {
  try {
    const counties = await prisma.county.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    })
    return ok(counties)
  } catch {
    return serverError()
  }
}
