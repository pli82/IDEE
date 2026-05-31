// src/app/api/admin/content/route.ts - Gestionare categorii, module, lecții
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/auth'
import { z } from 'zod'

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

const LessonSchema = z.object({
  moduleId: z.string(),
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  videoUrl: z.string().url().optional().nullable(),
  videoFileId: z.string().optional().nullable(),
  pdfFileId: z.string().optional().nullable(),
  order: z.number().int().default(0),
  published: z.boolean().default(false),
  minWatchPercentForTest: z.number().int().min(0).max(100).default(0),
})

export async function GET(request: NextRequest) {
  const session = await getSession()
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
          videoFile: { select: { filename: true, storagePath: true } },
          pdfFile: { select: { filename: true, storagePath: true } },
        },
        orderBy: { order: 'asc' },
      })
      return NextResponse.json({ data: lessons })
    }

    return NextResponse.json({ error: 'Resursă invalidă' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const resource = searchParams.get('resource') || 'categories'

  try {
    const body = await request.json()

    if (resource === 'categories') {
      const data = CategorySchema.parse(body)
      const category = await prisma.contentCategory.create({ data })
      await createAuditLog({ actorId: session.id, action: 'CREATE_CATEGORY', entityType: 'ContentCategory', entityId: category.id })
      return NextResponse.json({ data: category }, { status: 201 })
    }

    if (resource === 'modules') {
      const data = ModuleSchema.parse(body)
      const module = await prisma.module.create({ data })
      await createAuditLog({ actorId: session.id, action: 'CREATE_MODULE', entityType: 'Module', entityId: module.id })
      return NextResponse.json({ data: module }, { status: 201 })
    }

    if (resource === 'lessons') {
      const data = LessonSchema.parse(body)
      const lesson = await prisma.lesson.create({ data })
      await createAuditLog({ actorId: session.id, action: 'CREATE_LESSON', entityType: 'Lesson', entityId: lesson.id })
      return NextResponse.json({ data: lesson }, { status: 201 })
    }

    return NextResponse.json({ error: 'Resursă invalidă' }, { status: 400 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Date invalide', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const resource = searchParams.get('resource')
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID lipsă' }, { status: 400 })

  try {
    const body = await request.json()

    if (resource === 'categories') {
      const data = CategorySchema.partial().parse(body)
      const category = await prisma.contentCategory.update({ where: { id }, data })
      await createAuditLog({ actorId: session.id, action: 'UPDATE_CATEGORY', entityType: 'ContentCategory', entityId: id })
      return NextResponse.json({ data: category })
    }

    if (resource === 'modules') {
      const data = ModuleSchema.partial().parse(body)
      const module = await prisma.module.update({ where: { id }, data })
      return NextResponse.json({ data: module })
    }

    if (resource === 'lessons') {
      const data = LessonSchema.partial().parse(body)
      const lesson = await prisma.lesson.update({ where: { id }, data })
      return NextResponse.json({ data: lesson })
    }

    return NextResponse.json({ error: 'Resursă invalidă' }, { status: 400 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Date invalide', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })

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

    await createAuditLog({ actorId: session.id, action: `DELETE_${resource?.toUpperCase()}`, entityType: resource || '', entityId: id })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}
