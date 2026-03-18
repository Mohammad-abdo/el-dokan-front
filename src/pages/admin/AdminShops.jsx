import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { Plus, Edit, Eye, MoreHorizontal, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import showToast from '@/lib/toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { TableReportExportCard } from '@/components/TableReportExportCard';

export default function AdminShops() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [filters, setFilters] = useState({ vendor_status: '', is_active: '' });

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    setFetchError(null);
    try {
      const response = await api.get('/admin/shops');
      setShops(extractDataFromResponse(response));
    } catch (error) {
      console.error('Error fetching shops:', error);
      setShops([]);
      setFetchError(error.response?.data?.message || (language === 'ar' ? 'فشل تحميل المتاجر' : 'Failed to load shops.'));
    } finally {
      setLoading(false);
    }
  };

  const vendorLabels = useMemo(() => ({
    pending_approval: language === 'ar' ? 'قيد المراجعة' : 'Pending',
    approved: language === 'ar' ? 'مفعّل' : 'Approved',
    suspended: language === 'ar' ? 'موقوف' : 'Suspended',
    rejected: language === 'ar' ? 'مرفوض' : 'Rejected',
  }), [language]);

  const columns = useMemo(() => [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: language === 'ar' ? 'الاسم' : 'Name' },
    { 
      accessorKey: 'user', 
      header: language === 'ar' ? 'المستخدم' : 'User',
      getExportValue: (row) => row.user?.username || row.user?.email || '-',
      cell: ({ row }) => row.original.user?.username || row.original.user?.email || '-'
    },
    { accessorKey: 'category', header: language === 'ar' ? 'الفئة' : 'Category' },
    { accessorKey: 'phone', header: language === 'ar' ? 'الهاتف' : 'Phone' },
    { accessorKey: 'address', header: language === 'ar' ? 'العنوان' : 'Address' },
    {
      accessorKey: 'is_active',
      header: language === 'ar' ? 'الحالة' : 'Status',
      getExportValue: (row) => row.is_active !== false ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive'),
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          row.original.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {row.original.is_active !== false ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive')}
        </span>
      ),
    },
    {
      accessorKey: 'vendor_status',
      header: language === 'ar' ? 'حالة البائع' : 'Vendor',
      getExportValue: (row) => vendorLabels[row.vendor_status] || row.vendor_status || 'approved',
      cell: ({ row }) => {
        const s = row.original.vendor_status || 'approved';
        const labels = vendorLabels;
        const classes = { pending_approval: 'bg-amber-100 text-amber-800', approved: 'bg-green-100 text-green-800', suspended: 'bg-red-100 text-red-800', rejected: 'bg-gray-100 text-gray-800' };
        return <span className={`px-2 py-1 rounded-full text-xs ${classes[s] || 'bg-gray-100 text-gray-800'}`}>{labels[s] || s}</span>;
      },
    },
    {
      id: 'actions',
      header: language === 'ar' ? 'الإجراءات' : 'Actions',
      cell: ({ row }) => {
        const shop = row.original;
        const handleApprove = async (e) => {
          e?.stopPropagation?.();
          try {
            await api.post(`/admin/shops/${shop.id}/approve`);
            showToast.success(language === 'ar' ? 'تم تفعيل البائع' : 'Vendor approved');
            fetchShops();
          } catch (err) {
            showToast.error(err.response?.data?.message || (language === 'ar' ? 'فشل التنفيذ' : 'Action failed'));
          }
        };
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {shop.vendor_status === 'pending_approval' && (
                <DropdownMenuItem onClick={handleApprove}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {language === 'ar' ? 'موافقة' : 'Approve'}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => navigate(`/admin/shops/${shop.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                {language === 'ar' ? 'عرض' : 'View'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/admin/shops/${shop.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                {language === 'ar' ? 'تعديل' : 'Edit'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [navigate, language, fetchShops, vendorLabels]);

  const filteredData = useMemo(() => {
    return shops.filter((s) => {
      if (filters.vendor_status && (s.vendor_status || 'approved') !== filters.vendor_status) return false;
      if (filters.is_active !== '') {
        const active = s.is_active !== false;
        if (filters.is_active === '1' && !active) return false;
        if (filters.is_active === '0' && active) return false;
      }
      return true;
    });
  }, [shops, filters.vendor_status, filters.is_active]);

  const filterOptions = [
    {
      key: 'vendor_status',
      label: language === 'ar' ? 'حالة البائع' : 'Vendor',
      options: [
        { value: 'pending_approval', label: vendorLabels.pending_approval },
        { value: 'approved', label: vendorLabels.approved },
        { value: 'suspended', label: vendorLabels.suspended },
        { value: 'rejected', label: vendorLabels.rejected },
      ],
    },
    {
      key: 'is_active',
      label: language === 'ar' ? 'الحالة' : 'Status',
      options: [
        { value: '1', label: language === 'ar' ? 'نشط' : 'Active' },
        { value: '0', label: language === 'ar' ? 'غير نشط' : 'Inactive' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {language === 'ar' ? 'المتاجر' : 'Shops'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === 'ar' ? 'إدارة جميع المتاجر' : 'Manage all shops'}
              </p>
            </div>
            <Button onClick={() => navigate('/admin/shops/new')}>
              <Plus className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'إضافة متجر' : 'Add Shop'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <TableReportExportCard reportKey="shops" data={filteredData} columns={columns} />

      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{language === 'ar' ? 'خطأ' : 'Error'}</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>{fetchError}</span>
            <Button variant="outline" size="sm" onClick={fetchShops} className="gap-1">
              <RefreshCw className="h-3 w-3" />
              {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={filteredData}
        searchable
        searchPlaceholder={language === 'ar' ? 'البحث في المتاجر...' : 'Search shops...'}
        loading={loading}
        emptyTitle={language === 'ar' ? 'لا توجد متاجر' : 'No shops found.'}
        emptyDescription={language === 'ar' ? 'أضف متجراً أو عدّل الفلاتر.' : 'Add a shop or adjust your search.'}
        filters={filterOptions}
        filterValues={filters}
        onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
      />
    </div>
  );
}


