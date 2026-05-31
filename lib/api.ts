// src/lib/api.ts — Utilitare răspunsuri API uniforme
import { NextResponse } from 'next/server'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status })
}

export function created<T>(data: T) {
  return ok(data, 201)
}

export function noContent() {
  return new NextResponse(null, { status: 204 })
}

export function badRequest(error: string, details?: Record<string, string[]>) {
  return NextResponse.json({ error, ...(details ? { details } : {}) }, { status: 400 })
}

export function unauthorized(error = 'Neautentificat') {
  return NextResponse.json({ error }, { status: 401 })
}

export function forbidden(error = 'Acces interzis') {
  return NextResponse.json({ error }, { status: 403 })
}

export function notFound(error = 'Resursa nu a fost găsită') {
  return NextResponse.json({ error }, { status: 404 })
}

export function conflict(error: string) {
  return NextResponse.json({ error }, { status: 409 })
}

export function serverError(error = 'Eroare internă server') {
  return NextResponse.json({ error }, { status: 500 })
}

// Client-side fetch helpers
export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
    const json = await res.json()
    if (!res.ok) return { error: json.error || 'Eroare' }
    return { data: json.data }
  } catch {
    return { error: 'Eroare de rețea' }
  }
}
