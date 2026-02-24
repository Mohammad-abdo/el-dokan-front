import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { Check, X, Trash2 } from 'lucide-react';

export default function AdminRatings() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    try {
      const response = await api.get('/admin/ratings');
      setRatings(extractDataFromResponse(response));
    } catch (error) {
      console.error('Error fetching ratings:', error);
      setRatings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/admin/ratings/${id}/approve`);
      fetchRatings();
    } catch (error) {
      console.error('Error approving rating:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/admin/ratings/${id}/reject`);
      fetchRatings();
    } catch (error) {
      console.error('Error rejecting rating:', error);
    }
  };

  const columns = useMemo(() => [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'user', header: 'User', cell: ({ row }) => row.original.user?.name || '-' },
    { accessorKey: 'rating', header: 'Rating', cell: ({ row }) => `${row.original.rating}/5` },
    { accessorKey: 'comment', header: 'Comment' },
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

  if (loading) {
    return <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ratings</h1>
        <p className="text-muted-foreground mt-2">Manage product ratings and reviews</p>
      </div>
      <DataTable columns={columns} data={ratings} searchable searchPlaceholder="Search ratings..." />
    </div>
  );
}


