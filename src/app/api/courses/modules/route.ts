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
        materials: {
          orderBy: { order: 'asc' },
          include: {
            progress: {
              where: { userId: session.id },
              select: { id: true, viewedAt: true },
            },
          },
        },
        tests: {
          where: { published: true },
          select: {
            id: true,
            title: true,
            questionsPerAttempt: true,
            passingScore: true,
            attempts: {
              where: { userId: session.id },
              orderBy: { submittedAt: 'desc' },
              take: 1,
              select: { passed: true, score: true, maxScore: true, submittedAt: true },
            },
          },
        },
        _count: {
          select: { lessons: true },
        },
      },
    })

    const modulesWithStats = modules.map((mod) => {
      const videoLessons = mod.lessons.filter(l => l.videoUrl)
      const totalVideos = videoLessons.length
      const completedVideos = videoLessons.filter(
        (l) => l.progress[0]?.status === 'COMPLETED'
      ).length
      const videoComplete = totalVideos > 0 && completedVideos === totalVideos

      const totalMaterials = mod.materials.length
      const viewedMaterials = mod.materials.filter(m => m.progress.length > 0).length
      const materialsComplete = totalMaterials > 0 && viewedMaterials === totalMaterials

      const hasTests = mod.tests.length > 0
      const testPassed = hasTests && mod.tests.some(t => t.attempts[0]?.passed)

      let components = 0
      let completedComponents = 0

      if (totalVideos > 0) {
        components++
        if (videoComplete) completedComponents++
      }
      if (totalMaterials > 0) {
        components++
        if (materialsComplete) completedComponents++
      }
      if (hasTests) {
        components++
        if (testPassed) completedComponents++
      }

      const percent = components > 0
        ? Math.round((completedComponents / components) * 100)
        : 0

      return {
        ...mod,
        stats: {
          totalVideos,
          completedVideos,
          videoComplete,
          totalMaterials,
          viewedMaterials,
          materialsComplete,
          hasTests,
          testPassed,
          components,
          completedComponents,
          percent,
          total: mod.lessons.length,
          completed: completedVideos,
        },
      }
    })

    return ok({ modules: modulesWithStats, category })
  } catch (e) {
    console.error(e)
    return serverError()
  }
}
