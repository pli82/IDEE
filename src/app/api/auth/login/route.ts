import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, createSession, setSessionCookie } from '@/lib/auth'
import { LoginSchema } from '@/lib/validations'
import { ok, badRequest, serverError } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = LoginSchema.safeParse(body)
    if (!parsed.success) return badRequest('Date invalide')

    const { email, password } = parsed.data

    const user = await prisma.user.findUnique({
      where: { email },
      include: { roles: true, profile: true },
    })

    if (!user) return badRequest('Email sau parolă incorectă')

    const passwordOk = await verifyPassword(password, user.passwordHash)
    if (!passwordOk) return badRequest('Email sau parolă incorectă')

    if (user.status === 'SUSPENDED') return badRequest('Contul este suspendat')
    if (!user.emailVerified) return badRequest('Email-ul nu a fost verificat')

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), failedLoginAttempts: 0 },
    })

    const session = {
      id: user.id,
      email: user.email,
      roles: user.roles.map(r => r.role) as any,
      profileComplete: user.profile?.profileComplete || false,
      name: user.profile?.prenume || undefined,
      judetCode: user.profile?.judetCode || undefined,
    }

    const token = await createSession(session)
    setSessionCookie(token)

    const isAdmin = user.roles.some(r =>
      ['SUPER_ADMIN', 'CONTENT_ADMIN', 'REPORTING_ADMIN'].includes(r.role)
    )

    return ok({
      redirectTo: user.profile?.profileComplete
        ? isAdmin ? '/admin' : '/dashboard'
        : '/profile/complete',
    })
  } catch (err) {
    console.error('Login error:', err)
    return serverError()
  }
}
