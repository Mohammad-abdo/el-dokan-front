import { useState, useCallback, useEffect } from 'react';
import { previewShopReport, generateShopReport } from '@/services/reportService';
import showToast from '@/lib/toast';

const STORAGE_KEY = 'shop_report_last_filters';

function getDefaultDateRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    date_from: from.toISOString().slice(0, 10),
    date_to: to.toISOString().slice(0, 10),
  };
}

function loadSavedFilters() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveFilters(filters) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch {
    // ignore storage errors
  }
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

const ALL_SECTIONS = [
  'overview',
  'products',
  'wallet',
  'ordersFromReps',
  'visits',
  'representatives',
  'companyOrders',
  'branches',
  'documents',
];

/**
 * Hook for generating shop reports with preview + export.
 */
export function useGenerateShopReport(language = 'en') {
  const isAr = language === 'ar';
  const i18n = {
    selectSections: isAr ? 'اختر قسمًا واحدًا على الأقل.' : 'Select at least one section.',
    dateFromRequired: isAr ? 'تاريخ البدء مطلوب.' : 'Start date is required.',
    dateToRequired: isAr ? 'تاريخ الانتهاء مطلوب.' : 'End date is required.',
    dateToAfterFrom: isAr ? 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء.' : 'End date must be after start date.',
    previewFailed: isAr ? 'فشل تحميل المعاينة.' : 'Failed to load preview.',
    generateFailed: isAr ? 'فشل إنشاء التقرير.' : 'Failed to generate report.',
    downloadedAs: (filename) => (isAr ? `تم تنزيل التقرير باسم ${filename}` : `Report downloaded as ${filename}`),
  };

  const saved = loadSavedFilters();
  const defaults = getDefaultDateRange();

  const [reportType, setReportType] = useState(saved?.reportType ?? 'full');
  const [sections, setSections] = useState(saved?.sections ?? ALL_SECTIONS);
  const [dateFrom, setDateFrom] = useState(saved?.dateFrom ?? defaults.date_from);
  const [dateTo, setDateTo] = useState(saved?.dateTo ?? defaults.date_to);
  const [format, setFormat] = useState(saved?.format ?? 'pdf');

  const [generating, setGenerating] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    saveFilters({ reportType, sections, dateFrom, dateTo, format });
  }, [reportType, sections, dateFrom, dateTo, format]);

  const toggleSection = useCallback((key) => {
    setSections((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  }, []);

  const validate = useCallback(() => {
    const errs = {};
    if (reportType === 'custom' && sections.length === 0) errs.sections = i18n.selectSections;
    if (!dateFrom) errs.date_from = i18n.dateFromRequired;
    if (!dateTo) errs.date_to = i18n.dateToRequired;
    if (dateFrom && dateTo && dateFrom > dateTo) errs.date_to = i18n.dateToAfterFrom;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [reportType, sections, dateFrom, dateTo, i18n.selectSections, i18n.dateFromRequired, i18n.dateToRequired, i18n.dateToAfterFrom]);

  const buildParams = useCallback(
    (shopId, overrideFormat) => ({
      shop_id: shopId,
      report_type: reportType,
      ...(reportType === 'custom' ? { sections } : {}),
      date_from: dateFrom,
      date_to: dateTo,
      format: overrideFormat ?? format,
    }),
    [reportType, sections, dateFrom, dateTo, format]
  );

  const preview = useCallback(
    async (shopId) => {
      if (!validate()) return;
      setPreviewing(true);
      setPreviewData(null);
      try {
        const result = await previewShopReport(buildParams(shopId, 'json'));
        setPreviewData(result.data ?? null);
      } catch (err) {
        showToast.error(err?.response?.data?.message ?? i18n.previewFailed);
      } finally {
        setPreviewing(false);
      }
    },
    [buildParams, validate, i18n.previewFailed]
  );

  const generate = useCallback(
    async (shopId) => {
      if (!validate()) return false;
      setGenerating(true);
      try {
        const params = buildParams(shopId);
        const { blob, filename } = await generateShopReport(params);
        triggerDownload(blob, filename);
        showToast.success(i18n.downloadedAs(filename));
        return true;
      } catch (err) {
        const msg = err?.response?.data?.message ?? i18n.generateFailed;
        showToast.error(msg);
        return false;
      } finally {
        setGenerating(false);
      }
    },
    [buildParams, validate, i18n.generateFailed, i18n.downloadedAs]
  );

  const reset = useCallback(() => {
    const d = getDefaultDateRange();
    setReportType('full');
    setSections(ALL_SECTIONS);
    setDateFrom(d.date_from);
    setDateTo(d.date_to);
    setFormat('pdf');
    setPreviewData(null);
    setErrors({});
  }, []);

  return {
    // form state
    reportType,
    setReportType,
    sections,
    toggleSection,
    setSections,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    format,
    setFormat,
    // async state
    generating,
    previewing,
    previewData,
    setPreviewData,
    errors,
    // actions
    preview,
    generate,
    reset,
  };
}

