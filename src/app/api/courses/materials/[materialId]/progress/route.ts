export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/api'

export async function POST(
  request: NextRequest,
  { params }: { params: { materialId: string } }
) {
  const session = await getSession()
  if (!session) return unauthorized()

  try {
    await prisma.materialProgress.upsert({
      where: {
        userId_materialId: {
          userId: session.id,
          materialId: params.materialId,
        },
      },
      update: { viewedAt: new Date() },
      create: {
        userId: session.id,
        materialId: params.materialId,
      },
    })
    return ok({ success: true })
  } catch (err) {
    console.error('MaterialProgress POST error:', err)
    return serverError()
  }
}
