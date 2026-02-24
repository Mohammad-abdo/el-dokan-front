import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import showToast from '@/lib/toast';
import { showConfirm } from '@/components/ConfirmDialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, Package, DollarSign, ShoppingCart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ShopProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/shop/products/${id}`);
      setProduct(response.data?.data || response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const message = language === 'ar' ? 'هل أنت متأكد من حذف هذا المنتج؟' : 'Are you sure you want to delete this product?';
    showConfirm(message, async () => {
      try {
        await api.delete(`/shop/products/${id}`);
        navigate('/shop/products');
      } catch (error) {
        console.error('Error deleting product:', error);
        showToast.error(language === 'ar' ? 'فشل حذف المنتج' : 'Failed to delete product');
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{language === 'ar' ? 'المنتج غير موجود' : 'Product not found'}</p>
        <Link to="/shop/products" className="text-primary mt-4 inline-block">
          {language === 'ar' ? 'رجوع إلى المنتجات' : 'Back to Products'}
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
            onClick={() => navigate('/shop/products')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === 'ar' ? 'رجوع' : 'Back'}
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {product.name || (language === 'ar' ? 'المنتج' : 'Product')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'ar' ? 'تفاصيل المنتج' : 'Product Details'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate(`/shop/products/${id}/edit`)}
            variant="outline"
            className="gap-2"
          >
            <Edit className="w-4 h-4" />
            {language === 'ar' ? 'تعديل' : 'Edit'}
          </Button>
          <Button
            onClick={handleDelete}
            variant="destructive"
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {language === 'ar' ? 'حذف' : 'Delete'}
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
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {language === 'ar' ? 'معلومات المنتج' : 'Product Information'}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'الاسم' : 'Name'}</p>
                <p className="font-medium">{product.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'السعر' : 'Price'}</p>
                <p className="font-medium">${parseFloat(product.price || 0).toLocaleString()}</p>
              </div>
              {product.discount_percentage && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'الخصم' : 'Discount'}</p>
                  <p className="font-medium">{product.discount_percentage}%</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'الكمية' : 'Stock'}</p>
                <p className="font-medium">{product.stock_quantity || 0}</p>
              </div>
              {product.description && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'الوصف' : 'Description'}</p>
                  <p className="font-medium">{product.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'الحالة' : 'Status'}</p>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  product.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {product.is_active !== false ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                </span>
              </div>
            </div>
          </Card>

          {product.images && product.images.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {language === 'ar' ? 'صور المنتج' : 'Product Images'}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {product.images.map((image, index) => (
                  <div key={index} className="relative w-full h-48 rounded-lg overflow-hidden">
                    <img
                      src={image}
                      alt={`Product ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {language === 'ar' ? 'الإحصائيات' : 'Statistics'}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'الكمية' : 'Stock'}
                  </span>
                </div>
                <span className="font-bold">{product.stock_quantity || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'السعر' : 'Price'}
                  </span>
                </div>
                <span className="font-bold">${parseFloat(product.price || 0).toLocaleString()}</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

