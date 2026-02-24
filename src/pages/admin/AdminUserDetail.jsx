import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { Card } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, User, Mail, Phone, MapPin, ShoppingCart, Calendar, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import showToast from '@/lib/toast';
import { showConfirm } from '@/components/ConfirmDialog';

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    if (!id || id === 'create' || id === 'new') {
      setLoading(false);
      return;
    }
    try {
      const response = await api.get(`/admin/users/${id}`);
      const userData = response.data?.data || response.data;
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    showConfirm(
      language === 'ar' ? 'هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this user? This action cannot be undone.',
      () => {
        showToast.promise(
          (async () => {
            await api.delete(`/admin/users/${id}`);
            navigate('/admin/users');
          })(),
          {
            loading: language === 'ar' ? 'جاري حذف المستخدم...' : 'Deleting user...',
            success: language === 'ar' ? 'تم حذف المستخدم بنجاح' : 'User deleted successfully',
            error: (err) => err.response?.data?.message || (language === 'ar' ? 'فشل حذف المستخدم' : 'Failed to delete user'),
          }
        );
      }
    );
  };

  const handleSuspend = async () => {
    showToast.promise(
      (async () => {
        await api.post(`/admin/users/${id}/suspend`);
        fetchUser();
      })(),
      {
        loading: language === 'ar' ? 'جاري تعليق المستخدم...' : 'Suspending user...',
        success: language === 'ar' ? 'تم تعليق المستخدم بنجاح' : 'User suspended successfully',
        error: (err) => err.response?.data?.message || (language === 'ar' ? 'فشل تعليق المستخدم' : 'Failed to suspend user'),
      }
    );
  };

  const handleActivate = async () => {
    showToast.promise(
      (async () => {
        await api.post(`/admin/users/${id}/activate`);
        fetchUser();
      })(),
      {
        loading: language === 'ar' ? 'جاري تفعيل المستخدم...' : 'Activating user...',
        success: language === 'ar' ? 'تم تفعيل المستخدم بنجاح' : 'User activated successfully',
        error: (err) => err.response?.data?.message || (language === 'ar' ? 'فشل تفعيل المستخدم' : 'Failed to activate user'),
      }
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-24" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="p-6">
              <Skeleton className="h-6 w-36 mb-4" />
              <Skeleton className="h-20 w-full" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{language === 'ar' ? 'المستخدم غير موجود' : 'User not found'}</p>
        <Link to="/admin/users" className="text-primary mt-4 inline-block">
          {language === 'ar' ? 'رجوع إلى المستخدمين' : 'Back to Users'}
        </Link>
      </div>
    );
  }

  if (!user) return null;

  const userRole = user.role_names && user.role_names.length > 0 ? user.role_names[0] : user.role || 'user';
  const statusColor = user.status === 'active' ? 'bg-green-100 text-green-800' : 
                      user.status === 'suspended' ? 'bg-red-100 text-red-800' : 
                      'bg-gray-100 text-gray-800';
  const isRTL = language === 'ar';

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}
      >
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/users')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === 'ar' ? 'رجوع' : 'Back'}
          </Button>
          <Avatar className="h-12 w-12 border-2 border-muted">
            <AvatarFallback className="text-lg font-semibold">
              {(user.username || user.name || user.email || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {user.username || user.name || user.email}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'ar' ? 'تفاصيل المستخدم' : 'User Details'}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button
            onClick={() => navigate(`/admin/users/${id}/edit`)}
            variant="outline"
            className="gap-2"
          >
            <Edit className="w-4 h-4" />
            {language === 'ar' ? 'تعديل' : 'Edit'}
          </Button>
          {user.status === 'active' ? (
            <Button
              onClick={handleSuspend}
              variant="outline"
              className="text-yellow-600 hover:text-yellow-700"
            >
              {language === 'ar' ? 'تعليق' : 'Suspend'}
            </Button>
          ) : (
            <Button
              onClick={handleActivate}
              variant="outline"
              className="text-green-600 hover:text-green-700"
            >
              {language === 'ar' ? 'تفعيل' : 'Activate'}
            </Button>
          )}
          <Button
            onClick={handleDelete}
            variant="destructive"
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {language === 'ar' ? 'حذف' : 'Delete'}
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Information */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                {language === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}
              </h2>
              <Separator className="mb-4" />
              <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'اسم المستخدم' : 'Username'}</p>
                <p className="font-medium">{user.username || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</p>
                <p className="font-medium">{user.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'الهاتف' : 'Phone'}</p>
                <p className="font-medium">{user.phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'الحالة' : 'Status'}</p>
                <span className={`px-2 py-1 rounded-full text-xs ${statusColor}`}>
                  {language === 'ar' 
                    ? (user.status === 'active' ? 'نشط' : user.status === 'suspended' ? 'معلق' : 'قيد الانتظار')
                    : (user.status || 'active')
                  }
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'نوع الحساب' : 'Account Type'}</p>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  (user.user_type || (user.role === 'admin' ? 'admin' : ['doctor', 'shop', 'driver', 'representative'].includes(user.role) ? 'service_provider' : 'user')) === 'service_provider'
                    ? 'bg-amber-100 text-amber-800'
                    : (user.user_type || user.role) === 'admin'
                    ? 'bg-violet-100 text-violet-800'
                    : 'bg-slate-100 text-slate-800'
                }`}>
                  {language === 'ar'
                    ? ((user.user_type || (user.role === 'admin' ? 'admin' : ['doctor', 'shop', 'driver', 'representative'].includes(user.role) ? 'service_provider' : 'user')) === 'service_provider' ? 'مزود خدمة' : (user.user_type || user.role) === 'admin' ? 'مدير' : 'مستخدم')
                    : (user.user_type || (user.role === 'admin' ? 'admin' : ['doctor', 'shop', 'driver', 'representative'].includes(user.role) ? 'service_provider' : 'user')) === 'service_provider' ? 'Service Provider' : (user.user_type || user.role) === 'admin' ? 'Admin' : 'User'}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'الدور' : 'Role'}</p>
                <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 capitalize">
                  {userRole}
                </span>
              </div>
              {user.wallet_balance !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'رصيد المحفظة' : 'Wallet Balance'}</p>
                  <p className="font-medium">${user.wallet_balance || 0}</p>
                </div>
              )}
              </div>
            </CardContent>
          </Card>

          {/* Addresses */}
          {user.addresses && user.addresses.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {language === 'ar' ? 'العناوين' : 'Addresses'}
                </h2>
                <Separator className="mb-4" />
                <div className="space-y-3">
                {user.addresses.map((address, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <p className="font-medium">{address.address || '-'}</p>
                    {address.city && <p className="text-sm text-muted-foreground">{address.city}</p>}
                    {address.is_default && (
                      <span className="inline-block mt-2 px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                        {language === 'ar' ? 'افتراضي' : 'Default'}
                      </span>
                    )}
                  </div>
                ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Orders */}
          {user.orders && user.orders.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  {language === 'ar' ? 'الطلبات الأخيرة' : 'Recent Orders'} ({user.orders.length})
                </h2>
                <Separator className="mb-4" />
                <div className="space-y-3">
                {user.orders.slice(0, 5).map((order) => (
                  <Link
                    key={order.id}
                    to={`/admin/orders/${order.id}`}
                    className="block p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{language === 'ar' ? 'طلب' : 'Order'} #{order.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.created_at && format(new Date(order.created_at), 'PPp')}
                        </p>
                      </div>
                      <div className={`text-right ${isRTL ? 'text-left' : ''}`}>
                        <p className="font-semibold">${order.total || 0}</p>
                        <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                </div>
              {user.orders.length > 5 && (
                <Link
                  to="/admin/orders"
                  className="block mt-4 text-center text-primary hover:underline"
                >
                  {language === 'ar' ? 'عرض جميع الطلبات' : 'View all orders'}
                </Link>
              )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Info */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {language === 'ar' ? 'معلومات الحساب' : 'Account Information'}
              </h2>
              <Separator className="mb-4" />
              <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}</p>
                <p className="font-medium">
                  {user.created_at ? format(new Date(user.created_at), 'PPp') : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'آخر تحديث' : 'Last Updated'}</p>
                <p className="font-medium">
                  {user.updated_at ? format(new Date(user.updated_at), 'PPp') : '-'}
                </p>
              </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">{language === 'ar' ? 'الإحصائيات' : 'Statistics'}</h2>
              <Separator className="mb-4" />
              <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}</p>
                <p className="text-2xl font-bold">{user.orders?.length || 0}</p>
              </div>
              {user.bookings && (
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي الحجوزات' : 'Total Bookings'}</p>
                  <p className="text-2xl font-bold">{user.bookings.length || 0}</p>
                </div>
              )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

