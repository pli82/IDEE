export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)

async function getSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get('aep_session')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch {
    return null
  }
}

function isAdminSession(session: any) {
  const roles = Array.isArray(session?.roles) ? session.roles : []
  return roles.some((r: any) => ['SUPER_ADMIN', 'CONTENT_ADMIN'].includes(r))
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session || !isAdminSession(session)) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'Fișier lipsă' }, { status: 400 })
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tip fișier nepermis. Sunt acceptate doar PDF și PPT/PPTX.' }, { status: 400 })
    }

    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Fișierul depășește limita de 50MB.' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()
    const folder = file.type === 'application/pdf' ? 'pdf' : 'ppt'
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const blob = await put(filename, file, { access: 'public' })

    return NextResponse.json({ url: blob.url }, { status: 201 })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Eroare la upload' }, { status: 500 })
  }
}
