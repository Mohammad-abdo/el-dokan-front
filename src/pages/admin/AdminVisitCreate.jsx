import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import showToast from '@/lib/toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';

export default function AdminVisitCreate() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [representatives, setRepresentatives] = useState([]);
  const [shops, setShops] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [form, setForm] = useState({
    representative_id: '',
    shop_id: '',
    doctor_id: '',
    visit_date: format(new Date(), 'yyyy-MM-dd'),
    visit_time: '10:00',
    purpose: '',
    notes: '',
    status: 'pending',
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [repsRes, shopsRes, companiesRes, doctorsRes] = await Promise.all([
          api.get('/admin/representatives?company_only=1'),
          api.get('/admin/shops?per_page=500'),
          api.get('/admin/shops?type=company&per_page=500'),
          api.get('/admin/doctors?per_page=500'),
        ]);
        const repsData = repsRes.data?.data ?? repsRes.data;
        const reps = Array.isArray(repsData) ? repsData : [];
        setRepresentatives(reps.filter((r) => r.shop_id && r.shop));
        setShops(extractDataFromResponse(shopsRes) || []);
        setCompanies(extractDataFromResponse(companiesRes) || []);
        setDoctors(extractDataFromResponse(doctorsRes) || []);
      } catch (e) {
        console.error(e);
        showToast.error(language === 'ar' ? 'فشل تحميل القوائم' : 'Failed to load options');
      }
    };
    fetchOptions();
  }, [language]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!(form.representative_id ?? '').trim()) {
      showToast.error(language === 'ar' ? 'المندوب مطلوب' : 'Representative is required');
      return;
    }
    if (!(form.visit_date ?? '').trim()) {
      showToast.error(language === 'ar' ? 'تاريخ الزيارة مطلوب' : 'Visit date is required');
      return;
    }
    if (!(form.visit_time ?? '').trim()) {
      showToast.error(language === 'ar' ? 'وقت الزيارة مطلوب' : 'Visit time is required');
      return;
    }
    if (!(form.purpose ?? '').trim()) {
      showToast.error(language === 'ar' ? 'غرض الزيارة مطلوب' : 'Purpose is required');
      return;
    }
    setLoading(true);
    try {
      await api.post('/admin/visits', {
        representative_id: Number(form.representative_id),
        shop_id: form.shop_id ? Number(form.shop_id) : null,
        doctor_id: form.doctor_id ? Number(form.doctor_id) : null,
        visit_date: form.visit_date,
        visit_time: form.visit_time,
        purpose: form.purpose.trim(),
        notes: (form.notes ?? '').trim() || null,
        status: form.status || 'pending',
      });
      showToast.success(language === 'ar' ? 'تم إنشاء الزيارة' : 'Visit created');
      navigate('/admin/visits');
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.errors?.representative_id?.[0] || (language === 'ar' ? 'فشل إنشاء الزيارة' : 'Failed to create visit');
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const isRTL = language === 'ar';

  const repLabel = (r) => {
    const prefix = language === 'ar' ? 'مندوب: ' : 'Rep: ';
    const user = r.user;
    const name = user?.username || user?.name || user?.email || '—';
    const territory = r.territory ? ` (${r.territory})` : '';
    const shopName = r.shop ? ` — ${language === 'ar' ? (r.shop.name_ar || r.shop.name) : (r.shop.name_en || r.shop.name)}` : '';
    return `${prefix}${name}${territory}${shopName}`;
  };

  const shopLabel = (s) => (language === 'ar' ? (s.name_ar || s.name) : (s.name_en || s.name));
  const doctorLabel = (d) => (language === 'ar' ? (d.name_ar || d.name) : (d.name_en || d.name));

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center justify-between flex-wrap gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}
      >
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button variant="ghost" onClick={() => navigate('/admin/visits')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            {language === 'ar' ? 'رجوع' : 'Back'}
          </Button>
          <div className={isRTL ? 'text-right' : ''}>
            <h1 className="text-3xl font-bold tracking-tight">
              {language === 'ar' ? 'إنشاء زيارة جديدة' : 'Create new visit'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'ar' ? 'إسناد زيارة لأحد المندوبين وتحديد مكان الزيارة (متجر أو شركة) والطبيب والغرض' : 'Assign a visit to a representative and set visit location (shop or company), doctor, and purpose'}
            </p>
          </div>
        </div>
      </motion.div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">
              {language === 'ar' ? 'المندوب ومكان الزيارة' : 'Representative & visit location'}
            </h2>

            <div>
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'المندوب' : 'Representative'} <span className="text-destructive">*</span>
              </label>
              <select
                name="representative_id"
                required
                value={form.representative_id ?? ''}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">{language === 'ar' ? '— اختر المندوب —' : '— Select representative —'}</option>
                {representatives.map((r) => (
                  <option key={r.id} value={r.id}>
                    {repLabel(r)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {language === 'ar' ? 'قائمة مندوبي الشركات فقط — كل عنصر يظهر كـ «مندوب: اسم (المنطقة) — الشركة»' : 'Company representatives only — each shown as «Rep: name (territory) — Company»'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'المتجر أو الشركة (مكان الزيارة)' : 'Shop or company (visit location)'}
              </label>
              <select
                name="shop_id"
                value={form.shop_id ?? ''}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">{language === 'ar' ? '— لا يوجد —' : '— None —'}</option>
                {shops.length > 0 && (
                  <optgroup label={language === 'ar' ? 'متاجر' : 'Shops'}>
                    {shops.map((s) => (
                      <option key={s.id} value={s.id}>{shopLabel(s)}</option>
                    ))}
                  </optgroup>
                )}
                {companies.length > 0 && (
                  <optgroup label={language === 'ar' ? 'شركات' : 'Companies'}>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{shopLabel(c)}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'الطبيب' : 'Doctor'}
              </label>
              <select
                name="doctor_id"
                value={form.doctor_id ?? ''}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">{language === 'ar' ? '— لا يوجد —' : '— None —'}</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{doctorLabel(d)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">
              {language === 'ar' ? 'التاريخ والوقت' : 'Date & time'}
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'ar' ? 'تاريخ الزيارة' : 'Visit date'} <span className="text-destructive">*</span>
                </label>
                <Input
                  name="visit_date"
                  type="date"
                  required
                  value={form.visit_date ?? ''}
                  onChange={handleChange}
                  className="h-10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'ar' ? 'وقت الزيارة' : 'Visit time'} <span className="text-destructive">*</span>
                </label>
                <Input
                  name="visit_time"
                  type="time"
                  value={form.visit_time ?? ''}
                  onChange={handleChange}
                  className="h-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">
              {language === 'ar' ? 'الغرض والملاحظات' : 'Purpose & notes'}
            </h2>
            <div>
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'غرض الزيارة' : 'Purpose'} <span className="text-destructive">*</span>
              </label>
              <textarea
                name="purpose"
                required
                value={form.purpose ?? ''}
                onChange={handleChange}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder={language === 'ar' ? 'الغرض من الزيارة' : 'Purpose of the visit'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'ملاحظات' : 'Notes'}
              </label>
              <textarea
                name="notes"
                value={form.notes ?? ''}
                onChange={handleChange}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">
              {language === 'ar' ? 'الحالة' : 'Status'}
            </h2>
            <div>
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'الحالة الافتراضية' : 'Default status'}
              </label>
              <select
                name="status"
                value={form.status ?? 'pending'}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</option>
                <option value="approved">{language === 'ar' ? 'موافق عليه' : 'Approved'}</option>
                <option value="completed">{language === 'ar' ? 'مكتملة' : 'Completed'}</option>
              </select>
            </div>
          </div>

          <div className={`flex gap-3 pt-4 border-t ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button type="submit" disabled={loading} className="gap-2">
              <Save className="w-4 h-4" />
              {loading ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'إنشاء الزيارة' : 'Create visit')}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/admin/visits')}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
