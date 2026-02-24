import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import showToast from '@/lib/toast';
import { showConfirm } from '@/components/ConfirmDialog';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { Plus, Trash2, MapPin } from 'lucide-react';

export default function DoctorMedicalCenters() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    try {
      const response = await api.get('/doctor/medical-centers');
      setCenters(extractDataFromResponse(response));
    } catch (error) {
      console.error('Error fetching medical centers:', error);
      setCenters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    showConfirm('Are you sure you want to remove this medical center?', async () => {
      try {
        await api.delete(`/doctor/medical-centers/${id}`);
        fetchCenters();
      } catch (error) {
        console.error('Error removing medical center:', error);
        showToast.error(error.response?.data?.message || 'Failed to remove medical center');
      }
    });
  };

  const columns = useMemo(() => [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'address', header: 'Address' },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleRemove(row.original.id)}>
            <Trash2 className="w-4 h-4 text-destructive" />
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
          <h1 className="text-3xl font-bold tracking-tight">Medical Centers</h1>
          <p className="text-muted-foreground mt-2">Manage your medical centers</p>
        </div>
        <Button onClick={() => window.location.href = '/doctor/medical-centers/add'}>
          <Plus className="w-4 h-4 mr-2" />
          Add Center
        </Button>
      </div>
      <DataTable columns={columns} data={centers} searchable searchPlaceholder="Search medical centers..." />
    </div>
  );
}


