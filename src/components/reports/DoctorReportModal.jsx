import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useGenerateReport } from '@/hooks/useGenerateReport';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import {
  FileText,
  FileSpreadsheet,
  Loader2,
  Eye,
  Download,
  RotateCcw,
  Stethoscope,
  ClipboardList,
  Calendar,
  Users,
  Wallet,
  MapPin,
  Pill,
  Building2,
  TrendingUp,
  ChevronDown,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// ─── Section definitions ──────────────────────────────────────────────────────
const SECTIONS = [
  { key: 'schedule',        label: 'Schedule & Pricing',    labelAr: 'الجدول والأسعار',            icon: Calendar },
  { key: 'prescriptions',   label: 'Prescriptions',         labelAr: 'الوصفات الطبية',          icon: ClipboardList },
  { key: 'bookings',        label: 'Bookings',              labelAr: 'الحجوزات',                  icon: TrendingUp },
  { key: 'patients',        label: 'Patients',              labelAr: 'المرضى',                    icon: Users },
  { key: 'wallet',          label: 'Wallet & Revenue',      labelAr: 'المحفظة والإيرادات',         icon: Wallet },
  { key: 'visits',          label: 'Visits',                labelAr: 'الزيارات',                   icon: MapPin },
  { key: 'treatments',      label: 'Treatments',            labelAr: 'العلاجات',                  icon: Pill },
  { key: 'medical_centers', label: 'Medical Centers',       labelAr: 'المراكز الطبية',            icon: Building2 },
  { key: 'ratings',         label: 'Ratings & Reviews',     labelAr: 'التقييمات والمراجعات',      icon: Stethoscope },
];

// ─── Radio card ───────────────────────────────────────────────────────────────
function RadioOption({ id, name, value, current, onChange, icon: Icon, label, description }) {
  const selected = current === value;
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={selected}
        onChange={() => onChange(value)}
        className="mt-0.5 accent-blue-600"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`h-4 w-4 ${selected ? 'text-blue-600' : 'text-gray-500'}`} />}
          <span className={`text-sm font-semibold ${selected ? 'text-blue-700' : 'text-gray-700'}`}>
            {label}
          </span>
        </div>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
}

// ─── Section checkbox ─────────────────────────────────────────────────────────
function SectionCheckbox({ section, checked, onToggle }) {
  const Icon = section.icon;
  return (
    <label
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
        checked
          ? 'border-blue-400 bg-blue-50 text-blue-700'
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(section.key)}
        className="accent-blue-600 h-3.5 w-3.5"
      />
      <Icon className={`h-3.5 w-3.5 shrink-0 ${checked ? 'text-blue-500' : 'text-gray-400'}`} />
      <span className="font-medium">{section.label}</span>
    </label>
  );
}

// ─── KPI preview card ─────────────────────────────────────────────────────────
function PreviewCard({ data, language }) {
  if (!data) return null;
  const isAr = language === 'ar';
  const kpis   = data.kpis   ?? {};
  const doctor = data.doctor ?? {};

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-semibold text-blue-800">{isAr ? 'معاينة التقرير' : 'Report Preview'}</span>
        <span className="text-xs text-blue-600 ml-auto">
          {data.period?.from} → {data.period?.to}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: isAr ? 'الحجوزات' : 'Bookings', value: kpis.bookings_this_month ?? 0 },
          { label: isAr ? 'الوصفات الطبية' : 'Prescriptions', value: kpis.total_prescriptions ?? 0 },
          { label: isAr ? 'نسبة الشراء' : 'Purchase Rate', value: `${kpis.prescription_purchase_rate ?? 0}%` },
          { label: isAr ? 'الإيرادات' : 'Revenue', value: `EGP ${Number(kpis.completed_revenue ?? 0).toLocaleString()}` },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-md p-2.5 border border-blue-100 text-center">
            <div className="text-base font-bold text-blue-700">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-blue-700">
        <span>&#9733; {doctor.rating ?? '0.00'} {isAr ? 'تقييم' : 'rating'}</span>
        <span>&bull; {doctor.specialty ?? '-'}</span>
        <span>&bull; {Object.keys(data.sections ?? {}).length} {isAr ? 'أقسام' : 'sections'}</span>
      </div>
    </div>
  );
}

