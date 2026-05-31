import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/api';
import prisma from '@/lib/prisma';
import ExcelJS from 'exceljs';

export const GET = withAdmin(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'xlsx';

  try {
    const progress = await prisma.progress.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        lesson: {
          select: {
            title: true,
            module: { select: { title: true, category: { select: { name: true } } } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const rows = progress.map((p) => ({
      Nume: `${p.user.lastName} ${p.user.firstName}`,
      Email: p.user.email,
      Categorie: p.lesson.module.category.name,
      Modul: p.lesson.module.title,
      Lecție: p.lesson.title,
      Status: p.status,
      'Progres (%)': p.watchedPercent,
      'Ultima accesare': p.updatedAt.toISOString().split('T')[0],
    }));

    if (format === 'csv') {
      const headers = Object.keys(rows[0] || {}).join(',');
      const csvRows = rows.map((r) => Object.values(r).map(v => `"${v}"`).join(','));
      const csv = [headers, ...csvRows].join('\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="progres_instruire.csv"`,
        },
      });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Progres Instruire');
    if (rows.length > 0) {
      sheet.columns = Object.keys(rows[0]).map((key) => ({
        header: key, key, width: 20,
      }));
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a4480' } };
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      rows.forEach((row, i) => {
        const r = sheet.addRow(row);
        if (i % 2 === 1) r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F8' } };
      });
      sheet.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + Object.keys(rows[0]).length)}1` };
    }
    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="progres_instruire.xlsx"`,
      },
    });
  } catch (e) {
    console.error(e);
    return new NextResponse('Export failed', { status: 500 });
  }
});
