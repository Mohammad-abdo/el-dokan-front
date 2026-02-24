import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { getImageSrc } from '@/lib/imageUtils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Upload, X, ImageIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import showToast from '@/lib/toast';
import { uploadImage } from '@/lib/imageUpload';

export default function AdminShopCreate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const fileInputRef = useRef(null);
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [users, setUsers] = useState([]);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    user_id: '',
    name: '',
    category: '',
    subcategories: [],
    address: '',
    phone: '',
    image_url: '',
    is_active: true,
  });

  useEffect(() => {
    fetchUsers();
    if (isEdit) {
      fetchShop();
    }
  }, [id]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users?role=shop&limit=1000');
      const usersData = response.data?.data || response.data?.users || response.data || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const fetchShop = async () => {
    try {
      const response = await api.get(`/admin/shops/${id}`);
      const shop = response.data?.data || response.data;
      setFormData({
        user_id: shop.user_id || '',
        name: shop.name || '',
        category: shop.category || '',
        subcategories: shop.subcategories || [],
        address: shop.address || '',
        phone: shop.phone || '',
        image_url: shop.image_url || '',
        is_active: shop.is_active !== false,
      });
      if (shop.image_url) {
        setImagePreview(shop.image_url);
      }
    } catch (error) {
      console.error('Error fetching shop:', error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const imageUrl = await uploadImage(file, 'shop', language);
      if (imageUrl) {
        setFormData(prev => ({ ...prev, image_url: imageUrl }));
        setImagePreview(imageUrl);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageClick = () => {
    if (fileInputRef.current && !uploading) {
      fileInputRef.current.click();
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = language === 'ar' ? 'الاسم مطلوب' : 'Name is required';
    }

    if (!formData.category?.trim()) {
      newErrors.category = language === 'ar' ? 'الفئة مطلوبة' : 'Category is required';
    }

    if (!formData.address?.trim()) {
      newErrors.address = language === 'ar' ? 'العنوان مطلوب' : 'Address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      showToast.error(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        user_id: formData.user_id ? parseInt(formData.user_id) : null,
      };

      if (isEdit) {
        showToast.promise(
          api.put(`/admin/shops/${id}`, payload),
          {
            loading: language === 'ar' ? 'جاري التحديث...' : 'Updating shop...',
            success: () => {
              navigate('/admin/shops');
              return language === 'ar' ? 'تم تحديث المتجر بنجاح' : 'Shop updated successfully';
            },
            error: (err) => {
              const errorMsg = err.response?.data?.message || (language === 'ar' ? 'فشل تحديث المتجر' : 'Failed to update shop');
              if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
              }
              return errorMsg;
            },
          }
        );
      } else {
        showToast.promise(
          api.post('/admin/shops', payload),
          {
            loading: language === 'ar' ? 'جاري الإنشاء...' : 'Creating shop...',
            success: () => {
              navigate('/admin/shops');
              return language === 'ar' ? 'تم إنشاء المتجر بنجاح' : 'Shop created successfully';
            },
            error: (err) => {
              const errorMsg = err.response?.data?.message || (language === 'ar' ? 'فشل إنشاء المتجر' : 'Failed to create shop');
              if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
              }
              return errorMsg;
            },
          }
        );
      }
    } catch (error) {
      console.error('Error saving shop:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
      showToast.error(error.response?.data?.message || (language === 'ar' ? 'فشل حفظ المتجر' : 'Failed to save shop'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}
      >
        <div className={`flex items-center gap-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/shops')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === 'ar' ? 'رجوع' : 'Back'}
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEdit ? (language === 'ar' ? 'تعديل المتجر' : 'Edit Shop') : (language === 'ar' ? 'إنشاء متجر جديد' : 'Create New Shop')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEdit ? (language === 'ar' ? 'تحديث معلومات المتجر' : 'Update shop information') : (language === 'ar' ? 'إضافة متجر جديد إلى النظام' : 'Add a new shop to the system')}
            </p>
          </div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="user_id">
                {language === 'ar' ? 'المستخدم' : 'User'} (Optional)
              </Label>
              <select
                id="user_id"
                value={formData.user_id}
                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">{language === 'ar' ? '-- لا يوجد --' : '-- None --'}</option>
                {Array.isArray(users) && users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="name">
                {language === 'ar' ? 'الاسم' : 'Name'} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: null });
                }}
                className={errors.name ? 'border-destructive' : ''}
                required
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="category">
                {language === 'ar' ? 'الفئة' : 'Category'} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => {
                  setFormData({ ...formData, category: e.target.value });
                  if (errors.category) setErrors({ ...errors, category: null });
                }}
                className={errors.category ? 'border-destructive' : ''}
                required
                placeholder={language === 'ar' ? 'مثال: pharmacy, company' : 'e.g., pharmacy, company'}
              />
              {errors.category && (
                <p className="text-sm text-destructive mt-1">{errors.category}</p>
              )}
            </div>

            <div>
              <Label htmlFor="address">
                {language === 'ar' ? 'العنوان' : 'Address'} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => {
                  setFormData({ ...formData, address: e.target.value });
                  if (errors.address) setErrors({ ...errors, address: null });
                }}
                className={errors.address ? 'border-destructive' : ''}
                required
              />
              {errors.address && (
                <p className="text-sm text-destructive mt-1">{errors.address}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="phone">
                  {language === 'ar' ? 'الهاتف' : 'Phone'}
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="image_url">
                  {language === 'ar' ? 'صورة المتجر' : 'Shop Image'}
                </Label>
                <div className="space-y-3">
                  <div className={`flex gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <Input
                      id="image_url"
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => {
                        const url = e.target.value;
                        setFormData({ ...formData, image_url: url });
                        setImagePreview(url);
                      }}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleImageClick}
                      disabled={uploading}
                      className="gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {uploading 
                        ? (language === 'ar' ? 'جاري الرفع...' : 'Uploading...') 
                        : (language === 'ar' ? 'رفع صورة' : 'Upload Image')}
                    </Button>
                  </div>
                  <div className="flex gap-3 items-start">
                    {imagePreview ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-32 h-32 border rounded-lg overflow-hidden bg-muted"
                      >
                        <img
                          src={getImageSrc(imagePreview)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={() => {
                            setImagePreview('');
                            setFormData(prev => ({ ...prev, image_url: '' }));
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview('');
                            setFormData(prev => ({ ...prev, image_url: '' }));
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          className={`absolute top-1 ${language === 'ar' ? 'left-1' : 'right-1'} p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ) : (
                      <div
                        onClick={handleImageClick}
                        className="w-32 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-accent transition-colors"
                      >
                        <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                        <span className="text-xs text-muted-foreground text-center px-2">
                          {language === 'ar' ? 'انقر لاختيار صورة' : 'Click to select image'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

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
        </Card>

        <div className={`flex justify-end gap-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/shops')}
            disabled={loading}
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {loading 
              ? (isEdit ? (language === 'ar' ? 'جاري التحديث...' : 'Updating...') : (language === 'ar' ? 'جاري الإنشاء...' : 'Creating...'))
              : (isEdit ? (language === 'ar' ? 'حفظ' : 'Save') : (language === 'ar' ? 'إنشاء' : 'Create'))
            }
          </Button>
        </div>
      </form>
    </div>
  );
}

