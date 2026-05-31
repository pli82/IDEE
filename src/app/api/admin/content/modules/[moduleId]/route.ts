import { NextRequest } from 'next/server';
import { ok, notFound, serverError } from '@/lib/api';
import { withAdmin } from '@/lib/api';
import prisma from '@/lib/prisma';

export const GET = withAdmin(async (
  _req: NextRequest,
  { params }: { params: { moduleId: string } }
) => {
  try {
    const mod = await prisma.module.findUnique({
      where: { id: params.moduleId },
      include: {
        category: true,
        lessons: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!mod) return notFound('Modul negăsit');
    return ok({ data: mod });
  } catch (e) { console.error(e); return serverError(); }
});

export const PATCH = withAdmin(async (
  req: NextRequest,
  { params }: { params: { moduleId: string } }
) => {
  try {
    const body = await req.json();
    const mod = await prisma.module.update({
      where: { id: params.moduleId },
      data: body,
    });
    return ok({ data: mod });
  } catch (e) { console.error(e); return serverError(); }
});

export const DELETE = withAdmin(async (
  _req: NextRequest,
  { params }: { params: { moduleId: string } }
) => {
  try {
    await prisma.module.delete({ where: { id: params.moduleId } });
    return ok({ message: 'Modul șters' });
  } catch (e) { console.error(e); return serverError(); }
});
