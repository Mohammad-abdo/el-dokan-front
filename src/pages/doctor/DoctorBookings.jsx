import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { Eye, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function DoctorBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '' });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/doctor/bookings');
      setBookings(extractDataFromResponse(response));
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
  ];

  const columns = useMemo(() => [
    { accessorKey: 'id', header: 'Booking ID' },
    {
      accessorKey: 'patient',
      header: 'Patient',
      cell: ({ row }) => row.original.patient?.name || row.original.patient?.fullName || '-',
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => row.original.date ? format(new Date(row.original.date), 'MMM dd, yyyy') : '-',
    },
    {
      accessorKey: 'time',
      header: 'Time',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status || 'pending';
        const colors = {
          pending: 'bg-yellow-100 text-yellow-800',
          confirmed: 'bg-blue-100 text-blue-800',
          completed: 'bg-green-100 text-green-800',
          cancelled: 'bg-red-100 text-red-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${colors[status] || colors.pending}`}>
            {status}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => window.location.href = `/doctor/bookings/${row.original.id}`}>
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ], []);

  const filteredData = useMemo(() => {
    return bookings.filter(booking => {
      if (filters.status && booking.status !== filters.status) return false;
      return true;
    });
  }, [bookings, filters]);

  if (loading) {
    return <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
        <p className="text-muted-foreground mt-2">Manage your appointments</p>
      </div>
      <DataTable
        columns={columns}
        data={filteredData}
        searchable
        searchPlaceholder="Search bookings..."
        filters={filterOptions}
        filterValues={filters}
        onFilterChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
      />
    </div>
  );
}

