export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jwtVerify } from 'jose'
import { ok, unauthorized, serverError } from '@/lib/api'
import { getSession } from '@/lib/auth'

async function getAdminSession(request: NextRequest) {
  const token = request.cookies.get('aep_session')?.value
  if (!token) return null
  try {
    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-in-production')
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch { return null }
}

function isAdmin(session: any) {
  const roles = Array.isArray(session?.roles) ? session.roles : []
  return roles.some((r: any) => ['SUPER_ADMIN', 'CONTENT_ADMIN'].includes(r))
}

export async function GET(
  request: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  const session = await getSession()
  if (!session) return unauthorized()

  try {
    const materials = await prisma.lessonMaterial.findMany({
      where: { moduleId: params.moduleId },
      orderBy: { order: 'asc' },
      include: {
        progress: {
          where: { userId: session.id },
          select: { id: true, viewedAt: true },
        },
      },
    })
    return ok({ data: materials })
  } catch (err) {
    console.error('Module materials GET error:', err)
    return serverError()
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  const session = await getAdminSession(request)
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Neautorizat' }, { status: 403 })

  try {
    const body = await request.json()
    const { title, url, type, order } = body
    if (!title || !url) return NextResponse.json({ error: 'Titlu și URL obligatorii' }, { status: 400 })

    const material = await prisma.lessonMaterial.create({
      data: {
        moduleId: params.moduleId,
        title,
        url,
        type: type || 'PDF',
        order: order || 0,
      },
    })
    return ok({ data: material })
  } catch (err) {
    console.error('Module materials POST error:', err)
    return serverError()
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  const session = await getAdminSession(request)
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Neautorizat' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID lipsă' }, { status: 400 })

  try {
    await prisma.lessonMaterial.delete({ where: { id } })
    return ok({ success: true })
  } catch (err) {
    return serverError()
  }
}
