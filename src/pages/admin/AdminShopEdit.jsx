import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { getImageSrc } from '@/lib/imageUtils';
import showToast from '@/lib/toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminShopEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isCompanyRoute = location.pathname.startsWith('/admin/companies/');
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [users, setUsers] = useState([]);

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
    fetchShop();
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
      const shop = response.data?.data ?? response.data;
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
      formDataUpload.append('type', 'shop');

      const response = await api.post('/admin/file-uploads', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data?.data ?? response.data;
      const imageUrl = data?.url ?? data?.file_url ?? response.data?.url;
      if (imageUrl) {
        const url = typeof imageUrl === 'string' && imageUrl.startsWith('/') ? (api.defaults.baseURL?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:8000') + imageUrl : imageUrl;
        setFormData(prev => ({ ...prev, image_url: url }));
        setImagePreview(url);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast.error(language === 'ar' ? 'فشل رفع الصورة' : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        user_id: formData.user_id ? parseInt(formData.user_id) : null,
      };

      await api.put(`/admin/shops/${id}`, payload);
      navigate(isCompanyRoute ? `/admin/companies/${id}` : `/admin/shops/${id}`);
    } catch (error) {
      console.error('Error updating shop:', error);
      showToast.error(error.response?.data?.message || (language === 'ar' ? 'فشل تحديث المتجر' : 'Failed to update shop'));
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(isCompanyRoute ? `/admin/companies/${id}` : `/admin/shops/${id}`)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === 'ar' ? 'رجوع' : 'Back'}
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isCompanyRoute ? (language === 'ar' ? 'تعديل الشركة' : 'Edit Company') : (language === 'ar' ? 'تعديل المتجر' : 'Edit Shop')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isCompanyRoute ? (language === 'ar' ? 'تحديث معلومات الشركة' : 'Update company information') : (language === 'ar' ? 'تعديل معلومات المتجر' : 'Update shop information')}
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
              <Label htmlFor="category">
                {language === 'ar' ? 'الفئة' : 'Category'} *
              </Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                placeholder={language === 'ar' ? 'مثال: pharmacy, company' : 'e.g., pharmacy, company'}
              />
            </div>

            <div>
              <Label htmlFor="address">
                {language === 'ar' ? 'العنوان' : 'Address'} *
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
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
                  <div className="flex gap-3">
                    <Input
                      id="image_url"
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => {
                        setFormData({ ...formData, image_url: e.target.value });
                        setImagePreview(e.target.value);
                      }}
                      placeholder="https://example.com/image.jpg"
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

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(isCompanyRoute ? `/admin/companies/${id}` : `/admin/shops/${id}`)}
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ' : 'Save')}
          </Button>
        </div>
      </form>
    </div>
  );
}

