import { NextRequest } from 'next/server';
import { ok, serverError } from '@/lib/api';
import { withAdmin } from '@/lib/api';
import prisma from '@/lib/prisma';

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const event = await prisma.event.create({
      data: {
        title: body.title,
        description: body.description,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        location: body.location,
        isOnline: body.isOnline ?? false,
        meetingUrl: body.meetingUrl,
        eventType: body.eventType ?? 'TRAINING',
        countyId: body.countyId,
      },
      include: { county: { select: { name: true } } },
    });
    return ok({ data: event });
  } catch (e) {
    console.error(e);
    return serverError();
  }
});
