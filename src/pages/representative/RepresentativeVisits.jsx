import { useState, useEffect } from 'react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { Eye, Plus } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export default function RepresentativeVisits() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();

  useEffect(() => {
    fetchVisits();
  }, [searchParams]);

  const fetchVisits = async () => {
    try {
      const status = searchParams.get('status');
      const filter = searchParams.get('filter');
      const params = {};
      if (status) params.status = status;
      if (filter) params.filter = filter;
      
      const response = await api.get('/representative/visits', { params });
      setVisits(extractDataFromResponse(response));
    } catch (error) {
      console.error('Error fetching visits:', error);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { accessorKey: 'id', header: language === 'ar' ? 'ID' : 'ID' },
    { accessorKey: 'shop_name', header: language === 'ar' ? 'اسم المتجر' : 'Shop Name' },
    { accessorKey: 'visit_date', header: language === 'ar' ? 'تاريخ الزيارة' : 'Visit Date' },
    { accessorKey: 'status', header: language === 'ar' ? 'الحالة' : 'Status' },
    { accessorKey: 'notes', header: language === 'ar' ? 'ملاحظات' : 'Notes' },
    {
      id: 'actions',
      header: language === 'ar' ? 'الإجراءات' : 'Actions',
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => navigate(`/representative/visits/${row.original.id}`)}>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {language === 'ar' ? 'الزيارات' : 'Visits'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === 'ar' ? 'إدارة زياراتك للمتاجر' : 'Manage your shop visits'}
          </p>
        </div>
        <Button onClick={() => navigate('/representative/visits/new')}>
          <Plus className="w-4 h-4 mr-2" />
          {language === 'ar' ? 'إضافة زيارة' : 'Add Visit'}
        </Button>
      </div>

      <DataTable data={visits} columns={columns} />
    </div>
  );
}

