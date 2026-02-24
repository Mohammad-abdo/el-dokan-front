import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { Eye, AlertCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';

export default function AdminOrders() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setFetchError(null);
    try {
      const response = await api.get('/admin/orders');
      setOrders(extractDataFromResponse(response));
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
      setFetchError(error.response?.data?.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'received', label: 'Received' },
        { value: 'processing', label: 'Processing' },
        { value: 'on_the_way', label: 'On The Way' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
  ];

  const columns = useMemo(() => [
    {
      accessorKey: 'id',
      header: language === 'ar' ? 'رقم الطلب' : 'Order ID',
    },
    {
      accessorKey: 'user',
      header: language === 'ar' ? 'العميل' : 'Customer',
      cell: ({ row }) => row.original.user?.name || row.original.user?.fullName || row.original.user?.username || '-',
    },
    {
      accessorKey: 'total',
      header: language === 'ar' ? 'المبلغ' : 'Total',
      cell: ({ row }) => `$${Number(row.original.total_amount ?? row.original.total ?? 0).toFixed(2)}`,
    },
    {
      accessorKey: 'status',
      header: language === 'ar' ? 'الحالة' : 'Status',
      cell: ({ row }) => {
        const status = row.original.status || 'received';
        const colors = {
          received: 'bg-blue-100 text-blue-800',
          processing: 'bg-yellow-100 text-yellow-800',
          on_the_way: 'bg-purple-100 text-purple-800',
          delivered: 'bg-green-100 text-green-800',
          cancelled: 'bg-red-100 text-red-800',
        };
        const labels = language === 'ar'
          ? { received: 'مستلم', processing: 'قيد التجهيز', on_the_way: 'في الطريق', delivered: 'تم التسليم', cancelled: 'ملغي' }
          : {};
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${colors[status] || colors.received}`}>
            {labels[status] || status}
          </span>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: language === 'ar' ? 'التاريخ' : 'Date',
      cell: ({ row }) => {
        const date = row.original.created_at;
        return date ? format(new Date(date), 'MMM dd, yyyy HH:mm') : '-';
      },
    },
    {
      id: 'actions',
      header: language === 'ar' ? 'الإجراءات' : 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate(`/admin/orders/${row.original.id}`)}
            title={language === 'ar' ? 'عرض' : 'View'}
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">{language === 'ar' ? 'عرض' : 'View'}</span>
          </Button>
        </div>
      ),
    },
  ], [navigate, language]);

  const filteredData = useMemo(() => {
    const list = orders.filter(order => {
      if (filters.status && order.status !== filters.status) return false;
      return true;
    });
    return [...list].sort((a, b) => (a.id || 0) - (b.id || 0));
  }, [orders, filters]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
              <p className="text-muted-foreground mt-1">Manage all orders</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>{fetchError}</span>
            <Button variant="outline" size="sm" onClick={fetchOrders} className="gap-1">
              <RefreshCw className="h-3 w-3" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={filteredData}
        searchable
        searchPlaceholder="Search orders..."
        filters={filterOptions}
        filterValues={filters}
        onFilterChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
        loading={loading}
        emptyTitle="No orders found."
        emptyDescription="Orders will appear here when customers place orders."
      />
    </div>
  );
}

