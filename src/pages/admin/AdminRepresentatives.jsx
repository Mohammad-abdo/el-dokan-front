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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import showToast from '@/lib/toast';
import { Plus, UserCheck, UserX, Eye, Edit, MoreHorizontal, AlertCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TableReportExportCard } from '@/components/TableReportExportCard';

export default function AdminRepresentatives() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [representatives, setRepresentatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [filters, setFilters] = useState({ status: '' });

  useEffect(() => {
    fetchRepresentatives();
  }, []);

  const fetchRepresentatives = async () => {
    setFetchError(null);
    try {
      const response = await api.get('/admin/representatives');
      setRepresentatives(extractDataFromResponse(response));
    } catch (error) {
      console.error('Error fetching representatives:', error);
      setRepresentatives([]);
      setFetchError(error.response?.data?.message || (language === 'ar' ? 'فشل تحميل  مندوبين المبيعات ' : 'Failed to load representatives.'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/admin/representatives/${id}/approve`);
      showToast.success(language === 'ar' ? 'تمت الموافقة على المندوب' : 'Representative approved.');
      fetchRepresentatives();
    } catch (error) {
      console.error('Error approving representative:', error);
      showToast.error(error.response?.data?.message || (language === 'ar' ? 'فشل الموافقة' : 'Failed to approve'));
    }
  };

  const handleSuspend = async (id) => {
    try {
      await api.post(`/admin/representatives/${id}/suspend`);
      showToast.success(language === 'ar' ? 'تم تعليق المندوب' : 'Representative suspended.');
      fetchRepresentatives();
    } catch (error) {
      console.error('Error suspending representative:', error);
      showToast.error(error.response?.data?.message || (language === 'ar' ? 'فشل التعليق' : 'Failed to suspend'));
    }
  };

  const statusLabels = useMemo(() => ({
    approved: language === 'ar' ? 'موافق عليه' : 'Approved',
    suspended: language === 'ar' ? 'معلق' : 'Suspended',
    pending: language === 'ar' ? 'قيد الانتظار' : 'Pending',
  }), [language]);

  const columns = useMemo(() => [
    { accessorKey: 'id', header: 'ID' },
    { 
      accessorKey: 'user', 
      header: language === 'ar' ? 'المستخدم' : 'User',
      getExportValue: (row) => row.user?.username || row.user?.email || '-',
      cell: ({ row }) => row.original.user?.username || row.original.user?.email || '-'
    },
    { 
      accessorKey: 'territory', 
      header: language === 'ar' ? 'المنطقة' : 'Territory' 
    },
    {
      accessorKey: 'status',
      header: language === 'ar' ? 'الحالة' : 'Status',
      getExportValue: (row) => statusLabels[row.status] || row.status || 'pending',
      cell: ({ row }) => {
        const status = row.original.status || 'pending';
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${
            status === 'approved' ? 'bg-green-100 text-green-800' :
            status === 'suspended' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {statusLabels[status] || status}
          </span>
        );
      },
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
            <DropdownMenuItem onClick={() => navigate(`/admin/representatives/${row.original.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              {language === 'ar' ? 'عرض' : 'View'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/admin/representatives/${row.original.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              {language === 'ar' ? 'تعديل' : 'Edit'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {row.original.status === 'pending' ? (
              <DropdownMenuItem onClick={() => handleApprove(row.original.id)}>
                <UserCheck className="mr-2 h-4 w-4 text-green-600" />
                {language === 'ar' ? 'موافقة' : 'Approve'}
              </DropdownMenuItem>
            ) : row.original.status === 'approved' ? (
              <DropdownMenuItem onClick={() => handleSuspend(row.original.id)}>
                <UserX className="mr-2 h-4 w-4 text-red-600" />
                {language === 'ar' ? 'تعليق' : 'Suspend'}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [navigate, language, handleApprove, handleSuspend, statusLabels]);

  const filteredData = useMemo(() => {
    return representatives.filter((r) => {
      if (filters.status && (r.status || 'pending') !== filters.status) return false;
      return true;
    });
  }, [representatives, filters.status]);

  const filterOptions = [
    {
      key: 'status',
      label: language === 'ar' ? 'الحالة' : 'Status',
      options: [
        { value: 'pending', label: statusLabels.pending },
        { value: 'approved', label: statusLabels.approved },
        { value: 'suspended', label: statusLabels.suspended },
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
                {language === 'ar' ? ' مندوبين المبيعات ' : 'Representatives'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === 'ar' ? 'إدارة مندوبي المبيعات' : 'Manage sales representatives'}
              </p>
            </div>
            <Button onClick={() => navigate('/admin/representatives/new')}>
              <Plus className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'إضافة مندوب' : 'Add Representative'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <TableReportExportCard reportKey="representatives" data={filteredData} columns={columns} />

      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{language === 'ar' ? 'خطأ' : 'Error'}</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>{fetchError}</span>
            <Button variant="outline" size="sm" onClick={fetchRepresentatives} className="gap-1">
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
        searchPlaceholder={language === 'ar' ? 'البحث في مندوبين المبيعات...' : 'Search representatives...'}
        loading={loading}
        emptyTitle={language === 'ar' ? 'لا يوجد مندوبون' : 'No representatives found.'}
        emptyDescription={language === 'ar' ? 'أضف مندوباً أو عدّل الفلاتر.' : 'Add a representative or adjust your filters.'}
        filters={filterOptions}
        filterValues={filters}
        onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
      />
    </div>
  );
}


