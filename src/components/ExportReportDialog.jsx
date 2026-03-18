import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, Table2, ListChecks } from 'lucide-react';
import { exportReportToCsv } from '@/lib/reportExport';

/**
 * Get display header for column (for export list).
 */
function getColumnHeader(col, language) {
  if (typeof col.header === 'string') return col.header;
  if (language === 'ar' && col.headerAr) return col.headerAr;
  return col.accessorKey || col.id || '';
}

/**
 * Dialog to export table data as CSV.
 * Clearly shows: what columns will be exported, row count, filters, and option for table-only or full report.
 */
export function ExportReportDialog({
  open,
  onOpenChange,
  reportTitle,
  columns,
  data,
  filtersApplied = {},
  language = 'en',
  filename,
}) {
  const [tableOnly, setTableOnly] = useState(true);

  const exportColumns = columns.filter((c) => c.id !== 'actions');
  const columnHeaders = exportColumns.map((c) => getColumnHeader(c, language));
  const rowCount = Array.isArray(data) ? data.length : 0;
  const hasFilters = Object.values(filtersApplied).some((v) => v != null && v !== '');

  const handleExportCsv = () => {
    exportReportToCsv({
      reportTitle,
      columns,
      data,
      filtersApplied,
      language,
      includeMetadata: !tableOnly,
      filename: filename || `${reportTitle.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    onOpenChange?.(false);
  };

  const labels = {
    title: language === 'ar' ? 'استخراج بيانات الجدول' : 'Export table data',
    description: language === 'ar'
      ? 'سيتم تصدير نفس البيانات الظاهرة في الجدول إلى ملف CSV. يمكنك فتح الملف في Excel.'
      : 'The same data shown in the table will be exported to a CSV file. You can open it in Excel.',
    whatExport: language === 'ar' ? 'ما الذي سيتم تصديره؟' : 'What will be exported?',
    columnsLabel: language === 'ar' ? 'الأعمدة في الملف:' : 'Columns in file:',
    rows: language === 'ar' ? 'عدد الصفوف:' : 'Number of rows:',
    filters: language === 'ar' ? 'الفلاتر المطبقة:' : 'Filters applied:',
    noFilters: language === 'ar' ? 'لا توجد فلاتر' : 'No filters',
    tableOnlyLabel: language === 'ar' ? 'جدول فقط — نفس أعمدة وصفوف الجدول الظاهر أمامك (يفتح مباشرة في Excel)' : 'Table only — same columns and rows as the table (opens directly in Excel)',
    fullReportLabel: language === 'ar' ? 'تقرير كامل — جدول + سطر في الأعلى يوضح تاريخ التقرير والفلاتر' : 'Full report — table plus a header block with date and filters',
    exportCsv: language === 'ar' ? 'تحميل الملف CSV' : 'Download CSV',
    cancel: language === 'ar' ? 'إلغاء' : 'Cancel',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {labels.title}
          </DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* ما الذي سيتم تصديره */}
          <div>
            <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <ListChecks className="h-4 w-4" />
              {labels.whatExport}
            </p>
            <p className="text-xs text-muted-foreground mb-1">{labels.columnsLabel}</p>
            <ul className="text-sm bg-muted/50 rounded-md p-3 list-none space-y-1 max-h-32 overflow-y-auto">
              {columnHeaders.map((h, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>{h || '—'}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Table2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">{labels.rows}</span>
            <strong>{rowCount}</strong>
          </div>

          {hasFilters && (
            <div className="text-sm">
              <span className="text-muted-foreground">{labels.filters}</span>
              <ul className="list-disc list-inside mt-1 text-muted-foreground">
                {Object.entries(filtersApplied)
                  .filter(([, v]) => v != null && v !== '')
                  .map(([key, value]) => (
                    <li key={key}>
                      {key}: {String(value)}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* خيار نوع الملف */}
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground">
              {language === 'ar' ? 'نوع الملف' : 'File format'}
            </p>
            <label className="flex items-start gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                name="exportType"
                checked={tableOnly}
                onChange={() => setTableOnly(true)}
                className="mt-0.5"
              />
              <span>{labels.tableOnlyLabel}</span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                name="exportType"
                checked={!tableOnly}
                onChange={() => setTableOnly(false)}
                className="mt-0.5"
              />
              <span>{labels.fullReportLabel}</span>
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>
            {labels.cancel}
          </Button>
          <Button onClick={handleExportCsv} className="gap-2" disabled={rowCount === 0}>
            <Download className="h-4 w-4" />
            {labels.exportCsv}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
