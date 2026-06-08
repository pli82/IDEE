export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ProfileSchema = z.object({
  prenume: z.string().min(2).max(100),
  nume: z.string().min(2).max(100),
  dataNasterii: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sex: z.enum(['M', 'F']),
  judetCode: z.string().min(1),
  studii: z.string().min(1),
  calitate: z.string().min(1, 'Calitatea este obligatorie'),
  serieCI: z.string().max(10).optional(),
  numarCI: z.string().max(10).optional(),
  dataExpirareCI: z.string().optional().nullable(),
  gdprConsent: z.boolean().optional(),
})

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { profile: true, roles: true },
    })
    return NextResponse.json({ data: user })
  } catch (e) {
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })
  try {
    const body = await req.json()
    const parsed = ProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Date invalide', details: parsed.error.errors }, { status: 400 })
    }
    const { prenume, nume, dataNasterii, sex, judetCode, studii, calitate, serieCI, numarCI, dataExpirareCI, gdprConsent } = parsed.data

    await prisma.userProfile.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        prenume, nume,
        dataNasterii: new Date(dataNasterii),
        sex: sex as any,
        judetCode, studii, calitate,
        serieCI: serieCI || null,
        numarCI: numarCI || null,
        dataExpirareCI: dataExpirareCI ? new Date(dataExpirareCI) : null,
        profileComplete: true,
        gdprConsentAt: gdprConsent ? new Date() : null,
        gdprPolicyVersion: '1.0',
      },
      update: {
        prenume, nume,
        dataNasterii: new Date(dataNasterii),
        sex: sex as any,
        judetCode, studii, calitate,
        serieCI: serieCI || null,
        numarCI: numarCI || null,
        dataExpirareCI: dataExpirareCI ? new Date(dataExpirareCI) : null,
        profileComplete: true,
        gdprConsentAt: gdprConsent ? new Date() : null,
        gdprPolicyVersion: '1.0',
      },
    })

    return NextResponse.json({ data: { success: true } })
  } catch (e) {
    console.error('Profile update error:', e)
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}
