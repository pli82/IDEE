// src/lib/auth.ts - Utilitare autentificare
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import type { SessionUser, Role } from '@/types'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)
const SESSION_MAX_AGE = parseInt(process.env.SESSION_MAX_AGE || '86400', 10)

// ── Parole ────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return 'Parola trebuie să aibă cel puțin 8 caractere'
  if (!/[A-Z]/.test(password)) return 'Parola trebuie să conțină cel puțin o literă mare'
  if (!/[a-z]/.test(password)) return 'Parola trebuie să conțină cel puțin o literă mică'
  if (!/[0-9]/.test(password)) return 'Parola trebuie să conțină cel puțin o cifră'
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
    return 'Parola trebuie să conțină cel puțin un caracter special'
  return null
}

// ── OTP ───────────────────────────────────────────────────

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10)
}

export async function verifyOtp(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash)
}

// ── JWT / Sesiuni ─────────────────────────────────────────

export async function createSession(user: SessionUser): Promise<string> {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    roles: user.roles,
    profileComplete: user.profileComplete,
    name: user.name,
    judetCode: user.judetCode,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(JWT_SECRET)
  return token
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      id: payload.id as string,
      email: payload.email as string,
      roles: payload.roles as Role[],
      profileComplete: payload.profileComplete as boolean,
      name: payload.name as string | undefined,
      judetCode: payload.judetCode as string | undefined,
    }
  } catch {
    return null
  }
}

export function setSessionCookie(token: string) {
  cookies().set('aep_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

export function clearSessionCookie() {
  cookies().delete('aep_session')
}

export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get('aep_session')?.value
  if (!token) return null
  return verifySession(token)
}

// ── RBAC ─────────────────────────────────────────────────

export function hasRole(user: SessionUser, ...roles: Role[]): boolean {
  return roles.some((role) => user.roles.includes(role))
}

export function isAdmin(user: SessionUser): boolean {
  return hasRole(user, 'SUPER_ADMIN', 'CONTENT_ADMIN', 'REPORTING_ADMIN')
}

export function isSuperAdmin(user: SessionUser): boolean {
  return hasRole(user, 'SUPER_ADMIN')
}

// ── Rate limiting ─────────────────────────────────────────
// (în producție folosiți Redis; aici folosim DB pentru simplitate)

export async function checkLoginRateLimit(
  email: string
): Promise<{ allowed: boolean; lockedUntil?: Date }> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { failedLoginAttempts: true, lockedUntil: true },
  })

  if (!user) return { allowed: true }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { allowed: false, lockedUntil: user.lockedUntil }
  }

  return { allowed: true }
}

export async function recordFailedLogin(email: string): Promise<void> {
  const maxAttempts = parseInt(process.env.AUTH_MAX_FAILED_ATTEMPTS || '5', 10)
  const lockoutMinutes = parseInt(process.env.AUTH_LOCKOUT_MINUTES || '15', 10)

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return

  const newAttempts = user.failedLoginAttempts + 1
  const lockedUntil =
    newAttempts >= maxAttempts
      ? new Date(Date.now() + lockoutMinutes * 60 * 1000)
      : undefined

  await prisma.user.update({
    where: { email },
    data: {
      failedLoginAttempts: newAttempts,
      ...(lockedUntil ? { lockedUntil } : {}),
    },
  })
}

export async function resetFailedLogins(email: string): Promise<void> {
  await prisma.user.update({
    where: { email },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  })
}

// ── Audit log ─────────────────────────────────────────────

export async function createAuditLog(params: {
  actorId?: string
  action: string
  entityType?: string
  entityId?: string
  metadata?: Record<string, unknown>
  ip?: string
  userAgent?: string
}) {
  return prisma.auditLog.create({ data: params })
}
