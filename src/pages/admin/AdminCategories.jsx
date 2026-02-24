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
import { showConfirm } from '@/components/ConfirmDialog';
import { Plus, Edit, Trash2, Eye, MoreHorizontal, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminCategories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setFetchError(null);
    try {
      const response = await api.get('/admin/categories');
      setCategories(extractDataFromResponse(response));
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
      setFetchError(error.response?.data?.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    showConfirm('Are you sure you want to delete this category? This action cannot be undone.', () => {
      api.delete(`/admin/categories/${id}`)
        .then(() => {
          showToast.success('Category deleted.');
          fetchCategories();
        })
        .catch((error) => {
          showToast.error(error.response?.data?.message || 'Failed to delete category');
        });
    });
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'ID',
    },
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <div className="max-w-xs truncate">{row.original.description || '-'}</div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ row }) => {
        const date = row.original.created_at;
        return date ? format(new Date(date), 'MMM dd, yyyy') : '-';
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
            <DropdownMenuItem onClick={() => navigate(`/admin/categories/${row.original.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/admin/categories/${row.original.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDelete(row.original.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [navigate, handleDelete]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
              <p className="text-muted-foreground mt-1">Manage product categories</p>
            </div>
            <Button onClick={() => navigate('/admin/categories/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
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
            <Button variant="outline" size="sm" onClick={fetchCategories} className="gap-1">
              <RefreshCw className="h-3 w-3" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={categories}
        searchable
        searchPlaceholder="Search categories..."
        loading={loading}
        emptyTitle="No categories found."
        emptyDescription="Try adding a category or adjust your search."
      />
    </div>
  );
}

