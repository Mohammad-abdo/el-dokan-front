import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import showToast from '@/lib/toast';
import { showConfirm } from '@/components/ConfirmDialog';
import { ArrowLeft, Image, Edit, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminSliderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [slider, setSlider] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSlider();
  }, [id]);

  const fetchSlider = async () => {
    try {
      const response = await api.get(`/admin/sliders/${id}`);
      const sliderData = response.data?.data || response.data;
      setSlider(sliderData);
    } catch (error) {
      console.error('Error fetching slider:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    showConfirm('Are you sure you want to delete this slider? This action cannot be undone.', () => {
      api.delete(`/admin/sliders/${id}`)
        .then(() => {
          showToast.success('Slider deleted.');
          navigate('/admin/sliders');
        })
        .catch((error) => {
          showToast.error(error.response?.data?.message || 'Failed to delete slider');
        });
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!slider) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Slider not found</p>
        <Link to="/admin/sliders" className="text-primary mt-4 inline-block">
          Back to Sliders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/sliders')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {slider.title || 'Slider'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Slider Details
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate(`/admin/sliders/${id}/edit`)}
            variant="outline"
            className="gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          <Button
            onClick={handleDelete}
            variant="destructive"
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 space-y-6"
        >
          {/* Slider Image */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Image className="w-5 h-5" />
              Slider Image
            </h2>
            {slider.image || slider.image_url ? (
              <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden">
                <img
                  src={slider.image || slider.image_url}
                  alt={slider.title || 'Slider'}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                <Image className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
          </Card>

          {/* Slider Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Slider Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Title</p>
                <p className="font-medium">{slider.title || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Order</p>
                <p className="font-medium">{slider.order || slider.sort_order || '-'}</p>
              </div>
              {slider.link && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">Link</p>
                  <a
                    href={slider.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {slider.link}
                  </a>
                </div>
              )}
              {slider.description && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="font-medium">{slider.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  slider.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {slider.is_active !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="font-medium">
                  {slider.created_at ? format(new Date(slider.created_at), 'PPp') : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {slider.updated_at ? format(new Date(slider.updated_at), 'PPp') : '-'}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}




