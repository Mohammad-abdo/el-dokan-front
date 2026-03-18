import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import showToast from '@/lib/toast';
import { showConfirm } from '@/components/ConfirmDialog';
import {
  ArrowLeft,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Calendar,
  MapPin,
  Wallet,
  DollarSign,
  User,
  Store,
  Target,
  ShoppingCart,
  FileText,
  Building2,
  Stethoscope,
  TrendingUp,
  Phone,
  Mail,
  Hash,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';

const visitStatusLabels = {
  pending: { ar: 'قيد الانتظار', en: 'Pending', className: 'bg-amber-100 text-amber-800' },
  approved: { ar: 'موافق عليه', en: 'Approved', className: 'bg-blue-100 text-blue-800' },
  rejected: { ar: 'مرفوض', en: 'Rejected', className: 'bg-red-100 text-red-800' },
  completed: { ar: 'مكتملة', en: 'Completed', className: 'bg-green-100 text-green-800' },
};

const orderStatusLabels = {
  pending: { ar: 'قيد الانتظار', en: 'Pending', className: 'bg-amber-100 text-amber-800' },
  confirmed: { ar: 'مؤكد', en: 'Confirmed', className: 'bg-blue-100 text-blue-800' },
  delivered: { ar: 'تم التوصيل', en: 'Delivered', className: 'bg-green-100 text-green-800' },
  cancelled: { ar: 'ملغي', en: 'Cancelled', className: 'bg-gray-100 text-gray-800' },
};

export default function AdminRepresentativeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [representative, setRepresentative] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!id) return;
    fetchRepresentative();
    fetchWallet();
  }, [id]);

  const fetchRepresentative = async () => {
    try {
      const response = await api.get(`/admin/representatives/${id}`);
      setRepresentative(response.data?.data || response.data);
    } catch (error) {
      console.error('Error fetching representative:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWallet = async () => {
    try {
      const response = await api.get('/admin/financial/vendor-wallet', {
        params: { type: 'representative', id },
      });
      setWallet(response.data?.data);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const handleDelete = () => {
    showConfirm(
      language === 'ar'
        ? 'هل أنت متأكد من حذف هذا المندوب؟ لا يمكن التراجع.'
        : 'Are you sure you want to delete this representative? This action cannot be undone.',
      () => {
        api
          .delete(`/admin/representatives/${id}`)
          .then(() => {
            showToast.success(language === 'ar' ? 'تم حذف المندوب' : 'Representative deleted.');
            navigate('/admin/representatives');
          })
          .catch((error) => {
            showToast.error(
              error.response?.data?.message ||
                (language === 'ar' ? 'فشل حذف المندوب' : 'Failed to delete representative')
            );
          });
      }
    );
  };

  const handleApprove = async () => {
    try {
      await api.post(`/admin/representatives/${id}/approve`);
      showToast.success(language === 'ar' ? 'تمت الموافقة على المندوب' : 'Representative approved.');
      fetchRepresentative();
    } catch (error) {
      showToast.error(error.response?.data?.message || (language === 'ar' ? 'فشل الموافقة' : 'Failed to approve'));
    }
  };

  const handleSuspend = async () => {
    try {
      await api.post(`/admin/representatives/${id}/suspend`);
      showToast.success(language === 'ar' ? 'تم تعليق المندوب' : 'Representative suspended.');
      fetchRepresentative();
    } catch (error) {
      showToast.error(error.response?.data?.message || (language === 'ar' ? 'فشل التعليق' : 'Failed to suspend'));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-12 w-12 rounded-full" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!representative) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {language === 'ar' ? 'المندوب غير موجود' : 'Representative not found'}
        </p>
        <Link to="/admin/representatives" className="text-primary mt-4 inline-block">
          {language === 'ar' ? 'رجوع إلى مندوبين المبيعات' : 'Back to Representatives'}
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { label: language === 'ar' ? 'موافق عليه' : 'Approved', className: 'bg-green-100 text-green-800' },
      suspended: { label: language === 'ar' ? 'معلق' : 'Suspended', className: 'bg-red-100 text-red-800' },
      pending: { label: language === 'ar' ? 'قيد الانتظار' : 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      pending_approval: { label: language === 'ar' ? 'قيد المراجعة' : 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      active: { label: language === 'ar' ? 'نشط' : 'Active', className: 'bg-green-100 text-green-800' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant="secondary" className={config.className}>{config.label}</Badge>;
  };

  const stats = representative.stats || {};
  const visits = representative.visits || [];
  const companyOrders = representative.company_orders || representative.companyOrders || [];
  const isRTL = language === 'ar';

  const summaryCards = [
    {
      title: language === 'ar' ? 'إجمالي الزيارات' : 'Total Visits',
      value: stats.total_visits ?? visits.length,
      icon: Calendar,
      className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      title: language === 'ar' ? 'الزيارات المكتملة' : 'Completed Visits',
      value: stats.visits_completed ?? visits.filter((v) => v.status === 'completed').length,
      icon: FileText,
      className: 'bg-green-500/10 text-green-600 dark:text-green-400',
    },
    {
      title: language === 'ar' ? 'إجمالي المبيعات' : 'Total Sales',
      value: (stats.total_sales ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      suffix: language === 'ar' ? 'ج.م' : ' EGP',
      icon: DollarSign,
      className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      title: language === 'ar' ? 'عدد الطلبات' : 'Orders Count',
      value: stats.sales_count ?? companyOrders.filter((o) => ['confirmed', 'delivered'].includes(o.status)).length,
      icon: ShoppingCart,
      className: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    },
  ];

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}
      >
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button variant="ghost" onClick={() => navigate('/admin/representatives')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            {language === 'ar' ? 'رجوع' : 'Back'}
          </Button>
          <div className={isRTL ? 'text-right' : ''}>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {representative.user?.username || representative.user?.email || (language === 'ar' ? 'المندوب' : 'Representative')}
            </h1>
            <p className="text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
              {representative.employee_id && (
                <span className="flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5" />
                  {representative.employee_id}
                </span>
              )}
              {representative.territory && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {representative.territory}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className={`flex flex-wrap items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {representative.status === 'pending' && (
            <Button onClick={handleApprove} variant="outline" size="sm" className="gap-2">
              <UserCheck className="w-4 h-4" />
              {language === 'ar' ? 'موافقة' : 'Approve'}
            </Button>
          )}
          {representative.status === 'approved' && (
            <Button onClick={handleSuspend} variant="outline" size="sm" className="gap-2">
              <UserX className="w-4 h-4" />
              {language === 'ar' ? 'تعليق' : 'Suspend'}
            </Button>
          )}
          <Button onClick={() => navigate(`/admin/representatives/${id}/edit`)} variant="outline" size="sm" className="gap-2">
            <Edit className="w-4 h-4" />
            {language === 'ar' ? 'تعديل' : 'Edit'}
          </Button>
          <Button onClick={handleDelete} variant="destructive" size="sm" className="gap-2">
            <Trash2 className="w-4 h-4" />
            {language === 'ar' ? 'حذف' : 'Delete'}
          </Button>
        </div>
      </motion.div>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-4 flex items-center justify-between">
                <div className={isRTL ? 'text-right' : ''}>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">
                    {card.value}
                    {card.suffix && <span className="text-base font-normal text-muted-foreground">{card.suffix}</span>}
                  </p>
                </div>
                <div className={`rounded-full p-3 ${card.className}`}>
                  <card.icon className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="gap-2 rounded-lg">
            <TrendingUp className="w-4 h-4" />
            {language === 'ar' ? 'نظرة عامة' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger value="info" className="gap-2 rounded-lg">
            <User className="w-4 h-4" />
            {language === 'ar' ? 'معلومات المندوب' : 'Info'}
          </TabsTrigger>
          <TabsTrigger value="visits" className="gap-2 rounded-lg">
            <Calendar className="w-4 h-4" />
            {language === 'ar' ? 'الزيارات' : 'Visits'}
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">{visits.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="sales" className="gap-2 rounded-lg">
            <ShoppingCart className="w-4 h-4" />
            {language === 'ar' ? 'المبيعات' : 'Sales'}
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">{companyOrders.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="target" className="gap-2 rounded-lg">
            <Target className="w-4 h-4" />
            {language === 'ar' ? 'التارجت' : 'Target'}
          </TabsTrigger>
          <TabsTrigger value="wallet" className="gap-2 rounded-lg">
            <Wallet className="w-4 h-4" />
            {language === 'ar' ? 'المحفظة' : 'Wallet'}
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{language === 'ar' ? 'معلومات سريعة' : 'Quick Info'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{language === 'ar' ? 'الحالة' : 'Status'}</span>
                  {getStatusBadge(representative.status)}
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{language === 'ar' ? 'الشركة / المتجر' : 'Company / Shop'}</span>
                  <span className="font-medium">
                    {representative.shop?.name
                      ? (language === 'ar' ? representative.shop.name_ar || representative.shop.name : representative.shop.name_en || representative.shop.name)
                      : '—'}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{language === 'ar' ? 'آخر زيارة' : 'Last Visit'}</span>
                  <span className="font-medium">
                    {visits.length
                      ? format(new Date(visits[0].visit_date), 'yyyy-MM-dd')
                      : '—'}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{language === 'ar' ? 'آخر المعاملات (المحفظة)' : 'Recent Wallet Transactions'}</CardTitle>
              </CardHeader>
              <CardContent>
                {wallet?.transactions?.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {wallet.transactions.slice(0, 5).map((tx, idx) => (
                      <div
                        key={idx}
                        className={`flex justify-between items-center text-sm ${isRTL ? 'flex-row-reverse' : ''}`}
                      >
                        <span className="text-muted-foreground truncate max-w-[60%]">
                          {tx.type || tx.description || '—'}
                        </span>
                        <span className={Number(tx.amount || 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {Number(tx.amount || 0) >= 0 ? '+' : ''}
                          {Number(tx.amount || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">{language === 'ar' ? 'لا توجد معاملات' : 'No transactions'}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Info */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'معلومات المندوب' : 'Representative Information'}</CardTitle>
              <CardDescription>
                {language === 'ar' ? 'جميع البيانات المسجلة للمندوب' : 'All registered data for this representative'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {language === 'ar' ? 'المستخدم' : 'User'}
                  </p>
                  <p className="font-medium">{representative.user?.username || representative.user?.email || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </p>
                  <p className="font-medium">{representative.user?.email || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {language === 'ar' ? 'الهاتف' : 'Phone'}
                  </p>
                  <p className="font-medium">{representative.user?.phone || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    {language === 'ar' ? 'رقم الموظف' : 'Employee ID'}
                  </p>
                  <p className="font-medium">{representative.employee_id || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {language === 'ar' ? 'المنطقة' : 'Territory'}
                  </p>
                  <p className="font-medium">{representative.territory || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {language === 'ar' ? 'الشركة التابع لها' : 'Assigned Shop/Company'}
                  </p>
                  <p className="font-medium">
                    {representative.shop
                      ? (language === 'ar' ? representative.shop.name_ar || representative.shop.name : representative.shop.name_en || representative.shop.name)
                      : '—'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الحالة' : 'Status'}</p>
                  {getStatusBadge(representative.status)}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visits */}
        <TabsContent value="visits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'عمليات الزيارات ونتائجها' : 'Visits & Results'}</CardTitle>
              <CardDescription>
                {language === 'ar' ? 'جميع الزيارات التي قام بها المندوب مع التاريخ والغرض والحالة' : 'All visits by this representative with date, purpose and status'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {visits.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  {language === 'ar' ? 'لا توجد زيارات مسجلة' : 'No visits recorded'}
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                        <TableHead>{language === 'ar' ? 'الوقت' : 'Time'}</TableHead>
                        <TableHead>{language === 'ar' ? 'الغرض' : 'Purpose'}</TableHead>
                        <TableHead>{language === 'ar' ? 'المتجر/الطبيب' : 'Shop/Doctor'}</TableHead>
                        <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                        <TableHead>{language === 'ar' ? 'ملاحظات' : 'Notes'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visits.map((v) => {
                        const statusInfo = visitStatusLabels[v.status] || visitStatusLabels.pending;
                        const place = v.shop?.name || v.doctor?.name || '—';
                        return (
                          <TableRow key={v.id}>
                            <TableCell>{v.visit_date ? format(new Date(v.visit_date), 'yyyy-MM-dd') : '—'}</TableCell>
                            <TableCell>{v.visit_time || '—'}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{v.purpose || '—'}</TableCell>
                            <TableCell>{place}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={statusInfo.className}>
                                {language === 'ar' ? statusInfo.ar : statusInfo.en}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[180px] truncate text-muted-foreground">{v.notes || '—'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales */}
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'المبيعات التي حققها المندوب' : 'Sales by Representative'}</CardTitle>
              <CardDescription>
                {language === 'ar' ? 'طلبات الشركة (مبيعات المنتجات للمتاجر/الأطباء) المرتبطة بهذا المندوب' : 'Company orders (sales to shops/doctors) linked to this representative'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {companyOrders.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  {language === 'ar' ? 'لا توجد مبيعات مسجلة' : 'No sales recorded'}
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === 'ar' ? 'رقم الطلب' : 'Order #'}</TableHead>
                        <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                        <TableHead>{language === 'ar' ? 'العميل' : 'Customer'}</TableHead>
                        <TableHead>{language === 'ar' ? 'النوع' : 'Type'}</TableHead>
                        <TableHead>{language === 'ar' ? 'المبلغ' : 'Amount'}</TableHead>
                        <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companyOrders.map((order) => {
                        const statusInfo = orderStatusLabels[order.status] || orderStatusLabels.pending;
                        const customer = order.customer || (order.customer_type === 'shop' ? order.customer_shop : order.customer_doctor);
                        const customerName = customer?.name || (order.customer_type === 'shop' ? (language === 'ar' ? order.customer_shop?.name_ar : order.customer_shop?.name_en) : (language === 'ar' ? order.customer_doctor?.name_ar : order.customer_doctor?.name_en)) || '—';
                        return (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono">{order.order_number || order.id}</TableCell>
                            <TableCell>
                              {order.ordered_at
                                ? format(new Date(order.ordered_at), 'yyyy-MM-dd HH:mm')
                                : '—'}
                            </TableCell>
                            <TableCell>{customerName}</TableCell>
                            <TableCell>
                              {order.customer_type === 'shop'
                                ? (language === 'ar' ? 'متجر' : 'Shop')
                                : (language === 'ar' ? 'طبيب' : 'Doctor')}
                            </TableCell>
                            <TableCell className="font-medium">
                              {Number(order.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} {language === 'ar' ? 'ج.م' : 'EGP'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={statusInfo.className}>
                                {language === 'ar' ? statusInfo.ar : statusInfo.en}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Target */}
        <TabsContent value="target" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                {language === 'ar' ? 'التارجت الخاص بالمندوب' : 'Representative Target'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'هدف المبيعات ونسبة التحقيق إن وُجد' : 'Sales target and achievement rate if set'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.sales_target != null && Number(stats.sales_target) > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{language === 'ar' ? 'الهدف (ج.م)' : 'Target (EGP)'}</span>
                    <span className="text-xl font-bold">{Number(stats.sales_target).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{language === 'ar' ? 'المحقق' : 'Achieved'}</span>
                    <span className="text-xl font-bold text-green-600">
                      {(stats.total_sales ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{language === 'ar' ? 'نسبة التحقيق' : 'Achievement %'}</span>
                    <span className="text-xl font-bold">
                      {Math.min(100, Math.round(((stats.total_sales ?? 0) / Number(stats.sales_target)) * 100))}%
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground py-4">
                  {language === 'ar' ? 'لم يُحدد تارجت لهذا المندوب بعد.' : 'No target has been set for this representative yet.'}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wallet */}
        <TabsContent value="wallet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                {language === 'ar' ? 'المحفظة' : 'Wallet'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'الرصيد ومعاملات المحفظة' : 'Balance and wallet transactions'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">{language === 'ar' ? 'الرصيد الحالي' : 'Current Balance'}</span>
                <span className="text-2xl font-bold text-green-600">
                  {parseFloat(wallet?.balance ?? representative.user?.wallet_balance ?? 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  {language === 'ar' ? 'ج.م' : 'EGP'}
                </span>
              </div>
              <div>
                <p className="font-medium mb-2">{language === 'ar' ? 'آخر المعاملات' : 'Recent Transactions'}</p>
                {wallet?.transactions?.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {wallet.transactions.map((tx, idx) => (
                      <div
                        key={idx}
                        className={`flex justify-between items-center py-2 border-b last:border-0 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}
                      >
                        <span className="text-muted-foreground">{tx.type || tx.description || '—'}</span>
                        <span className={Number(tx.amount || 0) >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {Number(tx.amount || 0) >= 0 ? '+' : ''}
                          {Number(tx.amount || 0).toFixed(2)} {language === 'ar' ? 'ج.م' : 'EGP'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm py-4">{language === 'ar' ? 'لا توجد معاملات' : 'No transactions'}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
