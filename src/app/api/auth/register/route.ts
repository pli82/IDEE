import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, createAuditLog, createSession } from '@/lib/auth'
import { RegisterSchema } from '@/lib/validations'
import { ok, badRequest, conflict, serverError } from '@/lib/api'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = RegisterSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('Date invalide', parsed.error.flatten().fieldErrors as Record<string, string[]>)
    }
    const { email, password, phone } = parsed.data
    const calitate = (body as any).calitate || null

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return conflict('Un cont cu această adresă de email există deja')

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        phone: phone || null,
        status: 'ACTIVE',
        emailVerified: true,
        profile: {
          create: {
            calitate: calitate,
            profileComplete: false,
            gdprConsentAt: new Date(),
            gdprPolicyVersion: '1.0',
          },
        },
        roles: {
          create: [{ role: 'USER' }],
        },
      },
    })

    await createAuditLog({ actorId: user.id, action: 'REGISTER', entityType: 'User', entityId: user.id, ip: req.headers.get('x-forwarded-for') || undefined })

    // Creează sesiune automată după înregistrare
    const response = ok({ message: 'Cont creat cu succes.', userId: user.id })
    await createSession(user.id, response)
    return response
  } catch (err) {
    console.error('Register error:', err)
    return serverError()
  }
}
