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

// ─── Section definitions ──────────────────────────────────────────────────────
const SECTIONS = [
  { key: 'schedule',        label: 'Schedule & Pricing', icon: Calendar },
  { key: 'prescriptions',   label: 'Prescriptions',      icon: ClipboardList },
  { key: 'bookings',        label: 'Bookings',            icon: TrendingUp },
  { key: 'patients',        label: 'Patients',            icon: Users },
  { key: 'wallet',          label: 'Wallet & Revenue',    icon: Wallet },
  { key: 'visits',          label: 'Visits',              icon: MapPin },
  { key: 'treatments',      label: 'Treatments',          icon: Pill },
  { key: 'medical_centers', label: 'Medical Centers',     icon: Building2 },
  { key: 'ratings',         label: 'Ratings & Reviews',   icon: Stethoscope },
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
function PreviewCard({ data }) {
  if (!data) return null;
  const kpis   = data.kpis   ?? {};
  const doctor = data.doctor ?? {};

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-semibold text-blue-800">Report Preview</span>
        <span className="text-xs text-blue-600 ml-auto">
          {data.period?.from} → {data.period?.to}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: 'Bookings',      value: kpis.bookings_this_month   ?? 0 },
          { label: 'Prescriptions', value: kpis.total_prescriptions   ?? 0 },
          { label: 'Purchase Rate', value: `${kpis.prescription_purchase_rate ?? 0}%` },
          { label: 'Revenue',       value: `EGP ${Number(kpis.completed_revenue ?? 0).toLocaleString()}` },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-md p-2.5 border border-blue-100 text-center">
            <div className="text-base font-bold text-blue-700">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-blue-700">
        <span>&#9733; {doctor.rating ?? '0.00'} rating</span>
        <span>&bull; {doctor.specialty ?? '-'}</span>
        <span>&bull; {Object.keys(data.sections ?? {}).length} sections</span>
      </div>
    </div>
  );
}

// ─── Doctor selector (used when no doctor is pre-selected) ───────────────────
function DoctorSelector({ value, onChange }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/doctors')
      .then((res) => setDoctors(extractDataFromResponse(res)))
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false));
  }, []);

  const getDoctorLabel = (d) =>
    d.name || d.fullName || d.user?.name || d.user?.username || `Doctor #${d.id}`;

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Select Doctor
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
        >
          <option value="">{loading ? 'Loading doctors…' : '— Select a doctor —'}</option>
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
  } = useGenerateReport();

  // When no doctor is pre-selected the user picks one inside the modal
  const [pickedDoctorId, setPickedDoctorId] = useState('');
  const [pickerError, setPickerError] = useState('');

  // Resolve the effective doctor ID
  const effectiveDoctorId = doctor?.id ?? (pickedDoctorId ? Number(pickedDoctorId) : null);
  const doctorName =
    doctor?.name || doctor?.user?.name || doctor?.fullName ||
    (pickedDoctorId ? 'Selected Doctor' : 'Doctor');

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
      setPickerError('Please select a doctor first.');
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-full">

        {/* ── Header ── */}
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Stethoscope className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-lg">Generate Doctor Report</DialogTitle>
              <DialogDescription className="text-sm">
                {doctor ? doctorName : 'PDF or Excel export with full data'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ── Body ── */}
        <div className="space-y-5 py-1">

          {/* Doctor picker — only when no doctor is pre-selected */}
          {!doctor && (
            <div>
              <DoctorSelector value={pickedDoctorId} onChange={setPickedDoctorId} />
              {pickerError && (
                <p className="text-xs text-red-500 mt-1.5">{pickerError}</p>
              )}
            </div>
          )}

          {/* Report Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Report Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <RadioOption
                id="type-full"
                name="report_type"
                value="full"
                current={reportType}
                onChange={setReportType}
                icon={FileText}
                label="Full Report"
                description="All sections included"
              />
              <RadioOption
                id="type-custom"
                name="report_type"
                value="custom"
                current={reportType}
                onChange={setReportType}
                icon={ClipboardList}
                label="Custom Report"
                description="Select specific sections"
              />
            </div>
          </div>

          {/* Sections (custom only) */}
          {reportType === 'custom' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Sections</label>
                <div className="flex gap-2">
                  <button type="button" onClick={selectAllSections} className="text-xs text-blue-600 hover:underline">All</button>
                  <span className="text-xs text-gray-400">/</span>
                  <button type="button" onClick={clearAllSections} className="text-xs text-gray-500 hover:underline">None</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SECTIONS.map((s) => (
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
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
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
                <label className="block text-xs text-gray-500 mb-1">To</label>
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
              Export Format
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
                description="Professional printable layout"
              />
              <RadioOption
                id="format-excel"
                name="export_format"
                value="excel"
                current={format}
                onChange={setFormat}
                icon={FileSpreadsheet}
                label="Excel"
                description="Multi-sheet spreadsheet"
              />
            </div>
          </div>

          {/* Preview area */}
          {previewing && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading preview…
            </div>
          )}
          {!previewing && previewData && <PreviewCard data={previewData} />}

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
              Reset
            </Button>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
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
            Preview
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
            {generating ? 'Generating…' : 'Generate'}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
