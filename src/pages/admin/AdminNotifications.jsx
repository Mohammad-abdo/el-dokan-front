import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import showToast from '@/lib/toast';
import { showConfirm } from '@/components/ConfirmDialog';
import { Plus, Bell, CheckCheck, Eye, Trash2, Filter } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';

export default function AdminNotifications() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    is_read: '',
    user_id: '',
    search: '',
  });

  useEffect(() => {
    fetchNotifications();
    fetchStatistics();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.is_read !== '') params.append('is_read', filters.is_read);
      if (filters.user_id) params.append('user_id', filters.user_id);
      if (filters.search) params.append('search', filters.search);
      params.append('per_page', '50');

      const response = await api.get(`/admin/notifications?${params.toString()}`);
      const data = extractDataFromResponse(response);
      setNotifications(Array.isArray(data) ? data : (data?.data || []));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/admin/notifications/statistics');
      setStatistics(response.data?.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filters]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/admin/notifications/${id}`, { is_read: true });
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
      fetchStatistics();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      fetchStatistics();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = (id) => {
    showConfirm(
      language === 'ar' ? 'هل أنت متأكد من حذف هذا الإشعار؟' : 'Are you sure you want to delete this notification?',
      () => {
        api.delete(`/admin/notifications/${id}`)
          .then(() => {
            showToast.success(language === 'ar' ? 'تم حذف الإشعار' : 'Notification deleted.');
            setNotifications(prev => prev.filter(notif => notif.id !== id));
            fetchStatistics();
          })
          .catch((error) => {
            showToast.error(error.response?.data?.message || (language === 'ar' ? 'فشل حذف الإشعار' : 'Failed to delete notification'));
          });
      }
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return '📦';
      case 'prescription':
        return '💊';
      case 'booking':
        return '📅';
      case 'message':
        return '💬';
      case 'payment':
        return '💳';
      case 'delivery':
        return '🚚';
      default:
        return '🔔';
    }
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getNotificationIcon(row.original.type)}</span>
          <span className="font-medium">#{row.original.id}</span>
        </div>
      ),
    },
    {
      accessorKey: 'user',
      header: language === 'ar' ? 'المستخدم' : 'User',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.user?.username || row.original.user?.email || '-'}</p>
          {row.original.user?.email && (
            <p className="text-xs text-muted-foreground">{row.original.user.email}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'title',
      header: language === 'ar' ? 'العنوان' : 'Title',
      cell: ({ row }) => (
        <div>
          <p className={`font-medium ${!row.original.is_read ? 'font-bold' : ''}`}>
            {row.original.title}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {row.original.description}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: language === 'ar' ? 'النوع' : 'Type',
      cell: ({ row }) => (
        <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
          {row.original.type || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'is_read',
      header: language === 'ar' ? 'الحالة' : 'Status',
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          row.original.is_read
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {row.original.is_read
            ? (language === 'ar' ? 'مقروء' : 'Read')
            : (language === 'ar' ? 'غير مقروء' : 'Unread')}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: language === 'ar' ? 'التاريخ' : 'Date',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.created_at
            ? format(new Date(row.original.created_at), 'PPp')
            : '-'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: language === 'ar' ? 'الإجراءات' : 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {!row.original.is_read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMarkAsRead(row.original.id)}
              title={language === 'ar' ? 'تحديد كمقروء' : 'Mark as read'}
            >
              <Bell className="w-4 h-4" />
            </Button>
          )}
          {row.original.action_url && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(row.original.action_url)}
              title={language === 'ar' ? 'عرض' : 'View'}
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
            className="text-red-600 hover:text-red-700"
            title={language === 'ar' ? 'حذف' : 'Delete'}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ], [navigate, language]);

  const filterOptions = [
    {
      key: 'type',
      label: language === 'ar' ? 'النوع' : 'Type',
      options: [
        { value: 'order', label: language === 'ar' ? 'طلب' : 'Order' },
        { value: 'prescription', label: language === 'ar' ? 'وصفة طبية' : 'Prescription' },
        { value: 'booking', label: language === 'ar' ? 'حجز' : 'Booking' },
        { value: 'message', label: language === 'ar' ? 'رسالة' : 'Message' },
        { value: 'payment', label: language === 'ar' ? 'دفع' : 'Payment' },
        { value: 'delivery', label: language === 'ar' ? 'تسليم' : 'Delivery' },
      ],
    },
    {
      key: 'is_read',
      label: language === 'ar' ? 'الحالة' : 'Status',
      options: [
        { value: 'false', label: language === 'ar' ? 'غير مقروء' : 'Unread' },
        { value: 'true', label: language === 'ar' ? 'مقروء' : 'Read' },
      ],
    },
  ];

  if (loading && !notifications.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {language === 'ar' ? 'الإشعارات' : 'Notifications'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === 'ar' ? 'إدارة جميع الإشعارات' : 'Manage all notifications'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            className="gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            {language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark All as Read'}
          </Button>
          <Button onClick={() => navigate('/admin/notifications/new')} className="gap-2">
            <Plus className="w-4 h-4" />
            {language === 'ar' ? 'إشعار جديد' : 'New Notification'}
          </Button>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'إجمالي الإشعارات' : 'Total Notifications'}
                </p>
                <p className="text-2xl font-bold mt-1">{statistics.total || 0}</p>
              </div>
              <Bell className="w-8 h-8 text-primary opacity-50" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'غير مقروء' : 'Unread'}
                </p>
                <p className="text-2xl font-bold mt-1 text-yellow-600">{statistics.unread || 0}</p>
              </div>
              <Bell className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'مقروء' : 'Read'}
                </p>
                <p className="text-2xl font-bold mt-1 text-green-600">{statistics.read || 0}</p>
              </div>
              <Bell className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'الأنواع' : 'Types'}
                </p>
                <p className="text-2xl font-bold mt-1">{statistics.by_type?.length || 0}</p>
              </div>
              <Filter className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </Card>
        </div>
      )}

      <DataTable
        columns={columns}
        data={notifications}
        searchable
        searchPlaceholder={language === 'ar' ? 'البحث في الإشعارات...' : 'Search notifications...'}
        filters={filterOptions}
        filterValues={filters}
        onFilterChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
        exportable
        onExport={() => {
          console.log('Export notifications');
        }}
      />
    </div>
  );
}

