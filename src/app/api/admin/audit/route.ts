// src/app/api/admin/audit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession, isSuperAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || !isSuperAdmin(session)) return NextResponse.json({ error: 'Neautorizat' }, { status: 403 })

  const { searchParams } = request.nextUrl
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const action = searchParams.get('action')

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: action ? { action } : undefined,
      include: { actor: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count(action ? { where: { action } } : undefined),
  ])

  return NextResponse.json({ data: logs, total, page, pages: Math.ceil(total / limit) })
}
