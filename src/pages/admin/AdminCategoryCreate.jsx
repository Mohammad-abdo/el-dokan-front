import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import showToast from '@/lib/toast';
import { ArrowLeft, Upload, X, Plus, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminCategoryCreate() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
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
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/admin/categories');
      const allCategories = extractDataFromResponse(response);
      // Filter to show only root categories (no parent) for parent selection
      setCategories(allCategories.filter(cat => !cat.parent_id));
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
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'category');

      const response = await api.post('/admin/file-uploads', formData, {
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

  const handleAddSubcategory = () => {
    setSubcategories(prev => [...prev, { 
      name: '', 
      name_ar: '', 
      name_en: '', 
      slug: '', 
      description: '', 
      image_url: '', 
      is_active: true,
      imagePreview: ''
    }]);
  };

  const handleSubcategoryChange = (index, field, value) => {
    setSubcategories(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'name' && !updated[index].slug) {
        updated[index].slug = generateSlug(value);
      }
      if (field === 'image_url') {
        updated[index].imagePreview = value;
      }
      return updated;
    });
  };

  const handleSubcategoryImageUpload = async (index, e) => {
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
        handleSubcategoryChange(index, 'image_url', imageUrl);
        handleSubcategoryChange(index, 'imagePreview', imageUrl);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast.error(language === 'ar' ? 'فشل رفع الصورة' : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveSubcategory = (index) => {
    setSubcategories(prev => prev.filter((_, i) => i !== index));
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

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({ 
      ...prev, 
      name,
      slug: prev.slug || generateSlug(name)
    }));
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name?.trim() && !formData.name_en?.trim() && !formData.name_ar?.trim()) {
      newErrors.name = language === 'ar' ? 'يجب إدخال الاسم على الأقل (بالإنجليزية أو العربية)' : 'At least one name field (English or Arabic) is required';
    }
    
    if (!formData.slug?.trim()) {
      newErrors.slug = language === 'ar' ? 'Slug مطلوب' : 'Slug is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      // Create main category
      const payload = {
        name: formData.name || formData.name_en || formData.name_ar || '',
        name_ar: formData.name_ar || '',
        name_en: formData.name_en || formData.name || '',
        slug: formData.slug || generateSlug(formData.name || formData.name_en || formData.name_ar || ''),
        description: formData.description || '',
        parent_id: formData.parent_id || null,
        image_url: formData.image_url || null,
        is_active: formData.is_active !== false,
      };
      
      const mainCategoryResponse = await api.post('/admin/categories', payload);
      const mainCategory = mainCategoryResponse.data?.data || mainCategoryResponse.data;

      // Create subcategories if any
      if (subcategories.length > 0 && mainCategory?.id) {
        const subcategoryPromises = subcategories
          .filter(sub => sub.name || sub.name_ar || sub.name_en)
          .map(sub => {
            const subPayload = {
              name: sub.name || sub.name_en || sub.name_ar || '',
              name_ar: sub.name_ar || '',
              name_en: sub.name_en || sub.name || '',
              slug: sub.slug || generateSlug(sub.name || sub.name_en || sub.name_ar || ''),
              description: sub.description || '',
              parent_id: mainCategory.id,
              image_url: sub.image_url || null,
              is_active: sub.is_active !== false,
            };
            return api.post('/admin/categories', subPayload);
          });

        await Promise.all(subcategoryPromises);
      }

      showToast.success(language === 'ar' ? 'تم إنشاء الفئة بنجاح' : 'Category created successfully.');
      navigate('/admin/categories');
    } catch (error) {
      console.error('Error creating category:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        showToast.error(error.response?.data?.message || (language === 'ar' ? 'فشل إنشاء الفئة' : 'Failed to create category'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/categories')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {language === 'ar' ? 'إنشاء فئة جديدة' : 'Create New Category'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === 'ar' ? 'إضافة فئة جديدة للنظام' : 'Add a new category to the system'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-lg font-semibold">
              {language === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}
            </h2>
            <Separator />
            <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                {language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleNameChange}
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
                {categories.map((cat) => (
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
                  <input
                    id="category-image-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('category-image-input')?.click()}
                    disabled={uploading}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {uploading 
                      ? (language === 'ar' ? 'جاري الرفع...' : 'Uploading...') 
                      : (language === 'ar' ? 'رفع صورة' : 'Upload Image')}
                  </Button>
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

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <label className="text-sm font-medium">
                {language === 'ar' ? 'نشط' : 'Active'}
              </label>
            </div>
          </div>

          {/* Subcategories Section */}
          <div className="border-t pt-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {language === 'ar' ? 'الفئات الفرعية' : 'Subcategories'}
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSubcategory}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                {language === 'ar' ? 'إضافة فئة فرعية' : 'Add Subcategory'}
              </Button>
            </div>

            {subcategories.length > 0 && (
              <div className="space-y-4">
                {subcategories.map((sub, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">
                        {language === 'ar' ? `فئة فرعية ${index + 1}` : `Subcategory ${index + 1}`}
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSubcategory(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        placeholder={language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'}
                        value={sub.name}
                        onChange={(e) => handleSubcategoryChange(index, 'name', e.target.value)}
                      />
                      <Input
                        placeholder={language === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}
                        value={sub.name_ar}
                        onChange={(e) => handleSubcategoryChange(index, 'name_ar', e.target.value)}
                      />
                      <Input
                        placeholder={language === 'ar' ? 'Slug' : 'Slug'}
                        value={sub.slug}
                        onChange={(e) => handleSubcategoryChange(index, 'slug', e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Input
                          placeholder={language === 'ar' ? 'رابط الصورة' : 'Image URL'}
                          value={sub.image_url}
                          onChange={(e) => handleSubcategoryChange(index, 'image_url', e.target.value)}
                          type="url"
                          className="flex-1"
                        />
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleSubcategoryImageUpload(index, e)}
                            className="hidden"
                            disabled={uploading}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploading}
                            className="gap-1"
                          >
                            <Upload className="w-3 h-3" />
                            {uploading ? '...' : (language === 'ar' ? 'رفع' : 'Upload')}
                          </Button>
                        </label>
                      </div>
                      {sub.imagePreview && (
                        <div className="relative w-24 h-24 border rounded-lg overflow-hidden mt-2">
                          <img
                            src={sub.imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={() => handleSubcategoryChange(index, 'imagePreview', '')}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              handleSubcategoryChange(index, 'image_url', '');
                              handleSubcategoryChange(index, 'imagePreview', '');
                            }}
                            className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/categories')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Category'}
            </Button>
          </div>
        </form>
        </CardContent>
      </Card>
    </div>
  );
}



