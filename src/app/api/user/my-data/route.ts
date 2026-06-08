export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { unauthorized, serverError } from '@/lib/api'

export async function GET(_req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        profile: true,
        roles: { select: { role: true } },
      },
    })

    const progress = await prisma.$queryRaw`
      SELECT l.title as lectie, m.title as modul, c.title as categorie,
             p.status, p."watchedPercent", p."completedAt", p."updatedAt"
      FROM progress p
      JOIN lessons l ON p."lessonId" = l.id
      JOIN modules m ON l."moduleId" = m.id
      JOIN content_categories c ON m."categoryId" = c.id
      WHERE p."userId" = ${session.id}
      ORDER BY p."updatedAt" DESC
    ` as any[]

    const materialProgress = await prisma.$queryRaw`
      SELECT lm.title as material, m.title as modul, mp."viewedAt"
      FROM material_progress mp
      JOIN lesson_materials lm ON mp."materialId" = lm.id
      JOIN modules m ON lm."moduleId" = m.id
      WHERE mp."userId" = ${session.id}
      ORDER BY mp."viewedAt" DESC
    ` as any[]

    const testAttempts = await prisma.testAttempt.findMany({
      where: { userId: session.id },
      include: { test: { select: { title: true } } },
      orderBy: { submittedAt: 'desc' },
    })

    const exportData = {
      exportat_la: new Date().toISOString(),
      date_personale: {
        email: user?.email,
        telefon: user?.phone || null,
        nume: user?.profile?.nume || null,
        prenume: user?.profile?.prenume || null,
        data_nasterii: user?.profile?.dataNasterii || null,
        sex: user?.profile?.sex || null,
        judet: user?.profile?.judetCode || null,
        studii: user?.profile?.studii || null,
        calitate: user?.profile?.calitate || null,
        adresa: user?.profile?.adresa || null,
        data_inregistrare: user?.createdAt,
        ultima_autentificare: user?.lastLoginAt || null,
        profil_complet: user?.profile?.profileComplete || false,
        gdpr_consimtamant: user?.profile?.gdprConsentAt || null,
      },
      progres_lectii: progress.map((p: any) => ({
        categorie: p.categorie,
        modul: p.modul,
        lectie: p.lectie,
        status: p.status,
        procent_vizionat: Math.round(Number(p.watchedPercent)),
        completat_la: p.completedAt,
        ultima_accesare: p.updatedAt,
      })),
      materiale_vizualizate: materialProgress.map((m: any) => ({
        modul: m.modul,
        material: m.material,
        vizualizat_la: m.viewedAt,
      })),
      rezultate_teste: testAttempts.map(a => ({
        test: a.test.title,
        scor: a.score,
        scor_maxim: a.maxScore,
        promovat: a.passed,
        data: a.submittedAt,
      })),
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="datele-mele-AEP-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    })
  } catch (err) {
    console.error('My data export error:', err)
    return serverError()
  }
}
