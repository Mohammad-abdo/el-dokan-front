import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';

const getImageSrc = (url) => {
  if (!url) return null;
  if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) return url;
  const base = api.defaults.baseURL?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:8000';
  return base + (url.startsWith('/') ? url : `/${url}`);
};
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Edit, Eye, MoreHorizontal, AlertCircle, RefreshCw } from 'lucide-react';

export default function AdminSliders() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    fetchSliders();
  }, []);

  const fetchSliders = async () => {
    setFetchError(null);
    try {
      const response = await api.get('/admin/sliders');
      setSliders(extractDataFromResponse(response));
    } catch (error) {
      console.error('Error fetching sliders:', error);
      setSliders([]);
      setFetchError(error.response?.data?.message || 'Failed to load sliders.');
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(() => [
    { accessorKey: 'id', header: t('common_labels.id') },
    { accessorKey: 'title', header: t('common_labels.name') },
    { 
      accessorKey: 'image', 
      header: t('common_labels.image'), 
      cell: ({ row }) => {
        const src = getImageSrc(row.original.image_url || row.original.image);
        return (
          <motion.div whileHover={{ scale: 1.05 }} className="w-16 h-16 rounded overflow-hidden bg-muted flex items-center justify-center shrink-0">
            {src ? (
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                  const placeholder = e.target.nextElementSibling;
                  if (placeholder) placeholder.classList.remove("hidden");
                }}
              />
            ) : null}
            <span className={src ? "hidden text-muted-foreground text-xs" : "text-muted-foreground text-xs"}>
              -
            </span>
          </motion.div>
        );
      }
    },
    { 
      accessorKey: 'order', 
      header: t('common_labels.order'),
      cell: ({ row }) => row.original.order || row.original.sort_order || '-'
    },
    {
      id: 'actions',
      header: t('common_labels.action'),
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/admin/sliders/${row.original.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/admin/sliders/${row.original.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [navigate, t]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t('sidebar.sliders')}</h1>
              <p className="text-muted-foreground mt-1">Manage homepage sliders</p>
            </div>
            <Button onClick={() => navigate('/admin/sliders/new')}>
              <Plus className="w-4 h-4 mr-2" />
              {t('common_labels.create')} {t('sidebar.sliders')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('common_labels.error') || 'Error'}</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>{fetchError}</span>
            <Button variant="outline" size="sm" onClick={fetchSliders} className="gap-1">
              <RefreshCw className="h-3 w-3" />
              {t('common_labels.retry') || 'Retry'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={sliders}
        searchable
        searchPlaceholder={t('common_labels.search') + ' ' + t('sidebar.sliders') + '...'}
        loading={loading}
        emptyTitle="No sliders found."
        emptyDescription="Create a slider to show on the homepage."
      />
    </div>
  );
}


