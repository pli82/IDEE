export const dynamic = 'force-dynamic'
// src/app/api/admin/tests/route.ts - Gestionare teste admin
import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin, createAuditLog } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const TestSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  moduleId: z.string().optional().nullable(),
  lessonId: z.string().optional().nullable(),
  questionsPerAttempt: z.number().int().min(1).max(100).default(10),
  passingScore: z.number().int().min(1).default(7),
  published: z.boolean().default(false),
})

const QuestionSchema = z.object({
  testId: z.string(),
  text: z.string().min(5),
  type: z.enum(['SINGLE', 'MULTIPLE']).default('SINGLE'),
  explanation: z.string().max(2000).optional(),
  active: z.boolean().default(true),
  order: z.number().int().default(0),
  options: z.array(z.object({
    text: z.string().min(1),
    isCorrect: z.boolean(),
    order: z.number().int().default(0),
  })).min(2).max(6),
})

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Neautorizat' }, { status: 403 })

  const { searchParams } = request.nextUrl
  const resource = searchParams.get('resource') || 'tests'
  const testId = searchParams.get('testId')

  try {
    if (resource === 'tests') {
      const tests = await prisma.test.findMany({
        include: {
          module: { select: { title: true, category: { select: { title: true } } } },
          lesson: { select: { title: true } },
          _count: { select: { questions: true, attempts: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json({ data: tests })
    }

    if (resource === 'questions' && testId) {
      const questions = await prisma.question.findMany({
        where: { testId },
        include: { options: { orderBy: { order: 'asc' } } },
        orderBy: { order: 'asc' },
      })
      return NextResponse.json({ data: questions })
    }

    return NextResponse.json({ error: 'Parametri lipsă' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Neautorizat' }, { status: 403 })

  const { searchParams } = request.nextUrl
  const resource = searchParams.get('resource') || 'tests'

  try {
    const body = await request.json()

    if (resource === 'tests') {
      const data = TestSchema.parse(body)
      const test = await prisma.test.create({ data })
      await createAuditLog({ actorId: session.id, action: 'CREATE_TEST', entityType: 'Test', entityId: test.id })
      return NextResponse.json({ data: test }, { status: 201 })
    }

    if (resource === 'questions') {
      const { options, ...questionData } = QuestionSchema.parse(body)
      const question = await prisma.question.create({
        data: {
          ...questionData,
          options: {
            create: options.map((opt, i) => ({ ...opt, order: i })),
          },
        },
        include: { options: true },
      })
      return NextResponse.json({ data: question }, { status: 201 })
    }

    // Import în masă din CSV/JSON
    if (resource === 'import') {
      const { testId, questions } = body as { testId: string; questions: z.infer<typeof QuestionSchema>[] }
      const created = await Promise.all(
        questions.map(async ({ options, ...q }) => {
          return prisma.question.create({
            data: {
              ...q,
              testId,
              options: { create: options.map((opt, i) => ({ ...opt, order: i })) },
            },
          })
        })
      )
      return NextResponse.json({ data: { imported: created.length } })
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
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Neautorizat' }, { status: 403 })

  const { searchParams } = request.nextUrl
  const resource = searchParams.get('resource')
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID lipsă' }, { status: 400 })

  try {
    const body = await request.json()

    if (resource === 'tests') {
      const data = TestSchema.partial().parse(body)
      const test = await prisma.test.update({ where: { id }, data })
      return NextResponse.json({ data: test })
    }

    if (resource === 'questions') {
      const { options, ...questionData } = QuestionSchema.partial().parse(body)
      const question = await prisma.question.update({
        where: { id },
        data: questionData,
        include: { options: true },
      })
      // Actualizare opțiuni - șterge și recreează
      if (options) {
        await prisma.questionOption.deleteMany({ where: { questionId: id } })
        await prisma.questionOption.createMany({
          data: options.map((opt, i) => ({ ...opt, questionId: id, order: i })),
        })
      }
      return NextResponse.json({ data: question })
    }

    return NextResponse.json({ error: 'Resursă invalidă' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Neautorizat' }, { status: 403 })

  const { searchParams } = request.nextUrl
  const resource = searchParams.get('resource')
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID lipsă' }, { status: 400 })

  try {
    if (resource === 'tests') {
      await prisma.test.delete({ where: { id } })
} else if (resource === 'questions') {
      await prisma.attemptAnswer.deleteMany({ where: { questionId: id } })
      await prisma.questionOption.deleteMany({ where: { questionId: id } })
      await prisma.question.delete({ where: { id } })
    } else {
      return NextResponse.json({ error: 'Resursă invalidă' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}
