import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Package, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DataTable } from '@/components/DataTable';
import { format } from 'date-fns';

export default function AdminAvailableOrders() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({});

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/orders/available-for-delivery');
      const data = res.data?.data ?? [];
      setOrders(Array.isArray(data) ? data : []);
      setMeta(res.data?.meta ?? {});
    } catch (e) {
      console.error(e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const columns = [
    {
      accessorKey: 'order_number',
      header: language === 'ar' ? 'رقم الطلب' : 'Order #',
    },
    {
      accessorKey: 'user',
      header: language === 'ar' ? 'العميل' : 'Customer',
      cell: ({ row }) =>
        row.original.user?.name || row.original.user?.fullName || '-',
    },
    {
      accessorKey: 'shop',
      header: language === 'ar' ? 'المتجر' : 'Shop',
      cell: ({ row }) => row.original.shop?.name || '-',
    },
    {
      accessorKey: 'total_amount',
      header: language === 'ar' ? 'المبلغ' : 'Total',
      cell: ({ row }) =>
        `$${Number(row.original.total_amount || 0).toFixed(2)}`,
    },
    {
      accessorKey: 'delivery_address',
      header: language === 'ar' ? 'عنوان التوصيل' : 'Delivery Address',
      cell: ({ row }) =>
        row.original.delivery_address || '-',
    },
    {
      id: 'actions',
      header: language === 'ar' ? 'إجراءات' : 'Actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/admin/orders/${row.original.order_id}`)}
          className="gap-1"
        >
          <Eye className="h-4 w-4" />
          {language === 'ar' ? 'تفاصيل' : 'View'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {language === 'ar' ? 'طلبات متاحة للتوصيل' : 'Available Orders for Delivery'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === 'ar'
                  ? 'طلبات بدون سائق معين - قم بتعيين سائق من صفحة الطلب أو التوصيلات'
                  : 'Orders without assigned driver - assign from order or deliveries'}
              </p>
            </div>
            <Button onClick={fetchOrders} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              {language === 'ar' ? 'تحديث' : 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        searchable
        searchPlaceholder={language === 'ar' ? 'بحث...' : 'Search...'}
        emptyTitle={language === 'ar' ? 'لا توجد طلبات متاحة' : 'No available orders'}
        emptyDescription={
          language === 'ar'
            ? 'جميع الطلبات لديها سائق معين أو لا تحتاج توصيل.'
            : 'All orders have a driver assigned or do not need delivery.'
        }
      />
    </div>
  );
}
