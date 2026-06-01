export const dynamic = 'force-dynamic'
// src/app/api/admin/users/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, isAdmin, createAuditLog } from '@/lib/auth'
import { ok, unauthorized, forbidden, serverError } from '@/lib/api'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!isAdmin(session)) return forbidden()

  const { searchParams } = req.nextUrl
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const search = searchParams.get('search')
  const status = searchParams.get('status')
  const county = searchParams.get('county')

  try {
    const where: any = {
      ...(search ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { profile: { OR: [
            { nume: { contains: search, mode: 'insensitive' } },
            { prenume: { contains: search, mode: 'insensitive' } },
          ]}},
        ],
      } : {}),
      ...(status ? { status } : {}),
      ...(county ? { profile: { judetCode: county } } : {}),
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
profile: true,
          roles: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return ok({ data: users, total, page, pages: Math.ceil(total / limit) } as any)
  } catch {
    return serverError()
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!isAdmin(session)) return forbidden()

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return ok(null)

  try {
    const body = await req.json()
    const UpdateSchema = z.object({
      status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']).optional(),
      role: z.enum(['SUPER_ADMIN', 'CONTENT_ADMIN', 'REPORTING_ADMIN', 'USER']).optional(),
    })
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) return ok(null)

    const { status, role } = parsed.data
    if (status) {
      await prisma.user.update({ where: { id }, data: { status } })
      await createAuditLog({ actorId: session.id, action: 'USER_STATUS_CHANGED', entityType: 'User', entityId: id, metadata: { status } })
    }
    return ok({ success: true })
  } catch {
    return serverError()
  }
}
