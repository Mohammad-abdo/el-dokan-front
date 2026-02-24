import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import showToast from '@/lib/toast';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { getImageSrc } from '@/lib/imageUtils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [shops, setShops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    shop_id: '',
    name: '',
    description: '',
    price: '',
    discount_percentage: '',
    stock_quantity: '',
    category: '',
    subcategory: '',
    image_url: '',
    is_active: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    Promise.all([fetchProduct(), fetchShops(), fetchCategories()]);
  }, [id]);

  const fetchShops = async () => {
    try {
      const response = await api.get('/admin/shops');
      setShops(extractDataFromResponse(response));
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/admin/categories');
      setCategories(extractDataFromResponse(response));
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/admin/products/${id}`);
      const data = response.data?.data || response.data;
      const product = data?.product || data;
      if (product) {
        const firstImage = product.images && product.images.length > 0 ? product.images[0] : '';
        setFormData({
          shop_id: product.shop_id || '',
          name: product.name || '',
          description: product.description || '',
          price: product.price || '',
          discount_percentage: product.discount_percentage || '',
          stock_quantity: product.stock_quantity || '',
          category: product.category || '',
          subcategory: product.subcategory || '',
          image_url: firstImage,
          is_active: product.is_active !== undefined ? product.is_active : true,
        });
        if (firstImage) setImagePreview(firstImage);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast.error(language === 'ar' ? 'الملف يجب أن يكون صورة' : 'File must be an image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast.error(language === 'ar' ? 'حجم الصورة يجب أن يكون أقل من 5MB' : 'Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);
      formDataUpload.append('type', 'product');

      const response = await api.post('/admin/file-uploads', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = response.data?.data?.url || response.data?.data?.file_url || response.data?.url;
      if (imageUrl) {
        setFormData(prev => ({ ...prev, image_url: imageUrl }));
        setImagePreview(imageUrl);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast.error(language === 'ar' ? 'فشل رفع الصورة' : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.price || parseFloat(formData.price) < 0) {
      newErrors.price = 'Valid price is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        shop_id: formData.shop_id ? parseInt(formData.shop_id) : null,
        price: parseFloat(formData.price),
        discount_percentage: formData.discount_percentage ? parseFloat(formData.discount_percentage) : null,
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : 0,
        images: formData.image_url ? [formData.image_url] : [],
      };
      await api.put(`/admin/products/${id}`, payload);
      navigate(`/admin/products/${id}`);
    } catch (error) {
      console.error('Error updating product:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        showToast.error(error.response?.data?.message || 'Failed to update product');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(`/admin/products/${id}`)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground mt-1">Update product information</p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">Shop</label>
              <select
                name="shop_id"
                value={formData.shop_id}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select Shop</option>
                {shops.map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name || shop.name_en || shop.name_ar}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Product Name <span className="text-destructive">*</span>
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter product name"
                className={errors.name ? 'border-destructive' : ''}
                required
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Price <span className="text-destructive">*</span>
              </label>
              <Input
                name="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
                className={errors.price ? 'border-destructive' : ''}
                required
              />
              {errors.price && (
                <p className="text-sm text-destructive mt-1">{errors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Discount (%)</label>
              <Input
                name="discount_percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.discount_percentage}
                onChange={handleChange}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Stock Quantity</label>
              <Input
                name="stock_quantity"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={handleChange}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name || cat.name_en || cat.slug}>
                    {cat.name || cat.name_en || cat.name_ar}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter product description"
                className="w-full p-2 border rounded-lg min-h-[100px]"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="image_url">
                {language === 'ar' ? 'صورة المنتج' : 'Product Image'}
              </Label>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Input
                    id="image_url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={(e) => {
                      handleChange(e);
                      setImagePreview(e.target.value);
                    }}
                    placeholder="https://example.com/image.jpg"
                    type="url"
                    className="flex-1"
                  />
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
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
                        : (language === 'ar' ? 'رفع صورة' : 'Upload Image')}
                    </Button>
                  </label>
                </div>
                {(imagePreview || formData.image_url) && (
                  <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                    <img
                      src={getImageSrc(imagePreview || formData.image_url)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={() => setImagePreview('')}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setFormData(prev => ({ ...prev, image_url: '' }));
                      }}
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <label className="text-sm font-medium">Active</label>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/admin/products/${id}`)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}




