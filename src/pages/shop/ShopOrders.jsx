import { useState, useEffect } from 'react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { Eye } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ShopOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();

  useEffect(() => {
    fetchOrders();
  }, [searchParams]);

  const fetchOrders = async () => {
    try {
      const status = searchParams.get('status');
      const params = status ? { status } : {};
      const response = await api.get('/shop/orders', { params });
      setOrders(extractDataFromResponse(response));
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { accessorKey: 'id', header: language === 'ar' ? 'ID' : 'ID' },
    { accessorKey: 'order_number', header: language === 'ar' ? 'رقم الطلب' : 'Order Number' },
    { accessorKey: 'customer_name', header: language === 'ar' ? 'اسم العميل' : 'Customer Name' },
    { accessorKey: 'total', header: language === 'ar' ? 'الإجمالي' : 'Total', cell: ({ row }) => `$${row.original.total}` },
    { accessorKey: 'status', header: language === 'ar' ? 'الحالة' : 'Status' },
    { accessorKey: 'created_at', header: language === 'ar' ? 'التاريخ' : 'Date' },
    {
      id: 'actions',
      header: language === 'ar' ? 'الإجراءات' : 'Actions',
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => navigate(`/shop/orders/${row.original.id}`)}>
          <Eye className="w-4 h-4" />
        </Button>
      ),
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
          {language === 'ar' ? 'الطلبات' : 'Orders'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === 'ar' ? 'إدارة طلباتك' : 'Manage your orders'}
        </p>
      </div>

      <DataTable data={orders} columns={columns} />
    </div>
  );
}

