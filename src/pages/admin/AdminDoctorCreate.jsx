import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, User as UserIcon, Upload, X } from 'lucide-react';
import { uploadImage } from '@/lib/imageUpload';
import showToast from '@/lib/toast';

const DAYS_OF_WEEK = [
  { value: 'saturday', label: 'Saturday', labelAr: 'السبت' },
  { value: 'sunday', label: 'Sunday', labelAr: 'الأحد' },
  { value: 'monday', label: 'Monday', labelAr: 'الإثنين' },
  { value: 'tuesday', label: 'Tuesday', labelAr: 'الثلاثاء' },
  { value: 'wednesday', label: 'Wednesday', labelAr: 'الأربعاء' },
  { value: 'thursday', label: 'Thursday', labelAr: 'الخميس' },
  { value: 'friday', label: 'Friday', labelAr: 'الجمعة' },
];

export default function AdminDoctorCreate() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    user_id: '',
    name: '',
    name_ar: '',
    name_en: '',
    specialty: '',
    specialty_ar: '',
    specialty_en: '',
    photo_url: '',
    consultation_price: '',
    discount_percentage: '',
    available_days: [],
    available_hours_start: '09:00',
    available_hours_end: '17:00',
    location: '',
    location_ar: '',
    location_en: '',
    consultation_duration: '20',
    is_active: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users?per_page=100');
      const allUsers = extractDataFromResponse(response);
      // Ensure it's an array
      const usersArray = Array.isArray(allUsers) ? allUsers : [];
      // Filter users that don't have a doctor profile yet
      const usersWithoutDoctor = usersArray.filter(user => {
        // You might need to check if user has doctor relation
        return true; // For now, show all users
      });
      setUsers(Array.isArray(usersWithoutDoctor) ? usersWithoutDoctor : []);
    } catch (error) {
      console.error('Error fetching users:', error);
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

  const handleDayToggle = (day) => {
    setFormData(prev => {
      const days = prev.available_days || [];
      const updatedDays = days.includes(day)
        ? days.filter(d => d !== day)
        : [...days, day];
      return { ...prev, available_days: updatedDays };
    });
  };

  const handleImageUpload = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const imageUrl = await uploadImage(file, 'doctor', language);
      if (imageUrl) {
        setFormData(prev => ({ ...prev, photo_url: imageUrl }));
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
    
    if (!formData.user_id) {
      newErrors.user_id = language === 'ar' ? 'المستخدم مطلوب' : 'User is required';
    }
    
    if (!formData.name?.trim()) {
      newErrors.name = language === 'ar' ? 'الاسم مطلوب' : 'Name is required';
    }
    
    if (!formData.specialty?.trim()) {
      newErrors.specialty = language === 'ar' ? 'التخصص مطلوب' : 'Specialty is required';
    }
    
    if (!formData.consultation_price || parseFloat(formData.consultation_price) < 0) {
      newErrors.consultation_price = language === 'ar' ? 'سعر الاستشارة مطلوب' : 'Consultation price is required';
    }
    
    if (!formData.available_days || formData.available_days.length === 0) {
      newErrors.available_days = language === 'ar' ? 'يجب اختيار يوم واحد على الأقل' : 'At least one day must be selected';
    }
    
    if (!formData.location?.trim()) {
      newErrors.location = language === 'ar' ? 'الموقع مطلوب' : 'Location is required';
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
      const payload = {
        user_id: parseInt(formData.user_id),
        name: formData.name || '',
        name_ar: formData.name_ar || null,
        name_en: formData.name_en || null,
        specialty: formData.specialty || '',
        specialty_ar: formData.specialty_ar || null,
        specialty_en: formData.specialty_en || null,
        photo_url: formData.photo_url || null,
        consultation_price: parseFloat(formData.consultation_price) || 0,
        discount_percentage: formData.discount_percentage ? parseFloat(formData.discount_percentage) : null,
        available_days: formData.available_days || [],
        available_hours_start: formData.available_hours_start || '09:00',
        available_hours_end: formData.available_hours_end || '17:00',
        location: formData.location || '',
        location_ar: formData.location_ar || null,
        location_en: formData.location_en || null,
        consultation_duration: formData.consultation_duration ? parseInt(formData.consultation_duration) : 20,
        is_active: formData.is_active !== undefined ? formData.is_active : true,
      };

      // Remove null values for cleaner payload (keep null for nullable fields)
      Object.keys(payload).forEach(key => {
        if (payload[key] === null || payload[key] === '') {
          if (!['name_ar', 'name_en', 'specialty_ar', 'specialty_en', 'location_ar', 'location_en', 'photo_url', 'discount_percentage'].includes(key)) {
            delete payload[key];
          }
        }
      });

      await api.post('/admin/doctors', payload);
      navigate('/admin/doctors');
    } catch (error) {
      console.error('Error creating doctor:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        showToast.error(error.response?.data?.message || (language === 'ar' ? 'فشل إنشاء الطبيب' : 'Failed to create doctor'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/doctors')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'ar' ? 'رجوع' : 'Back'}
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {language === 'ar' ? 'إنشاء طبيب جديد' : 'Create New Doctor'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'ar' ? 'أضف طبيباً جديداً إلى النظام' : 'Add a new doctor to the system'}
          </p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Selection */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">
              {language === 'ar' ? 'اختيار المستخدم' : 'User Selection'}
            </h2>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'المستخدم' : 'User'} <span className="text-destructive">*</span>
              </label>
              <select
                name="user_id"
                value={formData.user_id}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg"
                required
              >
                <option value="">{language === 'ar' ? 'اختر مستخدم' : 'Select User'}</option>
                {Array.isArray(users) && users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.username || user.email} ({user.email})
                  </option>
                ))}
              </select>
              {errors.user_id && (
                <p className="text-sm text-destructive mt-1">{errors.user_id}</p>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">
              {language === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}
            </h2>
            
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'ar' ? 'الاسم (العام)' : 'Name (Default)'} <span className="text-destructive">*</span>
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={language === 'ar' ? 'اسم الطبيب' : 'Doctor name'}
                  className={errors.name ? 'border-destructive' : ''}
                  required
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}
                </label>
                <Input
                  name="name_ar"
                  value={formData.name_ar}
                  onChange={handleChange}
                  placeholder={language === 'ar' ? 'اسم الطبيب بالعربية' : 'Doctor name in Arabic'}
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'}
                </label>
                <Input
                  name="name_en"
                  value={formData.name_en}
                  onChange={handleChange}
                  placeholder={language === 'ar' ? 'اسم الطبيب بالإنجليزية' : 'Doctor name in English'}
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'ar' ? 'التخصص (العام)' : 'Specialty (Default)'} <span className="text-destructive">*</span>
                </label>
                <Input
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleChange}
                  placeholder={language === 'ar' ? 'التخصص' : 'Specialty'}
                  className={errors.specialty ? 'border-destructive' : ''}
                  required
                />
                {errors.specialty && (
                  <p className="text-sm text-destructive mt-1">{errors.specialty}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'ar' ? 'التخصص (عربي)' : 'Specialty (Arabic)'}
                </label>
                <Input
                  name="specialty_ar"
                  value={formData.specialty_ar}
                  onChange={handleChange}
                  placeholder={language === 'ar' ? 'التخصص بالعربية' : 'Specialty in Arabic'}
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'ar' ? 'التخصص (إنجليزي)' : 'Specialty (English)'}
                </label>
                <Input
                  name="specialty_en"
                  value={formData.specialty_en}
                  onChange={handleChange}
                  placeholder={language === 'ar' ? 'التخصص بالإنجليزية' : 'Specialty in English'}
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">
              {language === 'ar' ? 'الأسعار' : 'Pricing'}
            </h2>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'ar' ? 'سعر الاستشارة' : 'Consultation Price'} <span className="text-destructive">*</span>
                </label>
                <Input
                  name="consultation_price"
                  type="number"
                  step="0.01"
                  value={formData.consultation_price}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={errors.consultation_price ? 'border-destructive' : ''}
                  required
                />
                {errors.consultation_price && (
                  <p className="text-sm text-destructive mt-1">{errors.consultation_price}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'ar' ? 'نسبة الخصم (%)' : 'Discount (%)'}
                </label>
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
            </div>
          </div>

          {/* Availability */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">
              {language === 'ar' ? 'الأوقات المتاحة' : 'Availability'}
            </h2>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'الأيام المتاحة' : 'Available Days'} <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <label
                    key={day.value}
                    className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                      formData.available_days.includes(day.value)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card hover:bg-accent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.available_days.includes(day.value)}
                      onChange={() => handleDayToggle(day.value)}
                      className="w-4 h-4"
                    />
                    <span>{language === 'ar' ? day.labelAr : day.label}</span>
                  </label>
                ))}
              </div>
              {errors.available_days && (
                <p className="text-sm text-destructive mt-1">{errors.available_days}</p>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'ar' ? 'وقت البدء' : 'Start Time'} <span className="text-destructive">*</span>
                </label>
                <Input
                  name="available_hours_start"
                  type="time"
                  value={formData.available_hours_start}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'ar' ? 'وقت الانتهاء' : 'End Time'} <span className="text-destructive">*</span>
                </label>
                <Input
                  name="available_hours_end"
                  type="time"
                  value={formData.available_hours_end}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'مدة الاستشارة (دقيقة)' : 'Consultation Duration (minutes)'}
              </label>
              <Input
                name="consultation_duration"
                type="number"
                min="10"
                value={formData.consultation_duration}
                onChange={handleChange}
                placeholder="20"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">
              {language === 'ar' ? 'الموقع' : 'Location'}
            </h2>
            
            <div className="grid gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'ar' ? 'الموقع (العام)' : 'Location (Default)'} <span className="text-destructive">*</span>
                </label>
                <textarea
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder={language === 'ar' ? 'عنوان العيادة' : 'Clinic address'}
                  className="w-full p-2 border rounded-lg min-h-[100px]"
                  required
                />
                {errors.location && (
                  <p className="text-sm text-destructive mt-1">{errors.location}</p>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'الموقع (عربي)' : 'Location (Arabic)'}
                  </label>
                  <textarea
                    name="location_ar"
                    value={formData.location_ar}
                    onChange={handleChange}
                    placeholder={language === 'ar' ? 'عنوان العيادة بالعربية' : 'Clinic address in Arabic'}
                    className="w-full p-2 border rounded-lg min-h-[100px]"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'الموقع (إنجليزي)' : 'Location (English)'}
                  </label>
                  <textarea
                    name="location_en"
                    value={formData.location_en}
                    onChange={handleChange}
                    placeholder={language === 'ar' ? 'عنوان العيادة بالإنجليزية' : 'Clinic address in English'}
                    className="w-full p-2 border rounded-lg min-h-[100px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Photo */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">
              {language === 'ar' ? 'الصورة' : 'Photo'}
            </h2>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'صورة الطبيب' : 'Doctor Photo'}
              </label>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Input
                    name="photo_url"
                    type="url"
                    value={formData.photo_url}
                    onChange={(e) => {
                      handleChange(e);
                      setImagePreview(e.target.value);
                    }}
                    placeholder="https://example.com/photo.jpg"
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
                {(imagePreview || formData.photo_url) && (
                  <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                    <img
                      src={imagePreview || formData.photo_url}
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
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-4 h-4"
              id="is_active"
            />
            <label htmlFor="is_active" className="text-sm font-medium">
              {language === 'ar' ? 'الطبيب نشط' : 'Doctor is active'}
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/doctors')}
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
                : (language === 'ar' ? 'إنشاء الطبيب' : 'Create Doctor')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}



