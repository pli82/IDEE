import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/api';
import prisma from '@/lib/prisma';
import ExcelJS from 'exceljs';

export const GET = withAdmin(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'xlsx';

  try {
    const logs = await prisma.auditLog.findMany({
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    const rows = logs.map((l) => ({
      'Data / Ora': l.createdAt.toISOString().replace('T', ' ').split('.')[0],
      Utilizator: l.user ? `${l.user.lastName} ${l.user.firstName}` : 'Sistem',
      Email: l.user?.email || '—',
      Acțiune: l.action,
      Entitate: l.entity || '—',
      'IP Adresă': l.ipAddress || '—',
    }));

    if (format === 'csv') {
      const headers = Object.keys(rows[0] || {}).join(',');
      const csvRows = rows.map((r) => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
      const csv = '\uFEFF' + [headers, ...csvRows].join('\n'); // BOM for Romanian chars
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="jurnal_audit.csv"',
        },
      });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Jurnal Audit');
    if (rows.length > 0) {
      sheet.columns = Object.keys(rows[0]).map((key) => ({ header: key, key, width: 24 }));
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF343a40' } };
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      rows.forEach((row, i) => {
        const r = sheet.addRow(row);
        if (i % 2 === 1) r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
      });
      sheet.views = [{ state: 'frozen', ySplit: 1 }];
    }
    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="jurnal_audit.xlsx"',
      },
    });
  } catch (e) {
    console.error(e);
    return new NextResponse('Export failed', { status: 500 });
  }
});
