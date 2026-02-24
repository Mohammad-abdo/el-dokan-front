import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Upload, X, ImageIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import showToast from '@/lib/toast';
import { uploadImage } from '@/lib/imageUpload';

export default function AdminUserCreate() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    avatar_url: '',
    status: 'active',
  });
  const [errors, setErrors] = useState({});

  const handleImageUpload = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const imageUrl = await uploadImage(file, 'avatar', language);
      if (imageUrl) {
        setFormData(prev => ({ ...prev, avatar_url: imageUrl }));
        setImagePreview(imageUrl);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast.error(error.response?.data?.message || (language === 'ar' ? 'فشل رفع الصورة' : 'Failed to upload image'));
    } finally {
      setUploading(false);
      // Reset file input to allow uploading same file again
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
      newErrors.username = language === 'ar' ? 'اسم المستخدم مطلوب' : 'Username is required';
    }
    
    if (!formData.phone?.trim()) {
      newErrors.phone = language === 'ar' ? 'رقم الهاتف مطلوب' : 'Phone is required';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = language === 'ar' ? 'البريد الإلكتروني غير صحيح' : 'Email is invalid';
    }
    
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match';
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
      await api.post('/admin/users', formData);
      showToast.success(language === 'ar' ? 'تم إنشاء المستخدم بنجاح' : 'User created successfully');
      navigate('/admin/users');
    } catch (error) {
      console.error('Error creating user:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        showToast.error(
          error.response?.data?.message || 
          (language === 'ar' ? 'فشل إنشاء المستخدم' : 'Failed to create user')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const isRTL = language === 'ar';

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}
      >
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/users')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'ar' ? 'رجوع' : 'Back'}
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {language === 'ar' ? 'إنشاء مستخدم جديد' : 'Create New User'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'ar' ? 'إضافة مستخدم جديد إلى النظام' : 'Add a new user to the system'}
          </p>
        </div>
      </motion.div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'اسم المستخدم' : 'Username'} <span className="text-destructive">*</span>
              </label>
              <Input
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder={language === 'ar' ? 'أدخل اسم المستخدم' : 'Enter username'}
                className={errors.username ? 'border-destructive' : ''}
              />
              {errors.username && (
                <p className="text-sm text-destructive mt-1">{errors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'رقم الهاتف' : 'Phone'} <span className="text-destructive">*</span>
              </label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={language === 'ar' ? 'أدخل رقم الهاتف' : 'Enter phone number'}
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-destructive mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={language === 'ar' ? 'أدخل البريد الإلكتروني' : 'Enter email'}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'الحالة' : 'Status'}
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg"
              >
                <option value="active">{language === 'ar' ? 'نشط' : 'Active'}</option>
                <option value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</option>
                <option value="suspended">{language === 'ar' ? 'معلق' : 'Suspended'}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'كلمة المرور' : 'Password'} <span className="text-destructive">*</span>
              </label>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter password'}
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && (
                <p className="text-sm text-destructive mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'} <span className="text-destructive">*</span>
              </label>
              <Input
                type="password"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                placeholder={language === 'ar' ? 'أكد كلمة المرور' : 'Confirm password'}
                className={errors.password_confirmation ? 'border-destructive' : ''}
              />
              {errors.password_confirmation && (
                <p className="text-sm text-destructive mt-1">{errors.password_confirmation}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label>
                {language === 'ar' ? 'صورة الملف الشخصي' : 'Avatar Image'}
              </Label>
              <div className="space-y-3">
                <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Input
                    type="url"
                    value={formData.avatar_url}
                    onChange={(e) => {
                      const url = e.target.value;
                      setFormData(prev => ({ ...prev, avatar_url: url }));
                      setImagePreview(url);
                    }}
                    placeholder="https://example.com/avatar.jpg"
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleImageClick();
                    }}
                    disabled={uploading}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {uploading 
                      ? (language === 'ar' ? 'جاري الرفع...' : 'Uploading...')
                      : (language === 'ar' ? 'رفع صورة' : 'Upload Image')
                    }
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
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={() => {
                          setImagePreview('');
                          setFormData(prev => ({ ...prev, avatar_url: '' }));
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview('');
                          setFormData(prev => ({ ...prev, avatar_url: '' }));
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className={`absolute top-1 ${isRTL ? 'left-1' : 'right-1'} p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors`}
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

          <div className={`flex gap-2 justify-end ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/users')}
              disabled={loading}
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading 
                ? (language === 'ar' ? 'جاري الإنشاء...' : 'Creating...')
                : (language === 'ar' ? 'إنشاء مستخدم' : 'Create User')
              }
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
