import { NextRequest } from 'next/server'
import { ok, unauthorized, serverError } from '@/lib/api'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return unauthorized()

    const { searchParams } = new URL(req.url)
    const categorySlug = searchParams.get('category')
    const categoryId = searchParams.get('categoryId')

    const whereCategory = categorySlug
      ? { slug: categorySlug }
      : categoryId ? { id: categoryId } : undefined

    const category = whereCategory
      ? await prisma.contentCategory.findFirst({ where: whereCategory })
      : null

    const modules = await prisma.module.findMany({
      where: {
        published: true,
        ...(category ? { categoryId: category.id } : {}),
      },
      orderBy: { order: 'asc' },
      include: {
        category: { select: { id: true, title: true, slug: true } },
        lessons: {
          where: { published: true },
          orderBy: { order: 'asc' },
          include: {
            progress: {
              where: { userId: session.id },
              select: { status: true, watchedPercent: true },
            },
          },
        },
        _count: {
          select: { lessons: true },
        },
      },
    })

    const modulesWithStats = modules.map((mod) => {
      const total = mod.lessons.length
      const completed = mod.lessons.filter(
        (l) => l.progress[0]?.status === 'COMPLETED'
      ).length
      return {
        ...mod,
        stats: { total, completed, percent: total > 0 ? Math.round((completed / total) * 100) : 0 },
      }
    })

    return ok({ modules: modulesWithStats, category })
  } catch (e) {
    console.error(e)
    return serverError()
  }
}
