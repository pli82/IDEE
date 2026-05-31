// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'
import { clearSessionCookie, getSession, createAuditLog } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (session) {
    await createAuditLog({ actorId: session.id, action: 'LOGOUT', entityType: 'User', entityId: session.id })
  }
  clearSessionCookie()
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
}
