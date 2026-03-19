import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, FileDown, Download, ListChecks, User, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/lib/api';
import { exportReportToExcel } from '@/lib/exportReportExcel';
import { exportReportToCsv, exportDetailReportToCsv } from '@/lib/reportExport';
import { exportDetailReportToExcel } from '@/lib/exportReportExcel';
import showToast from '@/lib/toast';
import { TABLE_REPORT_TYPES } from '@/lib/reportConfig';

/**
 * نظام تقارير واضح داخل الصفحة — بدون أي modal
 * يدعم: الكل أو سجل واحد، تقرير جدول أو تقرير مفصل عن السجل المحدد
 */
function getColumnHeader(col, language) {
  if (typeof col.header === 'string') return col.header;
  if (language === 'ar' && col.headerAr) return col.headerAr;
  return col.accessorKey || col.id || '';
}

function getReportTitle(reportKey, language) {
  const t = TABLE_REPORT_TYPES.find((r) => r.key === reportKey);
  return t ? (language === 'ar' ? t.labelAr : t.labelEn) : reportKey;
}

function getEntityLabel(item) {
  return item.name || item.user?.username || item.user?.email || `ID ${item.id}`;
}

export function TableReportExportCard({
  reportKey,
  data = [],
  columns = [],
  detailRoute,
  detailButtonLabel,
}) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [scope, setScope] = useState('all');
  const [selectedId, setSelectedId] = useState('');
  const [reportKind, setReportKind] = useState('tableOnly');
  const [selectedColumns, setSelectedColumns] = useState({});
  const [exportFormat, setExportFormat] = useState('csv');
  const [loadingExport, setLoadingExport] = useState(false);
  const canOpenDetail = typeof detailRoute === 'function' && scope === 'one' && selectedId;
  const openDetailLabel = detailButtonLabel || (language === 'ar' ? 'عرض التفاصيل' : 'View details');

  const config = useMemo(() => TABLE_REPORT_TYPES.find((r) => r.key === reportKey), [reportKey]);
  const exportColumns = useMemo(() => columns.filter((c) => c.id !== 'actions'), [columns]);
  const rowCount = Array.isArray(data) ? data.length : 0;
  const selectedEntity = useMemo(() => data.find((d) => String(d.id) === String(selectedId)), [data, selectedId]);
  const isDetailed = reportKind === 'detailed';

  useEffect(() => {
    const next = {};
    exportColumns.forEach((c) => {
      const key = c.accessorKey || c.id;
      if (key) next[key] = true;
    });
    setSelectedColumns((prev) => {
      exportColumns.forEach((c) => {
        const key = c.accessorKey || c.id;
        if (key && prev[key] !== undefined) next[key] = prev[key];
      });
      return next;
    });
  }, [reportKey, exportColumns]);

  const colsToExport = useMemo(() => {
    return exportColumns.filter((c) => {
      const key = c.accessorKey || c.id;
      return key && selectedColumns[key] !== false;
    });
  }, [exportColumns, selectedColumns]);

  const handleExport = async () => {
    setLoadingExport(true);
    try {
      const reportTitle = getReportTitle(reportKey, language);
      const baseFilename = `${reportKey}-${new Date().toISOString().slice(0, 10)}`;

      if (scope === 'one' && isDetailed && config?.detailApi && selectedId) {
        const res = await api.get(config.detailApi(selectedId));
        const detailData = res.data?.data ?? res.data;
        if (!detailData) throw new Error('No detail data');
        const detailFilename = `${reportKey}-detail-${selectedId}-${new Date().toISOString().slice(0, 10)}`;
        if (exportFormat === 'excel') {
          await exportDetailReportToExcel({
            reportTitle: (language === 'ar' ? 'تقرير مفصل — ' : 'Detail report — ') + reportTitle,
            data: detailData,
            language,
            includeMetadata: true,
            filename: `${detailFilename}.xlsx`,
          });
        } else {
          exportDetailReportToCsv({
            reportTitle: (language === 'ar' ? 'تقرير مفصل — ' : 'Detail report — ') + reportTitle,
            data: detailData,
            language,
            includeMetadata: true,
            filename: `${detailFilename}.csv`,
          });
        }
        showToast.success(language === 'ar' ? 'تم استخراج التقرير المفصل' : 'Detail report exported');
        return;
      }

      const exportData = scope === 'one' && selectedId
        ? data.filter((d) => String(d.id) === String(selectedId))
        : data;
      const includeMetadata = reportKind === 'fullReport';

      if (colsToExport.length === 0 && !isDetailed) {
        showToast.error(language === 'ar' ? 'اختر عموداً واحداً على الأقل' : 'Select at least one column');
        return;
      }

      if (exportFormat === 'excel') {
        await exportReportToExcel({
          reportTitle,
          columns: colsToExport,
          data: exportData,
          language,
          includeMetadata,
          filename: `${baseFilename}.xlsx`,
        });
      } else {
        exportReportToCsv({
          reportTitle,
          columns: colsToExport,
          data: exportData,
          filtersApplied: scope === 'one' ? { [language === 'ar' ? 'السجل' : 'Record']: selectedId } : {},
          language,
          includeMetadata,
          filename: `${baseFilename}.csv`,
        });
      }
      showToast.success(language === 'ar' ? 'تم التحميل' : 'Downloaded');
    } catch (e) {
      console.error(e);
      showToast.error(e?.message || (language === 'ar' ? 'فشل الاستخراج' : 'Export failed'));
    } finally {
      setLoadingExport(false);
    }
  };

  const scopeName = `scope_${reportKey}`;
  const kindName = `kind_${reportKey}`;
  const formatName = `format_${reportKey}`;
  const canExport = scope === 'all' ? rowCount > 0 : (scope === 'one' && selectedId);
  const canExportTable = !isDetailed && colsToExport.length > 0;

  return (
    <section
      role="region"
      aria-label={language === 'ar' ? 'نظام التقارير' : 'Reports system'}
      className="rounded-xl border-2 border-primary/20 bg-card shadow-sm overflow-hidden"
    >
      <div className="px-5 py-4 border-b bg-muted/30">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {language === 'ar' ? 'نظام التقارير' : 'Reports system'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {language === 'ar'
            ? `استخراج تقرير عن ${getReportTitle(reportKey, language)} — الكل أو سجل محدد، جدول أو تقرير مفصل`
            : `Export ${getReportTitle(reportKey, language)} report — All or one record, table or detailed report`}
        </p>
      </div>

      <div className="p-5">
        {/* Inputs row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:items-start">
          {/* scope */}
          <div className="lg:col-span-4">
            <label className="text-sm font-semibold block mb-2">
              {language === 'ar' ? 'نطاق التقرير' : 'Report scope'}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center gap-2 cursor-pointer rounded-xl border bg-muted/20 p-3 hover:bg-muted/30 transition-colors">
                <input
                  type="radio"
                  name={scopeName}
                  checked={scope === 'all'}
                  onChange={() => { setScope('all'); setReportKind((k) => (k === 'detailed' ? 'tableOnly' : k)); }}
                  className="rounded-full"
                />
                <span className="text-sm">{language === 'ar' ? 'الكل' : 'All'}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer rounded-xl border bg-muted/20 p-3 hover:bg-muted/30 transition-colors">
                <input
                  type="radio"
                  name={scopeName}
                  checked={scope === 'one'}
                  onChange={() => setScope('one')}
                  className="rounded-full"
                />
                <span className="text-sm">{language === 'ar' ? 'سجل واحد' : 'One record'}</span>
              </label>
            </div>

            {scope === 'one' && (
              <div className="mt-3">
                <label className="text-xs text-muted-foreground block mb-1">
                  {language === 'ar' ? 'اختر السجل:' : 'Select record:'}
                </label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">{language === 'ar' ? '— اختر —' : '— Select —'}</option>
                  {data.map((item) => (
                    <option key={item.id} value={item.id}>{getEntityLabel(item)}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* kind */}
          <div className="lg:col-span-4">
            <label className="text-sm font-semibold block mb-2">
              {language === 'ar' ? 'نوع التقرير' : 'Report type'}
            </label>

            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer rounded-xl border bg-muted/20 p-3 hover:bg-muted/30 transition-colors">
                <input
                  type="radio"
                  name={kindName}
                  checked={reportKind === 'tableOnly'}
                  onChange={() => setReportKind('tableOnly')}
                  className="mt-0.5"
                />
                <span className="text-sm leading-5">
                  {language === 'ar'
                    ? 'جدول فقط — نفس الأعمدة والصفوف'
                    : 'Table only — same columns and rows'}
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer rounded-xl border bg-muted/20 p-3 hover:bg-muted/30 transition-colors">
                <input
                  type="radio"
                  name={kindName}
                  checked={reportKind === 'fullReport'}
                  onChange={() => setReportKind('fullReport')}
                  className="mt-0.5"
                />
                <span className="text-sm leading-5">
                  {language === 'ar'
                    ? 'تقرير كامل — جدول + تاريخ وفلاتر'
                    : 'Full report — table + date and filters'}
                </span>
              </label>

              {scope === 'one' && (
                <label className="flex items-start gap-3 cursor-pointer rounded-xl border bg-muted/20 p-3 hover:bg-muted/30 transition-colors">
                  <input
                    type="radio"
                    name={kindName}
                    checked={reportKind === 'detailed'}
                    onChange={() => setReportKind('detailed')}
                    className="mt-0.5"
                  />
                  <span className="text-sm leading-5">
                    {language === 'ar'
                      ? 'تقرير مفصل — كل بيانات السجل'
                      : 'Detailed report — all record data'}
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* columns */}
          <div className="lg:col-span-4">
            {!isDetailed ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <ListChecks className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">{language === 'ar' ? 'الأعمدة التي تريدها' : 'Your columns'}</p>
                </div>

                <p className="text-xs text-muted-foreground mb-2">
                  {language === 'ar' ? 'في الملف النهائي' : 'In the final file'}
                </p>

                <div className="max-h-28 overflow-y-auto rounded-xl border bg-muted/30 p-3 space-y-1.5">
                  {exportColumns.map((col) => {
                    const key = col.accessorKey || col.id;
                    if (!key) return null;
                    return (
                      <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={selectedColumns[key] !== false}
                          onChange={(e) => setSelectedColumns((prev) => ({ ...prev, [key]: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <span>{getColumnHeader(col, language) || key}</span>
                      </label>
                    );
                  })}
                </div>

                <p className="text-sm text-muted-foreground mt-2">
                  {language === 'ar' ? 'عدد الصفوف:' : 'Rows:'}{" "}
                  <strong>{scope === 'one' ? (selectedId ? 1 : 0) : rowCount}</strong>
                </p>
              </>
            ) : (
              <div className="rounded-xl border bg-muted/20 p-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  {language === 'ar' ? 'تقرير مفصل' : 'Detailed report'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'ar'
                    ? 'سيتم جلب كل بيانات السجل المحدد.'
                    : 'All data for the selected record will be fetched.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {isDetailed && scope === 'one' && selectedId && (
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-4">
            <User className="h-4 w-4" />
            {language === 'ar' ? 'سيتم جلب كل بيانات السجل المحدد وتصديرها كتقرير مفصل.' : 'All data for the selected record will be fetched and exported as a detailed report.'}
          </p>
        )}

        {/* format + actions */}
        <div className="mt-4 pt-4 border-t flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium">{language === 'ar' ? 'تنسيق:' : 'Format:'}</span>

            <label className="flex items-center gap-2 cursor-pointer text-sm rounded-xl border bg-muted/20 p-2 hover:bg-muted/30 transition-colors">
              <input
                type="radio"
                name={formatName}
                checked={exportFormat === 'csv'}
                onChange={() => setExportFormat('csv')}
                className="rounded-full"
              />
              <FileDown className="h-4 w-4" />
              <span>CSV</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-sm rounded-xl border bg-muted/20 p-2 hover:bg-muted/30 transition-colors">
              <input
                type="radio"
                name={formatName}
                checked={exportFormat === 'excel'}
                onChange={() => setExportFormat('excel')}
                className="rounded-full"
              />
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              <span>Excel</span>
            </label>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {canOpenDetail && (
              <Button
                type="button"
                variant="outline"
                disabled={loadingExport}
                className="gap-2"
                onClick={() => navigate(detailRoute(selectedId))}
              >
                <FileText className="h-4 w-4" />
                {openDetailLabel}
              </Button>
            )}

            <Button
              onClick={handleExport}
              disabled={loadingExport || !canExport || (!isDetailed && !canExportTable)}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              {loadingExport
                ? language === 'ar'
                  ? 'جاري الاستخراج...'
                  : 'Exporting...'
                : language === 'ar'
                  ? 'استخراج التقرير'
                  : 'Export report'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
