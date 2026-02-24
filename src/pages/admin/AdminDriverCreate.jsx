import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/lib/api';
import showToast from '@/lib/toast';
import {
  ArrowLeft,
  Truck,
  Save,
  MapPin,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminDriverCreate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const isEdit = !!id;
  const [users, setUsers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [formData, setFormData] = useState({
    user_id: '',
    name: '',
    phone: '',
    photo_url: '',
    status: 'available',
    current_location_lat: '',
    current_location_lng: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
    if (isEdit) {
      fetchDriver();
    }
  }, [id]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users?limit=1000');
      const usersData = response.data?.data || response.data?.users || response.data || [];
      // Ensure it's an array
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]); // Set empty array on error
    }
  };

  const fetchDriver = async () => {
    try {
      const response = await api.get(`/admin/drivers/${id}`);
      const driver = response.data?.data || response.data;
      setFormData({
        user_id: driver.user_id || '',
        name: driver.name || '',
        phone: driver.phone || '',
        photo_url: driver.photo_url || '',
        status: driver.status || 'available',
        current_location_lat: driver.current_location_lat || '',
        current_location_lng: driver.current_location_lng || '',
      });
      if (driver.photo_url) {
        setImagePreview(driver.photo_url);
      }
    } catch (error) {
      console.error('Error fetching driver:', error);
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
      formDataUpload.append('type', 'driver');

      const response = await api.post('/admin/file-uploads', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = response.data?.data?.url || response.data?.url;
      if (imageUrl) {
        setFormData(prev => ({ ...prev, photo_url: imageUrl }));
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      const payload = {
        ...formData,
        user_id: formData.user_id ? parseInt(formData.user_id) : null,
        current_location_lat: formData.current_location_lat ? parseFloat(formData.current_location_lat) : null,
        current_location_lng: formData.current_location_lng ? parseFloat(formData.current_location_lng) : null,
      };

      if (isEdit) {
        await api.put(`/admin/drivers/${id}`, payload);
      } else {
        await api.post('/admin/drivers', payload);
      }
      navigate('/admin/drivers');
    } catch (error) {
      console.error('Error saving driver:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        showToast.error(error.response?.data?.message || (language === 'ar' ? 'فشل حفظ السائق' : 'Failed to save driver'));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/drivers')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === 'ar' ? 'العودة' : 'Back'}
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEdit ? (language === 'ar' ? 'تعديل السائق' : 'Edit Driver') : (language === 'ar' ? 'إضافة سائق جديد' : 'Add New Driver')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEdit ? (language === 'ar' ? 'تعديل معلومات السائق' : 'Edit driver information') : (language === 'ar' ? 'إنشاء سائق جديد في النظام' : 'Create a new driver in the system')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">
                {language === 'ar' ? 'معلومات السائق' : 'Driver Information'}
              </h2>
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
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'الهاتف' : 'Phone'} *
                  </label>
                  <Input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="photo_url">
                    {language === 'ar' ? 'صورة السائق' : 'Driver Photo'}
                  </Label>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <Input
                        id="photo_url"
                        name="photo_url"
                        type="url"
                        value={formData.photo_url}
                        onChange={(e) => {
                          handleChange(e);
                          setImagePreview(e.target.value);
                        }}
                        placeholder="https://example.com/photo.jpg"
                        className={`flex-1 ${errors.photo_url ? 'border-red-500' : ''}`}
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
                            setFormData(prev => ({ ...prev, photo_url: '' }));
                          }}
                          className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  {errors.photo_url && (
                    <p className="text-red-500 text-xs mt-1">{errors.photo_url}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="status">
                    {language === 'ar' ? 'الحالة' : 'Status'} *
                  </Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 py-2 border rounded-md ${errors.status ? 'border-red-500' : ''}`}
                  >
                    <option value="available">{language === 'ar' ? 'متاح' : 'Available'}</option>
                    <option value="busy">{language === 'ar' ? 'مشغول' : 'Busy'}</option>
                    <option value="offline">{language === 'ar' ? 'غير متصل' : 'Offline'}</option>
                  </select>
                  {errors.status && (
                    <p className="text-red-500 text-xs mt-1">{errors.status}</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Location Card */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {language === 'ar' ? 'الموقع' : 'Location'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'خط العرض' : 'Latitude'}
                  </label>
                  <Input
                    name="current_location_lat"
                    type="number"
                    step="any"
                    value={formData.current_location_lat}
                    onChange={handleChange}
                    placeholder="30.0444"
                    className={errors.current_location_lat ? 'border-red-500' : ''}
                  />
                  {errors.current_location_lat && (
                    <p className="text-red-500 text-xs mt-1">{errors.current_location_lat}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'خط الطول' : 'Longitude'}
                  </label>
                  <Input
                    name="current_location_lng"
                    type="number"
                    step="any"
                    value={formData.current_location_lng}
                    onChange={handleChange}
                    placeholder="31.2357"
                    className={errors.current_location_lng ? 'border-red-500' : ''}
                  />
                  {errors.current_location_lng && (
                    <p className="text-red-500 text-xs mt-1">{errors.current_location_lng}</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {language === 'ar' 
                  ? 'اتركه فارغاً إذا لم يكن الموقع متاحاً حالياً' 
                  : 'Leave empty if location is not available currently'}
              </p>
            </Card>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {language === 'ar' ? 'الإجراءات' : 'Actions'}
              </h3>
              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={saving}
                >
                  <Save className="w-4 h-4" />
                  {saving 
                    ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
                    : (language === 'ar' ? 'حفظ' : 'Save')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/admin/drivers')}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}


