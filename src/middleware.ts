import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)

const PUBLIC_PATHS = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/verify-otp',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/politica-confidentialitate',
  '/termeni-utilizare',
  '/contact',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-otp',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/counties',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  const token = request.cookies.get('aep_session')?.value

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })
    }
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('returnTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)

    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      const roles = payload.roles as string[]
      const isAdmin = roles?.some(r =>
        ['SUPER_ADMIN', 'CONTENT_ADMIN', 'REPORTING_ADMIN'].includes(r)
      )
      if (!isAdmin) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })
        }
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    return NextResponse.next()
  } catch {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Sesiune expirată' }, { status: 401 })
    }
    const response = NextResponse.redirect(new URL('/auth/login', request.url))
    response.cookies.delete('aep_session')
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
