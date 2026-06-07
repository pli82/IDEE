export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)

async function getSession(request: NextRequest) {
  const token = request.cookies.get('aep_session')?.value
  if (!token) return null
  try {
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
  { params }: { params: { lessonId: string } }
) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })

  try {
    const materials = await prisma.lessonMaterial.findMany({
      where: { lessonId: params.lessonId },
      orderBy: { order: 'asc' },
    })
    return NextResponse.json({ data: materials })
  } catch (err) {
    console.error('Materials GET error:', err)
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  const session = await getSession(request)
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Neautorizat' }, { status: 403 })

  try {
    const body = await request.json()
    const { title, url, type, order } = body
    if (!title || !url) return NextResponse.json({ error: 'Titlu și URL obligatorii' }, { status: 400 })

    const material = await prisma.lessonMaterial.create({
      data: {
        lessonId: params.lessonId,
        title,
        url,
        type: type || 'PDF',
        order: order || 0,
      },
    })
    return NextResponse.json({ data: material }, { status: 201 })
  } catch (err) {
    console.error('Materials POST error:', err)
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  const session = await getSession(request)
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Neautorizat' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID lipsă' }, { status: 400 })

  try {
    const body = await request.json()
    const material = await prisma.lessonMaterial.update({
      where: { id },
      data: body,
    })
    return NextResponse.json({ data: material })
  } catch (err) {
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  const session = await getSession(request)
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Neautorizat' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID lipsă' }, { status: 400 })

  try {
    await prisma.lessonMaterial.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}
