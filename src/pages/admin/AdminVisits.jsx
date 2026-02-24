import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { Check, X, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminVisits() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '' });

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      const response = await api.get('/admin/visits');
      setVisits(extractDataFromResponse(response));
    } catch (error) {
      console.error('Error fetching visits:', error);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/admin/visits/${id}/approve`);
      fetchVisits();
    } catch (error) {
      console.error('Error approving visit:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/admin/visits/${id}/reject`);
      fetchVisits();
    } catch (error) {
      console.error('Error rejecting visit:', error);
    }
  };

  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
      ],
    },
  ];

  const columns = useMemo(() => [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'representative', header: 'Representative', cell: ({ row }) => row.original.representative?.name || '-' },
    { accessorKey: 'shop', header: 'Shop', cell: ({ row }) => row.original.shop?.name || '-' },
    { accessorKey: 'visit_date', header: 'Visit Date', cell: ({ row }) => row.original.visit_date ? format(new Date(row.original.visit_date), 'MMM dd, yyyy') : '-' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status || 'pending';
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${
            status === 'approved' ? 'bg-green-100 text-green-800' :
            status === 'rejected' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
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
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => window.location.href = `/admin/visits/${row.original.id}`}>
            <Eye className="w-4 h-4" />
          </Button>
          {row.original.status === 'pending' && (
            <>
              <Button variant="ghost" size="sm" onClick={() => handleApprove(row.original.id)}>
                <Check className="w-4 h-4 text-green-600" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleReject(row.original.id)}>
                <X className="w-4 h-4 text-red-600" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ], []);

  const filteredData = useMemo(() => {
    return visits.filter(visit => {
      if (filters.status && visit.status !== filters.status) return false;
      return true;
    });
  }, [visits, filters]);

  if (loading) {
    return <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Visits</h1>
        <p className="text-muted-foreground mt-2">Manage representative visits</p>
      </div>
      <DataTable
        columns={columns}
        data={filteredData}
        searchable
        searchPlaceholder="Search visits..."
        filters={filterOptions}
        filterValues={filters}
        onFilterChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
      />
    </div>
  );
}

