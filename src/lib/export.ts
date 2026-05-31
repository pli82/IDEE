// src/lib/export.ts - Export CSV și Excel
import ExcelJS from 'exceljs'

// ── Export CSV ────────────────────────────────────────────
export function generateCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }
  
  const lines = [
    headers.map(escape).join(','),
    ...rows.map((row) => row.map(escape).join(',')),
  ]
  return '\uFEFF' + lines.join('\n') // BOM pentru Excel
}

// ── Export Excel ──────────────────────────────────────────
export async function generateExcel(
  title: string,
  sheets: {
    name: string
    headers: { key: string; header: string; width?: number }[]
    rows: Record<string, string | number | null | undefined>[]
  }[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'AEP Instruire Online'
  workbook.created = new Date()

  const AEP_BLUE = '1A5FA8'
  const HEADER_BG = 'EBF3FC'

  for (const sheet of sheets) {
    const ws = workbook.addWorksheet(sheet.name)

    // Titlu
    ws.mergeCells(1, 1, 1, sheet.headers.length)
    const titleCell = ws.getCell('A1')
    titleCell.value = title
    titleCell.font = { bold: true, size: 14, color: { argb: 'FF' + AEP_BLUE } }
    titleCell.alignment = { horizontal: 'center' }
    ws.getRow(1).height = 30

    // Antet
    const headerRow = ws.getRow(2)
    sheet.headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1)
      cell.value = h.header
      cell.font = { bold: true, color: { argb: 'FF374151' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + HEADER_BG } }
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FF' + AEP_BLUE } },
      }
      cell.alignment = { horizontal: 'center', wrapText: true }
      ws.getColumn(i + 1).width = h.width || 20
    })
    headerRow.height = 24

    // Date
    sheet.rows.forEach((row, rowIdx) => {
      const wsRow = ws.getRow(rowIdx + 3)
      sheet.headers.forEach((h, colIdx) => {
        const cell = wsRow.getCell(colIdx + 1)
        cell.value = row[h.key] ?? ''
        if (rowIdx % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }
        }
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        }
      })
    })

    // Freeze antet
    ws.views = [{ state: 'frozen', ySplit: 2 }]
  }

  return workbook.xlsx.writeBuffer() as Promise<Buffer>
}
