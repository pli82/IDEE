export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jwtVerify } from 'jose'
import { z } from 'zod'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)

async function getSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get('aep_session')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch {
    return null
  }
}

function isAdminSession(session: any) {
  const roles = session?.roles as string[] || []
  return roles.some(r => ['SUPER_ADMIN', 'CONTENT_ADMIN', 'REPORTING_ADMIN'].includes(r))
}

const CategorySchema = z.object({
  title: z.string().min(2).max(200),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().max(1000).optional(),
  parentId: z.string().optional().nullable(),
  order: z.number().int().default(0),
  published: z.boolean().default(false),
})

const ModuleSchema = z.object({
  categoryId: z.string(),
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  order: z.number().int().default(0),
  published: z.boolean().default(false),
})

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const resource = searchParams.get('resource') || 'categories'

  try {
    if (resource === 'categories') {
      const categories = await prisma.contentCategory.findMany({
        include: {
          children: { orderBy: { order: 'asc' } },
          _count: { select: { modules: true } },
        },
        where: { parentId: null },
        orderBy: { order: 'asc' },
      })
      return NextResponse.json({ data: categories })
    }

    if (resource === 'modules') {
      const categoryId = searchParams.get('categoryId')
      const modules = await prisma.module.findMany({
        where: categoryId ? { categoryId } : undefined,
        include: {
          category: { select: { title: true } },
          _count: { select: { lessons: true } },
        },
        orderBy: { order: 'asc' },
      })
      return NextResponse.json({ data: modules })
    }

    if (resource === 'lessons') {
      const moduleId = searchParams.get('moduleId')
      const lessons = await prisma.lesson.findMany({
        where: moduleId ? { moduleId } : undefined,
        include: {
          module: { select: { title: true } },
        },
        orderBy: { order: 'asc' },
      })
      return NextResponse.json({ data: lessons })
    }

    return NextResponse.json({ error: 'Resursă invalidă' }, { status: 400 })
  } catch (error) {
    console.error('Content GET error:', error)
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session || !isAdminSession(session)) return NextResponse.json({ error: 'Neautorizat' }, { status: 403 })

  const { searchParams } = request.nextUrl
  const resource = searchParams.get('resource') || 'categories'

  try {
    const body = await request.json()

    if (resource === 'categories') {
      const data = CategorySchema.parse(body)
      const category = await prisma.contentCategory.create({ data })
      return NextResponse.json({ data: category }, { status: 201 })
    }

    if (resource === 'modules') {
      const data = ModuleSchema.parse(body)
      const module = await prisma.module.create({ data })
      return NextResponse.json({ data: module }, { status: 201 })
    }

    return NextResponse.json({ error: 'Resursă invalidă' }, { status: 400 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Date invalide', details: error.errors }, { status: 400 })
    }
    console.error('Content POST error:', error)
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session || !isAdminSession(session)) return NextResponse.json({ error: 'Neautorizat' }, { status: 403 })

  const { searchParams } = request.nextUrl
  const resource = searchParams.get('resource')
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID lipsă' }, { status: 400 })

  try {
    const body = await request.json()

    if (resource === 'categories') {
      const data = CategorySchema.partial().parse(body)
      const category = await prisma.contentCategory.update({ where: { id }, data })
      return NextResponse.json({ data: category })
    }

    if (resource === 'modules') {
      const data = ModuleSchema.partial().parse(body)
      const module = await prisma.module.update({ where: { id }, data })
      return NextResponse.json({ data: module })
    }

    if (resource === 'lessons') {
      const lesson = await prisma.lesson.update({ where: { id }, data: body })
      return NextResponse.json({ data: lesson })
    }

    return NextResponse.json({ error: 'Resursă invalidă' }, { status: 400 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Date invalide', details: error.errors }, { status: 400 })
    }
    console.error('Content PUT error:', error)
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session || !isAdminSession(session)) return NextResponse.json({ error: 'Neautorizat' }, { status: 403 })

  const { searchParams } = request.nextUrl
  const resource = searchParams.get('resource')
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID lipsă' }, { status: 400 })

  try {
    if (resource === 'categories') {
      await prisma.contentCategory.delete({ where: { id } })
    } else if (resource === 'modules') {
      await prisma.module.delete({ where: { id } })
    } else if (resource === 'lessons') {
      await prisma.lesson.delete({ where: { id } })
    } else {
      return NextResponse.json({ error: 'Resursă invalidă' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Content DELETE error:', error)
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}
