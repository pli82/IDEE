export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { ok, unauthorized, badRequest, serverError } from '@/lib/api'
import { z } from 'zod'

const SubmitSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    selectedOptionId: z.string().nullable(),
  })),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { testId: string } }
) {
  const session = await getSession()
  if (!session) return unauthorized()

  try {
    const body = await req.json()
    const parsed = SubmitSchema.safeParse(body)
    if (!parsed.success) return badRequest('Date invalide')

    const { answers } = parsed.data

    const test = await prisma.test.findUnique({
      where: { id: params.testId },
      select: {
        id: true,
        questionsPerAttempt: true,
        passingScore: true,
        questions: {
          where: { id: { in: answers.map(a => a.questionId) } },
          select: {
            id: true,
            text: true,
            options: {
              select: { id: true, text: true, isCorrect: true },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    if (!test) return badRequest('Test inexistent')

    let score = 0
    const results = answers.map(answer => {
      const question = test.questions.find(q => q.id === answer.questionId)
      if (!question) return {
        questionId: answer.questionId, questionText: '',
        selectedOptionId: answer.selectedOptionId,
        correctOptionId: null, isCorrect: false, options: []
      }
      const correctOption = question.options.find(o => o.isCorrect)
      const isCorrect = answer.selectedOptionId === correctOption?.id
      if (isCorrect) score++
      return {
        questionId: question.id,
        questionText: question.text,
        selectedOptionId: answer.selectedOptionId,
        correctOptionId: correctOption?.id || null,
        isCorrect,
        options: question.options,
      }
    })

    const maxScore = answers.length
    const passed = score >= test.passingScore
    const percentage = Math.round((score / maxScore) * 100)

    const attempt = await prisma.testAttempt.create({
      data: {
        userId: session.id,
        testId: params.testId,
        score,
        maxScore,
        passed,
        submittedAt: new Date(),
        answers: {
          create: answers.map(a => {
            const result = results.find(r => r.questionId === a.questionId)
            return {
              questionId: a.questionId,
              selectedOptionId: a.selectedOptionId,
              isCorrect: result?.isCorrect || false,
              points: result?.isCorrect ? 1 : 0,
              questionText: result?.questionText || '',
            }
          }),
        },
      },
    })

    return ok({ attemptId: attempt.id, score, maxScore, passingScore: test.passingScore, passed, percentage, results })
  } catch (err) {
    console.error('Test submit error:', err)
    return serverError()
  }
}
