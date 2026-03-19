import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGenerateCompanyReport } from '@/hooks/useGenerateCompanyReport';
import {
  FileText,
  FileSpreadsheet,
  Loader2,
  Eye,
  Download,
  RotateCcw,
  Building2,
  ClipboardList,
  Calendar,
  Wallet,
  Users,
  Store,
  MapPin,
  BadgeCheck,
  FileArchive,
  Package2,
  ChevronDown,
} from 'lucide-react';

const COMPANY_SECTIONS = [
  { key: 'overview', label: 'Overview', labelAr: 'معلومات الشركة', icon: Store },
  { key: 'plan', label: 'Plan', labelAr: 'الخطة', icon: BadgeCheck },
  { key: 'companyProducts', label: 'Company Products', labelAr: 'منتجات الشركة', icon: Package2 },
  { key: 'products', label: 'Products Sales', labelAr: 'مبيعات المنتجات', icon: ClipboardList },
  { key: 'wallet', label: 'Wallet & Transactions', labelAr: 'المحفظة والمعاملات', icon: Wallet },
  { key: 'ordersFromReps', label: 'Orders From Reps', labelAr: 'الطلبات من المندوبين', icon: ClipboardList },
  { key: 'visits', label: 'Visits', labelAr: 'الزيارات', icon: MapPin },
  { key: 'representatives', label: 'Representatives', labelAr: 'المندوبون', icon: Users },
  { key: 'companyOrders', label: 'Company Orders', labelAr: 'مبيعات الشركة', icon: Building2 },
  { key: 'branches', label: 'Branches', labelAr: 'الفروع', icon: Building2 },
  { key: 'documents', label: 'Documents', labelAr: 'الوثائق', icon: FileArchive },
];

function RadioOption({ id, name, value, current, onChange, icon: Icon, label, description }) {
  const selected = current === value;
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
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
          <span className={`text-sm font-semibold ${selected ? 'text-blue-700' : 'text-gray-700'}`}>{label}</span>
        </div>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
    </label>
  );
}

function SectionCheckbox({ section, checked, onToggle }) {
  const Icon = section.icon;
  return (
    <label
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
        checked ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <input type="checkbox" checked={checked} onChange={() => onToggle(section.key)} className="accent-blue-600 h-3.5 w-3.5" />
      <Icon className={`h-3.5 w-3.5 shrink-0 ${checked ? 'text-blue-500' : 'text-gray-400'}`} />
      <span className="font-medium">{section.label}</span>
    </label>
  );
}

function PreviewCard({ data, language }) {
  if (!data) return null;
  const isAr = language === 'ar';
  const shop = data.shop ?? {};
  const period = data.period ?? {};
  const sectionsObj = data.sections ?? {};
  const sectionCount = Object.keys(sectionsObj || {}).length;
  const kpis = data.kpis ?? {};

  const revenue = kpis.total_revenue ?? kpis.revenue ?? null;
  const orders = kpis.orders_count ?? null;

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-semibold text-blue-800">{isAr ? 'معاينة التقرير' : 'Report Preview'}</span>
        <span className="text-xs text-blue-600 ml-auto">
          {period.from} → {period.to}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="text-sm font-semibold text-blue-900">{shop.name ?? (isAr ? 'الشركة' : 'Company')}</div>
        <div className="text-xs text-blue-700">{sectionCount} {isAr ? 'أقسام' : 'sections'}</div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: isAr ? 'الإيرادات' : 'Revenue', value: revenue ?? '-' },
          { label: isAr ? 'الطلبات' : 'Orders', value: orders ?? '-' },
          { label: isAr ? 'الحالة' : 'Status', value: kpis.status ?? (isAr ? 'جاهز' : 'Ready') },
          { label: isAr ? 'المعاملات' : 'Transactions', value: kpis.transactions_count ?? '-' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-md p-2.5 border border-blue-100 text-center">
            <div className="text-base font-bold text-blue-700">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompanySelector({ value, onChange, language, companies = [], disabled }) {
  const isAr = language === 'ar';
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(Array.isArray(companies) && companies.length === 0);
  }, [companies]);

  const getLabel = (c) => c?.name || c?.title || c?.user?.username || c?.user?.email || c?.id || '-';

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {isAr ? 'اختر الشركة' : 'Select Company'}
      </label>
      <div className="relative">
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || loading}
          className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
        >
          <option value="">{loading ? (isAr ? 'جاري تحميل الشركات...' : 'Loading companies…') : (isAr ? '— اختر —' : '— Select —')}</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {getLabel(c)}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
}

