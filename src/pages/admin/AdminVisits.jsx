import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { useLanguage } from '@/contexts/LanguageContext';
import { Check, X, Eye, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import showToast from '@/lib/toast';

export default function AdminVisits() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', representative_id: '', date_from: '', date_to: '' });
  const [representatives, setRepresentatives] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const params = { per_page: 100 };
      if (filters.status) params.status = filters.status;
      if (filters.representative_id) params.representative_id = filters.representative_id;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      const response = await api.get('/admin/visits', { params });
      const data = response.data?.data ?? response.data;
      setVisits(Array.isArray(data) ? data : extractDataFromResponse(response));
    } catch (error) {
      console.error('Error fetching visits:', error);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, [filters.status, filters.representative_id, filters.date_from, filters.date_to]);

  useEffect(() => {
    const fetchReps = async () => {
      try {
        const repsRes = await api.get('/admin/representatives?per_page=500').catch(() => ({ data: [] }));
        setRepresentatives(extractDataFromResponse(repsRes) || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchReps();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.post(`/admin/visits/${id}/approve`);
      showToast.success(language === 'ar' ? 'تمت الموافقة على الزيارة' : 'Visit approved');
      fetchVisits();
    } catch (error) {
      showToast.error(error.response?.data?.message || (language === 'ar' ? 'فشل' : 'Failed'));
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt(language === 'ar' ? 'سبب الرفض (اختياري):' : 'Rejection reason (optional):');
    if (reason === null) return;
    try {
      await api.post(`/admin/visits/${id}/reject`, { rejection_reason: reason || null });
      showToast.success(language === 'ar' ? 'تم رفض الزيارة' : 'Visit rejected');
      fetchVisits();
    } catch (error) {
      showToast.error(error.response?.data?.message || (language === 'ar' ? 'فشل' : 'Failed'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه الزيارة؟' : 'Are you sure you want to delete this visit?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/visits/${id}`);
      showToast.success(language === 'ar' ? 'تم حذف الزيارة' : 'Visit deleted');
      fetchVisits();
    } catch (error) {
      showToast.error(error.response?.data?.message || (language === 'ar' ? 'فشل الحذف' : 'Delete failed'));
    } finally {
      setDeletingId(null);
    }
  };

  const isRTL = language === 'ar';
  const repOptions = representatives.map((r) => ({
    value: String(r.id),
    label: r.user?.username || r.user?.email || r.territory || `#${r.id}`,
  }));

  const filterOptions = [
    {
      key: 'status',
      label: language === 'ar' ? 'الحالة' : 'Status',
      options: [
        { value: '', label: language === 'ar' ? 'الكل' : 'All' },
        { value: 'pending', label: language === 'ar' ? 'قيد الانتظار' : 'Pending' },
        { value: 'approved', label: language === 'ar' ? 'موافق عليه' : 'Approved' },
        { value: 'rejected', label: language === 'ar' ? 'مرفوض' : 'Rejected' },
        { value: 'completed', label: language === 'ar' ? 'مكتملة' : 'Completed' },
      ],
    },
    {
      key: 'representative_id',
      label: language === 'ar' ? 'المندوب' : 'Representative',
      options: [{ value: '', label: language === 'ar' ? 'الكل' : 'All' }, ...repOptions],
    },
  ];

  const columns = useMemo(() => [
    { accessorKey: 'id', header: 'ID' },
    {
      accessorKey: 'representative',
      header: language === 'ar' ? 'المندوب' : 'Representative',
      cell: ({ row }) => row.original.representative?.user?.username || row.original.representative?.user?.email || row.original.representative?.territory || '—',
    },
    {
      accessorKey: 'shop',
      header: language === 'ar' ? 'المتجر / الشركة' : 'Shop / Company',
      cell: ({ row }) => (language === 'ar' ? (row.original.shop?.name_ar || row.original.shop?.name) : (row.original.shop?.name_en || row.original.shop?.name)) || '—',
    },
    {
      accessorKey: 'doctor',
      header: language === 'ar' ? 'الطبيب' : 'Doctor',
      cell: ({ row }) => (language === 'ar' ? (row.original.doctor?.name_ar || row.original.doctor?.name) : (row.original.doctor?.name_en || row.original.doctor?.name)) || '—',
    },
    {
      accessorKey: 'visit_date',
      header: language === 'ar' ? 'تاريخ الزيارة' : 'Visit Date',
      cell: ({ row }) => row.original.visit_date ? format(new Date(row.original.visit_date), 'yyyy-MM-dd') : '—',
    },
    {
      accessorKey: 'purpose',
      header: language === 'ar' ? 'الغرض' : 'Purpose',
      cell: ({ row }) => (row.original.purpose || '—').slice(0, 40) + ((row.original.purpose || '').length > 40 ? '…' : ''),
    },
    {
      accessorKey: 'status',
      header: language === 'ar' ? 'الحالة' : 'Status',
      cell: ({ row }) => {
        const status = row.original.status || 'pending';
        const classes = status === 'approved' ? 'bg-green-100 text-green-800' : status === 'rejected' ? 'bg-red-100 text-red-800' : status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800';
        const labels = { pending: language === 'ar' ? 'قيد الانتظار' : 'Pending', approved: language === 'ar' ? 'موافق عليه' : 'Approved', rejected: language === 'ar' ? 'مرفوض' : 'Rejected', completed: language === 'ar' ? 'مكتملة' : 'Completed' };
        return <span className={`px-2 py-1 rounded-full text-xs ${classes}`}>{labels[status] || status}</span>;
      },
    },
    {
      id: 'actions',
      header: language === 'ar' ? 'الإجراءات' : 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/visits/${row.original.id}`)} title={language === 'ar' ? 'عرض / تحميل PDF' : 'View / Download PDF'}>
            <Eye className="w-4 h-4" />
          </Button>
          {row.original.status === 'pending' && (
            <>
              <Button variant="ghost" size="sm" onClick={() => handleApprove(row.original.id)} title={language === 'ar' ? 'موافقة' : 'Approve'}>
                <Check className="w-4 h-4 text-green-600" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleReject(row.original.id)} title={language === 'ar' ? 'رفض' : 'Reject'}>
                <X className="w-4 h-4 text-red-600" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
            disabled={deletingId === row.original.id}
            title={language === 'ar' ? 'حذف' : 'Delete'}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ], [language, navigate, deletingId]);

  if (loading && visits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        <p className="text-muted-foreground">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`flex flex-wrap items-center justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{language === 'ar' ? 'الزيارات' : 'Visits'}</h1>
          <p className="text-muted-foreground mt-2">
            {language === 'ar' ? 'إدارة زيارات المندوبين وربطها بمقدمي الخدمة (متاجر، شركات، أطباء)' : 'Manage representative visits linked to service providers (shops, companies, doctors)'}
          </p>
        </div>
        <Button onClick={() => navigate('/admin/visits/create')} className="gap-2">
          <Plus className="w-4 h-4" />
          {language === 'ar' ? 'إنشاء زيارة' : 'Create visit'}
        </Button>
      </div>

      {/* فلتر التاريخ */}
      <Card>
        <CardContent className="pt-4">
          <div className={`flex flex-wrap items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="text-sm text-muted-foreground">{language === 'ar' ? 'من تاريخ' : 'From date'}</span>
            <Input
              type="date"
              value={filters.date_from ?? ''}
              onChange={(e) => setFilters((p) => ({ ...p, date_from: e.target.value }))}
              className="w-40"
            />
            <span className="text-sm text-muted-foreground">{language === 'ar' ? 'إلى تاريخ' : 'To date'}</span>
            <Input
              type="date"
              value={filters.date_to ?? ''}
              onChange={(e) => setFilters((p) => ({ ...p, date_to: e.target.value }))}
              className="w-40"
            />
            {(filters.date_from || filters.date_to) && (
              <Button variant="ghost" size="sm" onClick={() => setFilters((p) => ({ ...p, date_from: '', date_to: '' }))}>
                {language === 'ar' ? 'مسح التاريخ' : 'Clear dates'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={visits}
        searchable
        searchPlaceholder={language === 'ar' ? 'البحث في الزيارات...' : 'Search visits...'}
        filters={filterOptions}
        filterValues={filters}
        onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
      />

    </div>
  );
}
