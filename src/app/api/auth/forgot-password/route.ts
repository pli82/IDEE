// src/app/api/auth/forgot-password/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ForgotPasswordSchema } from '@/lib/validations'
import { ok, badRequest, serverError } from '@/lib/api'
import { sendPasswordResetEmail } from '@/lib/email'
import { createHash, randomBytes } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = ForgotPasswordSchema.safeParse(body)
    if (!parsed.success) return badRequest('Email invalid')

    const { email } = parsed.data
    // Răspuns identic indiferent dacă emailul există (securitate)
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return ok({ message: 'Dacă emailul există, veți primi un link de resetare' })

    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 60 * 60_000) // 60 min

    await prisma.passwordReset.create({ data: { userId: user.id, tokenHash, expiresAt } })
    await sendPasswordResetEmail(email, rawToken)

    return ok({ message: 'Dacă emailul există, veți primi un link de resetare' })
  } catch (err) {
    console.error('Forgot password error:', err)
    return serverError()
  }
}
