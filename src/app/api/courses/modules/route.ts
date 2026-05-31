import { NextRequest } from 'next/server';
import { ok, unauthorized, serverError } from '@/lib/api';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return unauthorized();

    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get('category');
    const categoryId = searchParams.get('categoryId');

    const whereCategory = categorySlug
      ? { slug: categorySlug }
      : categoryId
      ? { id: categoryId }
      : undefined;

    const category = whereCategory
      ? await prisma.contentCategory.findFirst({ where: whereCategory })
      : null;

    const modules = await prisma.module.findMany({
      where: {
        isPublished: true,
        ...(category ? { categoryId: category.id } : {}),
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        category: { select: { id: true, name: true, slug: true, color: true } },
        lessons: {
          where: { isPublished: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            progress: {
              where: { userId: session.id },
              select: { status: true, watchedPercent: true },
            },
          },
        },
        _count: {
          select: { lessons: { where: { isPublished: true } } },
        },
      },
    });

    // Augment with completion stats per module
    const modulesWithStats = modules.map((mod) => {
      const total = mod.lessons.length;
      const completed = mod.lessons.filter(
        (l) => l.progress[0]?.status === 'COMPLETED'
      ).length;
      return {
        ...mod,
        stats: { total, completed, percent: total > 0 ? Math.round((completed / total) * 100) : 0 },
      };
    });

    return ok({ data: modulesWithStats, category });
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
