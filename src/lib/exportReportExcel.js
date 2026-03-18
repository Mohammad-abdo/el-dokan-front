/**
 * Export report to Excel (.xlsx) with formatted header and column widths.
 * Uses exceljs for styling. Falls back to CSV if exceljs is not available.
 */

import { buildReportCsv, exportReportToCsv, exportDetailReportToCsv } from './reportExport';

const HEADER_FILL = 'FF1a5896';
const HEADER_FONT_COLOR = 'FFFFFFFF';

/**
 * Build and download Excel file with styled header row.
 * @param {Object} options
 * @param {string} options.reportTitle
 * @param {Array} options.columns - from getReportColumns (accessorKey, header, headerAr, getExportValue)
 * @param {Array} options.data
 * @param {string} options.language - 'ar' | 'en'
 * @param {boolean} options.includeMetadata - add title + date rows at top
 * @param {string} options.filename
 */
export async function exportReportToExcel(options) {
  const { reportTitle, columns, data, language = 'en', includeMetadata = false, filename } = options;
  const exportColumns = columns.filter((c) => c.id !== 'actions');
  const headerLabels = exportColumns.map((c) => (language === 'ar' ? (c.headerAr || c.header) : c.header));

  try {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Eldokan Admin';
    const sheetName = (reportTitle || 'Report').slice(0, 31);
    const ws = workbook.addWorksheet(sheetName, { views: [{ rightToLeft: language === 'ar' }] });

    let startRow = 1;
    if (includeMetadata) {
      const dateLabel = language === 'ar' ? 'تاريخ التقرير' : 'Report Date';
      const dateValue = new Date().toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US');
      ws.getCell('A1').value = dateLabel;
      ws.getCell('B1').value = dateValue;
      ws.getCell('A2').value = language === 'ar' ? 'عنوان التقرير' : 'Report';
      ws.getCell('B2').value = reportTitle;
      startRow = 4;
    }

    const headerRow = ws.getRow(startRow);
    headerLabels.forEach((label, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = label;
      cell.font = { bold: true, color: { argb: HEADER_FONT_COLOR } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    headerRow.height = 22;

    const dataStartRow = startRow + 1;
    data.forEach((row, rowIndex) => {
      const r = ws.getRow(dataStartRow + rowIndex);
      exportColumns.forEach((col, colIndex) => {
        const value = col.getExportValue ? col.getExportValue(row, language) : (row[col.accessorKey] ?? '');
        r.getCell(colIndex + 1).value = value != null ? String(value) : '';
      });
    });

    exportColumns.forEach((_, i) => {
      ws.getColumn(i + 1).width = Math.min(Math.max(headerLabels[i]?.length || 10, 10), 40);
    });

    const buf = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `${(reportTitle || 'report').replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.warn('ExcelJS not available, falling back to CSV:', err);
    exportReportToCsv({
      ...options,
      includeMetadata,
      filename: (filename || '').replace(/\.xlsx$/, '.csv') || `${(reportTitle || 'report').replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`,
    });
  }
}

/** Flatten object to key-value rows for detail report */
function flattenDetailData(obj) {
  const rows = [];
  if (obj == null) return rows;
  const simple = (v) => {
    if (v == null) return '';
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (Array.isArray(v)) return v.length ? v.map((i) => (typeof i === 'object' && i != null && (i.name || i.id)) ? (i.name || i.id) : String(i)).join(', ') : '';
    if (typeof v === 'object') {
      if (v.username) return v.username;
      if (v.email) return v.email;
      if (v.name) return v.name;
      if (v.name_ar) return v.name_ar;
      return String(JSON.stringify(v)).slice(0, 200);
    }
    return String(v);
  };
  for (const [key, value] of Object.entries(obj)) {
    rows.push([key, simple(value)]);
  }
  return rows;
}

/** Export single-entity detail report to Excel */
export async function exportDetailReportToExcel({ reportTitle, data, language = 'en', includeMetadata = true, filename }) {
  try {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet((reportTitle || 'Detail').slice(0, 31), { views: [{ rightToLeft: language === 'ar' }] });
    let row = 1;
    if (includeMetadata) {
      ws.getCell(`A${row}`).value = language === 'ar' ? 'تاريخ التقرير' : 'Report Date';
      ws.getCell(`B${row}`).value = new Date().toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US');
      row++;
      ws.getCell(`A${row}`).value = language === 'ar' ? 'عنوان التقرير' : 'Report';
      ws.getCell(`B${row}`).value = reportTitle;
      row += 2;
    }
    const fieldLabel = language === 'ar' ? 'الحقل' : 'Field';
    const valueLabel = language === 'ar' ? 'القيمة' : 'Value';
    const hRow = ws.getRow(row);
    hRow.getCell(1).value = fieldLabel;
    hRow.getCell(2).value = valueLabel;
    hRow.getCell(1).font = hRow.getCell(2).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    hRow.getCell(1).fill = hRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a5896' } };
    row++;
    flattenDetailData(data).forEach(([k, v]) => {
      ws.getCell(`A${row}`).value = k;
      ws.getCell(`B${row}`).value = v != null ? String(v) : '';
      row++;
    });
    ws.getColumn(1).width = 28;
    ws.getColumn(2).width = 40;
    const buf = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `detail-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    exportDetailReportToCsv({ reportTitle, data, language, includeMetadata, filename: (filename || '').replace(/\.xlsx$/, '.csv') });
  }
}
