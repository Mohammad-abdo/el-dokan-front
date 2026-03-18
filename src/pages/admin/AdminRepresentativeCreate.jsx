import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import showToast from '@/lib/toast';
import { extractDataFromResponse } from '@/lib/apiHelper';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Save,
  User,
  Building2,
  MapPin,
  BadgeCheck,
  Target,
  Mail,
  Phone,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const STATUS_OPTIONS = [
  { value: 'pending_approval', labelAr: 'قيد المراجعة', labelEn: 'Pending approval' },
  { value: 'active', labelAr: 'نشط', labelEn: 'Active' },
  { value: 'suspended', labelAr: 'موقوف', labelEn: 'Suspended' },
  { value: 'approved', labelAr: 'موافق عليه', labelEn: 'Approved' },
  { value: 'pending', labelAr: 'قيد الانتظار', labelEn: 'Pending' },
];

export default function AdminRepresentativeCreate() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    shop_id: '',
    employee_id: '',
    territory: '',
    status: 'active',
    monthly_target: '',
    commission_percentage: '',
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/admin/shops', { params: { type: 'company', per_page: 500 } });
      const data = extractDataFromResponse(response);
      setCompanies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nameTrimmed = formData.name?.trim();
    if (!nameTrimmed) {
      showToast.error(language === 'ar' ? 'يجب إدخال اسم المندوب' : 'Representative name is required');
      return;
    }
    if (!formData.territory?.trim()) {
      showToast.error(language === 'ar' ? 'يجب إدخال المنطقة' : 'Territory is required');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: nameTrimmed,
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        shop_id: formData.shop_id ? parseInt(formData.shop_id, 10) : null,
        employee_id: formData.employee_id?.trim() || null,
        territory: formData.territory.trim(),
        status: formData.status,
        monthly_target: formData.monthly_target === '' ? null : parseFloat(formData.monthly_target),
        commission_percentage: formData.commission_percentage === '' ? null : parseFloat(formData.commission_percentage),
      };
      const response = await api.post('/admin/representatives', payload);
      const created = response.data?.data;
      showToast.success(language === 'ar' ? 'تم إنشاء المندوب بنجاح' : 'Representative created successfully');
      navigate(created?.id ? `/admin/representatives/${created.id}` : '/admin/representatives');
    } catch (error) {
      const msg = error.response?.data?.message;
      const errors = error.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        const firstMsg = Object.values(errors).flat()[0];
        showToast.error(firstMsg || (language === 'ar' ? 'فشل الحفظ' : 'Failed to save'));
      } else {
        showToast.error(msg || (language === 'ar' ? 'فشل حفظ المندوب' : 'Failed to save representative'));
      }
    } finally {
      setLoading(false);
    }
  };

  const t = (ar, en) => (language === 'ar' ? ar : en);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/representatives')}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t('إضافة مندوب جديد', 'Create New Representative')}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {t('إدخال جميع بيانات المندوب — الاسم، الشركة، المنطقة، الهدف والعمولة', 'Enter all representative data — name, company, territory, target and commission')}
            </p>
          </div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* البيانات الأساسية */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{t('البيانات الأساسية', 'Basic information')}</CardTitle>
              </div>
              <CardDescription>
                {t('اسم المندوب والمنطقة ورقم الموظف', 'Representative name, territory and employee ID')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('اسم المندوب', 'Representative name')} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder={t('اكتب الاسم — إن لم يكن مسجلاً سيتم إنشاء حساب', 'Type name — account created if not registered')}
                    required
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee_id">{t('رقم الموظف', 'Employee ID')}</Label>
                  <Input
                    id="employee_id"
                    value={formData.employee_id}
                    onChange={(e) => handleChange('employee_id', e.target.value)}
                    placeholder={t('اختياري — يُنشأ تلقائياً إن تُرك فارغاً', 'Optional — auto-generated if empty')}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('البريد الإلكتروني', 'Email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="rep_8_1@eldokan.com"
                      className="w-full pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('رقم الهاتف', 'Phone')}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="01801000000"
                      className="w-full pl-9"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="territory">{t('المنطقة / الإقليم', 'Territory')} *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="territory"
                    value={formData.territory}
                    onChange={(e) => handleChange('territory', e.target.value)}
                    placeholder={t('مثال: القاهرة - مصر الجديدة', 'e.g. Cairo - New Cairo')}
                    required
                    className="pl-9"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* الشركة */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{t('الشركة', 'Company')}</CardTitle>
              </div>
              <CardDescription>
                {t('ربط المندوب بشركة معيّنة — اختياري', 'Assign representative to a company — optional')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="shop_id">{t('الشركة', 'Company')}</Label>
                <select
                  id="shop_id"
                  value={formData.shop_id}
                  onChange={(e) => handleChange('shop_id', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">{t('— لا شركة —', '— No company —')}</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.name_ar || `#${c.id}`}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* الحالة والهدف والعمولة */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{t('الحالة والهدف والعمولة', 'Status, target & commission')}</CardTitle>
              </div>
              <CardDescription>
                {t('حالة المندوب والهدف الشهري ونسبة العمولة', 'Representative status, monthly target and commission %')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">{t('الحالة', 'Status')}</Label>
                <div className="relative">
                  <BadgeCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-4 text-sm"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {language === 'ar' ? opt.labelAr : opt.labelEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="monthly_target">{t('الهدف الشهري (مبيعات)', 'Monthly target (sales)')}</Label>
                  <Input
                    id="monthly_target"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.monthly_target}
                    onChange={(e) => handleChange('monthly_target', e.target.value)}
                    placeholder={t('مثال: 50000', 'e.g. 50000')}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commission_percentage">{t('نسبة العمولة %', 'Commission %')}</Label>
                  <Input
                    id="commission_percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.commission_percentage}
                    onChange={(e) => handleChange('commission_percentage', e.target.value)}
                    placeholder={t('مثال: 5', 'e.g. 5')}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:gap-4"
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/representatives')}
            className="w-full sm:w-auto"
          >
            {t('إلغاء', 'Cancel')}
          </Button>
          <Button type="submit" disabled={loading} className="w-full gap-2 sm:w-auto">
            <Save className="h-4 w-4" />
            {loading ? t('جاري الحفظ...', 'Saving...') : t('حفظ المندوب', 'Save representative')}
          </Button>
        </motion.div>
      </form>
    </div>
  );
}
