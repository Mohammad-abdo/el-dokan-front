import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import showToast from '@/lib/toast';
import { showConfirm } from '@/components/ConfirmDialog';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { Plus, Trash2, Upload } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminFileUploads() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await api.get('/admin/file-uploads');
      setFiles(extractDataFromResponse(response));
    } catch (error) {
      console.error('Error fetching files:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    showConfirm('Are you sure you want to delete this file?', async () => {
      try {
        await api.delete(`/admin/file-uploads/${id}`);
        fetchFiles();
      } catch (error) {
        console.error('Error deleting file:', error);
        showToast.error(error.response?.data?.message || 'Failed to delete file');
      }
    });
  };

  const columns = useMemo(() => [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'filename', header: 'Filename' },
    { accessorKey: 'path', header: 'Path' },
    { accessorKey: 'size', header: 'Size', cell: ({ row }) => `${(row.original.size / 1024).toFixed(2)} KB` },
    {
      accessorKey: 'created_at',
      header: 'Uploaded',
      cell: ({ row }) => row.original.created_at ? format(new Date(row.original.created_at), 'MMM dd, yyyy') : '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.original.id)}>
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
          <h1 className="text-3xl font-bold tracking-tight">File Uploads</h1>
          <p className="text-muted-foreground mt-2">Manage uploaded files</p>
        </div>
        <Button onClick={() => window.location.href = '/admin/file-uploads/upload'}>
          <Upload className="w-4 h-4 mr-2" />
          Upload File
        </Button>
      </div>
      <DataTable columns={columns} data={files} searchable searchPlaceholder="Search files..." />
    </div>
  );
}


