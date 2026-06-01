export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { ok, unauthorized, notFound, serverError } from '@/lib/api'

export async function GET(
  _req: NextRequest,
  { params }: { params: { testId: string } }
) {
  const session = await getSession()
  if (!session) return unauthorized()

  try {
    const test = await prisma.test.findUnique({
      where: { id: params.testId, published: true },
      select: {
        id: true,
        title: true,
        questionsPerAttempt: true,
        passingScore: true,
        questions: {
          where: { active: true },
          select: {
            id: true,
            text: true,
            type: true,
            options: {
              select: { id: true, text: true },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    if (!test) return notFound('Test inexistent')

    // Selectează random questionsPerAttempt întrebări
    const allQuestions = test.questions
    const shuffled = allQuestions.sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, Math.min(test.questionsPerAttempt, allQuestions.length))

    // Amestecă și opțiunile pentru fiecare întrebare
    const questionsWithShuffledOptions = selected.map(q => ({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5),
    }))

    return ok({
      id: test.id,
      title: test.title,
      questionsPerAttempt: test.questionsPerAttempt,
      passingScore: test.passingScore,
      totalQuestions: allQuestions.length,
      questions: questionsWithShuffledOptions,
    })
  } catch (err) {
    console.error('Test start error:', err)
    return serverError()
  }
}
