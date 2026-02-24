import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { getImageSrc } from '@/lib/imageUtils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Upload, X, ImageIcon, Building2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import showToast from '@/lib/toast';
import { uploadImage } from '@/lib/imageUpload';

/**
 * إنشاء شركة جديدة — Plans, Access and Permissions (Figma).
 * يرسل إلى نفس API المتاجر مع category=company واختيار خطة.
 */
export default function AdminCompanyCreate() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    user_id: '',
    name: '',
    category: 'company',
    address: '',
    phone: '',
    image_url: '',
    is_active: true,
    vendor_status: 'pending_approval',
    company_plan_id: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchPlans();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users?limit=500');
      const usersData = response.data?.data || response.data?.users || response.data || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await api.get('/admin/company-plans');
      const data = response.data?.data ?? response.data;
      const list = Array.isArray(data) ? data : [];
      setPlans(list);
      if (list.length > 0) {
        const basic = list.find((p) => p.slug === 'basic');
        if (basic) setFormData((prev) => ({ ...prev, company_plan_id: prev.company_plan_id || String(basic.id) }));
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      setPlans([]);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const imageUrl = await uploadImage(file, 'shop', language);
      if (imageUrl) {
        setFormData((prev) => ({ ...prev, image_url: imageUrl }));
        setImagePreview(imageUrl);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = language === 'ar' ? 'الاسم مطلوب' : 'Name is required';
    if (!formData.address?.trim()) newErrors.address = language === 'ar' ? 'العنوان مطلوب' : 'Address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast.error(language === 'ar' ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        category: 'company',
        address: formData.address.trim(),
        phone: formData.phone || null,
        image_url: formData.image_url || null,
        is_active: formData.is_active,
        vendor_status: formData.vendor_status,
        user_id: formData.user_id ? parseInt(formData.user_id, 10) : null,
        company_plan_id: formData.company_plan_id ? parseInt(formData.company_plan_id, 10) : null,
      };
      const res = await api.post('/admin/shops', payload);
      const created = res.data?.data || res.data;
      showToast.success(language === 'ar' ? 'تم إنشاء الشركة بنجاح' : 'Company created successfully');
      navigate(created?.id ? `/admin/companies/${created.id}` : '/admin/companies');
    } catch (error) {
      const msg = error.response?.data?.message || (language === 'ar' ? 'فشل إنشاء الشركة' : 'Failed to create company');
      if (error.response?.data?.errors) setErrors(error.response.data.errors);
      showToast.error(msg);
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
          <Button variant="ghost" onClick={() => navigate('/admin/companies')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            {language === 'ar' ? 'رجوع' : 'Back'}
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="w-8 h-8" />
              {language === 'ar' ? 'إضافة شركة' : 'Add Company'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'ar' ? 'تسجيل شركة جديدة — الخطط والوصول والصلاحيات (Figma)' : 'Register a new company — Plans, Access & Permissions (Figma)'}
            </p>
          </div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="user_id">{language === 'ar' ? 'المستخدم' : 'User'} (Optional)</Label>
              <select
                id="user_id"
                value={formData.user_id}
                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="">—</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.username || user.email} ({user.email})</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="name">{language === 'ar' ? 'اسم الشركة' : 'Company name'} <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => { setFormData({ ...formData, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: null }); }}
                className={errors.name ? 'border-destructive' : ''}
                required
              />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="plan">{language === 'ar' ? 'الخطة' : 'Plan'}</Label>
              <select
                id="plan"
                value={formData.company_plan_id}
                onChange={(e) => setFormData({ ...formData, company_plan_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="">{language === 'ar' ? '— افتراضي (أساسي) —' : '— Default (Basic) —'}</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name_ar || p.name} {p.max_products === 0 ? (language === 'ar' ? '(غير محدود)' : '(Unlimited)') : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="address">{language === 'ar' ? 'العنوان' : 'Address'} <span className="text-destructive">*</span></Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => { setFormData({ ...formData, address: e.target.value }); if (errors.address) setErrors({ ...errors, address: null }); }}
                className={errors.address ? 'border-destructive' : ''}
                required
              />
              {errors.address && <p className="text-sm text-destructive mt-1">{errors.address}</p>}
            </div>

            <div>
              <Label htmlFor="phone">{language === 'ar' ? 'الهاتف' : 'Phone'}</Label>
              <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>

            <div>
              <Label>{language === 'ar' ? 'صورة الشركة' : 'Company image'}</Label>
              <div className="space-y-3">
                <div className={`flex gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <Input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => { setFormData({ ...formData, image_url: e.target.value }); setImagePreview(e.target.value); }}
                    placeholder="https://..."
                    className="flex-1"
                  />
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2">
                    <Upload className="w-4 h-4" /> {uploading ? (language === 'ar' ? 'جاري الرفع...' : 'Uploading...') : (language === 'ar' ? 'رفع' : 'Upload')}
                  </Button>
                </div>
                {imagePreview && (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                    <img src={getImageSrc(imagePreview)} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImagePreview(''); setFormData((prev) => ({ ...prev, image_url: '' })); }}
                      className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>{language === 'ar' ? 'حالة الموافقة' : 'Access status'}</Label>
              <select
                value={formData.vendor_status}
                onChange={(e) => setFormData({ ...formData, vendor_status: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="pending_approval">{language === 'ar' ? 'قيد المراجعة' : 'Pending approval'}</option>
                <option value="approved">{language === 'ar' ? 'مفعّل' : 'Approved'}</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="is_active" className="cursor-pointer">{language === 'ar' ? 'نشط' : 'Active'}</Label>
            </div>
          </div>
        </Card>

        <div className={`flex justify-end gap-4 mt-6 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/companies')} disabled={loading}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {loading ? (language === 'ar' ? 'جاري الإنشاء...' : 'Creating...') : (language === 'ar' ? 'إنشاء الشركة' : 'Create company')}
          </Button>
        </div>
      </form>
    </div>
  );
}
