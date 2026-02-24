import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { Edit, MoreHorizontal, Plus, RefreshCw, Trash2 } from 'lucide-react';
import showToast from '@/lib/toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { showConfirm } from '@/components/ConfirmDialog';

export default function AdminCompanyPlans() {
  const { language } = useLanguage();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    name_ar: '',
    slug: '',
    max_products: 50,
    max_branches: 3,
    max_representatives: 10,
    price: 0,
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/admin/company-plans');
      const data = extractDataFromResponse(response);
      setPlans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingPlan(null);
    setForm({
      name: '',
      name_ar: '',
      slug: '',
      max_products: 50,
      max_branches: 3,
      max_representatives: 10,
      price: 0,
      is_active: true,
      sort_order: 0,
    });
    setDialogOpen(true);
  };

  const openEdit = (plan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name || '',
      name_ar: plan.name_ar || '',
      slug: plan.slug || '',
      max_products: plan.max_products ?? 50,
      max_branches: plan.max_branches ?? 3,
      max_representatives: plan.max_representatives ?? 10,
      price: plan.price ?? 0,
      is_active: plan.is_active !== false,
      sort_order: plan.sort_order ?? 0,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name?.trim()) {
      showToast.error(language === 'ar' ? 'الاسم مطلوب' : 'Name is required');
      return;
    }
    if (!form.slug?.trim()) {
      showToast.error(language === 'ar' ? 'المعرّف (slug) مطلوب' : 'Slug is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        name_ar: form.name_ar?.trim() || null,
        slug: form.slug.trim(),
        max_products: parseInt(form.max_products, 10) || 0,
        max_branches: parseInt(form.max_branches, 10) || 0,
        max_representatives: parseInt(form.max_representatives, 10) || 0,
        price: parseFloat(form.price) || 0,
        is_active: form.is_active,
        sort_order: parseInt(form.sort_order, 10) || 0,
      };
      if (editingPlan) {
        await api.put(`/admin/company-plans/${editingPlan.id}`, payload);
        showToast.success(language === 'ar' ? 'تم تحديث الخطة' : 'Plan updated');
      } else {
        await api.post('/admin/company-plans', payload);
        showToast.success(language === 'ar' ? 'تم إضافة الخطة' : 'Plan created');
      }
      setDialogOpen(false);
      fetchPlans();
    } catch (e) {
      showToast.error(e.response?.data?.message || e.response?.data?.errors?.slug?.[0] || (language === 'ar' ? 'فشل الحفظ' : 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (plan) => {
    showConfirm(
      language === 'ar' ? `حذف الخطة "${plan.name_ar || plan.name}"؟` : `Delete plan "${plan.name}"?`,
      async () => {
        try {
          await api.delete(`/admin/company-plans/${plan.id}`);
          showToast.success(language === 'ar' ? 'تم الحذف' : 'Deleted');
          fetchPlans();
        } catch (e) {
          showToast.error(e.response?.data?.message || (language === 'ar' ? 'فشل الحذف' : 'Delete failed'));
        }
      }
    );
  };

  const columns = useMemo(() => [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: language === 'ar' ? 'الاسم' : 'Name' },
    { accessorKey: 'name_ar', header: language === 'ar' ? 'الاسم بالعربية' : 'Name (AR)' },
    { accessorKey: 'slug', header: 'Slug' },
    {
      accessorKey: 'max_products',
      header: language === 'ar' ? 'حد المنتجات' : 'Max products',
      cell: ({ row }) => row.original.max_products === 0 ? (language === 'ar' ? 'غير محدود' : 'Unlimited') : row.original.max_products,
    },
    {
      accessorKey: 'max_branches',
      header: language === 'ar' ? 'حد الفروع' : 'Max branches',
      cell: ({ row }) => row.original.max_branches === 0 ? (language === 'ar' ? 'غير محدود' : 'Unlimited') : row.original.max_branches,
    },
    {
      accessorKey: 'max_representatives',
      header: language === 'ar' ? 'حد  مندوبين المبيعات ' : 'Max reps',
      cell: ({ row }) => row.original.max_representatives === 0 ? (language === 'ar' ? 'غير محدود' : 'Unlimited') : row.original.max_representatives,
    },
    {
      accessorKey: 'price',
      header: language === 'ar' ? 'السعر' : 'Price',
      cell: ({ row }) => Number(row.original.price || 0).toFixed(2),
    },
    {
      accessorKey: 'is_active',
      header: language === 'ar' ? 'نشط' : 'Active',
      cell: ({ row }) => (
        <span className={row.original.is_active !== false ? 'text-green-600' : 'text-muted-foreground'}>
          {row.original.is_active !== false ? (language === 'ar' ? 'نعم' : 'Yes') : (language === 'ar' ? 'لا' : 'No')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: language === 'ar' ? 'الإجراءات' : 'Actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(row.original)}>
              <Edit className="mr-2 h-4 w-4" />
              {language === 'ar' ? 'تعديل' : 'Edit'}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => handleDelete(row.original)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {language === 'ar' ? 'حذف' : 'Delete'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [language, fetchPlans]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {language === 'ar' ? 'خطط الشركات' : 'Company Plans'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === 'ar' ? 'إدارة الباقات والحدود (منتجات، فروع، مندوبين)' : 'Manage plans and limits (products, branches, representatives)'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchPlans} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                {language === 'ar' ? 'تحديث' : 'Refresh'}
              </Button>
              <Button onClick={openCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                {language === 'ar' ? 'إضافة خطة' : 'Add plan'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={plans}
        loading={loading}
        searchable
        searchPlaceholder={language === 'ar' ? 'بحث...' : 'Search...'}
        emptyTitle={language === 'ar' ? 'لا توجد خطط' : 'No plans'}
        emptyDescription={language === 'ar' ? 'أضف خطة من الزر أعلاه.' : 'Add a plan using the button above.'}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? (language === 'ar' ? 'تعديل الخطة' : 'Edit plan') : (language === 'ar' ? 'إضافة خطة' : 'Add plan')}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>{language === 'ar' ? 'الاسم' : 'Name'} *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>{language === 'ar' ? 'الاسم بالعربية' : 'Name (AR)'}</Label>
              <Input value={form.name_ar} onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))} />
            </div>
            <div>
              <Label>Slug *</Label>
              <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="basic" disabled={!!editingPlan} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>{language === 'ar' ? 'حد المنتجات' : 'Max products'}</Label>
                <Input type="number" min={0} value={form.max_products} onChange={(e) => setForm((f) => ({ ...f, max_products: e.target.value }))} />
              </div>
              <div>
                <Label>{language === 'ar' ? 'حد الفروع' : 'Max branches'}</Label>
                <Input type="number" min={0} value={form.max_branches} onChange={(e) => setForm((f) => ({ ...f, max_branches: e.target.value }))} />
              </div>
              <div>
                <Label>{language === 'ar' ? 'حد  مندوبين المبيعات ' : 'Max reps'}</Label>
                <Input type="number" min={0} value={form.max_representatives} onChange={(e) => setForm((f) => ({ ...f, max_representatives: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>{language === 'ar' ? 'السعر' : 'Price'}</Label>
              <Input type="number" min={0} step={0.01} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="plan_active" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
              <Label htmlFor="plan_active">{language === 'ar' ? 'نشط' : 'Active'}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ' : 'Save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
