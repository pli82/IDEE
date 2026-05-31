// src/app/api/auth/login/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  verifyPassword,
  createSession,
  setSessionCookie,
  checkLoginRateLimit,
  recordFailedLogin,
  resetFailedLogins,
  createAuditLog,
} from '@/lib/auth'
import { LoginSchema } from '@/lib/validations'
import { ok, badRequest, unauthorized, serverError } from '@/lib/api'
import type { SessionUser } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = LoginSchema.safeParse(body)

    if (!parsed.success) {
      return badRequest('Date invalide', parsed.error.flatten().fieldErrors as Record<string, string[]>)
    }

    const { email, password } = parsed.data

    // Rate limiting
    const rateCheck = await checkLoginRateLimit(email)
    if (!rateCheck.allowed) {
      const minutesLeft = rateCheck.lockedUntil
        ? Math.ceil((rateCheck.lockedUntil.getTime() - Date.now()) / 60000)
        : 15
      return unauthorized(
        `Contul este temporar blocat. Încercați din nou după ${minutesLeft} minute.`
      )
    }

    // Găsește utilizatorul
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: true,
        profile: true,
      },
    })

    if (!user) {
      // Nu dezvăluim dacă emailul există
      return unauthorized('Email sau parolă incorectă')
    }

    // Verifică parola
    const passwordOk = await verifyPassword(password, user.passwordHash)
    if (!passwordOk) {
      await recordFailedLogin(email)
      await createAuditLog({
        actorId: user.id,
        action: 'auth.login.failed',
        entityType: 'User',
        entityId: user.id,
        ip: req.headers.get('x-forwarded-for') || 'unknown',
      })
      return unauthorized('Email sau parolă incorectă')
    }

    // Verifică status cont
    if (user.status === 'SUSPENDED') {
      return unauthorized('Contul dvs. a fost suspendat. Contactați AEP pentru detalii.')
    }
    if (user.status === 'DELETED') {
      return unauthorized('Contul nu mai există.')
    }
    if (!user.emailVerified) {
      return unauthorized('Adresa de email nu a fost verificată. Verificați căsuța de email pentru codul OTP.')
    }

    // Login reușit - resetează contorul de eșecuri
    await resetFailedLogins(email)

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      roles: user.roles.map((r) => r.role),
      profileComplete: user.profile?.profileComplete ?? false,
      name: user.profile
        ? `${user.profile.prenume || ''} ${user.profile.nume || ''}`.trim()
        : undefined,
      judetCode: user.profile?.judetCode ?? undefined,
    }

    const token = await createSession(sessionUser)
    setSessionCookie(token)

    await createAuditLog({
      actorId: user.id,
      action: 'auth.login.success',
      entityType: 'User',
      entityId: user.id,
      ip: req.headers.get('x-forwarded-for') || 'unknown',
    })

    return ok({
      user: sessionUser,
      redirectTo: user.profile?.profileComplete ? '/dashboard' : '/profile/complete',
    })
  } catch (error) {
    return serverError(error)
  }
}
