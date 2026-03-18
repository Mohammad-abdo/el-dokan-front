import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  User,
  Store,
  Stethoscope,
  FileText,
  Check,
  X,
  MapPin,
  ClipboardList,
  Target,
  ShoppingCart,
  ListChecks,
  Clock,
  CalendarDays,
  Hash,
  Phone,
  ExternalLink,
  Package,
  FileDown,
} from 'lucide-react';
import { format } from 'date-fns';
import showToast from '@/lib/toast';

const statusConfig = {
  pending: { ar: 'قيد الانتظار', en: 'Pending', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  approved: { ar: 'موافق عليه', en: 'Approved', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  rejected: { ar: 'مرفوض', en: 'Rejected', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  completed: { ar: 'مكتملة', en: 'Completed', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
};

// مكون صف تفصيل موحد
function DetailRow({ label, value, icon: Icon }) {
  return (
    <div className="flex gap-3 py-3 first:pt-0 last:pb-0 border-b border-border/60 last:border-0">
      {Icon && <Icon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-foreground break-words">{value || '—'}</p>
      </div>
    </div>
  );
}

// قسم بعنوان
function SectionBlock({ title, description, children, className = '' }) {
  return (
    <div className={className}>
      {title && <h3 className="text-sm font-semibold text-foreground mb-0.5">{title}</h3>}
      {description && <p className="text-xs text-muted-foreground mb-3">{description}</p>}
      {children}
    </div>
  );
}

export default function AdminVisitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchVisit();
  }, [id]);

  const fetchVisit = async () => {
    try {
      const res = await api.get(`/admin/visits/${id}`);
      setVisit(res.data?.data || res.data);
    } catch (err) {
      console.error(err);
      showToast.error(language === 'ar' ? 'فشل تحميل الزيارة' : 'Failed to load visit');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await api.post(`/admin/visits/${id}/approve`);
      showToast.success(language === 'ar' ? 'تمت الموافقة على الزيارة' : 'Visit approved');
      fetchVisit();
    } catch (err) {
      showToast.error(err.response?.data?.message || (language === 'ar' ? 'فشل' : 'Failed'));
    }
  };

  const handleReject = async () => {
    try {
      await api.post(`/admin/visits/${id}/reject`, { rejection_reason: rejectReason || null });
      showToast.success(language === 'ar' ? 'تم رفض الزيارة' : 'Visit rejected');
      setShowRejectDialog(false);
      setRejectReason('');
      fetchVisit();
    } catch (err) {
      showToast.error(err.response?.data?.message || (language === 'ar' ? 'فشل' : 'Failed'));
    }
  };

  const handleExportPDF = () => {
    if (!visit) return;
    const ar = language === 'ar';
    const repName = visit.representative?.user?.username || visit.representative?.user?.email || visit.representative?.territory || '—';
    const shopName = ar ? (visit.shop?.name_ar || visit.shop?.name) : (visit.shop?.name_en || visit.shop?.name) || '—';
    const doctorName = ar ? (visit.doctor?.name_ar || visit.doctor?.name) : (visit.doctor?.name_en || visit.doctor?.name) || '—';
    const statusLabel = ar ? (statusConfig[visit.status]?.ar || visit.status) : (statusConfig[visit.status]?.en || visit.status);
    const orders = visit.company_orders || visit.companyOrders || [];
    const totalSales = orders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
    const dateStr = visit.visit_date ? format(new Date(visit.visit_date), 'yyyy-MM-dd') : '—';
    const timeStr = visit.visit_time || '—';

    const rows = (label, value) => `<tr><td style="padding:6px 12px;border:1px solid #e5e7eb;font-weight:600;width:180px;">${label}</td><td style="padding:6px 12px;border:1px solid #e5e7eb;">${value || '—'}</td></tr>`;
    let ordersHtml = '';
    orders.forEach((o) => {
      const cust = o.customer;
      const name = cust ? (ar ? (cust.name_ar || cust.name) : (cust.name_en || cust.name)) : (o.customer_shop?.name || o.customerShop?.name || o.customer_doctor?.name || o.customerDoctor?.name) || '—';
      ordersHtml += `<tr><td style="padding:6px;border:1px solid #e5e7eb;">${o.order_number || '#' + o.id}</td><td style="padding:6px;border:1px solid #e5e7eb;">${name}</td><td style="padding:6px;border:1px solid #e5e7eb;">${o.status}</td><td style="padding:6px;border:1px solid #e5e7eb;">${parseFloat(o.total_amount || 0).toFixed(2)}</td></tr>`;
    });

    const html = `
<!DOCTYPE html>
<html dir="${ar ? 'rtl' : 'ltr'}" lang="${ar ? 'ar' : 'en'}">
<head>
  <meta charset="utf-8">
  <title>${ar ? 'تفاصيل الزيارة' : 'Visit Details'} #${visit.id}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; margin: 24px; color: #111; line-height: 1.5; }
    h1 { font-size: 22px; color: #059669; border-bottom: 2px solid #059669; padding-bottom: 8px; margin-bottom: 20px; }
    h2 { font-size: 16px; color: #374151; margin-top: 24px; margin-bottom: 10px; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    th { background: #f3f4f6; padding: 8px 12px; text-align: ${ar ? 'right' : 'left'}; border: 1px solid #e5e7eb; }
    .section { margin-bottom: 24px; }
    .muted { color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <h1>${ar ? 'تفاصيل الزيارة' : 'Visit Details'} #${visit.id}</h1>

  <div class="section">
    <h2>${ar ? 'معلومات أساسية' : 'Basic info'}</h2>
    <table>
      ${rows(ar ? 'رقم الزيارة' : 'Visit #', visit.id)}
      ${rows(ar ? 'التاريخ' : 'Date', dateStr)}
      ${rows(ar ? 'الوقت' : 'Time', timeStr)}
      ${rows(ar ? 'الحالة' : 'Status', statusLabel)}
      ${rows(ar ? 'المندوب' : 'Representative', repName)}
      ${rows(ar ? 'المتجر / الشركة' : 'Shop / Company', shopName)}
      ${rows(ar ? 'الطبيب' : 'Doctor', doctorName)}
    </table>
  </div>

  <div class="section">
    <h2>${ar ? 'هدف الزيارة والغرض' : 'Purpose'}</h2>
    <p style="white-space:pre-wrap;padding:12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">${(visit.purpose || '—').replace(/</g, '&lt;')}</p>
  </div>

  <div class="section">
    <h2>${ar ? 'الملاحظات' : 'Notes'}</h2>
    <p style="white-space:pre-wrap;padding:12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">${(visit.notes || '—').replace(/</g, '&lt;')}</p>
  </div>

  ${visit.status === 'rejected' && visit.rejection_reason ? `<div class="section"><h2>${ar ? 'سبب الرفض' : 'Rejection reason'}</h2><p style="color:#b91c1c;">${visit.rejection_reason.replace(/</g, '&lt;')}</p></div>` : ''}

  <div class="section">
    <h2>${ar ? 'المبيعات من الزيارة' : 'Sales from visit'}</h2>
    <p><strong>${ar ? 'عدد الطلبات' : 'Orders'}:</strong> ${orders.length} &nbsp;|&nbsp; <strong>${ar ? 'الإجمالي' : 'Total'}:</strong> ${totalSales.toFixed(2)}</p>
    ${orders.length > 0 ? `<table><thead><tr><th>${ar ? 'رقم الطلب' : 'Order'}</th><th>${ar ? 'العميل' : 'Customer'}</th><th>${ar ? 'الحالة' : 'Status'}</th><th>${ar ? 'المبلغ' : 'Amount'}</th></tr></thead><tbody>${ordersHtml}</tbody></table>` : ''}
  </div>

  <p class="muted" style="margin-top:32px;">${ar ? 'تم الإنشاء' : 'Generated'} ${format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
</body>
</html>`;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-full rounded-xl" />
        <div className="flex gap-6">
          <Skeleton className="h-[400px] w-48 rounded-xl shrink-0" />
          <Skeleton className="h-[400px] flex-1 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{language === 'ar' ? 'الزيارة غير موجودة' : 'Visit not found'}</p>
        <Button onClick={() => navigate('/admin/visits')} className="mt-4">
          {language === 'ar' ? 'رجوع' : 'Back'}
        </Button>
      </div>
    );
  }

  const isRTL = language === 'ar';
  const statusInfo = statusConfig[visit.status] || statusConfig.pending;
  const orders = visit.company_orders || visit.companyOrders || [];
  const totalSales = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

  const visitDateFormatted = visit.visit_date ? format(new Date(visit.visit_date), 'yyyy-MM-dd') : '—';
  const visitTimeFormatted = visit.visit_time || '—';
  const createdAtFormatted = visit.created_at ? format(new Date(visit.created_at), 'yyyy-MM-dd HH:mm') : '—';
  const updatedAtFormatted = visit.updated_at ? format(new Date(visit.updated_at), 'yyyy-MM-dd HH:mm') : '—';

  const tabTriggers = [
    { value: 'overview', labelAr: 'نظرة عامة', labelEn: 'Overview', Icon: FileText },
    { value: 'where', labelAr: 'مكان الزيارة', labelEn: 'Visit location', Icon: MapPin },
    { value: 'what', labelAr: 'نشاط الزيارة', labelEn: 'Visit activity', Icon: ClipboardList },
    { value: 'achieved', labelAr: 'الإنجازات', labelEn: 'Achievements', Icon: Target },
    { value: 'sales', labelAr: 'المبيعات', labelEn: 'Sales', Icon: ShoppingCart },
    { value: 'outcomes', labelAr: 'مخرجات الزيارة', labelEn: 'Visit outcomes', Icon: ListChecks },
  ];

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* شريط علوي: رجوع + عنوان + أزرار */}
      <div className={`flex items-center justify-between flex-wrap gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button variant="ghost" onClick={() => navigate('/admin/visits')} className="gap-2 shrink-0">
            <ArrowLeft className="w-4 h-4" />
            {language === 'ar' ? 'رجوع' : 'Back'}
          </Button>
          <div className={isRTL ? 'text-right' : ''}>
            <h1 className="text-xl font-bold tracking-tight">
              {language === 'ar' ? 'تفاصيل الزيارة' : 'Visit Details'}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {language === 'ar' ? 'عرض كامل لجميع التفاصيل والنتائج المرتبطة بالزيارة' : 'Full view of all details and outcomes linked to the visit'}
            </p>
          </div>
        </div>
        <div className={`flex gap-2 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportPDF}>
            <FileDown className="w-4 h-4" />
            {language === 'ar' ? 'تحميل PDF' : 'Download PDF'}
          </Button>
          {visit.status === 'pending' && (
            <>
              <Button variant="outline" size="sm" className="gap-2 text-green-600 border-green-200 hover:bg-green-50" onClick={handleApprove}>
                <Check className="w-4 h-4" />
                {language === 'ar' ? 'موافقة' : 'Approve'}
              </Button>
              <Button variant="outline" size="sm" className="gap-2 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setShowRejectDialog(true)}>
                <X className="w-4 h-4" />
                {language === 'ar' ? 'رفض' : 'Reject'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* شريط معلومات الزيارة السريعة */}
      <Card className="rounded-xl border-2 bg-muted/30">
        <CardContent className="py-4 px-6">
          <div className={`flex flex-wrap items-center gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{language === 'ar' ? 'رقم الزيارة' : 'Visit #'}</span>
              <span className="font-semibold">{visit.id}</span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{visitDateFormatted}</span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{visitTimeFormatted}</span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <Badge variant="secondary" className={statusInfo.className}>
              {language === 'ar' ? statusInfo.ar : statusInfo.en}
            </Badge>
            {orders.length > 0 && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <span className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'طلبات' : 'Orders'}: <span className="font-semibold text-foreground">{orders.length}</span>
                  {' · '}
                  {language === 'ar' ? 'إجمالي' : 'Total'}: <span className="font-semibold text-foreground">{totalSales.toFixed(2)}</span>
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* تابات أفقية من اليمين في الأعلى */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList
          className={`w-full h-auto flex flex-wrap p-2 rounded-xl bg-muted/50 border gap-1 ${isRTL ? 'justify-start' : 'justify-end'}`}
        >
          {tabTriggers.map(({ value, labelAr, labelEn, Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="gap-2 rounded-lg py-2.5 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-sm">{language === 'ar' ? labelAr : labelEn}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* محتوى التابات */}
        <div className="mt-4 w-full">
            <TabsContent value="overview" className="mt-0">
              <Card className="rounded-xl border-2">
                <CardHeader>
                  <CardTitle className="text-base">{language === 'ar' ? 'ملخص الزيارة' : 'Visit summary'}</CardTitle>
                  <CardDescription>
                    {language === 'ar' ? 'الغرض، الحالة، والأطراف المرتبطة' : 'Purpose, status and related parties'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <SectionBlock
                    title={language === 'ar' ? 'هدف الزيارة والغرض' : 'Visit goal and purpose'}
                    description={language === 'ar' ? 'الغرض المعلن من الزيارة' : 'Stated purpose of the visit'}
                  >
                    <p className="text-sm leading-relaxed bg-muted/40 rounded-lg p-4">{visit.purpose || '—'}</p>
                  </SectionBlock>
                  <Separator />
                  <SectionBlock
                    title={language === 'ar' ? 'التوقيت والسجلات' : 'Timing and records'}
                    description={language === 'ar' ? 'تواريخ إنشاء وتحديث السجل' : 'Record creation and update times'}
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <DetailRow label={language === 'ar' ? 'تاريخ ووقت الزيارة' : 'Visit date & time'} value={`${visitDateFormatted} ${visitTimeFormatted}`} icon={Clock} />
                      <DetailRow label={language === 'ar' ? 'تاريخ الإنشاء' : 'Created at'} value={createdAtFormatted} icon={CalendarDays} />
                      <DetailRow label={language === 'ar' ? 'آخر تحديث' : 'Updated at'} value={updatedAtFormatted} icon={CalendarDays} />
                      <DetailRow label={language === 'ar' ? 'الحالة' : 'Status'} value={language === 'ar' ? statusInfo.ar : statusInfo.en} icon={FileText} />
                    </div>
                  </SectionBlock>
                  {visit.status === 'rejected' && visit.rejection_reason && (
                    <>
                      <Separator />
                      <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-4">
                        <p className="text-xs font-medium uppercase tracking-wider text-red-700 dark:text-red-400 mb-1">{language === 'ar' ? 'سبب الرفض' : 'Rejection reason'}</p>
                        <p className="text-sm text-red-800 dark:text-red-300">{visit.rejection_reason}</p>
                      </div>
                    </>
                  )}
                  <Separator />
                  <SectionBlock
                    title={language === 'ar' ? 'مقدمو الخدمة المرتبطون' : 'Related service providers'}
                    description={language === 'ar' ? 'المندوب، المتجر/الشركة، الطبيب' : 'Representative, shop/company, doctor'}
                  >
                    <div className="space-y-3">
                      {visit.representative && (
                        <div className={`flex items-center justify-between p-4 rounded-xl border bg-card ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <User className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">{language === 'ar' ? 'المندوب' : 'Representative'}</p>
                              <p className="font-medium">{visit.representative?.user?.username || visit.representative?.user?.email || visit.representative?.territory || '—'}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate(`/admin/representatives/${visit.representative.id}`)}>
                            <ExternalLink className="w-3.5 h-3.5" />
                            {language === 'ar' ? 'عرض' : 'View'}
                          </Button>
                        </div>
                      )}
                      {visit.shop && (
                        <div className={`flex items-center justify-between p-4 rounded-xl border bg-card ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <Store className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">{language === 'ar' ? 'المتجر / الشركة' : 'Shop / Company'}</p>
                              <p className="font-medium">{language === 'ar' ? (visit.shop?.name_ar || visit.shop?.name) : (visit.shop?.name_en || visit.shop?.name)}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate(`/admin/shops/${visit.shop.id}`)}>
                            <ExternalLink className="w-3.5 h-3.5" />
                            {language === 'ar' ? 'عرض' : 'View'}
                          </Button>
                        </div>
                      )}
                      {visit.doctor && (
                        <div className={`flex items-center justify-between p-4 rounded-xl border bg-card ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <Stethoscope className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">{language === 'ar' ? 'الطبيب' : 'Doctor'}</p>
                              <p className="font-medium">{language === 'ar' ? (visit.doctor?.name_ar || visit.doctor?.name) : (visit.doctor?.name_en || visit.doctor?.name)}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate(`/admin/doctors/${visit.doctor.id}`)}>
                            <ExternalLink className="w-3.5 h-3.5" />
                            {language === 'ar' ? 'عرض' : 'View'}
                          </Button>
                        </div>
                      )}
                      {!visit.representative && !visit.shop && !visit.doctor && (
                        <p className="text-muted-foreground text-sm py-4">{language === 'ar' ? 'لا توجد بيانات مرتبطة' : 'No related data'}</p>
                      )}
                    </div>
                  </SectionBlock>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="where" className="mt-0">
              <Card className="rounded-xl border-2">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {language === 'ar' ? 'مكان الزيارة' : 'Visit location'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'ar' ? 'تفاصيل دقيقة: التاريخ، الوقت، المتجر/الشركة، الطبيب، والعناوين' : 'Exact details: date, time, shop/company, doctor, and addresses'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <SectionBlock
                    title={language === 'ar' ? 'وقت وميعاد الزيارة' : 'Visit date and time'}
                    description={language === 'ar' ? 'التاريخ والوقت المحددين للزيارة' : 'Scheduled date and time for the visit'}
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <DetailRow label={language === 'ar' ? 'التاريخ' : 'Date'} value={visitDateFormatted} icon={CalendarDays} />
                      <DetailRow label={language === 'ar' ? 'الوقت' : 'Time'} value={visitTimeFormatted} icon={Clock} />
                    </div>
                  </SectionBlock>
                  <Separator />
                  {visit.shop && (
                    <SectionBlock
                      title={language === 'ar' ? 'المتجر / الشركة (مكان الزيارة)' : 'Shop / Company (visit location)'}
                      description={language === 'ar' ? 'الاسم والعنوان ووسائل التواصل' : 'Name, address and contact'}
                    >
                      <div className="rounded-xl border bg-muted/20 p-5 space-y-4">
                        <DetailRow label={language === 'ar' ? 'الاسم' : 'Name'} value={language === 'ar' ? (visit.shop?.name_ar || visit.shop?.name) : (visit.shop?.name_en || visit.shop?.name)} icon={Store} />
                        {visit.shop?.address && <DetailRow label={language === 'ar' ? 'العنوان' : 'Address'} value={visit.shop.address} icon={MapPin} />}
                        {visit.shop?.phone && <DetailRow label={language === 'ar' ? 'الهاتف' : 'Phone'} value={visit.shop.phone} icon={Phone} />}
                        <Button variant="outline" size="sm" onClick={() => navigate(`/admin/shops/${visit.shop.id}`)} className="gap-2">
                          <ExternalLink className="w-4 h-4" />
                          {language === 'ar' ? 'عرض تفاصيل المتجر' : 'View shop details'}
                        </Button>
                      </div>
                    </SectionBlock>
                  )}
                  {visit.doctor && (
                    <SectionBlock
                      title={language === 'ar' ? 'الطبيب (إن وُجد)' : 'Doctor (if applicable)'}
                      description={language === 'ar' ? 'اسم الطبيب وموقعه' : 'Doctor name and location'}
                    >
                      <div className="rounded-xl border bg-muted/20 p-5 space-y-4">
                        <DetailRow
                          label={language === 'ar' ? 'الاسم' : 'Name'}
                          value={language === 'ar' ? (visit.doctor?.name_ar || visit.doctor?.name) : (visit.doctor?.name_en || visit.doctor?.name)}
                          icon={Stethoscope}
                        />
                        {(visit.doctor?.location || visit.doctor?.location_ar || visit.doctor?.location_en) && (
                          <DetailRow
                            label={language === 'ar' ? 'الموقع / العيادة' : 'Location / Clinic'}
                            value={language === 'ar' ? (visit.doctor?.location_ar || visit.doctor?.location) : (visit.doctor?.location_en || visit.doctor?.location)}
                            icon={MapPin}
                          />
                        )}
                        <Button variant="outline" size="sm" onClick={() => navigate(`/admin/doctors/${visit.doctor.id}`)} className="gap-2">
                          <ExternalLink className="w-4 h-4" />
                          {language === 'ar' ? 'عرض تفاصيل الطبيب' : 'View doctor details'}
                        </Button>
                      </div>
                    </SectionBlock>
                  )}
                  {!visit.shop && !visit.doctor && (
                    <p className="text-muted-foreground text-sm py-4">{language === 'ar' ? 'لا يوجد متجر أو طبيب مرتبط بالزيارة' : 'No shop or doctor linked to this visit'}</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="what" className="mt-0">
              <Card className="rounded-xl border-2">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    {language === 'ar' ? 'نشاط الزيارة' : 'Visit activity'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'ar' ? 'الغرض، الهدف، الملاحظات، والمرفقات المسجلة' : 'Purpose, goal, notes and recorded attachments'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <SectionBlock
                    title={language === 'ar' ? 'هدف الزيارة والغرض' : 'Visit goal and purpose'}
                    description={language === 'ar' ? 'ما المطلوب إنجازه من هذه الزيارة' : 'What was to be accomplished in this visit'}
                  >
                    <p className="text-sm leading-relaxed bg-muted/40 rounded-xl p-5 whitespace-pre-wrap">{visit.purpose || '—'}</p>
                  </SectionBlock>
                  <Separator />
                  <SectionBlock
                    title={language === 'ar' ? 'الملاحظات (ما تم تنفيذه)' : 'Notes (what was done)'}
                    description={language === 'ar' ? 'تفاصيل إضافية أو ملخص ما تم خلال الزيارة' : 'Additional details or summary of what was done during the visit'}
                  >
                    <p className="text-sm leading-relaxed bg-muted/30 rounded-xl p-5 whitespace-pre-wrap border">{visit.notes || (language === 'ar' ? 'لا توجد ملاحظات' : 'No notes')}</p>
                  </SectionBlock>
                  {visit.files && Array.isArray(visit.files) && visit.files.length > 0 && (
                    <>
                      <Separator />
                      <SectionBlock
                        title={language === 'ar' ? 'المرفقات' : 'Attachments'}
                        description={language === 'ar' ? 'ملفات مرفقة بالزيارة' : 'Files attached to the visit'}
                      >
                        <ul className="space-y-2">
                          {visit.files.map((f, i) => (
                            <li key={i}>
                              <a
                                href={typeof f === 'string' ? f : (f?.url || f?.path)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-primary hover:underline rounded-lg p-3 border bg-muted/20"
                              >
                                <ExternalLink className="w-4 h-4 shrink-0" />
                                {typeof f === 'string' ? f : (f?.name || f?.url || f?.path)}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </SectionBlock>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="achieved" className="mt-0">
              <Card className="rounded-xl border-2">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    {language === 'ar' ? 'الإنجازات' : 'Achievements'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'ar' ? 'حالة الزيارة، تأكيد الطبيب، وما تم تحقيقه فعلياً' : 'Visit status, doctor confirmation and what was actually achieved'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <SectionBlock
                    title={language === 'ar' ? 'حالة الزيارة' : 'Visit status'}
                    description={language === 'ar' ? 'الحالة الحالية للموافقة/الرفض' : 'Current approval/rejection status'}
                  >
                    <Badge variant="secondary" className={`text-sm px-3 py-1 ${statusInfo.className}`}>
                      {language === 'ar' ? statusInfo.ar : statusInfo.en}
                    </Badge>
                  </SectionBlock>
                  {visit.doctor_confirmed_at && (
                    <>
                      <Separator />
                      <SectionBlock
                        title={language === 'ar' ? 'تأكيد الطبيب' : 'Doctor confirmation'}
                        description={language === 'ar' ? 'تاريخ ووقت تأكيد الطبيب للزيارة' : 'Date and time of doctor confirmation'}
                      >
                        <DetailRow
                          label={language === 'ar' ? 'تم التأكيد في' : 'Confirmed at'}
                          value={format(new Date(visit.doctor_confirmed_at), 'yyyy-MM-dd HH:mm')}
                          icon={Clock}
                        />
                      </SectionBlock>
                    </>
                  )}
                  <Separator />
                  <SectionBlock
                    title={language === 'ar' ? 'ما تم تحقيقه (من الملاحظات)' : 'What was achieved (from notes)'}
                    description={language === 'ar' ? 'ملخص الإنجازات المسجلة في ملاحظات الزيارة' : 'Summary of achievements recorded in visit notes'}
                  >
                    <p className="text-sm leading-relaxed bg-muted/30 rounded-xl p-5 whitespace-pre-wrap border">{visit.notes || (language === 'ar' ? 'لا توجد تفاصيل' : 'No details')}</p>
                  </SectionBlock>
                  {visit.status === 'rejected' && visit.rejection_reason && (
                    <>
                      <Separator />
                      <div className="rounded-xl border-2 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400 mb-2">{language === 'ar' ? 'سبب الرفض' : 'Rejection reason'}</p>
                        <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">{visit.rejection_reason}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sales" className="mt-0">
              <Card className="rounded-xl border-2">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    {language === 'ar' ? 'المبيعات' : 'Sales'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'ar' ? 'تفاصيل دقيقة لجميع الطلبات والمبالغ المرتبطة بهذه الزيارة' : 'Exact details of all orders and amounts linked to this visit'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="rounded-xl border-2 bg-muted/30 p-4 text-center">
                      <p className="text-xs font-medium uppercase text-muted-foreground">{language === 'ar' ? 'عدد الطلبات' : 'Orders count'}</p>
                      <p className="text-2xl font-bold mt-1">{orders.length}</p>
                    </div>
                    <div className="rounded-xl border-2 bg-muted/30 p-4 text-center">
                      <p className="text-xs font-medium uppercase text-muted-foreground">{language === 'ar' ? 'إجمالي المبيعات' : 'Total sales'}</p>
                      <p className="text-2xl font-bold mt-1">{totalSales.toFixed(2)}</p>
                    </div>
                  </div>
                  {orders.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{language === 'ar' ? 'لا توجد مبيعات مرتبطة بهذه الزيارة' : 'No sales linked to this visit'}</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <h3 className="text-sm font-semibold">{language === 'ar' ? 'تفاصيل الطلبات' : 'Order details'}</h3>
                      {orders.map((order) => {
                        const customer = order.customer;
                        const customerName = customer
                          ? (language === 'ar' ? (customer.name_ar || customer.name) : (customer.name_en || customer.name))
                          : (order.customer_type === 'shop' ? (order.customer_shop?.name || order.customerShop?.name) : (order.customer_doctor?.name || order.customerDoctor?.name)) || '—';
                        const items = order.items || [];
                        return (
                          <div key={order.id} className="rounded-xl border-2 bg-card overflow-hidden">
                            <div className="p-4 border-b bg-muted/20 flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold">{order.order_number || `#${order.id}`}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {language === 'ar' ? 'العميل' : 'Customer'}: {customerName}
                                </p>
                                {order.ordered_at && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(order.ordered_at), 'yyyy-MM-dd HH:mm')}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant="secondary">{order.status}</Badge>
                                <span className="text-lg font-bold">{parseFloat(order.total_amount || 0).toFixed(2)}</span>
                              </div>
                            </div>
                            {items.length > 0 && (
                              <div className="p-4">
                                <p className="text-xs font-medium uppercase text-muted-foreground mb-3">{language === 'ar' ? 'البنود' : 'Items'}</p>
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b text-muted-foreground text-left">
                                      <th className="py-2 font-medium">{language === 'ar' ? 'المنتج' : 'Product'}</th>
                                      <th className="py-2 font-medium text-center">{language === 'ar' ? 'الكمية' : 'Qty'}</th>
                                      <th className="py-2 font-medium text-center">{language === 'ar' ? 'السعر' : 'Price'}</th>
                                      <th className="py-2 font-medium text-end">{language === 'ar' ? 'الإجمالي' : 'Total'}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {items.map((item) => {
                                      const name = language === 'ar' ? (item.company_product?.name_ar || item.companyProduct?.name_ar || item.company_product?.name) : (item.company_product?.name_en || item.companyProduct?.name_en || item.company_product?.name);
                                      return (
                                        <tr key={item.id} className="border-b last:border-0">
                                          <td className="py-2">{name || '—'}</td>
                                          <td className="py-2 text-center">{item.quantity}</td>
                                          <td className="py-2 text-center">{parseFloat(item.unit_price || 0).toFixed(2)}</td>
                                          <td className="py-2 text-end font-medium">{parseFloat(item.total_price || 0).toFixed(2)}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="outcomes" className="mt-0">
              <Card className="rounded-xl border-2">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ListChecks className="w-5 h-5" />
                    {language === 'ar' ? 'مخرجات الزيارة' : 'Visit outcomes'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'ar' ? 'ملخص كامل للطلبات والنتائج المترتبة على الزيارة' : 'Full summary of orders and outcomes from the visit'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <SectionBlock
                    title={language === 'ar' ? 'ملخص النتائج' : 'Outcomes summary'}
                    description={language === 'ar' ? 'أرقام وحقائق مرتبطة بنتائج الزيارة' : 'Numbers and facts linked to visit outcomes'}
                  >
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-xl border-2 p-5 bg-muted/20">
                        <p className="text-xs font-medium uppercase text-muted-foreground">{language === 'ar' ? 'عدد الطلبات الناتجة' : 'Resulting orders'}</p>
                        <p className="text-2xl font-bold mt-1">{orders.length}</p>
                      </div>
                      <div className="rounded-xl border-2 p-5 bg-muted/20">
                        <p className="text-xs font-medium uppercase text-muted-foreground">{language === 'ar' ? 'إجمالي قيمة الطلبات' : 'Total order value'}</p>
                        <p className="text-2xl font-bold mt-1">{totalSales.toFixed(2)}</p>
                      </div>
                      <div className="rounded-xl border-2 p-5 bg-muted/20 flex flex-col justify-center">
                        <p className="text-xs font-medium uppercase text-muted-foreground">{language === 'ar' ? 'حالة الزيارة' : 'Visit status'}</p>
                        <Badge variant="secondary" className={`mt-2 w-fit ${statusInfo.className}`}>
                          {language === 'ar' ? statusInfo.ar : statusInfo.en}
                        </Badge>
                      </div>
                    </div>
                  </SectionBlock>
                  <Separator />
                  <SectionBlock
                    title={language === 'ar' ? 'تفاصيل النتائج' : 'Outcome details'}
                    description={language === 'ar' ? 'وصف ما نجم عن الزيارة' : 'Description of what resulted from the visit'}
                  >
                    {orders.length > 0 ? (
                      <div className="rounded-xl border bg-muted/20 p-5 space-y-2">
                        <p className="text-sm leading-relaxed">
                          {language === 'ar'
                            ? `نتج عن هذه الزيارة عدد ${orders.length} طلباً بإجمالي مالي ${totalSales.toFixed(2)}. الطلبات مرتبطة بنفس الزيارة والمندوب وتُظهر حجم التحقيق من الزيارة.`
                            : `This visit resulted in ${orders.length} order(s) with a total value of ${totalSales.toFixed(2)}. Orders are linked to the same visit and representative, showing the outcome of the visit.`}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4">
                        {language === 'ar' ? 'لم ينتج عن الزيارة أي طلبات مسجلة حتى الآن.' : 'No orders have been recorded as resulting from this visit yet.'}
                      </p>
                    )}
                  </SectionBlock>
                </CardContent>
              </Card>
            </TabsContent>
        </div>
      </Tabs>

      {showRejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowRejectDialog(false)}>
          <div className="bg-background rounded-xl shadow-lg p-6 max-w-md w-full mx-4 border-2" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-2">{language === 'ar' ? 'سبب الرفض (اختياري)' : 'Rejection reason (optional)'}</h3>
            <textarea
              className="w-full min-h-[100px] rounded-lg border p-3 text-sm"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={language === 'ar' ? 'أدخل سبب الرفض إن أردت' : 'Enter rejection reason if needed'}
            />
            <div className={`flex gap-2 mt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
              <Button variant="destructive" onClick={handleReject}>{language === 'ar' ? 'رفض' : 'Reject'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