// ─── Doctor selector (used when no doctor is pre-selected) ───────────────────
function DoctorSelector({ value, onChange, language }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAr = language === 'ar';

  useEffect(() => {
    api.get('/admin/doctors')
      .then((res) => setDoctors(extractDataFromResponse(res)))
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false));
  }, []);

  const getDoctorLabel = (d) =>
    d.name || d.fullName || d.user?.name || d.user?.username || (isAr ? `طبيب #${d.id}` : `Doctor #${d.id}`);

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {isAr ? 'اختر الطبيب' : 'Select Doctor'}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
        >
          <option value="">{loading ? (isAr ? 'جاري تحميل الأطباء...' : 'Loading doctors…') : (isAr ? '— اختر طبيبًا —' : '— Select a doctor —')}</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {getDoctorLabel(d)}{d.specialty ? ` · ${d.specialty}` : ''}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
/**
 * DoctorReportModal
 *
 * Props:
 *   open         {boolean}
 *   onOpenChange {(open: boolean) => void}
 *   doctor       {object|null} — pass null to show an in-modal doctor picker
 */
export default function DoctorReportModal({ open, onOpenChange, doctor }) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const t = (en, ar) => (isAr ? ar : en);

  const {
    reportType, setReportType,
    sections, toggleSection, setSections,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    format, setFormat,
    generating, previewing,
    previewData, setPreviewData,
    errors,
    preview, generate, reset,
  } = useGenerateReport(language);

  // When no doctor is pre-selected the user picks one inside the modal
  const [pickedDoctorId, setPickedDoctorId] = useState('');
  const [pickerError, setPickerError] = useState('');

  // Resolve the effective doctor ID
  const effectiveDoctorId = doctor?.id ?? (pickedDoctorId ? Number(pickedDoctorId) : null);
  const doctorName =
    doctor?.name || doctor?.user?.name || doctor?.fullName ||
    (pickedDoctorId ? t('Selected Doctor', 'طبيب مختار') : t('Doctor', 'طبيب'));

  // Reset picker + preview when the modal re-opens
  useEffect(() => {
    if (open) {
      setPreviewData(null);
      setPickerError('');
      if (!doctor) setPickedDoctorId('');
    }
  }, [open, doctor?.id]);

  const requireDoctor = () => {
    if (!effectiveDoctorId) {
      setPickerError(t('Please select a doctor first.', 'يرجى اختيار طبيب أولاً.'));
      return false;
    }
    setPickerError('');
    return true;
  };

  const handlePreview = () => {
    if (!requireDoctor()) return;
    preview(effectiveDoctorId);
  };

  const handleGenerate = async () => {
    if (!requireDoctor()) return;
    const success = await generate(effectiveDoctorId);
    if (success) onOpenChange(false);
  };

  const selectAllSections = () => setSections(SECTIONS.map((s) => s.key));
  const clearAllSections  = () => setSections([]);
  const sectionsUI = SECTIONS.map((s) => ({
    ...s,
    label: isAr ? s.labelAr : s.label,
  }));

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      position="top"
      topOffset={6}
      zIndex="z-[1000000000]"
    >
      <DialogContent className="w-[1000px] max-w-[calc(100vw-2rem)] max-h-[95vh] p-10">

        {/* ── Header ── */}
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Stethoscope className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-lg">{t('Generate Doctor Report', 'إنشاء تقرير الطبيب')}</DialogTitle>
              <DialogDescription className="text-sm">
                {doctor ? doctorName : t('PDF or Excel export with full data', 'تصدير PDF أو Excel بالبيانات الكاملة')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ── Body ── */}
        <div className="space-y-5 py-1">

          {/* Doctor picker — only when no doctor is pre-selected */}
          {!doctor && (
            <div>
              <DoctorSelector value={pickedDoctorId} onChange={setPickedDoctorId} language={language} />
              {pickerError && (
                <p className="text-xs text-red-500 mt-1.5">{pickerError}</p>
              )}
            </div>
          )}

          {/* Report Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('Report Type', 'نوع التقرير')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <RadioOption
                id="type-full"
                name="report_type"
                value="full"
                current={reportType}
                onChange={setReportType}
                icon={FileText}
                label={t('Full Report', 'تقرير كامل')}
                description={t('All sections included', 'جميع الأقسام مشمولة')}
              />
              <RadioOption
                id="type-custom"
                name="report_type"
                value="custom"
                current={reportType}
                onChange={setReportType}
                icon={ClipboardList}
                label={t('Custom Report', 'تقرير مخصص')}
                description={t('Select specific sections', 'اختر الأقسام المحددة')}
              />
            </div>
          </div>

          {/* Sections (custom only) */}
          {reportType === 'custom' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">{t('Sections', 'الأقسام')}</label>
                <div className="flex gap-2">
                  <button type="button" onClick={selectAllSections} className="text-xs text-blue-600 hover:underline">{t('All', 'الكل')}</button>
                  <span className="text-xs text-gray-400">/</span>
                  <button type="button" onClick={clearAllSections} className="text-xs text-gray-500 hover:underline">{t('None', 'بدون')}</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {sectionsUI.map((s) => (
                  <SectionCheckbox
                    key={s.key}
                    section={s}
                    checked={sections.includes(s.key)}
                    onToggle={toggleSection}
                  />
                ))}
              </div>
              {errors.sections && (
                <p className="text-xs text-red-500 mt-1.5">{errors.sections}</p>
              )}
            </div>
          )}

          {/* Date Range */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('Date Range', 'نطاق التاريخ')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('From', 'من')}</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  max={dateTo || undefined}
                  className={`w-full rounded-md border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    errors.date_from ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {errors.date_from && <p className="text-xs text-red-500 mt-1">{errors.date_from}</p>}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('To', 'إلى')}</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  min={dateFrom || undefined}
                  className={`w-full rounded-md border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    errors.date_to ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {errors.date_to && <p className="text-xs text-red-500 mt-1">{errors.date_to}</p>}
              </div>
            </div>
          </div>

          {/* Export Format */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('Export Format', 'صيغة التصدير')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <RadioOption
                id="format-pdf"
                name="export_format"
                value="pdf"
                current={format}
                onChange={setFormat}
                icon={FileText}
                label="PDF"
                description={t('Professional printable layout', 'تخطيط احترافي للطباعة')}
              />
              <RadioOption
                id="format-excel"
                name="export_format"
                value="excel"
                current={format}
                onChange={setFormat}
                icon={FileSpreadsheet}
                label="Excel"
                description={t('Multi-sheet spreadsheet', 'ملف إكسل متعدد الشرائح')}
              />
            </div>
          </div>

          {/* Preview area */}
          {previewing && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('Loading preview…', 'جارٍ تحميل المعاينة…')}
            </div>
          )}
          {!previewing && previewData && <PreviewCard data={previewData} language={language} />}

        </div>

        {/* ── Footer ── */}
        <DialogFooter className="pt-2 gap-2">
          <div className="flex items-center gap-2 mr-auto">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={reset}
              className="text-gray-500 gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t('Reset', 'إعادة ضبط')}
            </Button>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {t('Cancel', 'إلغاء')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePreview}
            disabled={previewing || generating}
            className="gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            {previewing
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Eye className="h-3.5 w-3.5" />}
            {t('Preview', 'معاينة')}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleGenerate}
            disabled={generating || previewing}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700"
          >
            {generating
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Download className="h-3.5 w-3.5" />}
            {generating ? t('Generating…', 'جارٍ التوليد…') : t('Generate', 'توليد')}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
