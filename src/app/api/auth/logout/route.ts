import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  clearSessionCookie()
  return NextResponse.redirect(
    new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'https://idee-git-main-loredana-s-projects1.vercel.app')
  )
}
