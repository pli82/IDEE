// src/app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession, isSuperAdmin, createAuditLog } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const SettingSchema = z.record(z.string())

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })

  const settings = await prisma.appSetting.findMany()
  const data = Object.fromEntries(settings.map((s) => [s.key, s.value]))
  return NextResponse.json({ data })
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session || !isSuperAdmin(session)) return NextResponse.json({ error: 'Neautorizat' }, { status: 403 })

  try {
    const body = await request.json()
    const settings = SettingSchema.parse(body)

    await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        prisma.appSetting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        })
      )
    )

    await createAuditLog({ actorId: session.id, action: 'UPDATE_SETTINGS', metadata: { keys: Object.keys(settings) } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}
