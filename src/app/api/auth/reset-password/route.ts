// src/app/api/auth/reset-password/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ResetPasswordSchema } from '@/lib/validations'
import { hashPassword, createAuditLog } from '@/lib/auth'
import { ok, badRequest, serverError } from '@/lib/api'
import { createHash } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = ResetPasswordSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('Date invalide', parsed.error.flatten().fieldErrors as Record<string, string[]>)
    }

    const { token, password } = parsed.data
    const tokenHash = createHash('sha256').update(token).digest('hex')

    const reset = await prisma.passwordReset.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true },
    })

    if (!reset) return badRequest('Link de resetare invalid sau expirat')

    const passwordHash = await hashPassword(password)

    await prisma.$transaction([
      prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
      prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    ])

    await createAuditLog({ actorId: reset.userId, action: 'PASSWORD_RESET', entityType: 'User', entityId: reset.userId })

    return ok({ message: 'Parola a fost resetată cu succes. Vă puteți autentifica.' })
  } catch (err) {
    console.error('Reset password error:', err)
    return serverError()
  }
}
