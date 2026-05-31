import { NextRequest } from 'next/server';
import { ok, serverError } from '@/lib/api';
import { withAdmin } from '@/lib/api';
import prisma from '@/lib/prisma';

export const DELETE = withAdmin(async (
  _req: NextRequest,
  { params }: { params: { eventId: string } }
) => {
  try {
    await prisma.event.delete({ where: { id: params.eventId } });
    return ok({ message: 'Eveniment șters' });
  } catch (e) {
    console.error(e);
    return serverError();
  }
});
