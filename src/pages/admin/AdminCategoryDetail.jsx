import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import showToast from '@/lib/toast';
import { showConfirm } from '@/components/ConfirmDialog';
import { ArrowLeft, Folder, Edit, Trash2, Package } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminCategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategory();
  }, [id]);

  const fetchCategory = async () => {
    try {
      const response = await api.get(`/admin/categories/${id}`);
      const categoryData = response.data?.data || response.data;
      setCategory(categoryData);
    } catch (error) {
      console.error('Error fetching category:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    showConfirm('Are you sure you want to delete this category? This action cannot be undone.', () => {
      api.delete(`/admin/categories/${id}`)
        .then(() => {
          showToast.success('Category deleted.');
          navigate('/admin/categories');
        })
        .catch((error) => {
          showToast.error(error.response?.data?.message || 'Failed to delete category');
        });
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-12 w-12 rounded-full" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Category not found</p>
        <Link to="/admin/categories" className="text-primary mt-4 inline-block">
          Back to Categories
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin/categories')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Avatar className="h-12 w-12 border-2 border-muted">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Folder className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {category.name || category.name_en || category.name_ar || 'Category'}
                </h1>
                <p className="text-muted-foreground mt-1">
                  Category Details
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate(`/admin/categories/${id}/edit`)}
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
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Folder className="w-5 h-5" />
              Category Information
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Name (English)</p>
                <p className="font-medium">{category.name_en || category.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Name (Arabic)</p>
                <p className="font-medium">{category.name_ar || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Slug</p>
                <p className="font-medium">{category.slug || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {category.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {category.parent && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Parent Category</p>
                  <Link 
                    to={`/admin/categories/${category.parent.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {category.parent.name || category.parent.name_en || '-'}
                  </Link>
                </div>
              )}
              {category.description && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="font-medium">{category.description}</p>
                </div>
              )}
              {category.image_url && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">Image</p>
                  <img 
                    src={category.image_url} 
                    alt={category.name}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Subcategories */}
          {category.children && category.children.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Subcategories</h2>
              <div className="space-y-2">
                {category.children.map((child) => (
                  <Link
                    key={child.id}
                    to={`/admin/categories/${child.id}`}
                    className="block p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <p className="font-medium">{child.name || child.name_en || '-'}</p>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Products */}
          {category.products && category.products.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Products ({category.products.length})
              </h2>
              <div className="space-y-2">
                {category.products.slice(0, 10).map((product) => (
                  <Link
                    key={product.id}
                    to={`/admin/products/${product.id}`}
                    className="block p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <p className="font-medium">{product.name || '-'}</p>
                  </Link>
                ))}
                {category.products.length > 10 && (
                  <Link
                    to="/admin/products"
                    className="block mt-4 text-center text-primary hover:underline"
                  >
                    View all products ({category.products.length})
                  </Link>
                )}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Statistics</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{category.products?.length || 0}</p>
              </div>
              {category.children && (
                <div>
                  <p className="text-sm text-muted-foreground">Subcategories</p>
                  <p className="text-2xl font-bold">{category.children.length || 0}</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Timestamps</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="font-medium">
                  {category.created_at ? format(new Date(category.created_at), 'PPp') : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {category.updated_at ? format(new Date(category.updated_at), 'PPp') : '-'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}




