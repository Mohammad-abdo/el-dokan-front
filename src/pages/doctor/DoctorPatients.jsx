import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { Eye, User } from 'lucide-react';

export default function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await api.get('/doctor/patients');
      setPatients(extractDataFromResponse(response));
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(() => [
    { accessorKey: 'id', header: 'ID' },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => row.original.name || row.original.fullName || '-',
    },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'phone', header: 'Phone' },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => window.location.href = `/doctor/patients/${row.original.id}`}>
            <Eye className="w-4 h-4" />
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
        <p className="text-muted-foreground mt-2">View your patients</p>
      </div>
      <DataTable columns={columns} data={patients} searchable searchPlaceholder="Search patients..." />
    </div>
  );
}


