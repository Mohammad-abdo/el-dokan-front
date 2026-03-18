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
import { useLanguage } from '@/contexts/LanguageContext';
import { TableReportExportCard } from '@/components/TableReportExportCard';
import { Plus, Eye, UserCheck, UserX, Wallet, MoreHorizontal, AlertCircle, RefreshCw } from 'lucide-react';

export default function AdminDoctors() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [filters, setFilters] = useState({ status: '' });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setFetchError(null);
    try {
      const response = await api.get('/admin/doctors');
      setDoctors(extractDataFromResponse(response));
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors([]);
      setFetchError(error.response?.data?.message || 'Failed to load doctors.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id) => {
    try {
      await api.post(`/admin/doctors/${id}/activate`);
      showToast.success('Doctor activated.');
      fetchDoctors();
    } catch (error) {
      console.error('Error activating doctor:', error);
      showToast.error(error.response?.data?.message || 'Failed to activate doctor');
    }
  };

  const handleSuspend = async (id) => {
    try {
      await api.post(`/admin/doctors/${id}/suspend`);
      showToast.success('Doctor suspended.');
      fetchDoctors();
    } catch (error) {
      console.error('Error suspending doctor:', error);
      showToast.error(error.response?.data?.message || 'Failed to suspend doctor');
    }
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'ID',
    },
    {
      accessorKey: 'name',
      header: language === 'ar' ? 'الاسم' : 'Name',
      headerAr: 'الاسم',
      getExportValue: (row) => row.name || row.fullName || row.user?.name || row.user?.username || '-',
      cell: ({ row }) => {
        const doctor = row.original;
        return doctor.name || doctor.fullName || doctor.user?.name || doctor.user?.username || '-';
      },
    },
    {
      accessorKey: 'email',
      header: language === 'ar' ? 'البريد' : 'Email',
      headerAr: 'البريد',
      getExportValue: (row) => row.email || row.user?.email || '-',
      cell: ({ row }) => {
        const doctor = row.original;
        return doctor.email || doctor.user?.email || '-';
      },
    },
    {
      accessorKey: 'phone',
      header: language === 'ar' ? 'الهاتف' : 'Phone',
      headerAr: 'الهاتف',
      getExportValue: (row) => row.phone || row.user?.phone || '-',
      cell: ({ row }) => {
        const doctor = row.original;
        return doctor.phone || doctor.user?.phone || '-';
      },
    },
    {
      accessorKey: 'specialty',
      header: language === 'ar' ? 'التخصص' : 'Specialty',
      headerAr: 'التخصص',
      getExportValue: (row) => row.specialty || row.specialization || '-',
      cell: ({ row }) => {
        const doctor = row.original;
        return doctor.specialty || doctor.specialization || '-';
      },
    },
    {
      accessorKey: 'status',
      header: language === 'ar' ? 'الحالة' : 'Status',
      headerAr: 'الحالة',
      getExportValue: (row) => row.status || 'active',
      cell: ({ row }) => {
        const status = row.original.status || 'active';
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${
            status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {status}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/admin/doctors/${row.original.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/admin/doctors/${row.original.id}/wallet`)}>
              <Wallet className="mr-2 h-4 w-4" />
              Wallet
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {row.original.status !== 'active' ? (
              <DropdownMenuItem onClick={() => handleActivate(row.original.id)}>
                <UserCheck className="mr-2 h-4 w-4 text-green-600" />
                Activate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => handleSuspend(row.original.id)}>
                <UserX className="mr-2 h-4 w-4 text-red-600" />
                Suspend
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [navigate, language, handleActivate, handleSuspend]);

  const filteredData = useMemo(() => {
    return doctors.filter((d) => {
      if (filters.status && (d.status || 'active') !== filters.status) return false;
      return true;
    });
  }, [doctors, filters.status]);

  const filterOptions = [
    {
      key: 'status',
      label: language === 'ar' ? 'الحالة' : 'Status',
      options: [
        { value: 'active', label: language === 'ar' ? 'نشط' : 'Active' },
        { value: 'suspended', label: language === 'ar' ? 'موقوف' : 'Suspended' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Doctors</h1>
              <p className="text-muted-foreground mt-1">Manage all doctors</p>
            </div>
            <Button onClick={() => navigate('/admin/doctors/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Doctor
            </Button>
          </div>
        </CardContent>
      </Card>

      <TableReportExportCard reportKey="doctors" data={filteredData} columns={columns} />

      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>{fetchError}</span>
            <Button variant="outline" size="sm" onClick={fetchDoctors} className="gap-1">
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
        searchPlaceholder={language === 'ar' ? 'البحث في الأطباء...' : 'Search doctors...'}
        loading={loading}
        emptyTitle={language === 'ar' ? 'لا يوجد أطباء' : 'No doctors found.'}
        emptyDescription={language === 'ar' ? 'أضف طبيباً أو عدّل الفلاتر.' : 'Add a doctor or adjust your search.'}
        filters={filterOptions}
        filterValues={filters}
        onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
      />
    </div>
  );
}


