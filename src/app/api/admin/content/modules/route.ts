import { NextRequest } from 'next/server';
import { ok, serverError } from '@/lib/api';
import { withAdmin } from '@/lib/api';
import prisma from '@/lib/prisma';

export const GET = withAdmin(async (_req: NextRequest) => {
  try {
    const modules = await prisma.module.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        category: { select: { name: true, color: true } },
        _count: { select: { lessons: true } },
      },
    });
    return ok({ data: modules });
  } catch (e) {
    console.error(e);
    return serverError();
  }
});

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const mod = await prisma.module.create({
      data: {
        title: body.title,
        description: body.description,
        categoryId: body.categoryId,
        sortOrder: body.sortOrder ?? 0,
        isPublished: body.isPublished ?? false,
      },
    });
    return ok({ data: mod });
  } catch (e) {
    console.error(e);
    return serverError();
  }
});
