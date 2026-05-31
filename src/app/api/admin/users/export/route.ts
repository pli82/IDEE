// src/app/api/admin/users/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, isAdmin } from '@/lib/auth'
import { generateCsv, generateExcel } from '@/lib/export'
import { format } from 'date-fns'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !isAdmin(session)) return new NextResponse('Forbidden', { status: 403 })

  const fmt = req.nextUrl.searchParams.get('format') || 'csv'

  try {
    const users = await prisma.user.findMany({
      include: { profile: { include: { county: true } }, roles: true },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    })

    const rows = users.map(u => ({
      email: u.email,
      prenume: u.profile?.prenume || '',
      nume: u.profile?.nume || '',
      judet: u.profile?.county?.name || u.profile?.judetCode || '',
      sex: u.profile?.sex || '',
      dataNasterii: u.profile?.dataNasterii ? format(u.profile.dataNasterii, 'dd.MM.yyyy') : '',
      studii: u.profile?.studii || '',
      calitate: u.profile?.calitate || '',
      status: u.status,
      emailVerified: u.emailVerified ? 'Da' : 'Nu',
      profileComplete: u.profile?.profileComplete ? 'Da' : 'Nu',
      createdAt: format(u.createdAt, 'dd.MM.yyyy HH:mm'),
      lastLoginAt: u.lastLoginAt ? format(u.lastLoginAt, 'dd.MM.yyyy HH:mm') : '',
    }))

    if (fmt === 'xlsx') {
      const buffer = await generateExcel('Raport Utilizatori AEP', [{
        name: 'Utilizatori',
        headers: [
          { key: 'email', header: 'Email', width: 30 },
          { key: 'prenume', header: 'Prenume', width: 18 },
          { key: 'nume', header: 'Nume', width: 18 },
          { key: 'judet', header: 'Județ', width: 18 },
          { key: 'sex', header: 'Sex', width: 8 },
          { key: 'dataNasterii', header: 'Data nașterii', width: 14 },
          { key: 'studii', header: 'Studii', width: 22 },
          { key: 'calitate', header: 'Calitate', width: 30 },
          { key: 'status', header: 'Status', width: 14 },
          { key: 'emailVerified', header: 'Email verificat', width: 14 },
          { key: 'profileComplete', header: 'Profil complet', width: 14 },
          { key: 'createdAt', header: 'Înregistrat', width: 18 },
          { key: 'lastLoginAt', header: 'Ultima autentificare', width: 20 },
        ],
        rows,
      }])
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="utilizatori_${format(new Date(), 'yyyyMMdd')}.xlsx"`,
        },
      })
    }

    const headers = ['Email', 'Prenume', 'Nume', 'Județ', 'Sex', 'Data nașterii', 'Studii', 'Calitate', 'Status', 'Email verificat', 'Profil complet', 'Înregistrat', 'Ultima autentificare']
    const csv = generateCsv(headers, rows.map(r => Object.values(r)))
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="utilizatori_${format(new Date(), 'yyyyMMdd')}.csv"`,
      },
    })
  } catch (err) {
    console.error('Export error:', err)
    return new NextResponse('Server error', { status: 500 })
  }
}
