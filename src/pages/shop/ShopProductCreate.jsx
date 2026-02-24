import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import showToast from '@/lib/toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { extractDataFromResponse } from '@/lib/apiHelper';

export default function ShopProductCreate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discount_percentage: '',
    stock_quantity: '',
    category_id: '',
    subcategory_id: '',
    is_active: true,
  });

  useEffect(() => {
    fetchCategories();
    if (isEdit) {
      fetchProduct();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(extractDataFromResponse(response));
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/shop/products/${id}`);
      const product = response.data?.data || response.data;
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        discount_percentage: product.discount_percentage || '',
        stock_quantity: product.stock_quantity || '',
        category_id: product.category_id || '',
        subcategory_id: product.subcategory_id || '',
        is_active: product.is_active !== false,
      });
      if (product.images && Array.isArray(product.images)) {
        setImages(product.images);
        setImagePreviews(product.images);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const formDataUpload = new FormData();
        formDataUpload.append('image', file);
        formDataUpload.append('type', 'product');

        const response = await api.post('/admin/file-uploads', formDataUpload, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        return response.data?.data?.url || response.data?.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setImages(prev => [...prev, ...uploadedUrls]);
      setImagePreviews(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error('Error uploading images:', error);
      showToast.error(language === 'ar' ? 'فشل رفع الصور' : 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        discount_percentage: formData.discount_percentage ? parseFloat(formData.discount_percentage) : null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        subcategory_id: formData.subcategory_id ? parseInt(formData.subcategory_id) : null,
        images: images,
      };

      if (isEdit) {
        await api.put(`/shop/products/${id}`, payload);
      } else {
        await api.post('/shop/products', payload);
      }

      navigate('/shop/products');
    } catch (error) {
      console.error('Error saving product:', error);
      showToast.error(error.response?.data?.message || (language === 'ar' ? 'فشل حفظ المنتج' : 'Failed to save product'));
    } finally {
      setLoading(false);
    }
  };

  const subcategories = categories.find(cat => cat.id === parseInt(formData.category_id))?.children || [];

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
              {isEdit ? (language === 'ar' ? 'تعديل المنتج' : 'Edit Product') : (language === 'ar' ? 'إنشاء منتج جديد' : 'Create New Product')}
            </h1>
          </div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6 md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">
              {language === 'ar' ? 'معلومات المنتج' : 'Product Information'}
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">
                  {language === 'ar' ? 'الاسم' : 'Name'} *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">
                  {language === 'ar' ? 'الوصف' : 'Description'}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="price">
                    {language === 'ar' ? 'السعر' : 'Price'} *
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="discount_percentage">
                    {language === 'ar' ? 'نسبة الخصم (%)' : 'Discount (%)'}
                  </Label>
                  <Input
                    id="discount_percentage"
                    type="number"
                    step="0.01"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="stock_quantity">
                    {language === 'ar' ? 'الكمية' : 'Stock Quantity'}
                  </Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="category_id">
                    {language === 'ar' ? 'الفئة' : 'Category'}
                  </Label>
                  <select
                    id="category_id"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value, subcategory_id: '' })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">{language === 'ar' ? '-- اختر --' : '-- Select --'}</option>
                    {categories.filter(cat => !cat.parent_id).map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name || cat.name_en || cat.name_ar}
                      </option>
                    ))}
                  </select>
                </div>

                {subcategories.length > 0 && (
                  <div>
                    <Label htmlFor="subcategory_id">
                      {language === 'ar' ? 'الفئة الفرعية' : 'Subcategory'}
                    </Label>
                    <select
                      id="subcategory_id"
                      value={formData.subcategory_id}
                      onChange={(e) => setFormData({ ...formData, subcategory_id: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">{language === 'ar' ? '-- اختر --' : '-- Select --'}</option>
                      {subcategories.map(sub => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name || sub.name_en || sub.name_ar}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    {language === 'ar' ? 'نشط' : 'Active'}
                  </Label>
                </div>
              </div>

              <div>
                <Label>
                  {language === 'ar' ? 'صور المنتج' : 'Product Images'}
                </Label>
                <div className="space-y-3">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading}
                      className="gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {uploading 
                        ? (language === 'ar' ? 'جاري الرفع...' : 'Uploading...') 
                        : (language === 'ar' ? 'رفع صور' : 'Upload Images')}
                    </Button>
                  </label>
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {imagePreviews.map((url, index) => (
                        <div key={index} className="relative w-full h-32 border rounded-lg overflow-hidden">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/shop/products')}
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ' : 'Save')}
          </Button>
        </div>
      </form>
    </div>
  );
}

