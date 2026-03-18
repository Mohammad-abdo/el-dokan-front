/**
 * Report export utility: build CSV with metadata and optional filter summary.
 * Used for Doctors, Shops, Companies, Drivers, Representatives admin reports.
 */

const BOM = '\uFEFF'; // UTF-8 BOM for Excel

/**
 * Escape CSV cell (quotes, newlines, commas)
 */
function escapeCsvCell(value) {
  if (value == null) return '';
  const str = String(value).trim();
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Get plain text value from a row for a column (for export only).
 * columns: array of { accessorKey, header } or with cell getter
 */
function getCellExportValue(row, column, language = 'en') {
  const key = column.accessorKey;
  if (!key && column.id === 'actions') return '';
  if (key && (key in row)) {
    const v = row[key];
    if (v != null && typeof v === 'object' && !Array.isArray(v)) {
      if (v.username) return v.username;
      if (v.email) return v.email;
      if (v.name) return v.name;
      if (v.name_ar) return v.name_ar;
      return JSON.stringify(v);
    }
    return v;
  }
  if (column.getExportValue) return column.getExportValue(row, language);
  if (column.cell && typeof column.cell === 'function') {
    const fakeRow = { original: row };
    const fakeContext = { row: fakeRow };
    const rendered = column.cell({ row: fakeRow, getValue: () => row[key] });
    if (typeof rendered === 'string') return rendered;
    if (rendered?.props?.children != null) {
      const c = rendered.props.children;
      return Array.isArray(c) ? c.join(' ') : String(c);
    }
    return '';
  }
  return row[key] ?? '';
}

/**
 * Build CSV content for a report.
 * @param {Object} options
 * @param {string} options.reportTitle - e.g. "Doctors Report"
 * @param {Array} options.columns - [{ accessorKey, header, getExportValue? }] (no actions column for export)
 * @param {Array} options.data - array of row objects
 * @param {Object} options.filtersApplied - e.g. { status: 'active', search: 'john' }
 * @param {string} options.language - 'ar' | 'en'
 * @param {boolean} options.includeMetadata - prepend report date and filters (default true)
 */
export function buildReportCsv({ reportTitle, columns, data, filtersApplied = {}, language = 'en', includeMetadata = true }) {
  const exportColumns = columns.filter((c) => c.id !== 'actions');
  const headers = exportColumns.map((c) => (typeof c.header === 'string' ? c.header : (c.headerAr && language === 'ar' ? c.headerAr : c.header) || c.accessorKey));
  const rows = [];

  if (includeMetadata) {
    const dateLabel = language === 'ar' ? 'تاريخ التقرير' : 'Report Date';
    const dateValue = new Date().toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US');
    rows.push([dateLabel, dateValue]);
    rows.push([language === 'ar' ? 'عنوان التقرير' : 'Report', reportTitle]);
    if (Object.keys(filtersApplied).length) {
      const filterLabel = language === 'ar' ? 'الفلاتر المطبقة' : 'Filters Applied';
      const filterStr = Object.entries(filtersApplied)
        .filter(([, v]) => v != null && v !== '')
        .map(([k, v]) => `${k}: ${v}`)
        .join('; ');
      rows.push([filterLabel, filterStr]);
    }
    rows.push([]); // empty row before table
  }

  rows.push(headers.map(escapeCsvCell));
  for (const row of data) {
    rows.push(
      exportColumns.map((col) => escapeCsvCell(getCellExportValue(row, col, language)))
    );
  }

  const csv = rows.map((r) => r.join(',')).join('\r\n');
  return BOM + csv;
}

/**
 * Trigger download of a CSV file.
 */
export function downloadCsv(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `report-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Full export flow: build CSV and download.
 * @param {Object} options - same as buildReportCsv + filename (optional)
 */
export function exportReportToCsv(options) {
  const filename = options.filename || `${(options.reportTitle || 'report').replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`;
  const content = buildReportCsv(options);
  downloadCsv(content, filename);
}

/**
 * Flatten object to array of [fieldLabel, value] for detail report.
 * Handles nested objects (one level), arrays (join), and primitives.
 */
function flattenForDetailReport(obj, prefix = '', language = 'en') {
  const rows = [];
  const fieldLabel = language === 'ar' ? 'الحقل' : 'Field';
  const valueLabel = language === 'ar' ? 'القيمة' : 'Value';
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
      return JSON.stringify(v);
    }
    return String(v);
  };
  for (const [key, value] of Object.entries(obj)) {
    if (value != null && typeof value === 'object' && !Array.isArray(value) && (key === 'user' || key === 'company_plan' || key === 'user_id')) {
      const sub = simple(value);
      rows.push([prefix + key, sub]);
    } else {
      rows.push([prefix + key, simple(value)]);
    }
  }
  return rows;
}

/**
 * Build CSV for a single-entity detail report (key-value rows).
 */
export function buildDetailReportCsv({ reportTitle, data, language = 'en', includeMetadata = true }) {
  const rows = [];
  if (includeMetadata) {
    const dateLabel = language === 'ar' ? 'تاريخ التقرير' : 'Report Date';
    rows.push([dateLabel, new Date().toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')]);
    rows.push([language === 'ar' ? 'عنوان التقرير' : 'Report', reportTitle]);
    rows.push([]);
  }
  const fieldLabel = language === 'ar' ? 'الحقل' : 'Field';
  const valueLabel = language === 'ar' ? 'القيمة' : 'Value';
  rows.push([fieldLabel, valueLabel].map(escapeCsvCell));
  const flat = flattenForDetailReport(data, '', language);
  flat.forEach(([k, v]) => rows.push([escapeCsvCell(k), escapeCsvCell(v)]));
  return BOM + rows.map((r) => r.join(',')).join('\r\n');
}

/**
 * Download detail report CSV.
 */
export function exportDetailReportToCsv(options) {
  const filename = options.filename || `detail-${new Date().toISOString().slice(0, 10)}.csv`;
  const content = buildDetailReportCsv(options);
  downloadCsv(content, filename);
}
