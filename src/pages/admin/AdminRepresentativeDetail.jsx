import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import showToast from '@/lib/toast';
import { showConfirm } from '@/components/ConfirmDialog';
import { ArrowLeft, Edit, Trash2, UserCheck, UserX, Calendar, MapPin, Wallet, DollarSign, User } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminRepresentativeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [representative, setRepresentative] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        params: { type: 'representative', id }
      });
      setWallet(response.data?.data);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const handleDelete = () => {
    showConfirm(
      language === 'ar' ? 'هل أنت متأكد من حذف هذا المندوب؟ لا يمكن التراجع.' : 'Are you sure you want to delete this representative? This action cannot be undone.',
      () => {
        api.delete(`/admin/representatives/${id}`)
          .then(() => {
            showToast.success(language === 'ar' ? 'تم حذف المندوب' : 'Representative deleted.');
            navigate('/admin/representatives');
          })
          .catch((error) => {
            showToast.error(error.response?.data?.message || (language === 'ar' ? 'فشل حذف المندوب' : 'Failed to delete representative'));
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
      console.error('Error approving representative:', error);
      showToast.error(error.response?.data?.message || (language === 'ar' ? 'فشل الموافقة' : 'Failed to approve'));
    }
  };

  const handleSuspend = async () => {
    try {
      await api.post(`/admin/representatives/${id}/suspend`);
      showToast.success(language === 'ar' ? 'تم تعليق المندوب' : 'Representative suspended.');
      fetchRepresentative();
    } catch (error) {
      console.error('Error suspending representative:', error);
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
          <div className="flex gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  if (!representative) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{language === 'ar' ? 'المندوب غير موجود' : 'Representative not found'}</p>
        <Link to="/admin/representatives" className="text-primary mt-4 inline-block">
          {language === 'ar' ? 'رجوع إلى  مندوبين المبيعات ' : 'Back to Representatives'}
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: {
        label: language === 'ar' ? 'موافق عليه' : 'Approved',
        className: 'bg-green-100 text-green-800',
      },
      suspended: {
        label: language === 'ar' ? 'معلق' : 'Suspended',
        className: 'bg-red-100 text-red-800',
      },
      pending: {
        label: language === 'ar' ? 'قيد الانتظار' : 'Pending',
        className: 'bg-yellow-100 text-yellow-800',
      },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const isRTL = language === 'ar';

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}
      >
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/representatives')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === 'ar' ? 'رجوع' : 'Back'}
          </Button>
          <div className={isRTL ? 'text-right' : ''}>
            <h1 className="text-3xl font-bold tracking-tight">
              {representative.user?.username || representative.user?.email || (language === 'ar' ? 'المندوب' : 'Representative')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'ar' ? 'تفاصيل المندوب' : 'Representative Details'}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {representative.status === 'pending' && (
            <Button
              onClick={handleApprove}
              variant="outline"
              className="gap-2"
            >
              <UserCheck className="w-4 h-4" />
              {language === 'ar' ? 'موافقة' : 'Approve'}
            </Button>
          )}
          {representative.status === 'approved' && (
            <Button
              onClick={handleSuspend}
              variant="outline"
              className="gap-2"
            >
              <UserX className="w-4 h-4" />
              {language === 'ar' ? 'تعليق' : 'Suspend'}
            </Button>
          )}
          <Button
            onClick={() => navigate(`/admin/representatives/${id}/edit`)}
            variant="outline"
            className="gap-2"
          >
            <Edit className="w-4 h-4" />
            {language === 'ar' ? 'تعديل' : 'Edit'}
          </Button>
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

      <div className={`grid gap-6 md:grid-cols-3 ${isRTL ? 'text-right' : ''}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 space-y-6"
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {language === 'ar' ? 'معلومات المندوب' : 'Representative Information'}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'المستخدم' : 'User'}</p>
                <p className="font-medium">{representative.user?.username || representative.user?.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</p>
                <p className="font-medium">{representative.user?.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'المنطقة' : 'Territory'}</p>
                <p className="font-medium">{representative.territory || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'الحالة' : 'Status'}</p>
                {getStatusBadge(representative.status)}
              </div>
            </div>
          </Card>

          {representative.visits && representative.visits.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {language === 'ar' ? 'الزيارات' : 'Visits'}
              </h2>
              <div className="space-y-3">
                {representative.visits.map((visit) => (
                  <div key={visit.id} className="p-3 border rounded-lg">
                    <p className="font-medium">{visit.purpose || '-'}</p>
                    <p className="text-sm text-muted-foreground">
                      {visit.visit_date ? new Date(visit.visit_date).toLocaleDateString() : '-'}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {language === 'ar' ? 'الإحصائيات' : 'Statistics'}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'إجمالي الزيارات' : 'Total Visits'}
                </span>
                <span className="font-bold">{wallet?.total_visits || representative.visits?.length || 0}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              {language === 'ar' ? 'المحفظة' : 'Wallet'}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {language === 'ar' ? 'الرصيد' : 'Balance'}
                </span>
                <span className="font-bold text-lg text-green-600">
                  ${parseFloat(wallet?.balance || representative.user?.wallet_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {language === 'ar' ? 'إجمالي الزيارات' : 'Total Visits'}
                </span>
                <span className="font-bold">{wallet?.total_visits || representative.visits?.length || 0}</span>
              </div>
              {wallet?.transactions && wallet.transactions.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-semibold mb-2">
                    {language === 'ar' ? 'آخر المعاملات' : 'Recent Transactions'}
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {wallet.transactions.slice(0, 5).map((transaction, idx) => (
                      <div key={idx} className={`flex items-center justify-between text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className="text-muted-foreground">
                          {transaction.type || transaction.description || '-'}
                        </span>
                        <span className={`font-medium ${
                          parseFloat(transaction.amount || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {parseFloat(transaction.amount || 0) >= 0 ? '+' : ''}
                          ${Number(transaction.amount || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
