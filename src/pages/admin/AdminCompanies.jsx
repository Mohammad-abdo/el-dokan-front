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
import { Edit, Eye, MoreHorizontal, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminCompanies() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setFetchError(null);
    try {
      const response = await api.get('/admin/shops', { params: { type: 'company' } });
      const data = extractDataFromResponse(response);
      setCompanies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
      setFetchError(error.response?.data?.message || (language === 'ar' ? 'فشل تحميل الشركات' : 'Failed to load companies.'));
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(() => [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: language === 'ar' ? 'الاسم' : 'Name' },
    {
      accessorKey: 'user',
      header: language === 'ar' ? 'المستخدم' : 'User',
      cell: ({ row }) => row.original.user?.username || row.original.user?.email || '-'
    },
    { accessorKey: 'category', header: language === 'ar' ? 'الفئة' : 'Category' },
    { accessorKey: 'phone', header: language === 'ar' ? 'الهاتف' : 'Phone' },
    { accessorKey: 'address', header: language === 'ar' ? 'العنوان' : 'Address' },
    {
      accessorKey: 'vendor_status',
      header: language === 'ar' ? 'حالة الموافقة' : 'Access status',
      cell: ({ row }) => {
        const s = row.original.vendor_status || 'approved';
        const labels = { pending_approval: language === 'ar' ? 'قيد المراجعة' : 'Pending', approved: language === 'ar' ? 'مفعّل' : 'Approved', suspended: language === 'ar' ? 'موقوف' : 'Suspended', rejected: language === 'ar' ? 'مرفوض' : 'Rejected' };
        const classes = { pending_approval: 'bg-amber-100 text-amber-800', approved: 'bg-green-100 text-green-800', suspended: 'bg-red-100 text-red-800', rejected: 'bg-gray-100 text-gray-800' };
        return <span className={`px-2 py-1 rounded-full text-xs ${classes[s] || 'bg-gray-100 text-gray-800'}`}>{labels[s] || s}</span>;
      },
    },
    {
      accessorKey: 'company_plan',
      header: language === 'ar' ? 'الخطة' : 'Plan',
      cell: ({ row }) => row.original.company_plan?.name_ar || row.original.company_plan?.name || '—',
    },
    {
      accessorKey: 'is_active',
      header: language === 'ar' ? 'الحالة' : 'Status',
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          row.original.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {row.original.is_active !== false ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: language === 'ar' ? 'الإجراءات' : 'Actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/admin/companies/${row.original.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              {language === 'ar' ? 'عرض' : 'View'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/admin/companies/${row.original.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              {language === 'ar' ? 'تعديل' : 'Edit'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [navigate, language]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {language === 'ar' ? 'الشركات' : 'Companies'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === 'ar' ? 'قائمة الشركات — الخطط والوصول والصلاحيات (Figma)' : 'Companies list — Plans, Access & Permissions (Figma)'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => navigate('/admin/companies/new')} className="gap-2">
                <Plus className="h-4 w-4" />
                {language === 'ar' ? 'إضافة شركة' : 'Add company'}
              </Button>
              <Button variant="outline" onClick={fetchCompanies} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                {language === 'ar' ? 'تحديث' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{language === 'ar' ? 'خطأ' : 'Error'}</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>{fetchError}</span>
            <Button variant="outline" size="sm" onClick={fetchCompanies} className="gap-1">
              <RefreshCw className="h-3 w-3" />
              {language === 'ar' ? 'إعادة' : 'Retry'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={companies}
        loading={loading}
        searchable
        searchPlaceholder={language === 'ar' ? 'بحث...' : 'Search...'}
        emptyTitle={language === 'ar' ? 'لا توجد شركات' : 'No companies found'}
        emptyDescription={language === 'ar' ? 'الشركات ستظهر هنا.' : 'Companies will appear here.'}
      />
    </div>
  );
}
