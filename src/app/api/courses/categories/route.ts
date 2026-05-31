// src/app/api/courses/categories/route.ts
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/api'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()

  try {
    const categories = await prisma.contentCategory.findMany({
      where: { published: true, parentId: null },
      include: {
        children: {
          where: { published: true },
          orderBy: { order: 'asc' },
        },
        modules: {
          where: { published: true },
          select: { id: true, title: true, _count: { select: { lessons: true } } },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    })
    return ok(categories)
  } catch (err) {
    console.error('Categories error:', err)
    return serverError()
  }
}
