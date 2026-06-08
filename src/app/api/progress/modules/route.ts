export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/api'

export async function GET(_req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()

  try {
    const modules = await prisma.module.findMany({
      where: { published: true },
      orderBy: [{ category: { order: 'asc' } }, { order: 'asc' }],
      include: {
        category: { select: { id: true, title: true, slug: true } },
        lessons: {
          where: { published: true },
          include: {
            progress: {
              where: { userId: session.id },
              select: { status: true, watchedPercent: true },
            },
            tests: {
              where: { published: true },
              include: {
                attempts: {
                  where: { userId: session.id },
                  orderBy: { submittedAt: 'desc' },
                  take: 1,
                  select: { passed: true, score: true, maxScore: true },
                },
              },
            },
          },
        },
        materials: {
          include: {
            progress: {
              where: { userId: session.id },
              select: { id: true },
            },
          },
        },
      },
    })

    const result = modules.map(mod => {
      const videoLessons = mod.lessons.filter(l => l.videoUrl)
      const totalVideos = videoLessons.length
      const completedVideos = videoLessons.filter(l => l.progress[0]?.status === 'COMPLETED').length
      const videoComplete = totalVideos > 0 && completedVideos === totalVideos

      const totalMaterials = mod.materials.length
      const viewedMaterials = mod.materials.filter(m => m.progress.length > 0).length
      const materialsComplete = totalMaterials > 0 && viewedMaterials === totalMaterials

      const allTests = mod.lessons.flatMap(l => l.tests)
      const hasTests = allTests.length > 0
      const testPassed = hasTests && allTests.some(t => t.attempts[0]?.passed)

      let components = 0
      let completedComponents = 0
      if (totalVideos > 0) { components++; if (videoComplete) completedComponents++ }
      if (totalMaterials > 0) { components++; if (materialsComplete) completedComponents++ }
      if (hasTests) { components++; if (testPassed) completedComponents++ }

      const hasAnyProgress = completedVideos > 0 || viewedMaterials > 0 || testPassed

      return {
        id: mod.id,
        title: mod.title,
        category: mod.category,
        hasAnyProgress,
        stats: {
          totalVideos, completedVideos, videoComplete,
          totalMaterials, viewedMaterials, materialsComplete,
          hasTests, testPassed,
          components, completedComponents,
          percent: components > 0 ? Math.round((completedComponents / components) * 100) : 0,
        },
      }
    }).filter(m => m.hasAnyProgress || m.stats.components > 0)

    return ok({ modules: result })
  } catch (err) {
    console.error('Progress modules GET error:', err)
    return serverError()
  }
}