export default function CompanyReportModal({ open, onOpenChange, company, companies = [] }) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const t = (en, ar) => (isAr ? ar : en);

  const {
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
    generating,
    previewing,
    previewData,
    setPreviewData,
    errors,
    preview,
    generate,
    reset,
  } = useGenerateCompanyReport(language);

  const [pickedCompanyId, setPickedCompanyId] = useState('');
  const [pickerError, setPickerError] = useState('');

  const effectiveCompanyId = company?.id ?? (pickedCompanyId ? Number(pickedCompanyId) : null);
  const companyName = company?.name || company?.title || (pickedCompanyId ? t('Selected Company', 'شركة مختارة') : t('Company', 'شركة'));

  useEffect(() => {
    if (!open) return;
    setPreviewData(null);
    setPickerError('');
    if (!company) setPickedCompanyId('');
  }, [open, company?.id, setPreviewData]);

  const requireCompany = () => {
    if (!effectiveCompanyId) {
      setPickerError(t('Please select a company first.', 'يرجى اختيار شركة أولاً.'));
      return false;
    }
    setPickerError('');
    return true;
  };

  const handlePreview = () => {
    if (!requireCompany()) return;
    preview(effectiveCompanyId);
  };

  const handleGenerate = async () => {
    if (!requireCompany()) return;
    const success = await generate(effectiveCompanyId);
    if (success) onOpenChange(false);
  };

  const selectAllSections = () => setSections(COMPANY_SECTIONS.map((s) => s.key));
  const clearAllSections = () => setSections([]);
  const sectionsUI = useMemo(
    () =>
      COMPANY_SECTIONS.map((s) => ({
        ...s,
        label: isAr ? s.labelAr : s.label,
      })),
    [isAr]
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      position="top"
      topOffset={6}
      zIndex="z-[1000000000]"
    >
      <DialogContent className="w-[1200px] max-w-[calc(100vw-2rem)] max-h-[95vh] p-10">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-lg">{t('Generate Company Report', 'إنشاء تقرير شركة')}</DialogTitle>
              <DialogDescription className="text-sm">
                {t('PDF or Excel export with full company data', 'تصدير PDF أو Excel بالبيانات الكاملة للشركة')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div>
            <CompanySelector
              value={effectiveCompanyId ?? ''}
              onChange={(v) => setPickedCompanyId(v)}
              language={language}
              companies={companies}
              disabled={!Array.isArray(companies) || companies.length === 0}
            />
            {pickerError && <p className="text-xs text-red-500 mt-1.5">{pickerError}</p>}
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold">{t('Selected:', 'المختار:')}</span>
            <span>{companyName}</span>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('Report Type', 'نوع التقرير')}</label>
            <div className="grid grid-cols-2 gap-3">
              <RadioOption
                id="company-type-full"
                name="report_type"
                value="full"
                current={reportType}
                onChange={setReportType}
                icon={FileText}
                label={t('Full Report', 'تقرير كامل')}
                description={t('All sections included', 'جميع الأقسام مشمولة')}
              />
              <RadioOption
                id="company-type-custom"
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

          {reportType === 'custom' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">{t('Sections', 'الأقسام')}</label>
                <div className="flex gap-2">
                  <button type="button" onClick={selectAllSections} className="text-xs text-blue-600 hover:underline">
                    {t('All', 'الكل')}
                  </button>
                  <span className="text-xs text-gray-400">/</span>
                  <button type="button" onClick={clearAllSections} className="text-xs text-gray-500 hover:underline">
                    {t('None', 'بدون')}
                  </button>
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
              {errors.sections && <p className="text-xs text-red-500 mt-1.5">{errors.sections}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('Date Range', 'نطاق التاريخ')}</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('From', 'من')}</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  max={dateTo || undefined}
                  className={`w-full rounded-md border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.date_from ? 'border-red-400' : 'border-gray-300'}`}
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
                  className={`w-full rounded-md border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.date_to ? 'border-red-400' : 'border-gray-300'}`}
                />
                {errors.date_to && <p className="text-xs text-red-500 mt-1">{errors.date_to}</p>}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('Export Format', 'صيغة التصدير')}</label>
            <div className="grid grid-cols-2 gap-3">
              <RadioOption
                id="company-format-pdf"
                name="export_format"
                value="pdf"
                current={format}
                onChange={setFormat}
                icon={FileText}
                label="PDF"
                description={t('Professional printable layout', 'تخطيط احترافي للطباعة')}
              />
              <RadioOption
                id="company-format-excel"
                name="export_format"
                value="excel"
                current={format}
                onChange={setFormat}
                icon={FileSpreadsheet}
                label="Excel"
                description={t('Multi-section spreadsheet', 'ملف إكسل متعدد الشرائح')}
              />
            </div>
          </div>

          {previewing && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('Loading preview…', 'جارٍ تحميل المعاينة…')}
            </div>
          )}
          {!previewing && previewData && <PreviewCard data={previewData} language={language} />}
        </div>

        <DialogFooter className="pt-2 gap-2">
          <div className="flex items-center gap-2 mr-auto">
            <Button type="button" variant="ghost" size="sm" onClick={reset} className="text-gray-500 gap-1.5">
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
            {previewing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
            {t('Preview', 'معاينة')}
          </Button>

          <Button type="button" size="sm" onClick={handleGenerate} disabled={generating || previewing} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {generating ? t('Generating…', 'جارٍ التوليد…') : t('Generate', 'توليد')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

