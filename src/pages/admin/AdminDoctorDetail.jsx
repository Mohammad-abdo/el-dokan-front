import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Edit,
  Trash2,
  UserCog,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Star,
  Wallet,
  UserCheck,
  UserX,
  Building2,
  Stethoscope,
  Users,
  BookOpen,
  TrendingUp,
  CalendarDays,
  FileText,
} from 'lucide-react';
import DoctorReportModal from '@/components/reports/DoctorReportModal';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import showToast from '@/lib/toast';
import { showConfirm } from '@/components/ConfirmDialog';
import { extractDataFromResponse } from '@/lib/apiHelper';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const TAB_KEYS = ['overview', 'revenue', 'bookings', 'patients', 'clinic'];

export default function AdminDoctorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [doctor, setDoctor] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [bookingsPagination, setBookingsPagination] = useState({ total: 0, current_page: 1, last_page: 1 });
  const [bookingsStatusFilter, setBookingsStatusFilter] = useState('');
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionsPagination, setPrescriptionsPagination] = useState({ total: 0, current_page: 1, last_page: 1 });
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const isRTL = language === 'ar';

  const t = (en, ar) => (language === 'ar' ? ar : en);

  useEffect(() => {
    if (!id || id === 'create' || id === 'new') {
      setLoading(false);
      return;
    }
    fetchDoctor();
    fetchWallet();
  }, [id]);

  useEffect(() => {
    if (id && (activeTab === 'bookings' || activeTab === 'patients')) {
      fetchBookings();
    }
  }, [id, activeTab, bookingsStatusFilter]);

  useEffect(() => {
    if (id && activeTab === 'visits') {
      fetchVisits();
    }
  }, [id, activeTab]);

  useEffect(() => {
    if (id && activeTab === 'prescriptions') {
      fetchPrescriptions();
    }
  }, [id, activeTab]);

  const fetchDoctor = async () => {
    if (!id || id === 'create' || id === 'new') return;
    try {
      const response = await api.get(`/admin/doctors/${id}`);
      const doctorData = response.data?.data || response.data;
      setDoctor(doctorData);
    } catch (error) {
      console.error('Error fetching doctor:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWallet = async () => {
    if (!id || id === 'create' || id === 'new') return;
    try {
      const response = await api.get(`/admin/doctors/${id}/wallet`);
      setWallet(response.data?.data || extractDataFromResponse(response));
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const fetchBookings = async (page = 1) => {
    if (!id) return;
    setLoadingBookings(true);
    try {
      const params = { per_page: 15, page };
      if (bookingsStatusFilter) params.status = bookingsStatusFilter;
      const response = await api.get(`/admin/doctors/${id}/bookings`, { params });
      const data = response.data?.data ?? extractDataFromResponse(response) ?? [];
      const pagination = response.data?.pagination ?? {};
      setBookings(Array.isArray(data) ? data : []);
      setBookingsPagination({
        total: pagination.total ?? 0,
        current_page: pagination.current_page ?? 1,
        last_page: pagination.last_page ?? 1,
      });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchVisits = async () => {
    if (!id) return;
    setLoadingVisits(true);
    try {
      const response = await api.get('/admin/visits', { params: { doctor_id: id, per_page: 20 } });
      const data = response.data?.data ?? extractDataFromResponse(response) ?? [];
      setVisits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching visits:', error);
      setVisits([]);
    } finally {
      setLoadingVisits(false);
    }
  };

  const fetchPrescriptions = async (page = 1) => {
    if (!id) return;
    setLoadingPrescriptions(true);
    try {
      const response = await api.get(`/admin/doctors/${id}/prescriptions`, { params: { per_page: 15, page } });
      const data = response.data?.data ?? extractDataFromResponse(response) ?? [];
      const pagination = response.data?.pagination ?? {};
      setPrescriptions(Array.isArray(data) ? data : []);
      setPrescriptionsPagination({
        total: pagination.total ?? 0,
        current_page: pagination.current_page ?? 1,
        last_page: pagination.last_page ?? 1,
      });
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      setPrescriptions([]);
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const handleSuspend = async () => {
    showToast.promise(
      (async () => {
        await api.post(`/admin/doctors/${id}/suspend`);
        fetchDoctor();
      })(),
      {
        loading: t('Suspending doctor...', 'جاري تعليق الطبيب...'),
        success: t('Doctor suspended successfully', 'تم تعليق الطبيب بنجاح'),
        error: (err) => err.response?.data?.message || t('Failed to suspend doctor', 'فشل تعليق الطبيب'),
      }
    );
  };

  const handleActivate = async () => {
    showToast.promise(
      (async () => {
        await api.post(`/admin/doctors/${id}/activate`);
        fetchDoctor();
      })(),
      {
        loading: t('Activating doctor...', 'جاري تفعيل الطبيب...'),
        success: t('Doctor activated successfully', 'تم تفعيل الطبيب بنجاح'),
        error: (err) => err.response?.data?.message || t('Failed to activate doctor', 'فشل تفعيل الطبيب'),
      }
    );
  };

  const handleDelete = async () => {
    showConfirm(
      t(
        'Are you sure you want to delete this doctor? This action cannot be undone.',
        'هل أنت متأكد من حذف هذا الطبيب؟ لا يمكن التراجع عن هذا الإجراء.'
      ),
      () => {
        showToast.promise(
          (async () => {
            await api.delete(`/admin/doctors/${id}`);
            navigate('/admin/doctors');
          })(),
          {
            loading: t('Deleting doctor...', 'جاري حذف الطبيب...'),
            success: t('Doctor deleted successfully', 'تم حذف الطبيب بنجاح'),
            error: (err) => err.response?.data?.message || t('Failed to delete doctor', 'فشل حذف الطبيب'),
          }
        );
      }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('Doctor not found', 'الطبيب غير موجود')}</p>
        <Link to="/admin/doctors" className="text-primary mt-4 inline-block">
          {t('Back to Doctors', 'رجوع إلى الأطباء')}
        </Link>
      </div>
    );
  }

  const isActive = doctor.status === 'active' && doctor.is_active !== false;
  const user = doctor.user || {};
  const balance = wallet?.balance ?? doctor.wallet?.balance ?? 0;
  const transactions = wallet?.transactions ?? [];
  const totalEarnings = transactions
    .filter((tr) => ['booking_payment', 'commission'].includes(tr.type) && tr.status === 'completed')
    .reduce((sum, tr) => sum + parseFloat(tr.amount || 0), 0);

  const completedCount = doctor.bookings_completed ?? doctor.bookings?.filter((b) => b.status === 'completed').length ?? 0;
  const cancelledCount = doctor.bookings_cancelled ?? doctor.bookings?.filter((b) => b.status === 'cancelled').length ?? 0;
  const pendingCount = doctor.bookings_pending ?? doctor.bookings?.filter((b) => ['pending', 'confirmed', 'scheduled'].includes(b.status)).length ?? 0;
  const totalBookingsCount = doctor.bookings_count ?? doctor.bookings?.length ?? 0;

  const patientMap = new Map();
  (bookings || []).forEach((b) => {
    const uid = b.user_id || b.user?.id;
    if (!uid) return;
    if (!patientMap.has(uid)) {
      patientMap.set(uid, {
        id: uid,
        name: b.user?.name || b.patient_name || b.user?.email || `#${uid}`,
        email: b.user?.email,
        phone: b.user?.phone,
        bookingsCount: 0,
      });
    }
    patientMap.get(uid).bookingsCount += 1;
  });
  const uniquePatients = Array.from(patientMap.values());

  const medicalCenters = doctor.medicalCenters || [];
  const primaryCenter = doctor.primaryMedicalCenter;

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${isRTL ? 'sm:flex-row-reverse' : ''}`}
      >
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/doctors')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-4">
            {doctor.photo_url ? (
              <img
                src={doctor.photo_url}
                alt={doctor.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Stethoscope className="w-7 h-7 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {doctor.name || doctor.fullName || user.name || t('Doctor', 'طبيب')}
              </h1>
              <p className="text-muted-foreground text-sm">
                {doctor.specialty || doctor.specialty_en || doctor.specialty_ar || '-'} · {doctor.consultation_price != null && `$${Number(doctor.consultation_price).toFixed(2)}`}
              </p>
            </div>
          </div>
        </div>
        <div className={`flex flex-wrap items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button variant="outline" size="sm" onClick={() => navigate(`/admin/doctors/${id}/wallet`)} className="gap-2">
            <Wallet className="w-4 h-4" />
            {t('Wallet', 'المحفظة')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setReportModalOpen(true)} className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50">
            <FileText className="w-4 h-4" />
            {t('Report', 'تقرير')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/admin/doctors/${id}/edit`)} className="gap-2">
            <Edit className="w-4 h-4" />
            {t('Edit', 'تعديل')}
          </Button>
          {isActive ? (
            <Button variant="outline" size="sm" onClick={handleSuspend} className="gap-2 text-orange-600">
              <UserX className="w-4 h-4" />
              {t('Suspend', 'تعليق')}
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleActivate} className="gap-2 text-green-600">
              <UserCheck className="w-4 h-4" />
              {t('Activate', 'تفعيل')}
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-2">
            <Trash2 className="w-4 h-4" />
            {t('Delete', 'حذف')}
          </Button>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`w-full flex flex-wrap h-auto gap-1 p-1 bg-muted/50 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <TabsTrigger value="overview" className="gap-2">
            <UserCog className="w-4 h-4" />
            {t('Overview', 'ملخص')}
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            {t('Revenue', 'الإيرادات')}
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2">
            <Calendar className="w-4 h-4" />
            {t('Clinic Schedule', 'مواعيد العيادة')}
          </TabsTrigger>
          <TabsTrigger value="bookings" className="gap-2">
            <BookOpen className="w-4 h-4" />
            {t('Bookings', 'الحجوزات')}
            {totalBookingsCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {totalBookingsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="gap-2">
            <FileText className="w-4 h-4" />
            {t('Prescriptions', 'الوصفات')}
            {(doctor?.prescriptions_count ?? prescriptionsPagination.total ?? prescriptions.length) > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {doctor?.prescriptions_count ?? prescriptionsPagination.total ?? prescriptions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="patients" className="gap-2">
            <Users className="w-4 h-4" />
            {t('Patients', 'المشتركين')}
          </TabsTrigger>
          <TabsTrigger value="visits" className="gap-2">
            <CalendarDays className="w-4 h-4" />
            {t('Visits', 'الزيارات')}
            {(doctor?.visits_count ?? visits.length) > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{doctor?.visits_count ?? visits.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="clinic" className="gap-2">
            <Building2 className="w-4 h-4" />
            {t('Clinic', 'العيادة')}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Overview */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">{t('Personal Information', 'المعلومات الشخصية')}</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{user.email || doctor.email || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{user.phone || doctor.phone || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{doctor.location || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('Status', 'الحالة')}: </span>
                  <Badge variant={isActive ? 'default' : 'destructive'}>
                    {isActive ? t('Active', 'نشط') : (doctor.status === 'suspended' ? t('Suspended', 'معلق') : t('Inactive', 'غير نشط'))}
                  </Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">{t('Professional', 'المهني')}</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('Specialty', 'التخصص')}: </span>
                  <span>{doctor.specialty || doctor.specialty_en || doctor.specialty_ar || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span>{Number(doctor.rating ?? 0).toFixed(1)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('Consultation', 'الاستشارة')}: </span>
                  <span>${Number(doctor.consultation_price ?? 0).toFixed(2)}</span>
                </div>
                {doctor.consultation_duration && (
                  <div>
                    <span className="text-muted-foreground">{t('Duration', 'المدة')}: </span>
                    <span>{doctor.consultation_duration} {t('min', 'دقيقة')}</span>
                  </div>
                )}
                {(doctor.available_days?.length || doctor.available_hours_start) && (
                  <div className="flex items-center gap-2 pt-2">
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>
                      {doctor.available_days?.join(', ')} · {doctor.available_hours_start || '-'} - {doctor.available_hours_end || '-'}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">{t('Quick Stats', 'إحصائيات سريعة')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{totalBookingsCount}</p>
                  <p className="text-xs text-muted-foreground">{t('Total Bookings', 'إجمالي الحجوزات')}</p>
                </div>
                <div className="rounded-lg bg-green-500/10 p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                  <p className="text-xs text-muted-foreground">{t('Completed', 'تمت')}</p>
                </div>
                <div className="rounded-lg bg-amber-500/10 p-3 text-center">
                  <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground">{t('Pending', 'قيد الانتظار')}</p>
                </div>
                <div className="rounded-lg bg-red-500/10 p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{cancelledCount}</p>
                  <p className="text-xs text-muted-foreground">{t('Cancelled', 'ملغاة')}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-2xl font-bold">{doctor?.prescriptions_count ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{t('Prescriptions', 'الوصفات')}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-2xl font-bold">{doctor?.visits_count ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{t('Visits', 'الزيارات')}</p>
                </div>
                <div className="col-span-2 rounded-lg bg-primary/10 p-3 text-center">
                  <p className="text-2xl font-bold text-primary">${Number(balance).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{t('Wallet Balance', 'رصيد المحفظة')}</p>
                </div>
              </div>
            </Card>
          </div>

          {(doctor.ratings?.length > 0) && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5" />
                {t('Recent Ratings', 'التقييمات الأخيرة')} ({doctor.ratings.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {doctor.ratings.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i <= (r.rating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-muted'}`}
                        />
                      ))}
                      <span className="text-sm">{r.comment || '-'}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {r.created_at && format(new Date(r.created_at), 'dd/MM/yyyy')}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Tab: مواعيد العيادة (المواعيد التي يضيفها الطبيب عند التسجيل) */}
        <TabsContent value="schedule" className="mt-6 space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {t('Clinic Schedule', 'مواعيد العيادة')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {language === 'ar'
                ? 'المواعيد المتاحة التي أضافها الطبيب عند التسجيل أو من صفحة التعديل.'
                : 'Available schedule set by the doctor at registration or in the edit page.'}
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">{t('Available Days', 'أيام العمل')}</h4>
                {doctor?.available_days?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {doctor.available_days.map((day, i) => (
                      <Badge key={i} variant="secondary">{day}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">{t('Not set', 'غير محدد')}</p>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">{t('Working Hours', 'ساعات العمل')}</h4>
                {(doctor?.available_hours_start || doctor?.available_hours_end) ? (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {doctor.available_hours_start ?? '–'} {t('to', 'إلى')} {doctor.available_hours_end ?? '–'}
                    </span>
                  </div>
                ) : (
                  <p className="text-muted-foreground">{t('Not set', 'غير محدد')}</p>
                )}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {t('Consultation duration', 'مدة الاستشارة')}: {doctor?.consultation_duration ? `${doctor.consultation_duration} ${t('min', 'دقيقة')}` : '–'}
              </p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate(`/admin/doctors/${id}/edit`)}>
                {t('Edit schedule', 'تعديل المواعيد')}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Tab: Revenue */}
        <TabsContent value="revenue" className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">{t('Current Balance', 'الرصيد الحالي')}</p>
              <p className="text-3xl font-bold text-green-600 mt-1">${Number(balance).toFixed(2)}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">{t('Total Earnings', 'إجمالي الإيرادات')}</p>
              <p className="text-3xl font-bold mt-1">${totalEarnings.toFixed(2)}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">{t('Completed Bookings', 'الحجوزات المكتملة')}</p>
              <p className="text-3xl font-bold mt-1">{completedCount}</p>
            </Card>
          </div>
          <Card className="p-6">
            <h3 className="font-semibold mb-4">{t('Transactions', 'المعاملات')}</h3>
            {transactions.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t('No transactions yet', 'لا توجد معاملات بعد')}</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('Date', 'التاريخ')}</TableHead>
                      <TableHead>{t('Type', 'النوع')}</TableHead>
                      <TableHead>{t('Amount', 'المبلغ')}</TableHead>
                      <TableHead>{t('Status', 'الحالة')}</TableHead>
                      <TableHead>{t('Description', 'الوصف')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.slice(0, 30).map((tr, idx) => (
                      <TableRow key={tr.id || idx}>
                        <TableCell className="text-sm">
                          {tr.created_at ? format(new Date(tr.created_at), 'dd/MM/yyyy HH:mm') : '-'}
                        </TableCell>
                        <TableCell className="text-sm">{tr.type || '-'}</TableCell>
                        <TableCell className={`font-medium ${parseFloat(tr.amount || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {parseFloat(tr.amount || 0) >= 0 ? '+' : ''}${Number(tr.amount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={tr.status === 'completed' ? 'default' : 'secondary'}>{tr.status || '-'}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{tr.description || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => navigate(`/admin/doctors/${id}/wallet`)}>
                {t('Open Wallet', 'فتح المحفظة')}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Tab: Bookings */}
        <TabsContent value="bookings" className="mt-6 space-y-4">
          <div className={`flex flex-wrap items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="text-sm text-muted-foreground">{t('Status', 'الحالة')}:</span>
            {['', 'completed', 'cancelled', 'pending', 'confirmed', 'scheduled'].map((status) => (
              <Button
                key={status || 'all'}
                variant={bookingsStatusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBookingsStatusFilter(status)}
              >
                {!status ? t('All', 'الكل') : status}
              </Button>
            ))}
          </div>
          <Card className="p-6">
            {loadingBookings ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
              </div>
            ) : bookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t('No bookings found', 'لا توجد حجوزات')}</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>{t('Patient', 'المريض')}</TableHead>
                      <TableHead>{t('Date', 'التاريخ')}</TableHead>
                      <TableHead>{t('Time', 'الوقت')}</TableHead>
                      <TableHead>{t('Amount', 'المبلغ')}</TableHead>
                      <TableHead>{t('Status', 'الحالة')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono text-sm">{b.booking_number || b.id}</TableCell>
                        <TableCell>
                          {b.user?.name || b.patient_name || b.user?.email || `#${b.user_id}`}
                        </TableCell>
                        <TableCell>{b.appointment_date ? format(new Date(b.appointment_date), 'dd/MM/yyyy') : '-'}</TableCell>
                        <TableCell>{b.appointment_time || '-'}</TableCell>
                        <TableCell>${Number(b.total_amount || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              b.status === 'completed'
                                ? 'default'
                                : b.status === 'cancelled'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {b.status || '-'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {bookingsPagination.last_page > 1 && (
              <div className={`flex justify-center gap-2 mt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bookingsPagination.current_page <= 1}
                  onClick={() => fetchBookings(bookingsPagination.current_page - 1)}
                >
                  {t('Previous', 'السابق')}
                </Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  {bookingsPagination.current_page} / {bookingsPagination.last_page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bookingsPagination.current_page >= bookingsPagination.last_page}
                  onClick={() => fetchBookings(bookingsPagination.current_page + 1)}
                >
                  {t('Next', 'التالي')}
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Tab: Prescriptions (الوصفات وما وصفه الطبيب) */}
        <TabsContent value="prescriptions" className="mt-6 space-y-4">
          <Card className="p-6">
            {loadingPrescriptions ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
              </div>
            ) : prescriptions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t('No prescriptions found', 'لا توجد وصفات')}</p>
            ) : (
              <div className="space-y-6">
                {prescriptions.map((rx) => {
                  const items = rx.items || [];
                  const totalAmount = items.reduce((sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 0), 0);
                  return (
                    <div key={rx.id} className="border rounded-lg p-4 bg-muted/30">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div>
                          <span className="font-mono text-sm text-muted-foreground">{rx.prescription_number}</span>
                          <h4 className="font-semibold">{rx.prescription_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {t('Patient', 'المريض')}: {rx.patient_name || rx.patient?.name || '-'}
                            {rx.patient_phone && ` · ${rx.patient_phone}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {rx.created_at ? format(new Date(rx.created_at), 'dd/MM/yyyy HH:mm') : ''}
                            {rx.is_template && (
                              <Badge variant="outline" className="ml-2 text-xs">{t('Template', 'قالب')}</Badge>
                            )}
                          </p>
                        </div>
                        <div className="text-lg font-semibold">${totalAmount.toFixed(2)}</div>
                      </div>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t('Medication', 'الدواء')}</TableHead>
                              <TableHead>{t('Qty', 'الكمية')}</TableHead>
                              <TableHead>{t('Price', 'السعر')}</TableHead>
                              <TableHead>{t('Status', 'الحالة')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-muted-foreground text-center text-sm">
                                  {t('No items', 'لا عناصر')}
                                </TableCell>
                              </TableRow>
                            ) : (
                              items.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell className="font-medium">{item.medication_name}</TableCell>
                                  <TableCell>{item.quantity}</TableCell>
                                  <TableCell>${Number(item.price || 0).toFixed(2)}</TableCell>
                                  <TableCell>
                                    <Badge variant={item.status === 'completed' ? 'default' : item.status === 'in_cart' ? 'secondary' : 'outline'}>
                                      {item.status || 'pending'}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                      {rx.notes && (
                        <p className="text-sm text-muted-foreground mt-2 pt-2 border-t">{t('Notes', 'ملاحظات')}: {rx.notes}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {prescriptionsPagination.last_page > 1 && (
              <div className={`flex justify-center gap-2 mt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={prescriptionsPagination.current_page <= 1}
                  onClick={() => fetchPrescriptions(prescriptionsPagination.current_page - 1)}
                >
                  {t('Previous', 'السابق')}
                </Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  {prescriptionsPagination.current_page} / {prescriptionsPagination.last_page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={prescriptionsPagination.current_page >= prescriptionsPagination.last_page}
                  onClick={() => fetchPrescriptions(prescriptionsPagination.current_page + 1)}
                >
                  {t('Next', 'التالي')}
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Tab: Patients */}
        <TabsContent value="patients" className="mt-6">
          <Card className="p-6">
            {loadingBookings ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
              </div>
            ) : uniquePatients.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t('No patients yet', 'لا يوجد مرضى بعد')}</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('Name', 'الاسم')}</TableHead>
                      <TableHead>{t('Email', 'البريد')}</TableHead>
                      <TableHead>{t('Phone', 'الهاتف')}</TableHead>
                      <TableHead>{t('Bookings', 'عدد الحجوزات')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uniquePatients.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-muted-foreground">{p.email || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">{p.phone || '-'}</TableCell>
                        <TableCell>{p.bookingsCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Tab: Visits */}
        <TabsContent value="visits" className="mt-6">
          <Card className="p-6">
            {loadingVisits ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
              </div>
            ) : visits.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t('No visits found', 'لا توجد زيارات')}</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>{t('Representative', 'المندوب')}</TableHead>
                      <TableHead>{t('Shop', 'المتجر')}</TableHead>
                      <TableHead>{t('Date', 'التاريخ')}</TableHead>
                      <TableHead>{t('Time', 'الوقت')}</TableHead>
                      <TableHead>{t('Status', 'الحالة')}</TableHead>
                      <TableHead>{t('Confirmed', 'تأكيد الطبيب')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visits.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-mono text-sm">#{v.id}</TableCell>
                        <TableCell>{v.representative?.user?.name || v.representative?.name || '-'}</TableCell>
                        <TableCell>{v.shop?.name || '-'}</TableCell>
                        <TableCell>{v.visit_date ? format(new Date(v.visit_date), 'dd/MM/yyyy') : '-'}</TableCell>
                        <TableCell>{v.visit_time || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={v.status === 'approved' || v.status === 'completed' ? 'default' : v.status === 'rejected' ? 'destructive' : 'secondary'}>
                            {v.status || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>{v.doctor_confirmed_at ? format(new Date(v.doctor_confirmed_at), 'dd/MM HH:mm') : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Tab: Clinic */}
        <TabsContent value="clinic" className="mt-6 space-y-6">
          {primaryCenter && (
            <Card className="p-6 border-primary/30">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">{t('Primary Medical Center', 'المركز الطبي الأساسي')}</h3>
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-medium">{primaryCenter.name}</p>
                {primaryCenter.address && (
                  <p className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 shrink-0" />
                    {primaryCenter.address}
                  </p>
                )}
                {primaryCenter.phone && (
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Phone className="w-4 h-4 shrink-0" />
                    {primaryCenter.phone}
                  </p>
                )}
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {t('Medical Centers', 'المراكز الطبية')} ({medicalCenters.length})
            </h3>
            {medicalCenters.length === 0 && !primaryCenter ? (
              <p className="text-muted-foreground">{t('No medical centers linked', 'لا توجد مراكز طبية مرتبطة')}</p>
            ) : (
              <div className="space-y-4">
                {medicalCenters.map((center) => (
                  <div
                    key={center.id}
                    className={`p-4 rounded-lg border bg-card ${center.id === primaryCenter?.id ? 'border-primary/50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{center.name}</p>
                        {center.address && (
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {center.address}
                          </p>
                        )}
                        {center.phone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3 shrink-0" />
                            {center.phone}
                          </p>
                        )}
                      </div>
                      {center.id === primaryCenter?.id && (
                        <Badge variant="default">{t('Primary', 'أساسي')}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <DoctorReportModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        doctor={doctor}
      />
    </div>
  );
}
