import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/api';
import prisma from '@/lib/prisma';
import ExcelJS from 'exceljs';

export const GET = withAdmin(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'xlsx';

  try {
    const attempts = await prisma.testAttempt.findMany({
      where: { completedAt: { not: null } },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        test: { select: { title: true, passingScore: true } },
      },
      orderBy: { completedAt: 'desc' },
    });

    const rows = attempts.map((a) => ({
      Nume: `${a.user.lastName} ${a.user.firstName}`,
      Email: a.user.email,
      Test: a.test.title,
      'Scor (%)': a.score ?? 0,
      'Scor promovare (%)': a.test.passingScore,
      Promovat: a.passed ? 'DA' : 'NU',
      'Data finalizare': a.completedAt?.toISOString().split('T')[0] || '',
    }));

    if (format === 'csv') {
      const headers = Object.keys(rows[0] || {}).join(',');
      const csvRows = rows.map((r) => Object.values(r).map(v => `"${v}"`).join(','));
      const csv = [headers, ...csvRows].join('\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="rezultate_teste.csv"',
        },
      });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Rezultate Teste');
    if (rows.length > 0) {
      sheet.columns = Object.keys(rows[0]).map((key) => ({ header: key, key, width: 22 }));
      const headerRow = sheet.getRow(1);
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a4480' } };
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      rows.forEach((row, i) => {
        const r = sheet.addRow(row);
        const passed = row['Promovat'] === 'DA';
        if (i % 2 === 1) {
          r.getCell('Promovat').fill = {
            type: 'pattern', pattern: 'solid',
            fgColor: { argb: passed ? 'FFd4edda' : 'FFf8d7da' },
          };
        }
      });
      sheet.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + Object.keys(rows[0]).length)}1` };
    }
    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="rezultate_teste.xlsx"',
      },
    });
  } catch (e) {
    console.error(e);
    return new NextResponse('Export failed', { status: 500 });
  }
});
