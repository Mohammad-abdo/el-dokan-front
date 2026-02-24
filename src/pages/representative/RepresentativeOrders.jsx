import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function RepresentativeOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const status = searchParams.get('status');
      const params = status ? { status } : {};
      const res = await api.get('/representative/orders', { params });
      const data = extractDataFromResponse(res);
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [searchParams]);

  const columns = [
    { accessorKey: 'order_number', header: language === 'ar' ? 'رقم الطلب' : 'Order #' },
    {
      accessorKey: 'user',
      header: language === 'ar' ? 'العميل' : 'Customer',
      cell: ({ row }) => row.original.user?.username || row.original.user?.name || '-',
    },
    {
      accessorKey: 'shop',
      header: language === 'ar' ? 'المتجر' : 'Shop',
      cell: ({ row }) => row.original.shop?.name || '-',
    },
    { accessorKey: 'status', header: language === 'ar' ? 'الحالة' : 'Status' },
    {
      accessorKey: 'total_amount',
      header: language === 'ar' ? 'المبلغ' : 'Amount',
      cell: ({ row }) => `${row.original.total_amount ?? 0} EGP`,
    },
    {
      id: 'actions',
      header: language === 'ar' ? 'الإجراءات' : 'Actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/representative/orders/${row.original.id}`)}
        >
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {language === 'ar' ? 'الطلبات' : 'Orders'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === 'ar' ? 'طلبات المتاجر المرتبطة بزياراتك' : 'Orders from shops linked to your visits'}
        </p>
      </div>
      <DataTable data={orders} columns={columns} />
    </div>
  );
}
