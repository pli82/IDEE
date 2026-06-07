export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: session.id },
          { userId: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    return NextResponse.json({ data: notifications })
  } catch (e) {
    console.error('Notifications GET error:', e)
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Neautorizat' }, { status: 403 })

  try {
    const body = await req.json()
    const { title, body: notifBody, type, userId } = body

    if (!title || !notifBody) {
      return NextResponse.json({ error: 'Titlu și conținut obligatorii' }, { status: 400 })
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        body: notifBody,
        type: type || 'INFO',
        userId: userId || null,
      },
    })
    return NextResponse.json({ data: notification }, { status: 201 })
  } catch (e) {
    console.error('Notifications POST error:', e)
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Neautorizat' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID lipsă' }, { status: 400 })

  try {
    await prisma.notification.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}
