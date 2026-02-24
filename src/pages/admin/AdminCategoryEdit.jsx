import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import showToast from '@/lib/toast';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminCategoryEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [imagePreview, setImagePreview] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    name_en: '',
    slug: '',
    description: '',
    parent_id: '',
    image_url: '',
    is_active: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    Promise.all([fetchCategory(), fetchCategories()]);
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/admin/categories');
      const allCategories = extractDataFromResponse(response);
      // Filter to show only root categories (no parent) and exclude current category
      setCategories(allCategories.filter(cat => !cat.parent_id && cat.id !== parseInt(id)));
    } catch (error) {
      console.error('Error fetching categories:', error);
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
      formDataUpload.append('type', 'category');

      const response = await api.post('/admin/file-uploads', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = response.data?.data?.url || response.data?.url;
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

  const fetchCategory = async () => {
    try {
      const response = await api.get(`/admin/categories/${id}`);
      const category = response.data?.data || response.data;
      if (category) {
        setFormData({
          name: category.name || category.name_en || '',
          name_ar: category.name_ar || '',
          name_en: category.name_en || category.name || '',
          slug: category.slug || '',
          description: category.description || '',
          parent_id: category.parent_id || '',
          image_url: category.image_url || '',
          is_active: category.is_active !== undefined ? category.is_active : true,
        });
        if (category.image_url) {
          setImagePreview(category.image_url);
        }
      }
    } catch (error) {
      console.error('Error fetching category:', error);
    } finally {
      setLoading(false);
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
    
    if (!formData.name?.trim() && !formData.name_en?.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.slug?.trim()) {
      newErrors.slug = 'Slug is required';
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
        parent_id: formData.parent_id || null,
      };
      await api.put(`/admin/categories/${id}`, payload);
      navigate(`/admin/categories/${id}`);
    } catch (error) {
      console.error('Error updating category:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        showToast.error(error.response?.data?.message || 'Failed to update category');
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
          onClick={() => navigate(`/admin/categories/${id}`)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Category</h1>
          <p className="text-muted-foreground mt-1">Update category information</p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">
                Name (English) <span className="text-destructive">*</span>
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter category name"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Name (Arabic)</label>
              <Input
                name="name_ar"
                value={formData.name_ar}
                onChange={handleChange}
                placeholder="Enter category name in Arabic"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Slug <span className="text-destructive">*</span>
              </label>
              <Input
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="category-slug"
                className={errors.slug ? 'border-destructive' : ''}
              />
              {errors.slug && (
                <p className="text-sm text-destructive mt-1">{errors.slug}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Parent Category</label>
              <select
                name="parent_id"
                value={formData.parent_id}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">None (Root Category)</option>
                {categories.filter(cat => cat.id !== parseInt(id)).map((cat) => (
                  <option key={cat.id} value={cat.id}>
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
                placeholder="Enter category description"
                className="w-full p-2 border rounded-lg min-h-[100px]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'صورة الفئة' : 'Category Image'}
              </label>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Input
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
                {imagePreview && (
                  <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                    <img
                      src={imagePreview}
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

            <div className="flex items-center gap-2 mt-6">
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
              onClick={() => navigate(`/admin/categories/${id}`)}
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



