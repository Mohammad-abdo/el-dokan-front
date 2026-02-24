import { useState, useEffect } from 'react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { showToast } from '@/lib/toast';
import { Eye, Package, CheckCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export default function DriverDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();

  useEffect(() => {
    fetchDeliveries();
  }, [searchParams]);

  const fetchDeliveries = async () => {
    try {
      const status = searchParams.get('status');
      const filter = searchParams.get('filter');
      const params = {};
      if (status) params.status = status;
      if (filter) params.filter = filter;
      
      const response = await api.get('/driver/deliveries', { params });
      setDeliveries(extractDataFromResponse(response));
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePickup = async (deliveryId) => {
    try {
      await api.post(`/driver/deliveries/${deliveryId}/pickup`);
      showToast.success(language === 'ar' ? 'تم تأكيد الاستلام' : 'Pickup confirmed');
      fetchDeliveries();
    } catch (e) {
      showToast.error(e.response?.data?.message || (language === 'ar' ? 'فشل' : 'Failed'));
    }
  };
  const handleConfirmDelivery = async (deliveryId) => {
    try {
      await api.post(`/driver/deliveries/${deliveryId}/confirm-delivery`);
      showToast.success(language === 'ar' ? 'تم تأكيد التسليم' : 'Delivery confirmed');
      fetchDeliveries();
    } catch (e) {
      showToast.error(e.response?.data?.message || (language === 'ar' ? 'فشل' : 'Failed'));
    }
  };

  const columns = [
    { accessorKey: 'id', header: language === 'ar' ? 'ID' : 'ID' },
    {
      accessorKey: 'order',
      header: language === 'ar' ? 'رقم الطلب' : 'Order Number',
      cell: ({ row }) => row.original.order?.order_number ?? row.original.order_number ?? '-',
    },
    { accessorKey: 'delivery_address', header: language === 'ar' ? 'عنوان التوصيل' : 'Delivery Address' },
    { accessorKey: 'status', header: language === 'ar' ? 'الحالة' : 'Status' },
    { accessorKey: 'estimated_arrival_minutes', header: language === 'ar' ? 'الوقت المتوقع' : 'ETA (min)' },
    { accessorKey: 'created_at', header: language === 'ar' ? 'التاريخ' : 'Date' },
    {
      id: 'actions',
      header: language === 'ar' ? 'الإجراءات' : 'Actions',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/driver/deliveries/${row.original.id}`)}>
              <Eye className="w-4 h-4" />
            </Button>
            {status === 'assigned' && (
              <Button variant="outline" size="sm" onClick={() => handlePickup(row.original.id)} title={language === 'ar' ? 'تم الاستلام' : 'Pickup'}>
                <Package className="w-4 h-4" />
              </Button>
            )}
            {(status === 'picked_up' || status === 'in_transit') && (
              <Button variant="default" size="sm" onClick={() => handleConfirmDelivery(row.original.id)} title={language === 'ar' ? 'تأكيد التسليم' : 'Confirm delivery'}>
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {language === 'ar' ? 'التوصيلات' : 'Deliveries'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === 'ar' ? 'إدارة توصيلاتك' : 'Manage your deliveries'}
        </p>
      </div>

      <DataTable data={deliveries} columns={columns} />
    </div>
  );
}

