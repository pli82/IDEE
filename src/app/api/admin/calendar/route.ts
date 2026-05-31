// src/app/api/admin/calendar/route.ts - Admin calendar events
import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin, createAuditLog } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const EventSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  countyCode: z.string().max(5).optional().nullable(),
  startAt: z.string(),
  endAt: z.string(),
  location: z.string().max(500).optional(),
  onlineLink: z.string().optional().nullable(),
  targetAudience: z.string().max(500).optional(),
  maxParticipants: z.number().int().positive().optional().nullable(),
  published: z.boolean().default(false),
})

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Neautorizat' }, { status: 403 })
  const events = await prisma.event.findMany({
    include: { county: true },
    orderBy: { startAt: 'asc' },
  })
  return NextResponse.json({ data: events })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Neautorizat' }, { status: 403 })
  try {
    const body = await request.json()
    const data = EventSchema.parse(body)
    const event = await prisma.event.create({
      data: { ...data, startAt: new Date(data.startAt), endAt: new Date(data.endAt) },
    })
    await createAuditLog({ actorId: session.id, action: 'CREATE_EVENT', entityType: 'Event', entityId: event.id })
    return NextResponse.json({ data: event }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Date invalide', details: error.errors }, { status: 400 })
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Neautorizat' }, { status: 403 })
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID lipsa' }, { status: 400 })
  try {
    const body = await request.json()
    const data = EventSchema.partial().parse(body)
    const event = await prisma.event.update({
      where: { id },
      data: { ...data, ...(data.startAt && { startAt: new Date(data.startAt) }), ...(data.endAt && { endAt: new Date(data.endAt) }) },
    })
    return NextResponse.json({ data: event })
  } catch (error) {
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Neautorizat' }, { status: 403 })
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID lipsa' }, { status: 400 })
  try {
    await prisma.event.delete({ where: { id } })
    await createAuditLog({ actorId: session.id, action: 'DELETE_EVENT', entityType: 'Event', entityId: id })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}
