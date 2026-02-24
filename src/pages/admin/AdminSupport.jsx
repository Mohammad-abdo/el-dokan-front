import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminSupport() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '' });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await api.get('/admin/support/tickets');
      setTickets(extractDataFromResponse(response));
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'open', label: 'Open' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'resolved', label: 'Resolved' },
        { value: 'closed', label: 'Closed' },
      ],
    },
  ];

  const columns = useMemo(() => [
    { accessorKey: 'id', header: 'Ticket ID' },
    { accessorKey: 'user', header: 'User', cell: ({ row }) => row.original.user?.name || '-' },
    { accessorKey: 'subject', header: 'Subject' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status || 'open';
        const colors = {
          open: 'bg-blue-100 text-blue-800',
          in_progress: 'bg-yellow-100 text-yellow-800',
          resolved: 'bg-green-100 text-green-800',
          closed: 'bg-gray-100 text-gray-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${colors[status] || colors.open}`}>
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => row.original.created_at ? format(new Date(row.original.created_at), 'MMM dd, yyyy') : '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/support/tickets/${row.original.id}`)}>
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ], []);

  const filteredData = useMemo(() => {
    return tickets.filter(ticket => {
      if (filters.status && ticket.status !== filters.status) return false;
      return true;
    });
  }, [tickets, filters]);

  if (loading) {
    return <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
        <p className="text-muted-foreground mt-2">Manage customer support tickets</p>
      </div>
      <DataTable
        columns={columns}
        data={filteredData}
        searchable
        searchPlaceholder="Search tickets..."
        filters={filterOptions}
        filterValues={filters}
        onFilterChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
      />
    </div>
  );
}

