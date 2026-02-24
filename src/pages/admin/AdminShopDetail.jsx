import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { getImageSrc } from '@/lib/imageUtils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import showToast from '@/lib/toast';
import { showConfirm } from '@/components/ConfirmDialog';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  ShoppingCart,
  DollarSign,
  Wallet,
  Store,
  Users,
  BarChart3,
  FileText,
  Download,
  Eye,
  Image as ImageIcon,
  Phone,
  MapPin,
  Plus,
  Building2,
  FileCheck,
  TrendingUp,
  UserPlus,
  CalendarCheck,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';

const statusColors = {
  received: 'bg-blue-100 text-blue-800',
  processing: 'bg-amber-100 text-amber-800',
  on_the_way: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function AdminShopDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromCompanies = location.pathname.startsWith('/admin/companies/');
  const { language } = useLanguage();
  const [shop, setShop] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [fullWallet, setFullWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  useEffect(() => {
    const tab = location.state?.tab;
    if (tab && ['company-products', 'company-orders', 'overview', 'products', 'orders', 'wallet', 'branches', 'documents', 'representatives', 'visits', 'customers', 'revenue', 'reports', 'plan-access', 'product-reports', 'orders-from-reps'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [id, location.state?.tab]);
  const [walletAdjustOpen, setWalletAdjustOpen] = useState(false);
  const [walletAdjustAmount, setWalletAdjustAmount] = useState('');
  const [walletAdjustType, setWalletAdjustType] = useState('credit');
  const [walletAdjustDesc, setWalletAdjustDesc] = useState('');
  const [productReportsData, setProductReportsData] = useState(null);
  const [productReportsLoading, setProductReportsLoading] = useState(false);
  const [reportFrom, setReportFrom] = useState(format(new Date(new Date().setDate(1)), 'yyyy-MM-dd'));
  const [reportTo, setReportTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [addBranchOpen, setAddBranchOpen] = useState(false);
  const [addDocOpen, setAddDocOpen] = useState(false);
  const [branchForm, setBranchForm] = useState({ name: '', name_ar: '', address: '', phone: '', is_active: true });
  const [docForm, setDocForm] = useState({ type: 'permit', title: '', title_ar: '', reference_number: '', expires_at: '' });
  const [docFile, setDocFile] = useState(null);
  const [repFormOpen, setRepFormOpen] = useState(false);
  const [repForm, setRepForm] = useState({ user_id: '', territory: '', status: 'active' });
  const [usersList, setUsersList] = useState([]);
  const [companyVisits, setCompanyVisits] = useState({ data: [], pagination: null });
  const [companyVisitsLoading, setCompanyVisitsLoading] = useState(false);
  const [companyOrders, setCompanyOrders] = useState({ data: [], pagination: null });
  const [companyOrdersLoading, setCompanyOrdersLoading] = useState(false);
  const [companyProductFormOpen, setCompanyProductFormOpen] = useState(false);
  const [companyProductForm, setCompanyProductForm] = useState({ id: null, name: '', name_ar: '', sku: '', description: '', description_ar: '', product_type: 'other', unit: '', unit_price: '', stock_quantity: 0, is_active: true, images: [] });
  const [companyProductNewImages, setCompanyProductNewImages] = useState([]);
  const [companyPlans, setCompanyPlans] = useState([]);
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [ordersFromReps, setOrdersFromReps] = useState({ data: [], pagination: null });
  const [ordersFromRepsLoading, setOrdersFromRepsLoading] = useState(false);

  useEffect(() => {
    if (!id || id === 'create' || id === 'new') {
      setLoading(false);
      return;
    }
    fetchShop();
    fetchWallet();
  }, [id]);

  useEffect(() => {
    if (shop?.is_company) {
      api.get('/admin/company-plans').then((r) => {
        const data = r.data?.data ?? r.data;
        setCompanyPlans(Array.isArray(data) ? data : []);
      }).catch(() => setCompanyPlans([]));
    }
  }, [shop?.id, shop?.is_company]);

  useEffect(() => {
    if (id && activeTab === 'wallet') fetchFullWallet();
  }, [id, activeTab]);

  useEffect(() => {
    if (id && activeTab === 'visits') fetchCompanyVisits();
  }, [id, activeTab]);

  useEffect(() => {
    if (id && activeTab === 'company-orders') fetchCompanyOrders();
  }, [id, activeTab]);

  useEffect(() => {
    if (id && activeTab === 'orders-from-reps') fetchOrdersFromReps();
  }, [id, activeTab]);

  const fetchOrdersFromReps = async (page = 1) => {
    if (!id) return;
    setOrdersFromRepsLoading(true);
    try {
      const res = await api.get(`/admin/shops/${id}/orders-from-reps`, { params: { page, per_page: 20 } });
      setOrdersFromReps({ data: res.data?.data ?? [], pagination: res.data?.pagination ?? null });
    } catch (e) {
      setOrdersFromReps({ data: [], pagination: null });
    } finally {
      setOrdersFromRepsLoading(false);
    }
  };

  const fetchCompanyOrders = async (page = 1) => {
    if (!id) return;
    setCompanyOrdersLoading(true);
    try {
      const res = await api.get(`/admin/shops/${id}/company-orders`, { params: { page, per_page: 20 } });
      setCompanyOrders({ data: res.data?.data ?? [], pagination: res.data?.pagination ?? null });
    } catch (e) {
      setCompanyOrders({ data: [], pagination: null });
    } finally {
      setCompanyOrdersLoading(false);
    }
  };

  const handleSaveCompanyProduct = async () => {
    if (!companyProductForm.name?.trim()) {
      showToast.error(language === 'ar' ? 'أدخل اسم المنتج' : 'Enter product name');
      return;
    }
    const hasNewFiles = companyProductNewImages.length > 0;
    const formData = new FormData();
    formData.append('name', companyProductForm.name);
    formData.append('name_ar', companyProductForm.name_ar || '');
    formData.append('sku', companyProductForm.sku || '');
    formData.append('description', companyProductForm.description || '');
    formData.append('description_ar', companyProductForm.description_ar || '');
    formData.append('product_type', companyProductForm.product_type || 'other');
    formData.append('unit', companyProductForm.unit || '');
    formData.append('unit_price', String(parseFloat(companyProductForm.unit_price) || 0));
    formData.append('stock_quantity', String(parseInt(companyProductForm.stock_quantity, 10) || 0));
    formData.append('is_active', companyProductForm.is_active !== false ? '1' : '0');
    formData.append('images', JSON.stringify(companyProductForm.images || []));
    companyProductNewImages.forEach((file) => formData.append('images[]', file));

    try {
      if (companyProductForm.id) {
        formData.append('_method', 'PUT');
        await api.post(`/admin/shops/${id}/company-products/${companyProductForm.id}`, formData);
        showToast.success(language === 'ar' ? 'تم التحديث' : 'Updated');
      } else {
        await api.post(`/admin/shops/${id}/company-products`, formData);
        showToast.success(language === 'ar' ? 'تمت الإضافة' : 'Added');
      }
      setCompanyProductFormOpen(false);
      setCompanyProductForm({ id: null, name: '', name_ar: '', sku: '', description: '', description_ar: '', product_type: 'other', unit: '', unit_price: '', stock_quantity: 0, is_active: true, images: [] });
      setCompanyProductNewImages([]);
      fetchShop();
    } catch (e) {
      showToast.error(e.response?.data?.message || (language === 'ar' ? 'فشل' : 'Failed'));
    }
  };

  useEffect(() => {
    if (repFormOpen) {
      api.get('/admin/users', { params: { per_page: 200 } }).then((r) => {
        const list = r.data?.data?.data ?? r.data?.data ?? [];
        setUsersList(Array.isArray(list) ? list : []);
      }).catch(() => setUsersList([]));
    }
  }, [repFormOpen]);

  const fetchCompanyVisits = async (page = 1) => {
    if (!id) return;
    setCompanyVisitsLoading(true);
    try {
      const res = await api.get(`/admin/shops/${id}/visits`, { params: { page, per_page: 20 } });
      setCompanyVisits({
        data: res.data?.data ?? [],
        pagination: res.data?.pagination ?? null,
      });
    } catch (e) {
      setCompanyVisits({ data: [], pagination: null });
    } finally {
      setCompanyVisitsLoading(false);
    }
  };

  const handleAddRepresentative = async () => {
    if (!repForm.user_id || !repForm.territory?.trim()) {
      showToast.error(language === 'ar' ? 'أدخل المستخدم والمنطقة' : 'Enter user and territory');
      return;
    }
    try {
      await api.post(`/admin/shops/${id}/representatives`, repForm);
      showToast.success(language === 'ar' ? 'تم إضافة المندوب' : 'Representative added');
      setRepFormOpen(false);
      setRepForm({ user_id: '', territory: '', status: 'active' });
      fetchShop();
    } catch (e) {
      showToast.error(e.response?.data?.message || (language === 'ar' ? 'فشل' : 'Failed'));
    }
  };

  const fetchFullWallet = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/admin/shops/${id}/wallet`);
      setFullWallet(res.data?.data);
    } catch (e) {
      setFullWallet(null);
    }
  };

  const fetchProductReports = async () => {
    if (!id) return;
    setProductReportsLoading(true);
    try {
      const res = await api.get(`/admin/shops/${id}/product-reports`, { params: { from: reportFrom, to: reportTo } });
      setProductReportsData(res.data?.data);
    } catch (e) {
      setProductReportsData(null);
    } finally {
      setProductReportsLoading(false);
    }
  };

  const handleAddBranch = async () => {
    if (!branchForm.name?.trim()) {
      showToast.error(language === 'ar' ? 'أدخل اسم الفرع' : 'Enter branch name');
      return;
    }
    try {
      await api.post(`/admin/shops/${id}/branches`, branchForm);
      showToast.success(language === 'ar' ? 'تم إضافة الفرع' : 'Branch added');
      setAddBranchOpen(false);
      setBranchForm({ name: '', name_ar: '', address: '', phone: '', is_active: true });
      fetchShop();
    } catch (e) {
      showToast.error(e.response?.data?.message || (language === 'ar' ? 'فشل' : 'Failed'));
    }
  };

  const handleAddDocument = async () => {
    try {
      const formData = new FormData();
      formData.append('type', docForm.type);
      if (docForm.title) formData.append('title', docForm.title);
      if (docForm.title_ar) formData.append('title_ar', docForm.title_ar);
      if (docForm.reference_number) formData.append('reference_number', docForm.reference_number);
      if (docForm.expires_at) formData.append('expires_at', docForm.expires_at);
      if (docFile) formData.append('file', docFile);
      await api.post(`/admin/shops/${id}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast.success(language === 'ar' ? 'تم إضافة الوثيقة' : 'Document added');
      setAddDocOpen(false);
      setDocForm({ type: 'permit', title: '', title_ar: '', reference_number: '', expires_at: '' });
      setDocFile(null);
      fetchShop();
    } catch (e) {
      showToast.error(e.response?.data?.message || (language === 'ar' ? 'فشل' : 'Failed'));
    }
  };

  const handleWalletAdjust = async () => {
    const amount = parseFloat(walletAdjustAmount);
    if (!amount || amount <= 0) {
      showToast.error(language === 'ar' ? 'أدخل المبلغ صحيحاً' : 'Enter a valid amount');
      return;
    }
    try {
      await api.post(`/admin/shops/${id}/wallet/adjust`, {
        amount,
        type: walletAdjustType,
        description: walletAdjustDesc || (walletAdjustType === 'credit' ? (language === 'ar' ? 'إضافة رصيد من الأدمن' : 'Admin credit') : (language === 'ar' ? 'خصم من الأدمن' : 'Admin debit')),
      });
      showToast.success(language === 'ar' ? 'تم تنفيذ العملية' : 'Done');
      setWalletAdjustOpen(false);
      setWalletAdjustAmount('');
      setWalletAdjustDesc('');
      fetchFullWallet();
      fetchWallet();
    } catch (e) {
      showToast.error(e.response?.data?.message || (language === 'ar' ? 'فشل التنفيذ' : 'Failed'));
    }
  };

  const fetchShop = async () => {
    if (!id || id === 'create' || id === 'new') return;
    try {
      const response = await api.get(`/admin/shops/${id}`);
      const raw = response.data?.data ?? response.data;
      if (raw && typeof raw === 'object') {
        setShop({
          ...raw,
          image_url: raw.image_url ?? null,
          products: Array.isArray(raw.products) ? raw.products : raw.products?.data ?? [],
        });
      } else {
        setShop(null);
      }
    } catch (error) {
      console.error('Error fetching shop:', error);
      setShop(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchWallet = async () => {
    if (!id || id === 'create' || id === 'new') return;
    try {
      const response = await api.get('/admin/financial/vendor-wallet', {
        params: { type: 'shop', id },
      });
      setWallet(response.data?.data);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const handleDelete = () => {
    showConfirm(
      language === 'ar' ? (isCompany ? 'هل أنت متأكد من حذف هذه الشركة؟ لا يمكن التراجع.' : 'هل أنت متأكد من حذف هذا المتجر؟ لا يمكن التراجع.') : (isCompany ? 'Are you sure you want to delete this company? This cannot be undone.' : 'Are you sure you want to delete this shop? This action cannot be undone.'),
      () => {
        api
          .delete(`/admin/shops/${id}`)
          .then(() => {
            showToast.success(language === 'ar' ? (isCompany ? 'تم حذف الشركة' : 'تم حذف المتجر') : (isCompany ? 'Company deleted.' : 'Shop deleted.'));
            navigate(fromCompanies ? '/admin/companies' : '/admin/shops');
          })
          .catch((error) => {
            showToast.error(error.response?.data?.message || (language === 'ar' ? 'فشل الحذف' : 'Failed to delete'));
          });
      }
    );
  };

  const handleUpdatePlan = async (planId) => {
    if (!planId) return;
    setUpdatingPlan(true);
    try {
      await api.put(`/admin/shops/${id}/plan`, { company_plan_id: parseInt(planId, 10) });
      showToast.success(language === 'ar' ? 'تم تحديث الخطة' : 'Plan updated');
      fetchShop();
    } catch (e) {
      showToast.error(e.response?.data?.message || (language === 'ar' ? 'فشل تحديث الخطة' : 'Failed to update plan'));
    } finally {
      setUpdatingPlan(false);
    }
  };

  const customersFromOrders = useMemo(() => {
    if (!shop?.orders?.length) return [];
    const map = new Map();
    shop.orders.forEach((order) => {
      const uid = order.user_id || order.user?.id;
      if (!uid) return;
      if (!map.has(uid)) {
        map.set(uid, {
          id: uid,
          name: order.user?.name || order.user?.username || order.user?.email || '-',
          email: order.user?.email || '-',
          phone: order.user?.phone || '-',
          ordersCount: 0,
          totalSpent: 0,
        });
      }
      const c = map.get(uid);
      c.ordersCount += 1;
      c.totalSpent += parseFloat(order.total_amount ?? order.total ?? 0);
    });
    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [shop?.orders]);

  const totalRevenue = useMemo(() => {
    if (!shop?.orders?.length) return 0;
    return shop.orders.reduce((sum, o) => sum + parseFloat(o.total_amount ?? o.total ?? 0), 0);
  }, [shop?.orders]);

  const exportReport = (formatType = 'csv') => {
    if (!shop) return;
    const rows = [
      [language === 'ar' ? 'تقرير المتجر' : 'Shop Report', shop.name],
      [],
      [language === 'ar' ? 'الاسم' : 'Name', shop.name],
      [language === 'ar' ? 'الفئة' : 'Category', shop.category],
      [language === 'ar' ? 'العنوان' : 'Address', shop.address],
      [language === 'ar' ? 'الهاتف' : 'Phone', shop.phone || '-'],
      [language === 'ar' ? 'عدد المنتجات' : 'Products Count', String(shop.products_count ?? shop.products?.length ?? 0)],
      [language === 'ar' ? 'عدد الطلبات' : 'Orders Count', String(shop.orders_count ?? shop.orders?.length ?? 0)],
      [language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue', `$${totalRevenue.toFixed(2)}`],
      [language === 'ar' ? 'عدد العملاء' : 'Customers Count', String(customersFromOrders.length)],
    ];
    if (formatType === 'csv') {
      const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shop-${shop.name}-report.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast.success(language === 'ar' ? 'تم استخراج التقرير' : 'Report exported');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-14 w-14 rounded-xl" />
            <div>
              <Skeleton className="h-8 w-56 mb-2" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>
        <Skeleton className="h-12 w-full max-w-2xl" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!shop && !loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{language === 'ar' ? (fromCompanies ? 'الشركة غير موجودة' : 'المتجر غير موجود') : (fromCompanies ? 'Company not found' : 'Shop not found')}</p>
        <Link to={fromCompanies ? '/admin/companies' : '/admin/shops'} className="text-primary mt-4 inline-block">
          {language === 'ar' ? (fromCompanies ? 'رجوع إلى الشركات' : 'رجوع إلى المتاجر') : (fromCompanies ? 'Back to Companies' : 'Back to Shops')}
        </Link>
      </div>
    );
  }

  const isCompany = shop.is_company || shop.category === 'company' || shop.user?.role === 'company';
  const products = shop.products || [];
  const orders = shop.orders || [];
  const isRTL = language === 'ar';
  const vendorStatus = shop.vendor_status || 'approved';
  const vendorDashboard = shop.vendor_dashboard || {};
  const companyPlan = shop.company_plan || null;
  const companyPlanUsage = shop.company_plan_usage || { products: 0, branches: 0, representatives: 0 };

  const handleVendorAction = async (action) => {
    try {
      await api.post(`/admin/shops/${id}/${action}`);
      showToast.success(
        language === 'ar'
          ? (action === 'approve' ? 'تم تفعيل البائع' : action === 'reject' ? 'تم رفض البائع' : 'تم إيقاف البائع')
          : (action === 'approve' ? 'Vendor approved' : action === 'reject' ? 'Vendor rejected' : 'Vendor suspended')
      );
      fetchShop();
    } catch (e) {
      showToast.error(e.response?.data?.message || (language === 'ar' ? 'فشل تنفيذ الإجراء' : 'Action failed'));
    }
  };

  const vendorStatusLabel = {
    pending_approval: language === 'ar' ? 'قيد المراجعة' : 'Pending approval',
    approved: language === 'ar' ? 'مفعّل' : 'Approved',
    suspended: language === 'ar' ? 'موقوف' : 'Suspended',
    rejected: language === 'ar' ? 'مرفوض' : 'Rejected',
  }[vendorStatus] || vendorStatus;

  const vendorStatusVariant = {
    pending_approval: 'bg-amber-100 text-amber-800',
    approved: 'bg-green-100 text-green-800',
    suspended: 'bg-red-100 text-red-800',
    rejected: 'bg-gray-100 text-gray-800',
  }[vendorStatus] || 'bg-gray-100 text-gray-800';

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(fromCompanies ? '/admin/companies' : '/admin/shops')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            {language === 'ar' ? 'رجوع' : 'Back'}
          </Button>
          <div className="flex items-center gap-4 p-3 rounded-xl bg-card border">
            {shop.image_url ? (
              <img src={getImageSrc(shop.image_url)} alt={shop.name} className="h-14 w-14 rounded-lg object-cover" />
            ) : (
              <Avatar className="h-14 w-14 rounded-lg">
                <AvatarFallback className="bg-primary/10 text-primary rounded-lg">
                  <Store className="h-7 w-7" />
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{shop.name || (language === 'ar' ? (isCompany ? 'الشركة' : 'المتجر') : (isCompany ? 'Company' : 'Shop'))}</h1>
              <p className="text-sm text-muted-foreground">
                {isCompany ? (language === 'ar' ? 'شركة' : 'Company') : (shop.category || '-')} {shop.user && ` • ${shop.user.username || shop.user.email}`}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge className={vendorStatusVariant}>{vendorStatusLabel}</Badge>
                {isCompany && companyPlan && (
                  <Badge variant="outline" className="text-xs">{companyPlan.name_ar || companyPlan.name}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {vendorStatus === 'pending_approval' && (
            <>
              <Button variant="default" onClick={() => handleVendorAction('approve')} className="gap-2">
                {language === 'ar' ? 'موافقة' : 'Approve'}
              </Button>
              <Button variant="destructive" onClick={() => handleVendorAction('reject')} className="gap-2">
                {language === 'ar' ? 'رفض' : 'Reject'}
              </Button>
            </>
          )}
          {vendorStatus === 'approved' && (
            <Button variant="outline" onClick={() => handleVendorAction('suspend')} className="gap-2">
              {language === 'ar' ? 'إيقاف البائع' : 'Suspend'}
            </Button>
          )}
          {vendorStatus === 'suspended' && (
            <Button variant="default" onClick={() => handleVendorAction('approve')} className="gap-2">
              {language === 'ar' ? 'إعادة التفعيل' : 'Reactivate'}
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate(fromCompanies ? `/admin/companies/${id}/edit` : `/admin/shops/${id}/edit`)} className="gap-2">
            <Edit className="w-4 h-4" />
            {language === 'ar' ? 'تعديل' : 'Edit'}
          </Button>
          <Button variant="outline" onClick={() => exportReport('csv')} className="gap-2">
            <Download className="w-4 h-4" />
            {language === 'ar' ? 'استخراج تقرير' : 'Export Report'}
          </Button>
          <Button variant="destructive" onClick={handleDelete} className="gap-2">
            <Trash2 className="w-4 h-4" />
            {language === 'ar' ? 'حذف' : 'Delete'}
          </Button>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="overview" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <BarChart3 className="w-4 h-4" />
            {language === 'ar' ? 'نظرة عامة' : 'Overview'}
          </TabsTrigger>
          {isCompany && (
            <TabsTrigger value="plan-access" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              {language === 'ar' ? 'الخطة والوصول' : 'Plan & Access'}
            </TabsTrigger>
          )}
          <TabsTrigger value="products" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Package className="w-4 h-4" />
            {language === 'ar' ? 'منتجات المتجر (ماركت)' : 'Shop products (market)'}
            <Badge variant="secondary" className="ml-1 rounded-full px-1.5 text-xs">
              {products.length}
            </Badge>
          </TabsTrigger>
          {isCompany && (
            <TabsTrigger value="company-products" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Package className="w-4 h-4" />
              {language === 'ar' ? 'منتجات الشركة' : 'Company products'}
              <Badge variant="secondary" className="ml-1 rounded-full px-1.5 text-xs">
                {(shop.company_products || []).length}
              </Badge>
            </TabsTrigger>
          )}
          <TabsTrigger value="orders" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <ShoppingCart className="w-4 h-4" />
            {language === 'ar' ? 'الطلبات' : 'Orders'}
            <Badge variant="secondary" className="ml-1 rounded-full px-1.5 text-xs">
              {orders.length}
            </Badge>
          </TabsTrigger>
          {!isCompany && (
            <TabsTrigger value="orders-from-reps" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <ShoppingCart className="w-4 h-4" />
              {language === 'ar' ? 'طلبات من المندوبين' : 'Orders from reps'}
            </TabsTrigger>
          )}
          <TabsTrigger value="customers" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Users className="w-4 h-4" />
            {language === 'ar' ? 'العملاء' : 'Customers'}
            <Badge variant="secondary" className="ml-1 rounded-full px-1.5 text-xs">
              {customersFromOrders.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="representatives" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <UserPlus className="w-4 h-4" />
            {language === 'ar' ? 'المندوبون' : 'Representatives'}
            <Badge variant="secondary" className="ml-1 rounded-full px-1.5 text-xs">
              {(shop.representatives || []).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="visits" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <CalendarCheck className="w-4 h-4" />
            {language === 'ar' ? 'الزيارات' : 'Visits'}
          </TabsTrigger>
          {isCompany && (
            <TabsTrigger value="company-orders" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <ShoppingCart className="w-4 h-4" />
              {language === 'ar' ? 'مبيعات الشركة' : 'Company sales'}
              <Badge variant="secondary" className="ml-1 rounded-full px-1.5 text-xs">
                {shop.company_orders_count ?? 0}
              </Badge>
            </TabsTrigger>
          )}
          <TabsTrigger value="wallet" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Wallet className="w-4 h-4" />
            {language === 'ar' ? 'المحفظة' : 'Wallet'}
          </TabsTrigger>
          <TabsTrigger value="branches" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Building2 className="w-4 h-4" />
            {language === 'ar' ? 'الفروع' : 'Branches'}
            <Badge variant="secondary" className="ml-1 rounded-full px-1.5 text-xs">
              {(shop.branches || []).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <FileCheck className="w-4 h-4" />
            {language === 'ar' ? 'الأوراق والتصاريح' : 'Documents'}
            <Badge variant="secondary" className="ml-1 rounded-full px-1.5 text-xs">
              {(shop.documents || []).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="product-reports" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <TrendingUp className="w-4 h-4" />
            {language === 'ar' ? 'تقارير المنتجات' : 'Product Reports'}
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <DollarSign className="w-4 h-4" />
            {language === 'ar' ? 'الأرباح والإيرادات' : 'Revenue'}
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <FileText className="w-4 h-4" />
            {language === 'ar' ? 'تقارير' : 'Reports'}
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'المنتجات' : 'Products'}</p>
                    <p className="text-2xl font-bold">{shop.products_count ?? products.length}</p>
                  </div>
                  <Package className="h-10 w-10 text-primary/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الطلبات' : 'Orders'}</p>
                    <p className="text-2xl font-bold">{shop.orders_count ?? orders.length}</p>
                  </div>
                  <ShoppingCart className="h-10 w-10 text-green-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'العملاء' : 'Customers'}</p>
                    <p className="text-2xl font-bold">{customersFromOrders.length}</p>
                  </div>
                  <Users className="h-10 w-10 text-amber-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}</p>
                    <p className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <DollarSign className="h-10 w-10 text-emerald-500/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vendor dashboard summary (full control view) */}
          {(vendorDashboard.new_orders_count != null || vendorDashboard.daily_sales != null || (vendorDashboard.most_sold_today && vendorDashboard.most_sold_today.length) || (vendorDashboard.latest_orders && vendorDashboard.latest_orders.length)) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{language === 'ar' ? 'لوحة البائع (ملخص)' : 'Vendor dashboard (summary)'}</CardTitle>
                <CardDescription>
                  {language === 'ar' ? 'نظرة شاملة كما يراها البائع' : 'Overview as seen by the vendor'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <ShoppingCart className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الطلبات الجديدة' : 'New orders'}</p>
                      <p className="text-2xl font-bold">{vendorDashboard.new_orders_count ?? 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="rounded-full bg-green-500/10 p-3">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{language === 'ar' ? 'المبيعات اليومية' : 'Daily sales'}</p>
                      <p className="text-2xl font-bold">{vendorDashboard.daily_sales != null ? `${vendorDashboard.daily_sales} EGP` : '0 EGP'}</p>
                    </div>
                  </div>
                </div>
                {vendorDashboard.most_sold_today && vendorDashboard.most_sold_today.length > 0 && (
                  <div>
                    <h4 className="mb-2 font-medium">{language === 'ar' ? 'الأكثر مبيعاً اليوم' : 'Most sold today'}</h4>
                    <ul className="space-y-2">
                      {vendorDashboard.most_sold_today.slice(0, 5).map((item, i) => {
                        const name = item.product?.name ?? item.name;
                        const img = item.product?.first_image_url ?? item.first_image_url;
                        const qty = item.quantity_sold_today ?? item.quantity_sold ?? 0;
                        return (
                          <li key={item.product_id || i} className="flex items-center gap-3 rounded-lg border p-2">
                            {img && (
                              <img src={getImageSrc(img)} alt="" className="h-10 w-10 rounded object-cover" />
                            )}
                            <span className="flex-1 truncate">{name || (language === 'ar' ? 'منتج' : 'Product')}</span>
                            <Badge variant="secondary">{qty} {language === 'ar' ? 'قطعة' : 'pcs'}</Badge>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                {vendorDashboard.latest_orders && vendorDashboard.latest_orders.length > 0 && (
                  <div>
                    <h4 className="mb-2 font-medium">{language === 'ar' ? 'آخر الطلبات' : 'Latest orders'}</h4>
                    <ul className="space-y-2">
                      {vendorDashboard.latest_orders.slice(0, 5).map((ord) => (
                        <li key={ord.id} className="flex items-center justify-between rounded-lg border p-2">
                          <span className="font-mono text-sm">#{ord.order_number || ord.id}</span>
                          <span className="text-muted-foreground">{(ord.total_amount ?? ord.total) != null ? `${ord.total_amount ?? ord.total} EGP` : '-'}</span>
                          <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => navigate(`/admin/orders/${ord.id}`)}>
                            {language === 'ar' ? 'عرض التفاصيل' : 'View details'}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{language === 'ar' ? 'معلومات المتجر' : 'Shop Information'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Store className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الاسم' : 'Name'}</p>
                    <p className="font-medium">{shop.name || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الفئة' : 'Category'}</p>
                    <p className="font-medium">{shop.category || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'العنوان' : 'Address'}</p>
                    <p className="font-medium">{shop.address || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الهاتف' : 'Phone'}</p>
                    <p className="font-medium">{shop.phone || '-'}</p>
                  </div>
                </div>
                {shop.user && (
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">{language === 'ar' ? 'المستخدم' : 'User'}</p>
                      <p className="font-medium">{shop.user.username || shop.user.email || '-'}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{language === 'ar' ? 'الحالة' : 'Status'}</span>
                  <Badge variant={shop.is_active !== false ? 'default' : 'secondary'}>
                    {shop.is_active !== false ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  {language === 'ar' ? 'المحفظة والرصيد' : 'Wallet & Balance'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">{language === 'ar' ? 'الرصيد الحالي' : 'Current Balance'}</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${parseFloat(wallet?.balance ?? shop.financial?.total_earnings ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {wallet?.transactions?.length > 0 && (
                  <>
                    <Separator />
                    <p className="text-sm font-medium">{language === 'ar' ? 'آخر المعاملات' : 'Recent Transactions'}</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {wallet.transactions.slice(0, 8).map((tx, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                          <span className="text-muted-foreground truncate">{tx.type || tx.description || (tx.order_id ? `Order #${tx.order_id}` : '-')}</span>
                          <span className={parseFloat(tx.amount || 0) >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {parseFloat(tx.amount || 0) >= 0 ? '+' : ''}${parseFloat(tx.amount || 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {shop.image_url && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  {language === 'ar' ? 'صورة المتجر' : 'Shop Image'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full max-w-md h-64 rounded-xl overflow-hidden border">
                  <img src={getImageSrc(shop.image_url)} alt={shop.name} className="w-full h-full object-cover" />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Plan & Access (companies only) - Plans, Access and Permissions (Figma) */}
        {isCompany && (
          <TabsContent value="plan-access" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  {language === 'ar' ? 'الخطة والوصول والصلاحيات' : 'Plan, Access & Permissions'}
                </CardTitle>
                <CardDescription>
                  {language === 'ar' ? 'حالة الموافقة والخطة الحالية وحدود الاستخدام حسب Figma (Plans, Access and Permissions)' : 'Approval status, current plan and usage limits (Figma: Plans, Access and Permissions)'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'حالة الوصول' : 'Access status'}</p>
                    <Badge className={vendorStatusVariant}>{vendorStatusLabel}</Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      {language === 'ar' ? 'الموافقة / الرفض / الإيقاف من الأعلى' : 'Approve / Reject / Suspend from header'}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'الخطة الحالية' : 'Current plan'}</p>
                    {companyPlan ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{companyPlan.name_ar || companyPlan.name}</span>
                        {companyPlan.price != null && Number(companyPlan.price) > 0 && (
                          <span className="text-sm text-muted-foreground">— {Number(companyPlan.price).toFixed(2)} EGP</span>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">{language === 'ar' ? 'لا توجد خطة معينة' : 'No plan assigned'}</p>
                    )}
                    {companyPlans.length > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <select
                          className="rounded-md border border-input bg-background px-3 py-2 text-sm w-full max-w-xs"
                          value={companyPlan?.id ?? ''}
                          onChange={(e) => handleUpdatePlan(e.target.value)}
                          disabled={updatingPlan}
                        >
                          <option value="">{language === 'ar' ? '— اختر خطة —' : '— Select plan —'}</option>
                          {companyPlans.map((p) => (
                            <option key={p.id} value={p.id}>{p.name_ar || p.name} {p.max_products === 0 ? (language === 'ar' ? '(غير محدود)' : '(Unlimited)') : `(${p.max_products} ${language === 'ar' ? 'منتج' : 'products'})`}</option>
                          ))}
                        </select>
                        {updatingPlan && <span className="text-sm text-muted-foreground">{language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</span>}
                      </div>
                    )}
                  </div>
                </div>

                {companyPlan && (
                  <>
                    <div>
                      <p className="text-sm font-medium mb-2">{language === 'ar' ? 'استخدام الخطة (الحدود)' : 'Plan usage (limits)'}</p>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="rounded-lg bg-muted/50 p-3 flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">{language === 'ar' ? 'منتجات الشركة' : 'Company products'}</span>
                          <span className="font-mono text-sm">{companyPlanUsage.products}{companyPlan.max_products > 0 ? ` / ${companyPlan.max_products}` : (language === 'ar' ? ' (غير محدود)' : ' (unlimited)')}</span>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3 flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">{language === 'ar' ? 'الفروع' : 'Branches'}</span>
                          <span className="font-mono text-sm">{companyPlanUsage.branches}{companyPlan.max_branches > 0 ? ` / ${companyPlan.max_branches}` : (language === 'ar' ? ' (غير محدود)' : ' (unlimited)')}</span>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3 flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">{language === 'ar' ? 'المندوبون' : 'Representatives'}</span>
                          <span className="font-mono text-sm">{companyPlanUsage.representatives}{companyPlan.max_representatives > 0 ? ` / ${companyPlan.max_representatives}` : (language === 'ar' ? ' (غير محدود)' : ' (unlimited)')}</span>
                        </div>
                      </div>
                    </div>
                    {companyPlan.features && Array.isArray(companyPlan.features) && companyPlan.features.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">{language === 'ar' ? 'الصلاحيات والميزات' : 'Permissions & features'}</p>
                        <div className="flex flex-wrap gap-2">
                          {companyPlan.features.map((f, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{typeof f === 'string' ? f : (f?.name || f?.key || '-')}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Wallet - full control */}
        <TabsContent value="wallet" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{language === 'ar' ? 'المحفظة والتحكم الكامل' : 'Wallet & full control'}</CardTitle>
            <Button onClick={() => setWalletAdjustOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              {language === 'ar' ? 'تعديل الرصيد' : 'Adjust balance'}
            </Button>
          </div>
          {fullWallet && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الرصيد المتاح' : 'Available balance'}</p>
                    <p className="text-2xl font-bold text-green-600">{Number(fullWallet.summary?.available_balance ?? 0).toFixed(2)} EGP</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي الإيرادات' : 'Total revenue'}</p>
                    <p className="text-2xl font-bold">{Number(fullWallet.summary?.total_revenue ?? 0).toFixed(2)} EGP</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'نسبة الدكان من الأرباح' : 'Shop profit share'}</p>
                    <p className="text-2xl font-bold">{Number(fullWallet.summary?.profit_share_percent ?? 0).toFixed(1)}%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'عمولة المنصة' : 'Platform commission'}</p>
                    <p className="text-2xl font-bold">{Number(fullWallet.summary?.total_commission ?? 0).toFixed(2)} EGP</p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{language === 'ar' ? 'المبيعات حسب الفترة' : 'Sales by period'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">{language === 'ar' ? 'اليوم' : 'Today'}</p>
                      <p className="text-xl font-bold">{Number(fullWallet.sales?.today?.amount ?? 0).toFixed(2)} EGP</p>
                      <p className="text-xs text-muted-foreground">{fullWallet.sales?.today?.orders_count ?? 0} {language === 'ar' ? 'طلب' : 'orders'}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">{language === 'ar' ? 'هذا الشهر' : 'This month'}</p>
                      <p className="text-xl font-bold">{Number(fullWallet.sales?.this_month?.amount ?? 0).toFixed(2)} EGP</p>
                      <p className="text-xs text-muted-foreground">{fullWallet.sales?.this_month?.orders_count ?? 0} {language === 'ar' ? 'طلب' : 'orders'}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">{language === 'ar' ? 'هذه السنة' : 'This year'}</p>
                      <p className="text-xl font-bold">{Number(fullWallet.sales?.this_year?.amount ?? 0).toFixed(2)} EGP</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{language === 'ar' ? 'سجل المعاملات' : 'Transactions'}</CardTitle>
                </CardHeader>
                <CardContent>
                  {fullWallet.transactions?.length ? (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {fullWallet.transactions.map((tx, idx) => (
                        <div key={tx.id || idx} className="flex items-center justify-between py-2 border-b text-sm">
                          <span className="text-muted-foreground">
                            {tx.source === 'adjustment' ? (tx.description || (tx.type === 'credit' ? (language === 'ar' ? 'إضافة رصيد' : 'Credit') : (language === 'ar' ? 'خصم' : 'Debit'))) : `#${tx.order_number || tx.order_id || '-'}`}
                          </span>
                          <span className={Number(tx.amount || 0) >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {Number(tx.amount || 0) >= 0 ? '+' : ''}{Number(tx.amount || 0).toFixed(2)} EGP
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground py-4">{language === 'ar' ? 'لا توجد معاملات' : 'No transactions yet'}</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
          {activeTab === 'wallet' && !fullWallet && (
            <p className="text-muted-foreground">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
          )}
        </TabsContent>

        {/* Branches */}
        <TabsContent value="branches" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'فروع المتجر' : 'Shop branches'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'إدارة عناوين الفروع' : 'Manage branch addresses'}</CardDescription>
            </CardHeader>
            <CardContent>
              {(shop.branches || []).length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">{language === 'ar' ? 'لا توجد فروع' : 'No branches yet'}</p>
              ) : (
                <ul className="space-y-3">
                  {(shop.branches || []).map((b) => (
                    <li key={b.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">{b.name_ar || b.name}</p>
                        {b.address && <p className="text-sm text-muted-foreground">{b.address}</p>}
                        {b.phone && <p className="text-sm">{b.phone}</p>}
                        <Badge variant={b.is_active !== false ? 'default' : 'secondary'} className="mt-1">{b.is_active !== false ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive')}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => showConfirm(language === 'ar' ? 'حذف هذا الفرع؟' : 'Delete this branch?', () => api.delete(`/admin/shops/${id}/branches/${b.id}`).then(() => { showToast.success(language === 'ar' ? 'تم الحذف' : 'Deleted'); fetchShop(); }))}>{language === 'ar' ? 'حذف' : 'Delete'}</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <Button variant="outline" className="mt-4 gap-2" onClick={() => setAddBranchOpen(true)}>
                <Plus className="w-4 h-4" />
                {language === 'ar' ? 'إضافة فرع' : 'Add branch'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'الأوراق والتصاريح' : 'Documents & permits'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'رخص وتصاريح المتجر' : 'Shop licenses and permits'}</CardDescription>
            </CardHeader>
            <CardContent>
              {(shop.documents || []).length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">{language === 'ar' ? 'لا توجد وثائق' : 'No documents yet'}</p>
              ) : (
                <ul className="space-y-3">
                  {(shop.documents || []).map((d) => (
                    <li key={d.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">{d.title_ar || d.title || d.type}</p>
                        <p className="text-sm text-muted-foreground">{d.type} {d.reference_number && ` • ${d.reference_number}`}</p>
                        {d.expires_at && <p className="text-xs">{language === 'ar' ? 'ينتهي' : 'Expires'}: {format(new Date(d.expires_at), 'yyyy-MM-dd')}</p>}
                        <Badge variant={d.is_verified ? 'default' : 'secondary'} className="mt-1">{d.is_verified ? (language === 'ar' ? 'موثق' : 'Verified') : (language === 'ar' ? 'غير موثق' : 'Unverified')}</Badge>
                      </div>
                      <div className="flex gap-2">
                        {d.file_url && <Button variant="outline" size="sm" asChild><a href={d.file_url} target="_blank" rel="noopener noreferrer">{language === 'ar' ? 'عرض' : 'View'}</a></Button>}
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => showConfirm(language === 'ar' ? 'حذف هذه الوثيقة؟' : 'Delete this document?', () => api.delete(`/admin/shops/${id}/documents/${d.id}`).then(() => { showToast.success(language === 'ar' ? 'تم الحذف' : 'Deleted'); fetchShop(); }))}>{language === 'ar' ? 'حذف' : 'Delete'}</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <Button variant="outline" className="mt-4 gap-2" onClick={() => setAddDocOpen(true)}>
                <Plus className="w-4 h-4" />
                {language === 'ar' ? 'إضافة وثيقة' : 'Add document'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product reports */}
        <TabsContent value="product-reports" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'تقارير المنتجات الشاملة' : 'Comprehensive product reports'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'مبيعات وإيرادات كل منتج حسب الفترة' : 'Sales and revenue per product by period'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <Label>{language === 'ar' ? 'من' : 'From'}</Label>
                  <Input type="date" value={reportFrom} onChange={(e) => setReportFrom(e.target.value)} className="w-40" />
                </div>
                <div>
                  <Label>{language === 'ar' ? 'إلى' : 'To'}</Label>
                  <Input type="date" value={reportTo} onChange={(e) => setReportTo(e.target.value)} className="w-40" />
                </div>
                <Button onClick={fetchProductReports} disabled={productReportsLoading} className="gap-2">
                  {productReportsLoading ? (language === 'ar' ? 'جاري التحميل...' : 'Loading...') : (language === 'ar' ? 'عرض التقرير' : 'Show report')}
                </Button>
              </div>
              {productReportsData && (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">{language === 'ar' ? 'عدد المنتجات المباعة' : 'Products sold'}</p>
                      <p className="text-2xl font-bold">{productReportsData.totals?.products_count ?? 0}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي الكميات' : 'Total quantity'}</p>
                      <p className="text-2xl font-bold">{productReportsData.totals?.total_quantity_sold ?? 0}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي الإيرادات' : 'Total revenue'}</p>
                      <p className="text-2xl font-bold">{Number(productReportsData.totals?.total_revenue ?? 0).toFixed(2)} EGP</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left p-3 font-semibold">{language === 'ar' ? 'المنتج' : 'Product'}</th>
                          <th className="text-left p-3 font-semibold">{language === 'ar' ? 'الكمية المباعة' : 'Qty sold'}</th>
                          <th className="text-left p-3 font-semibold">{language === 'ar' ? 'الإيراد' : 'Revenue'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(productReportsData.products || []).map((row, i) => (
                          <tr key={row.product_id || i} className="border-b">
                            <td className="p-3">{row.product_name_ar || row.product_name || '-'}</td>
                            <td className="p-3">{row.total_quantity_sold ?? 0}</td>
                            <td className="p-3 font-medium">{Number(row.total_revenue ?? 0).toFixed(2)} EGP</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products */}
        <TabsContent value="products" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'منتجات المتجر' : 'Shop Products'}</CardTitle>
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'عرض فعلي لجميع المنتجات' : 'Full list of shop products'}</p>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">{language === 'ar' ? 'لا توجد منتجات' : 'No products yet'}</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {products.map((product) => (
                    <motion.div
                      key={product.id}
                      whileHover={{ y: -4 }}
                      className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-square bg-muted relative">
                        {(product.first_image_url || (product.images && product.images[0])) ? (
                          <img src={getImageSrc(product.first_image_url || product.images?.[0])} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold truncate" title={product.name}>{product.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          ${Number(product.price || 0).toFixed(2)} {language === 'ar' ? '• كميّة' : '• Qty'}: {product.stock_quantity ?? 0}
                        </p>
                        <Button variant="ghost" size="sm" className="w-full mt-2 gap-1" onClick={() => navigate(`/admin/products/${product.id}`)}>
                          <Eye className="h-4 w-4" />
                          {language === 'ar' ? 'عرض' : 'View'}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders */}
        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'طلبات المتجر' : 'Shop Orders'}</CardTitle>
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'قائمة الطلبات المرتبطة بهذا المتجر' : 'Orders linked to this shop'}</p>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">{language === 'ar' ? 'لا توجد طلبات' : 'No orders yet'}</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left p-3 font-semibold">{language === 'ar' ? 'رقم الطلب' : 'Order ID'}</th>
                        <th className="text-left p-3 font-semibold">{language === 'ar' ? 'العميل' : 'Customer'}</th>
                        <th className="text-left p-3 font-semibold">{language === 'ar' ? 'المبلغ' : 'Total'}</th>
                        <th className="text-left p-3 font-semibold">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                        <th className="text-left p-3 font-semibold">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                        <th className="text-left p-3 font-semibold">{language === 'ar' ? 'إجراء' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b hover:bg-muted/30">
                          <td className="p-3 font-medium">#{order.id}</td>
                          <td className="p-3">{order.user?.name || order.user?.username || order.user?.email || '-'}</td>
                          <td className="p-3">${Number(order.total_amount ?? order.total ?? 0).toFixed(2)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${statusColors[order.status] || statusColors.received}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground">{order.created_at ? format(new Date(order.created_at), 'MMM dd, yyyy HH:mm') : '-'}</td>
                          <td className="p-3">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/orders/${order.id}`)} className="gap-1">
                              <Eye className="h-4 w-4" />
                              {language === 'ar' ? 'عرض' : 'View'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders from reps (this shop as customer of company orders) */}
        {!isCompany && (
          <TabsContent value="orders-from-reps" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'طلبات من المندوبين' : 'Orders from reps'}</CardTitle>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'طلبات وردت لهذا المتجر من مندوبي الشركات (شراء منتجات شركة)' : 'Company orders where this shop is the customer'}</p>
              </CardHeader>
              <CardContent>
                {ordersFromRepsLoading ? (
                  <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" /></div>
                ) : (ordersFromReps.data || []).length === 0 ? (
                  <p className="text-center py-12 text-muted-foreground">{language === 'ar' ? 'لا توجد طلبات من مندوبين' : 'No orders from reps yet'}</p>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50 border-b">
                            <th className="text-left p-3 font-semibold">{language === 'ar' ? 'رقم' : 'Order'}</th>
                            <th className="text-left p-3 font-semibold">{language === 'ar' ? 'المندوب' : 'Rep'}</th>
                            <th className="text-left p-3 font-semibold">{language === 'ar' ? 'المبلغ' : 'Total'}</th>
                            <th className="text-left p-3 font-semibold">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                            <th className="text-left p-3 font-semibold">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(ordersFromReps.data || []).map((o) => (
                            <tr key={o.id} className="border-b hover:bg-muted/30">
                              <td className="p-3 font-medium">{o.order_number || '#' + o.id}</td>
                              <td className="p-3">{o.representative?.user?.username || o.representative?.user?.email || '-'}</td>
                              <td className="p-3">{Number(o.total_amount || 0).toFixed(2)} EGP</td>
                              <td className="p-3"><span className="px-2 py-1 rounded-full text-xs bg-muted">{o.status}</span></td>
                              <td className="p-3 text-muted-foreground">{o.ordered_at || o.created_at ? format(new Date(o.ordered_at || o.created_at), 'MMM dd, yyyy') : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {ordersFromReps.pagination && ordersFromReps.pagination.last_page > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <Button variant="outline" size="sm" disabled={ordersFromReps.pagination.current_page <= 1} onClick={() => fetchOrdersFromReps(ordersFromReps.pagination.current_page - 1)}>{language === 'ar' ? 'السابق' : 'Previous'}</Button>
                        <span className="text-sm text-muted-foreground">{ordersFromReps.pagination.current_page} / {ordersFromReps.pagination.last_page}</span>
                        <Button variant="outline" size="sm" disabled={ordersFromReps.pagination.current_page >= ordersFromReps.pagination.last_page} onClick={() => fetchOrdersFromReps(ordersFromReps.pagination.current_page + 1)}>{language === 'ar' ? 'التالي' : 'Next'}</Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Customers */}
        <TabsContent value="customers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'عملاء المتجر' : 'Shop Customers'}</CardTitle>
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'عملاء قاموا بالشراء من هذا المتجر' : 'Customers who ordered from this shop'}</p>
            </CardHeader>
            <CardContent>
              {customersFromOrders.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">{language === 'ar' ? 'لا يوجد عملاء بعد' : 'No customers yet'}</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left p-3 font-semibold">{language === 'ar' ? 'الاسم' : 'Name'}</th>
                        <th className="text-left p-3 font-semibold">{language === 'ar' ? 'البريد' : 'Email'}</th>
                        <th className="text-left p-3 font-semibold">{language === 'ar' ? 'عدد الطلبات' : 'Orders'}</th>
                        <th className="text-left p-3 font-semibold">{language === 'ar' ? 'إجمالي المشتريات' : 'Total Spent'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customersFromOrders.map((c) => (
                        <tr key={c.id} className="border-b hover:bg-muted/30">
                          <td className="p-3 font-medium">{c.name}</td>
                          <td className="p-3 text-muted-foreground">{c.email}</td>
                          <td className="p-3">{c.ordersCount}</td>
                          <td className="p-3 font-medium text-green-600">${c.totalSpent.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Representatives (company) */}
        <TabsContent value="representatives" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{language === 'ar' ? 'مندوبو الشركة / المتجر' : 'Representatives'}</CardTitle>
                  <CardDescription>{language === 'ar' ? 'المندوبون الذين يقومون بالزيارات لهذه الشركة' : 'Representatives who do visits for this company'}</CardDescription>
                </div>
                <Button onClick={() => setRepFormOpen(true)} className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  {language === 'ar' ? 'إضافة مندوب' : 'Add representative'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(shop.representatives || []).length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">{language === 'ar' ? 'لا يوجد مندوبون بعد' : 'No representatives yet'}</p>
              ) : (
                <ul className="space-y-3">
                  {(shop.representatives || []).map((r) => (
                    <li key={r.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">{r.user?.username || r.user?.email || r.user?.name || `#${r.id}`}</p>
                        <p className="text-sm text-muted-foreground">{r.territory || '-'}</p>
                        <Badge variant={r.status === 'active' ? 'default' : 'secondary'} className="mt-1">{r.status || '-'}</Badge>
                      </div>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => showConfirm(language === 'ar' ? 'إزالة المندوب من هذه الشركة؟' : 'Remove representative from this company?', () => api.delete(`/admin/representatives/${r.id}`).then(() => { showToast.success(language === 'ar' ? 'تم الحذف' : 'Deleted'); fetchShop(); }).catch((e) => showToast.error(e.response?.data?.message)))}>
                        {language === 'ar' ? 'إزالة' : 'Remove'}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visits (by company representatives) */}
        <TabsContent value="visits" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'زيارات  مندوبين المبيعات ' : 'Representative visits'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'الزيارات التي قام بها مندوبو هذه الشركة' : 'Visits done by this company\'s representatives'}</CardDescription>
            </CardHeader>
            <CardContent>
              {companyVisitsLoading ? (
                <p className="text-center py-8 text-muted-foreground">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
              ) : (companyVisits.data || []).length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">{language === 'ar' ? 'لا توجد زيارات' : 'No visits yet'}</p>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left p-3 font-semibold">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                          <th className="text-left p-3 font-semibold">{language === 'ar' ? 'المندوب' : 'Representative'}</th>
                          <th className="text-left p-3 font-semibold">{language === 'ar' ? 'الغرض' : 'Purpose'}</th>
                          <th className="text-left p-3 font-semibold">{language === 'ar' ? 'المتجر/الطبيب' : 'Shop/Doctor'}</th>
                          <th className="text-left p-3 font-semibold">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companyVisits.data.map((v) => (
                          <tr key={v.id} className="border-b hover:bg-muted/30">
                            <td className="p-3">{v.visit_date ? format(new Date(v.visit_date), 'yyyy-MM-dd') : '-'} {v.visit_time || ''}</td>
                            <td className="p-3">{v.representative?.user?.username || v.representative?.user?.email || '-'}</td>
                            <td className="p-3 max-w-[200px] truncate" title={v.purpose}>{v.purpose || '-'}</td>
                            <td className="p-3">{v.shop?.name || v.doctor?.name || '-'}</td>
                            <td className="p-3"><Badge variant="secondary">{v.status || '-'}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {companyVisits.pagination && companyVisits.pagination.last_page > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <Button variant="outline" size="sm" disabled={companyVisits.pagination.current_page <= 1} onClick={() => fetchCompanyVisits(companyVisits.pagination.current_page - 1)}>{language === 'ar' ? 'السابق' : 'Previous'}</Button>
                      <span className="py-2 text-sm text-muted-foreground">{companyVisits.pagination.current_page} / {companyVisits.pagination.last_page}</span>
                      <Button variant="outline" size="sm" disabled={companyVisits.pagination.current_page >= companyVisits.pagination.last_page} onClick={() => fetchCompanyVisits(companyVisits.pagination.current_page + 1)}>{language === 'ar' ? 'التالي' : 'Next'}</Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company products (أدوية، تراكيب، أخرى) - منفصلة عن منتجات المتجر - للشركات فقط */}
        {isCompany && (
        <TabsContent value="company-products" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{language === 'ar' ? 'منتجات الشركة' : 'Company products'}</CardTitle>
                  <CardDescription>{language === 'ar' ? 'أدوية، تراكيب، منتجات أخرى - يبيعها المندوبون للمتاجر والأطباء' : 'Drugs, compounds, other - sold by reps to shops and doctors'}</CardDescription>
                </div>
                <Button onClick={() => { setCompanyProductForm({ id: null, name: '', name_ar: '', sku: '', description: '', description_ar: '', product_type: 'other', unit: '', unit_price: '', stock_quantity: 0, is_active: true, images: [] }); setCompanyProductNewImages([]); setCompanyProductFormOpen(true); }} className="gap-2">
                  <Plus className="w-4 h-4" />
                  {language === 'ar' ? 'إضافة منتج شركة' : 'Add company product'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(shop.company_products || []).length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">{language === 'ar' ? 'لا توجد منتجات شركة بعد' : 'No company products yet'}</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(shop.company_products || []).map((p) => {
                    const imgUrl = (Array.isArray(p.images) && p.images[0]) ? p.images[0] : (p.first_image_url || null);
                    const productTypeLabel = p.product_type === 'drug' ? (language === 'ar' ? 'دواء' : 'Drug') : p.product_type === 'compound' ? (language === 'ar' ? 'تركيب' : 'Compound') : (language === 'ar' ? 'أخرى' : 'Other');
                    return (
                    <div key={p.id} className="rounded-xl border overflow-hidden flex flex-col">
                      <div className="aspect-[4/3] bg-muted flex items-center justify-center relative">
                        {imgUrl ? (
                          <img src={getImageSrc(imgUrl)} alt={p.name_ar || p.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-12 h-12 text-muted-foreground" />
                        )}
                        <Badge variant={p.is_active ? 'default' : 'secondary'} className="absolute top-2 right-2">{p.is_active ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive')}</Badge>
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <p className="font-medium">{p.name_ar || p.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{productTypeLabel}</p>
                        <p className="text-sm font-medium mt-1">{Number(p.unit_price || 0).toFixed(2)} EGP {p.unit ? `/ ${p.unit}` : ''}</p>
                        <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الكمية:' : 'Stock:'} {p.stock_quantity ?? 0}</p>
                        {p.sku && <p className="text-xs text-muted-foreground">{language === 'ar' ? 'كود:' : 'SKU:'} {p.sku}</p>}
                        {(p.description || p.description_ar) && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{(p.description_ar || p.description || '').slice(0, 80)}{((p.description_ar || p.description || '').length > 80) ? '…' : ''}</p>
                        )}
                        <div className="flex gap-1 mt-3 pt-3 border-t">
                          <Button variant="ghost" size="sm" className="flex-1" onClick={() => { setCompanyProductForm({ id: p.id, name: p.name, name_ar: p.name_ar || '', sku: p.sku || '', description: p.description || '', description_ar: p.description_ar || '', product_type: p.product_type || 'other', unit: p.unit || '', unit_price: p.unit_price, stock_quantity: p.stock_quantity || 0, is_active: p.is_active !== false, images: Array.isArray(p.images) ? p.images : (p.first_image_url ? [p.first_image_url] : []) }); setCompanyProductNewImages([]); setCompanyProductFormOpen(true); }}>{language === 'ar' ? 'تعديل' : 'Edit'}</Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => showConfirm(language === 'ar' ? 'حذف منتج الشركة؟' : 'Delete company product?', () => api.delete(`/admin/shops/${id}/company-products/${p.id}`).then(() => { showToast.success(language === 'ar' ? 'تم الحذف' : 'Deleted'); fetchShop(); }))}>{language === 'ar' ? 'حذف' : 'Delete'}</Button>
                        </div>
                      </div>
                    </div>
                  );})}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {/* Company sales (مبيعات  مندوبين المبيعات  لمتاجر/أطباء) - للشركات فقط */}
        {isCompany && (
        <TabsContent value="company-orders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'مبيعات الشركة' : 'Company sales'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'طلبات من  مندوبين المبيعات  لمتاجر وأطباء (مرتبطة بالزيارات)' : 'Orders from reps to shops and doctors (linked to visits)'}</CardDescription>
            </CardHeader>
            <CardContent>
              {companyOrdersLoading ? (
                <p className="text-center py-8 text-muted-foreground">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
              ) : (companyOrders.data || []).length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">{language === 'ar' ? 'لا توجد مبيعات' : 'No company sales yet'}</p>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left p-3 font-semibold">{language === 'ar' ? 'رقم الطلب' : 'Order'}</th>
                          <th className="text-left p-3 font-semibold">{language === 'ar' ? 'المندوب' : 'Rep'}</th>
                          <th className="text-left p-3 font-semibold">{language === 'ar' ? 'العميل' : 'Customer'}</th>
                          <th className="text-left p-3 font-semibold">{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                          <th className="text-left p-3 font-semibold">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                          <th className="text-left p-3 font-semibold">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companyOrders.data.map((o) => (
                          <tr key={o.id} className="border-b hover:bg-muted/30">
                            <td className="p-3 font-mono">{o.order_number || o.id}</td>
                            <td className="p-3">{o.representative?.user?.username || o.representative?.user?.email || '-'}</td>
                            <td className="p-3">{o.customer_shop?.name || o.customer_doctor?.name || o.customer?.name || `#${o.customer_id}`}</td>
                            <td className="p-3 font-medium">{Number(o.total_amount || 0).toFixed(2)} EGP</td>
                            <td className="p-3"><Badge variant="secondary">{o.status || '-'}</Badge></td>
                            <td className="p-3 text-muted-foreground">{o.ordered_at ? format(new Date(o.ordered_at), 'yyyy-MM-dd HH:mm') : (o.created_at ? format(new Date(o.created_at), 'yyyy-MM-dd') : '-')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {companyOrders.pagination && companyOrders.pagination.last_page > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <Button variant="outline" size="sm" disabled={companyOrders.pagination.current_page <= 1} onClick={() => fetchCompanyOrders(companyOrders.pagination.current_page - 1)}>{language === 'ar' ? 'السابق' : 'Previous'}</Button>
                      <span className="py-2 text-sm text-muted-foreground">{companyOrders.pagination.current_page} / {companyOrders.pagination.last_page}</span>
                      <Button variant="outline" size="sm" disabled={companyOrders.pagination.current_page >= companyOrders.pagination.last_page} onClick={() => fetchCompanyOrders(companyOrders.pagination.current_page + 1)}>{language === 'ar' ? 'التالي' : 'Next'}</Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {/* Revenue */}
        <TabsContent value="revenue" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'ملخص الإيرادات' : 'Revenue Summary'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <span className="text-muted-foreground">{language === 'ar' ? 'إجمالي الإيرادات من الطلبات' : 'Total Revenue from Orders'}</span>
                  <span className="text-2xl font-bold text-primary">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <span className="text-muted-foreground">{language === 'ar' ? 'عدد الطلبات' : 'Total Orders'}</span>
                  <span className="text-xl font-bold">{orders.length}</span>
                </div>
                {shop.financial && (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <span className="text-muted-foreground">{language === 'ar' ? 'أرباح مسجلة (مالية)' : 'Recorded Earnings (Financial)'}</span>
                    <span className="text-xl font-bold">${parseFloat(shop.financial.total_earnings || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'أحدث الطلبات (إيراد)' : 'Latest Orders (Revenue)'}</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{language === 'ar' ? 'لا توجد طلبات' : 'No orders'}</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {orders.slice(0, 15).map((order) => (
                      <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <span className="font-medium">#{order.id}</span>
                          <span className="text-muted-foreground text-sm ml-2">{order.user?.username || order.user?.email || '-'}</span>
                        </div>
                        <span className="font-medium text-green-600">${Number(order.total_amount ?? order.total ?? 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports */}
        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'استخراج التقارير' : 'Export Reports'}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'قم بتحميل تقرير شامل عن المتجر يشمل الإحصائيات والبيانات الأساسية.' : 'Download a comprehensive report including stats and basic data.'}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button onClick={() => exportReport('csv')} className="gap-2">
                  <Download className="h-4 w-4" />
                  {language === 'ar' ? 'تقرير CSV' : 'CSV Report'}
                </Button>
                <Button variant="outline" onClick={() => window.print()} className="gap-2">
                  <FileText className="h-4 w-4" />
                  {language === 'ar' ? 'طباعة الصفحة' : 'Print Page'}
                </Button>
              </div>
              <div className="rounded-lg border p-4 bg-muted/30">
                <p className="text-sm font-medium mb-2">{language === 'ar' ? 'محتويات التقرير' : 'Report contents'}</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>{language === 'ar' ? 'بيانات المتجر (الاسم، الفئة، العنوان، الهاتف)' : 'Shop data (name, category, address, phone)'}</li>
                  <li>{language === 'ar' ? 'عدد المنتجات والطلبات والعملاء' : 'Products, orders and customers count'}</li>
                  <li>{language === 'ar' ? 'إجمالي الإيرادات' : 'Total revenue'}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={walletAdjustOpen} onOpenChange={setWalletAdjustOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تعديل الرصيد' : 'Adjust balance'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>{language === 'ar' ? 'النوع' : 'Type'}</Label>
              <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={walletAdjustType} onChange={(e) => setWalletAdjustType(e.target.value)}>
                <option value="credit">{language === 'ar' ? 'إضافة رصيد' : 'Credit'}</option>
                <option value="debit">{language === 'ar' ? 'خصم' : 'Debit'}</option>
              </select>
            </div>
            <div>
              <Label>{language === 'ar' ? 'المبلغ (EGP)' : 'Amount (EGP)'}</Label>
              <Input type="number" min="0.01" step="0.01" value={walletAdjustAmount} onChange={(e) => setWalletAdjustAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label>{language === 'ar' ? 'الوصف (اختياري)' : 'Description (optional)'}</Label>
              <Input value={walletAdjustDesc} onChange={(e) => setWalletAdjustDesc(e.target.value)} placeholder={language === 'ar' ? 'سبب التعديل' : 'Reason'} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWalletAdjustOpen(false)}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleWalletAdjust}>{language === 'ar' ? 'تنفيذ' : 'Apply'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addBranchOpen} onOpenChange={setAddBranchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'إضافة فرع' : 'Add branch'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>{language === 'ar' ? 'اسم الفرع' : 'Branch name'} *</Label>
              <Input value={branchForm.name} onChange={(e) => setBranchForm((f) => ({ ...f, name: e.target.value }))} placeholder={language === 'ar' ? 'اسم الفرع' : 'Branch name'} />
            </div>
            <div>
              <Label>{language === 'ar' ? 'العنوان' : 'Address'}</Label>
              <Input value={branchForm.address} onChange={(e) => setBranchForm((f) => ({ ...f, address: e.target.value }))} placeholder={language === 'ar' ? 'العنوان' : 'Address'} />
            </div>
            <div>
              <Label>{language === 'ar' ? 'الهاتف' : 'Phone'}</Label>
              <Input value={branchForm.phone} onChange={(e) => setBranchForm((f) => ({ ...f, phone: e.target.value }))} placeholder={language === 'ar' ? 'الهاتف' : 'Phone'} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="branch_active" checked={branchForm.is_active} onChange={(e) => setBranchForm((f) => ({ ...f, is_active: e.target.checked }))} />
              <Label htmlFor="branch_active">{language === 'ar' ? 'نشط' : 'Active'}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddBranchOpen(false)}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleAddBranch}>{language === 'ar' ? 'إضافة' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addDocOpen} onOpenChange={setAddDocOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'إضافة وثيقة / تصريح' : 'Add document / permit'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>{language === 'ar' ? 'النوع' : 'Type'}</Label>
              <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={docForm.type} onChange={(e) => setDocForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="permit">{language === 'ar' ? 'تصريح' : 'Permit'}</option>
                <option value="license">{language === 'ar' ? 'رخصة' : 'License'}</option>
                <option value="tax_card">{language === 'ar' ? 'البطاقة الضريبية' : 'Tax card'}</option>
                <option value="commercial_register">{language === 'ar' ? 'السجل التجاري' : 'Commercial register'}</option>
                <option value="other">{language === 'ar' ? 'أخرى' : 'Other'}</option>
              </select>
            </div>
            <div>
              <Label>{language === 'ar' ? 'العنوان' : 'Title'}</Label>
              <Input value={docForm.title} onChange={(e) => setDocForm((f) => ({ ...f, title: e.target.value }))} placeholder={language === 'ar' ? 'العنوان' : 'Title'} />
            </div>
            <div>
              <Label>{language === 'ar' ? 'رقم المرجع' : 'Reference number'}</Label>
              <Input value={docForm.reference_number} onChange={(e) => setDocForm((f) => ({ ...f, reference_number: e.target.value }))} placeholder={language === 'ar' ? 'رقم المرجع' : 'Ref.'} />
            </div>
            <div>
              <Label>{language === 'ar' ? 'تاريخ الانتهاء' : 'Expiry date'}</Label>
              <Input type="date" value={docForm.expires_at} onChange={(e) => setDocForm((f) => ({ ...f, expires_at: e.target.value }))} />
            </div>
            <div>
              <Label>{language === 'ar' ? 'الملف (PDF أو صورة)' : 'File (PDF or image)'}</Label>
              <Input type="file" accept=".pdf,image/*" onChange={(e) => setDocFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDocOpen(false)}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleAddDocument}>{language === 'ar' ? 'إضافة' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={repFormOpen} onOpenChange={setRepFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'إضافة مندوب للشركة' : 'Add representative'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>{language === 'ar' ? 'المستخدم' : 'User'} *</Label>
              <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={repForm.user_id} onChange={(e) => setRepForm((f) => ({ ...f, user_id: e.target.value }))}>
                <option value="">{language === 'ar' ? 'اختر مستخدم' : 'Select user'}</option>
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>{u.username || u.email || u.name || `#${u.id}`}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>{language === 'ar' ? 'المنطقة / الإقليم' : 'Territory'} *</Label>
              <Input value={repForm.territory} onChange={(e) => setRepForm((f) => ({ ...f, territory: e.target.value }))} placeholder={language === 'ar' ? 'المنطقة' : 'Territory'} />
            </div>
            <div>
              <Label>{language === 'ar' ? 'الحالة' : 'Status'}</Label>
              <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={repForm.status} onChange={(e) => setRepForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="active">{language === 'ar' ? 'نشط' : 'Active'}</option>
                <option value="pending_approval">{language === 'ar' ? 'قيد المراجعة' : 'Pending'}</option>
                <option value="suspended">{language === 'ar' ? 'موقوف' : 'Suspended'}</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRepFormOpen(false)}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleAddRepresentative}>{language === 'ar' ? 'إضافة' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={companyProductFormOpen} onOpenChange={setCompanyProductFormOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{companyProductForm.id ? (language === 'ar' ? 'تعديل منتج الشركة' : 'Edit company product') : (language === 'ar' ? 'إضافة منتج شركة' : 'Add company product')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>{language === 'ar' ? 'الاسم' : 'Name'} *</Label>
              <Input value={companyProductForm.name} onChange={(e) => setCompanyProductForm((f) => ({ ...f, name: e.target.value }))} placeholder={language === 'ar' ? 'اسم المنتج' : 'Product name'} />
            </div>
            <div>
              <Label>{language === 'ar' ? 'الاسم بالعربية' : 'Name (Arabic)'}</Label>
              <Input value={companyProductForm.name_ar} onChange={(e) => setCompanyProductForm((f) => ({ ...f, name_ar: e.target.value }))} placeholder={language === 'ar' ? 'الاسم بالعربية' : 'Name (Arabic)'} />
            </div>
            <div>
              <Label>{language === 'ar' ? 'نوع المنتج / الفئة' : 'Product type (category)'}</Label>
              <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={companyProductForm.product_type} onChange={(e) => setCompanyProductForm((f) => ({ ...f, product_type: e.target.value }))}>
                <option value="drug">{language === 'ar' ? 'دواء' : 'Drug'}</option>
                <option value="compound">{language === 'ar' ? 'تركيب' : 'Compound'}</option>
                <option value="other">{language === 'ar' ? 'أخرى' : 'Other'}</option>
              </select>
            </div>
            <div>
              <Label>{language === 'ar' ? 'الوصف' : 'Description'}</Label>
              <textarea className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={companyProductForm.description || ''} onChange={(e) => setCompanyProductForm((f) => ({ ...f, description: e.target.value }))} placeholder={language === 'ar' ? 'وصف المنتج' : 'Product description'} />
            </div>
            <div>
              <Label>{language === 'ar' ? 'الوصف بالعربية' : 'Description (Arabic)'}</Label>
              <textarea className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={companyProductForm.description_ar || ''} onChange={(e) => setCompanyProductForm((f) => ({ ...f, description_ar: e.target.value }))} placeholder={language === 'ar' ? 'الوصف بالعربية' : 'Description (Arabic)'} />
            </div>
            <div>
              <Label>{language === 'ar' ? 'السعر (EGP)' : 'Price (EGP)'}</Label>
              <Input type="number" min="0" step="0.01" value={companyProductForm.unit_price} onChange={(e) => setCompanyProductForm((f) => ({ ...f, unit_price: e.target.value }))} />
            </div>
            <div>
              <Label>{language === 'ar' ? 'الوحدة' : 'Unit'}</Label>
              <Input value={companyProductForm.unit || ''} onChange={(e) => setCompanyProductForm((f) => ({ ...f, unit: e.target.value }))} placeholder={language === 'ar' ? 'مثال: حبة، علبة، كرتون' : 'e.g. piece, box, carton'} />
            </div>
            <div>
              <Label>{language === 'ar' ? 'الكمية بالمخزن' : 'Stock quantity'}</Label>
              <Input type="number" min="0" value={companyProductForm.stock_quantity} onChange={(e) => setCompanyProductForm((f) => ({ ...f, stock_quantity: parseInt(e.target.value, 10) || 0 }))} />
            </div>
            <div>
              <Label>{language === 'ar' ? 'SKU / كود' : 'SKU'}</Label>
              <Input value={companyProductForm.sku} onChange={(e) => setCompanyProductForm((f) => ({ ...f, sku: e.target.value }))} placeholder="SKU" />
            </div>
            <div>
              <Label>{language === 'ar' ? 'الصور' : 'Images'}</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {(companyProductForm.images || []).map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img src={getImageSrc(url)} alt="" className="h-16 w-16 rounded object-cover border" />
                    <button type="button" className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs opacity-90 group-hover:opacity-100" onClick={() => setCompanyProductForm((f) => ({ ...f, images: (f.images || []).filter((_, i) => i !== idx) }))}>×</button>
                  </div>
                ))}
                {companyProductNewImages.map((file, idx) => (
                  <div key={`new-${idx}`} className="relative group">
                    <img src={URL.createObjectURL(file)} alt="" className="h-16 w-16 rounded object-cover border" />
                    <button type="button" className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs" onClick={() => setCompanyProductNewImages((prev) => prev.filter((_, i) => i !== idx))}>×</button>
                  </div>
                ))}
                <label className="h-16 w-16 rounded border border-dashed flex items-center justify-center cursor-pointer hover:bg-muted/50 text-muted-foreground">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { const files = e.target.files; if (files?.length) setCompanyProductNewImages((prev) => [...prev, ...Array.from(files)]); e.target.value = ''; }} />
                  <Plus className="w-6 h-6" />
                </label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="cp_active" checked={companyProductForm.is_active} onChange={(e) => setCompanyProductForm((f) => ({ ...f, is_active: e.target.checked }))} />
              <Label htmlFor="cp_active">{language === 'ar' ? 'نشط' : 'Active'}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompanyProductFormOpen(false)}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleSaveCompanyProduct}>{companyProductForm.id ? (language === 'ar' ? 'حفظ' : 'Save') : (language === 'ar' ? 'إضافة' : 'Add')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
