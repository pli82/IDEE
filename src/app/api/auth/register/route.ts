// src/app/api/auth/register/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateOtp, hashOtp, createAuditLog } from '@/lib/auth'
import { RegisterSchema } from '@/lib/validations'
import { ok, badRequest, conflict, serverError } from '@/lib/api'
import { sendOtpEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = RegisterSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('Date invalide', parsed.error.flatten().fieldErrors as Record<string, string[]>)
    }

    const { email, password, phone } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return conflict('Un cont cu această adresă de email există deja')

    const passwordHash = await hashPassword(password)
    const otp = generateOtp()
    const otpHash = await hashOtp(otp)
    const otpExpires = new Date(Date.now() + parseInt(process.env.OTP_EXPIRES_MINUTES || '10', 10) * 60_000)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        phone: phone || null,
        status: 'PENDING',
        emailVerified: false,
        otpTokens: {
          create: {
            token: otpHash,
            type: 'EMAIL_VERIFY',
            expiresAt: otpExpires,
          },
        },
      },
    })

    await sendOtpEmail(email, otp)
    await createAuditLog({ actorId: user.id, action: 'REGISTER', entityType: 'User', entityId: user.id, ip: req.headers.get('x-forwarded-for') || undefined })

    return ok({ message: 'Cont creat. Verificați email-ul pentru codul de confirmare.', userId: user.id })
  } catch (err) {
    console.error('Register error:', err)
    return serverError()
  }
}
