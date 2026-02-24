import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { DataTable } from '@/components/DataTable';
import {
  Truck,
  Plus,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Navigation,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
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
import showToast from '@/lib/toast';
import { showConfirm } from '@/components/ConfirmDialog';
import { MoreHorizontal, AlertCircle, RefreshCw } from 'lucide-react';

export default function AdminDrivers() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setFetchError(null);
    try {
      setLoading(true);
      const response = await api.get('/admin/drivers');
      setDrivers(extractDataFromResponse(response));
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setDrivers([]);
      setFetchError(error.response?.data?.message || (language === 'ar' ? 'فشل تحميل السائقين' : 'Failed to load drivers.'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      available: {
        label: language === 'ar' ? 'متاح' : 'Available',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        icon: CheckCircle2,
      },
      busy: {
        label: language === 'ar' ? 'مشغول' : 'Busy',
        className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
        icon: Clock,
      },
      offline: {
        label: language === 'ar' ? 'غير متصل' : 'Offline',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
        icon: XCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.offline;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const columns = [
    {
      accessorKey: 'name',
      header: language === 'ar' ? 'الاسم' : 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Truck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{row.original.name}</p>
            {row.original.phone && (
              <p className="text-xs text-muted-foreground">{row.original.phone}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: language === 'ar' ? 'الهاتف' : 'Phone',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-muted-foreground" />
          <span>{row.original.phone || '-'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: language === 'ar' ? 'الحالة' : 'Status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'rating',
      header: language === 'ar' ? 'التقييم' : 'Rating',
      cell: ({ row }) => {
        const rating = row.original.rating;
        const ratingValue = typeof rating === 'number' ? rating.toFixed(1) : '0.0';
        return (
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">{ratingValue}</span>
            <span className="text-yellow-500">★</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'location',
      header: language === 'ar' ? 'الموقع' : 'Location',
      cell: ({ row }) => {
        const hasLocation = row.original.current_location_lat && row.original.current_location_lng;
        return (
          <div className="flex items-center gap-2">
            {hasLocation ? (
              <>
                <MapPin className="w-4 h-4 text-green-500" />
                <span className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'على الخريطة' : 'On Map'}
                </span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">
                {language === 'ar' ? 'غير متاح' : 'N/A'}
              </span>
            )}
          </div>
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
            <DropdownMenuItem onClick={() => navigate(`/admin/drivers/${row.original.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              {language === 'ar' ? 'عرض' : 'View'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/admin/drivers/${row.original.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              {language === 'ar' ? 'تعديل' : 'Edit'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDelete(row.original.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {language === 'ar' ? 'حذف' : 'Delete'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleDelete = (id) => {
    showConfirm(
      language === 'ar' ? 'هل أنت متأكد من حذف هذا السائق؟ لا يمكن التراجع.' : 'Are you sure you want to delete this driver? This action cannot be undone.',
      () => {
        api.delete(`/admin/drivers/${id}`)
          .then(() => {
            showToast.success(language === 'ar' ? 'تم حذف السائق' : 'Driver deleted.');
            fetchDrivers();
          })
          .catch((error) => {
            showToast.error(error.response?.data?.message || (language === 'ar' ? 'فشل حذف السائق' : 'Failed to delete driver'));
          });
      }
    );
  };

  const filteredData = drivers.filter(driver => {
    if (filters.status && driver.status !== filters.status) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        driver.name?.toLowerCase().includes(search) ||
        driver.phone?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const filterOptions = [
    {
      key: 'status',
      label: language === 'ar' ? 'الحالة' : 'Status',
      options: [
        { value: 'available', label: language === 'ar' ? 'متاح' : 'Available' },
        { value: 'busy', label: language === 'ar' ? 'مشغول' : 'Busy' },
        { value: 'offline', label: language === 'ar' ? 'غير متصل' : 'Offline' },
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
                {language === 'ar' ? 'إدارة السائقين' : 'Drivers Management'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === 'ar'
                  ? 'إدارة جميع السائقين ومتابعة مواقعهم'
                  : 'Manage all drivers and track their locations'}
              </p>
            </div>
            <Button onClick={() => navigate('/admin/drivers/new')} className="gap-2">
              <Plus className="w-4 h-4" />
              {language === 'ar' ? 'إضافة سائق' : 'Add Driver'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'إجمالي السائقين' : 'Total Drivers'}
                </p>
                <p className="text-2xl font-bold mt-1">{drivers.length}</p>
              </div>
              <Truck className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'متاحين' : 'Available'}
                </p>
                <p className="text-2xl font-bold mt-1">
                  {drivers.filter(d => d.status === 'available').length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'مشغولين' : 'Busy'}
                </p>
                <p className="text-2xl font-bold mt-1">
                  {drivers.filter(d => d.status === 'busy').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{language === 'ar' ? 'خطأ' : 'Error'}</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>{fetchError}</span>
            <Button variant="outline" size="sm" onClick={fetchDrivers} className="gap-1">
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
        searchPlaceholder={language === 'ar' ? 'بحث عن سائق...' : 'Search drivers...'}
        filters={filterOptions}
        filterValues={filters}
        onFilterChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
        loading={loading}
        emptyTitle={language === 'ar' ? 'لا يوجد سائقون' : 'No drivers found.'}
        emptyDescription={language === 'ar' ? 'أضف سائقاً أو عدّل الفلاتر.' : 'Add a driver or adjust your filters.'}
        exportable
        onExport={() => console.log('Export drivers')}
      />
    </div>
  );
}
