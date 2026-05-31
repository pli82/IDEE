// src/app/api/admin/files/route.ts - Upload fișiere admin
import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { saveFileLocally, validateFile } from '@/lib/upload'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Neautorizat' }, { status: 403 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'Fișier lipsă' }, { status: 400 })

    const validationError = validateFile({ size: file.size, type: file.type })
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await saveFileLocally(buffer, file.name, file.type)

    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        filename: result.filename,
        originalName: result.originalName,
        mimeType: result.mimeType,
        size: result.size,
        storagePath: result.storagePath,
        storageType: result.storageType,
        uploadedById: session.id,
      },
    })

    return NextResponse.json({ data: uploadedFile }, { status: 201 })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Eroare upload' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Neautorizat' }, { status: 403 })

  const files = await prisma.uploadedFile.findMany({
    include: { uploadedBy: { select: { email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json({ data: files })
}
