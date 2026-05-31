// src/lib/upload.ts - Serviciu upload fișiere (local + S3/MinIO)
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

const UPLOADS_DIR = process.env.UPLOADS_DIR || './uploads'
const MAX_SIZE_MB = parseInt(process.env.UPLOAD_MAX_SIZE_MB || '50', 10)
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'video/mp4',
  'video/webm',
  'video/ogg',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
])

export interface UploadResult {
  filename: string
  originalName: string
  mimeType: string
  size: number
  storagePath: string
  storageType: 'LOCAL' | 'S3' | 'MINIO'
}

export function validateFile(file: { size: number; type: string }): string | null {
  if (file.size > MAX_SIZE_BYTES) {
    return `Fișierul depășește dimensiunea maximă de ${MAX_SIZE_MB}MB`
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return `Tipul de fișier ${file.type} nu este permis`
  }
  return null
}

export async function saveFileLocally(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<UploadResult> {
  const ext = path.extname(originalName).toLowerCase()
  const filename = `${uuidv4()}${ext}`

  // Organizare pe subdirectoare după tip
  const subDir = mimeType.startsWith('video/') ? 'videos' : 
                 mimeType === 'application/pdf' ? 'pdfs' : 'images'
  const fullDir = path.join(UPLOADS_DIR, subDir)
  
  await fs.mkdir(fullDir, { recursive: true })
  const filePath = path.join(fullDir, filename)
  await fs.writeFile(filePath, buffer)

  return {
    filename,
    originalName,
    mimeType,
    size: buffer.length,
    storagePath: `${subDir}/${filename}`,
    storageType: 'LOCAL',
  }
}

export async function deleteFileLocally(storagePath: string): Promise<void> {
  try {
    const fullPath = path.join(UPLOADS_DIR, storagePath)
    await fs.unlink(fullPath)
  } catch {
    // Ignorăm dacă fișierul nu există
  }
}

export function getPublicUrl(storagePath: string): string {
  return `/api/files/${storagePath}`
}

export function parseFormDataFile(formData: FormData, fieldName: string) {
  const file = formData.get(fieldName) as File | null
  return file
}
