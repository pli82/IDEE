import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  cookies().delete('aep_session')
  return NextResponse.redirect(
    new URL('/auth/login', 'https://idee-git-main-loredana-s-projects1.vercel.app')
  )
}
