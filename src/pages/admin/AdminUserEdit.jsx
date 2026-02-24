import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import showToast from '@/lib/toast';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminUserEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    status: 'active',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const response = await api.get(`/admin/users/${id}`);
      const user = response.data?.data || response.data;
      if (user) {
        setFormData({
          username: user.username || '',
          email: user.email || '',
          phone: user.phone || '',
          avatar_url: user.avatar_url || '',
          status: user.status || 'active',
        });
        if (user.avatar_url) {
          setImagePreview(user.avatar_url);
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
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
      formDataUpload.append('type', 'avatar');

      const response = await api.post('/admin/file-uploads', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = response.data?.data?.url || response.data?.data?.file_url || response.data?.url;
      if (imageUrl) {
        setFormData(prev => ({ ...prev, avatar_url: imageUrl }));
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

  const validate = () => {
    const newErrors = {};
    
    if (!formData.username?.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone is required';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
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
      await api.put(`/admin/users/${id}`, formData);
      navigate(`/admin/users/${id}`);
    } catch (error) {
      console.error('Error updating user:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        showToast.error(error.response?.data?.message || 'Failed to update user');
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
          onClick={() => navigate(`/admin/users/${id}`)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
          <p className="text-muted-foreground mt-1">Update user information</p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">
                Username <span className="text-destructive">*</span>
              </label>
              <Input
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter username"
                className={errors.username ? 'border-destructive' : ''}
              />
              {errors.username && (
                <p className="text-sm text-destructive mt-1">{errors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Phone <span className="text-destructive">*</span>
              </label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-destructive mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div>
              <Label htmlFor="avatar_url">
                {language === 'ar' ? 'صورة المستخدم' : 'Avatar Image'}
              </Label>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Input
                    id="avatar_url"
                    type="url"
                    value={formData.avatar_url || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, avatar_url: e.target.value });
                      setImagePreview(e.target.value);
                    }}
                    placeholder="https://example.com/avatar.jpg"
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
                {(imagePreview || formData.avatar_url) && (
                  <div className="relative w-24 h-24 border rounded-lg overflow-hidden">
                    <img
                      src={imagePreview || formData.avatar_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={() => setImagePreview('')}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setFormData(prev => ({ ...prev, avatar_url: '' }));
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

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/admin/users/${id}`)}
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

