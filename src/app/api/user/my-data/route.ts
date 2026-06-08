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

    const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
    const formatDateTime = (d: any) => d ? new Date(d).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
    const p = user?.profile

    const html = `<!DOCTYPE html>
<html lang="ro">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Datele mele — AEP Instruire Online</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1f2937; line-height: 1.5; padding: 32px; max-width: 900px; margin: 0 auto; }
  .header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #1a4480; padding-bottom: 16px; margin-bottom: 24px; }
  .logo { background: #1a4480; color: white; font-weight: bold; font-size: 18px; width: 48px; height: 48px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
  .header-text h1 { font-size: 20px; color: #1a4480; }
  .header-text p { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 14px; font-weight: bold; color: #1a4480; background: #e8f0fb; padding: 6px 12px; border-radius: 4px; margin-bottom: 12px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .field { display: flex; flex-direction: column; padding: 8px 12px; background: #f9fafb; border-radius: 4px; border: 1px solid #e5e7eb; }
  .field label { font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
  .field span { font-size: 13px; color: #1f2937; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #1a4480; color: white; padding: 8px 10px; text-align: left; font-weight: 600; }
  td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #f9fafb; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .badge-green { background: #dcfce7; color: #15803d; }
  .badge-blue { background: #dbeafe; color: #1d4ed8; }
  .badge-gray { background: #f3f4f6; color: #6b7280; }
  .badge-red { background: #fee2e2; color: #dc2626; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
  .print-btn { position: fixed; top: 16px; right: 16px; background: #1a4480; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; }
  @media print {
    .print-btn { display: none; }
    body { padding: 16px; }
    @page { margin: 1.5cm; }
  }
  .empty { color: #9ca3af; font-style: italic; font-size: 12px; padding: 12px; text-align: center; }
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">🖨️ Salvează ca PDF</button>

<div class="header">
  <div class="logo">AEP</div>
  <div class="header-text">
    <h1>Datele mele personale</h1>
    <p>AEP Instruire Online — Export GDPR — Generat la ${formatDateTime(new Date())}</p>
  </div>
</div>

<div class="section">
  <div class="section-title">Date personale</div>
  <div class="grid">
    <div class="field"><label>Nume complet</label><span>${p?.prenume || '—'} ${p?.nume || ''}</span></div>
    <div class="field"><label>Email</label><span>${user?.email || '—'}</span></div>
    <div class="field"><label>Telefon</label><span>${user?.phone || '—'}</span></div>
    <div class="field"><label>Data nașterii</label><span>${formatDate(p?.dataNasterii)}</span></div>
    <div class="field"><label>Sex</label><span>${p?.sex === 'M' ? 'Masculin' : p?.sex === 'F' ? 'Feminin' : '—'}</span></div>
    <div class="field"><label>Județ</label><span>${p?.judetCode || '—'}</span></div>
    <div class="field"><label>Studii</label><span>${p?.studii || '—'}</span></div>
    <div class="field"><label>Calitate</label><span>${p?.calitate || '—'}</span></div>
    <div class="field"><label>Adresă</label><span>${p?.adresa || '—'}</span></div>
    <div class="field"><label>Serie/Număr CI</label><span>${p?.serieCI || '—'} ${p?.numarCI || ''}</span></div>
    <div class="field"><label>Data înregistrării</label><span>${formatDateTime(user?.createdAt)}</span></div>
    <div class="field"><label>Ultima autentificare</label><span>${formatDateTime(user?.lastLoginAt)}</span></div>
    <div class="field"><label>Consimțământ GDPR</label><span>${formatDateTime(p?.gdprConsentAt)}</span></div>
    <div class="field"><label>Profil complet</label><span>${p?.profileComplete ? 'Da' : 'Nu'}</span></div>
  </div>
</div>

<div class="section">
  <div class="section-title">Progres lecții (${progress.length} înregistrări)</div>
  ${progress.length === 0 ? '<p class="empty">Nicio lecție accesată</p>' : `
  <table>
    <thead><tr><th>Categorie</th><th>Modul</th><th>Lecție</th><th>Status</th><th>%</th><th>Ultima accesare</th></tr></thead>
    <tbody>
    ${progress.map((p: any) => `
      <tr>
        <td>${p.categorie}</td>
        <td>${p.modul}</td>
        <td>${p.lectie}</td>
        <td><span class="badge ${p.status === 'COMPLETED' ? 'badge-green' : p.status === 'IN_PROGRESS' ? 'badge-blue' : 'badge-gray'}">${p.status === 'COMPLETED' ? 'Completat' : p.status === 'IN_PROGRESS' ? 'În curs' : 'Neînceput'}</span></td>
        <td>${Math.round(Number(p.watchedPercent))}%</td>
        <td>${formatDateTime(p.updatedAt)}</td>
      </tr>`).join('')}
    </tbody>
  </table>`}
</div>

<div class="section">
  <div class="section-title">Materiale vizualizate (${materialProgress.length} înregistrări)</div>
  ${materialProgress.length === 0 ? '<p class="empty">Niciun material vizualizat</p>' : `
  <table>
    <thead><tr><th>Modul</th><th>Material</th><th>Vizualizat la</th></tr></thead>
    <tbody>
    ${materialProgress.map((m: any) => `
      <tr><td>${m.modul}</td><td>${m.material}</td><td>${formatDateTime(m.viewedAt)}</td></tr>`).join('')}
    </tbody>
  </table>`}
</div>

<div class="section">
  <div class="section-title">Rezultate teste (${testAttempts.length} înregistrări)</div>
  ${testAttempts.length === 0 ? '<p class="empty">Niciun test susținut</p>' : `
  <table>
    <thead><tr><th>Test</th><th>Scor</th><th>Rezultat</th><th>Data</th></tr></thead>
    <tbody>
    ${testAttempts.map((a: any) => `
      <tr>
        <td>${a.test.title}</td>
        <td>${a.score}/${a.maxScore}</td>
        <td><span class="badge ${a.passed ? 'badge-green' : 'badge-red'}">${a.passed ? 'Promovat' : 'Nepromovat'}</span></td>
        <td>${formatDateTime(a.submittedAt)}</td>
      </tr>`).join('')}
    </tbody>
  </table>`}
</div>

<div class="footer">
  <p>Document generat automat de AEP Instruire Online în conformitate cu GDPR (Regulamentul UE 2016/679)</p>
  <p>Pentru exercitarea altor drepturi GDPR, contactați: dpo@aep.ro</p>
</div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (err) {
    console.error('My data export error:', err)
    return serverError()
  }
}
