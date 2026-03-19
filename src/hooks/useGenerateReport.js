import { useState, useCallback, useEffect } from 'react';
import { previewDoctorReport, generateDoctorReport } from '@/services/reportService';
import showToast from '@/lib/toast';

const STORAGE_KEY = 'doctor_report_last_filters';

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

/**
 * Hook for generating doctor reports with preview, generate, and
 * persistent filter support.
 */
export function useGenerateReport() {
  const saved = loadSavedFilters();
  const defaults = getDefaultDateRange();

  const [reportType, setReportType] = useState(saved?.reportType ?? 'full');
  const [sections, setSections] = useState(saved?.sections ?? [
    'schedule', 'prescriptions', 'bookings', 'patients', 'wallet', 'visits', 'treatments', 'medical_centers', 'ratings',
  ]);
  const [dateFrom, setDateFrom] = useState(saved?.dateFrom ?? defaults.date_from);
  const [dateTo, setDateTo] = useState(saved?.dateTo ?? defaults.date_to);
  const [format, setFormat] = useState(saved?.format ?? 'pdf');

  const [generating, setGenerating] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [errors, setErrors] = useState({});

  // Persist filters whenever they change
  useEffect(() => {
    saveFilters({ reportType, sections, dateFrom, dateTo, format });
  }, [reportType, sections, dateFrom, dateTo, format]);

  const toggleSection = useCallback((key) => {
    setSections((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  }, []);

  const validate = useCallback(() => {
    const errs = {};
    if (reportType === 'custom' && sections.length === 0) {
      errs.sections = 'Select at least one section.';
    }
    if (!dateFrom) errs.date_from = 'Start date is required.';
    if (!dateTo)   errs.date_to   = 'End date is required.';
    if (dateFrom && dateTo && dateFrom > dateTo) {
      errs.date_to = 'End date must be after start date.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [reportType, sections, dateFrom, dateTo]);

  const buildParams = useCallback(
    (doctorId, overrideFormat) => ({
      doctor_id:   doctorId,
      report_type: reportType,
      ...(reportType === 'custom' ? { sections } : {}),
      date_from: dateFrom,
      date_to:   dateTo,
      format:    overrideFormat ?? format,
    }),
    [reportType, sections, dateFrom, dateTo, format]
  );

  const preview = useCallback(
    async (doctorId) => {
      if (!validate()) return;
      setPreviewing(true);
      setPreviewData(null);
      try {
        const result = await previewDoctorReport(buildParams(doctorId, 'json'));
        setPreviewData(result.data ?? null);
      } catch (err) {
        showToast.error(err?.response?.data?.message ?? 'Failed to load preview.');
      } finally {
        setPreviewing(false);
      }
    },
    [buildParams, validate]
  );

  const generate = useCallback(
    async (doctorId) => {
      if (!validate()) return false;
      setGenerating(true);
      try {
        const params = buildParams(doctorId);
        const { blob, filename } = await generateDoctorReport(params);
        triggerDownload(blob, filename);
        showToast.success(`Report downloaded as ${filename}`);
        return true;
      } catch (err) {
        const msg = err?.response?.data?.message ?? 'Failed to generate report.';
        showToast.error(msg);
        return false;
      } finally {
        setGenerating(false);
      }
    },
    [buildParams, validate]
  );

  const reset = useCallback(() => {
    const d = getDefaultDateRange();
    setReportType('full');
    setSections(['schedule', 'prescriptions', 'bookings', 'patients', 'wallet', 'visits', 'treatments', 'medical_centers', 'ratings']);
    setDateFrom(d.date_from);
    setDateTo(d.date_to);
    setFormat('pdf');
    setPreviewData(null);
    setErrors({});
  }, []);

  return {
    // form state
    reportType, setReportType,
    sections, toggleSection, setSections,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    format, setFormat,
    // async state
    generating, previewing,
    previewData, setPreviewData,
    errors,
    // actions
    preview, generate, reset,
  };
}
