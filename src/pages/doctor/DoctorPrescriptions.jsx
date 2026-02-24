import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import showToast from '@/lib/toast';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { Plus, Eye, Edit, Printer, Share2 } from 'lucide-react';
import { format } from 'date-fns';

export default function DoctorPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const response = await api.get('/doctor/prescriptions');
      setPrescriptions(extractDataFromResponse(response));
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async (id) => {
    try {
      const response = await api.get(`/doctor/prescriptions/${id}/print`);
      window.open(response.data.url, '_blank');
    } catch (error) {
      console.error('Error printing prescription:', error);
    }
  };

  const handleShare = async (id) => {
    try {
      const response = await api.post(`/doctor/prescriptions/${id}/share`);
      if (response.data.link) {
        navigator.clipboard.writeText(response.data.link);
        showToast.success('Share link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing prescription:', error);
    }
  };

  const columns = useMemo(() => [
    { accessorKey: 'id', header: 'ID' },
    {
      accessorKey: 'patient',
      header: 'Patient',
      cell: ({ row }) => row.original.patient?.name || row.original.patient?.fullName || '-',
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => row.original.created_at ? format(new Date(row.original.created_at), 'MMM dd, yyyy') : '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => window.location.href = `/doctor/prescriptions/${row.original.id}`}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => window.location.href = `/doctor/prescriptions/${row.original.id}/edit`}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handlePrint(row.original.id)}>
            <Printer className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleShare(row.original.id)}>
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ], []);

  if (loading) {
    return <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prescriptions</h1>
          <p className="text-muted-foreground mt-2">Manage prescriptions</p>
        </div>
        <Button onClick={() => window.location.href = '/doctor/prescriptions/new'}>
          <Plus className="w-4 h-4 mr-2" />
          New Prescription
        </Button>
      </div>
      <DataTable columns={columns} data={prescriptions} searchable searchPlaceholder="Search prescriptions..." />
    </div>
  );
}


