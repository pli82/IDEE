export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getSession, clearSessionCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { unauthorized, serverError } from '@/lib/api'

export async function DELETE(_req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()

  try {
    await prisma.user.delete({ where: { id: session.id } })
    clearSessionCookie()
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete account error:', err)
    return serverError()
  }
}
