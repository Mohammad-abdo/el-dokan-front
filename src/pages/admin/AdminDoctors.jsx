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
import { Plus, Eye, UserCheck, UserX, Wallet, MoreHorizontal, AlertCircle, RefreshCw } from 'lucide-react';

export default function AdminDoctors() {
  const navigate = useNavigate();
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
      header: 'Name',
      cell: ({ row }) => {
        const doctor = row.original;
        return doctor.name || doctor.fullName || doctor.user?.name || doctor.user?.username || '-';
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => {
        const doctor = row.original;
        return doctor.email || doctor.user?.email || '-';
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => {
        const doctor = row.original;
        return doctor.phone || doctor.user?.phone || '-';
      },
    },
    {
      accessorKey: 'specialty',
      header: 'Specialty',
      cell: ({ row }) => {
        const doctor = row.original;
        return doctor.specialty || doctor.specialization || '-';
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
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
  ], [navigate, handleActivate, handleSuspend]);

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
        data={doctors}
        searchable
        searchPlaceholder="Search doctors..."
        loading={loading}
        emptyTitle="No doctors found."
        emptyDescription="Add a doctor or adjust your search."
      />
    </div>
  );
}


