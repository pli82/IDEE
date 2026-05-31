// src/app/api/auth/verify-otp/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyOtp, createSession, setSessionCookie, createAuditLog } from '@/lib/auth'
import { OtpSchema } from '@/lib/validations'
import { ok, badRequest, serverError } from '@/lib/api'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = OtpSchema.safeParse(body)
    if (!parsed.success) return badRequest('Date invalide')

    const { email, code } = parsed.data
    const user = await prisma.user.findUnique({
      where: { email },
      include: { otpTokens: { where: { type: 'EMAIL_VERIFY', usedAt: null }, orderBy: { createdAt: 'desc' }, take: 1 }, roles: true, profile: true },
    })

    if (!user) return badRequest('Utilizator inexistent')

    const token = user.otpTokens[0]
    if (!token) return badRequest('Cod OTP inexistent sau expirat')
    if (token.expiresAt < new Date()) return badRequest('Codul OTP a expirat')
    if (token.attempts >= parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10)) {
      return badRequest('Prea multe încercări. Solicitați un cod nou.')
    }

    const valid = await verifyOtp(code, token.token)
    if (!valid) {
      await prisma.otpToken.update({ where: { id: token.id }, data: { attempts: { increment: 1 } } })
      return badRequest('Cod OTP incorect')
    }

    await prisma.$transaction([
      prisma.otpToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }),
      prisma.user.update({ where: { id: user.id }, data: { emailVerified: true, status: 'ACTIVE' } }),
    ])

    const session = {
      id: user.id,
      email: user.email,
      roles: user.roles.map(r => r.role) as any,
      profileComplete: user.profile?.profileComplete || false,
      name: user.profile?.prenume || undefined,
      judetCode: user.profile?.judetCode || undefined,
    }
    const sessionToken = await createSession(session)
    setSessionCookie(sessionToken)

    await createAuditLog({ actorId: user.id, action: 'EMAIL_VERIFIED', entityType: 'User', entityId: user.id })

    return ok({ redirectTo: user.profile?.profileComplete ? '/dashboard' : '/profile/complete' })
  } catch (err) {
    console.error('Verify OTP error:', err)
    return serverError()
  }
}
