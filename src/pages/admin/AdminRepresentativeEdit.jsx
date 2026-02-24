import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import showToast from '@/lib/toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminRepresentativeEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);

  const [formData, setFormData] = useState({
    user_id: '',
    territory: '',
    status: 'pending',
  });

  useEffect(() => {
    fetchUsers();
    fetchRepresentative();
  }, [id]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users?limit=1000');
      const usersData = response.data?.data || response.data?.users || response.data || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const fetchRepresentative = async () => {
    try {
      const response = await api.get(`/admin/representatives/${id}`);
      const rep = response.data?.data || response.data;
      setFormData({
        user_id: rep.user_id || '',
        territory: rep.territory || '',
        status: rep.status || 'pending',
      });
    } catch (error) {
      console.error('Error fetching representative:', error);
    } finally {
      setLoading(false);
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

      await api.put(`/admin/representatives/${id}`, payload);
      navigate(`/admin/representatives/${id}`);
    } catch (error) {
      console.error('Error updating representative:', error);
      showToast.error(error.response?.data?.message || (language === 'ar' ? 'فشل تحديث المندوب' : 'Failed to update representative'));
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
            onClick={() => navigate(`/admin/representatives/${id}`)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === 'ar' ? 'رجوع' : 'Back'}
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {language === 'ar' ? 'تعديل المندوب' : 'Edit Representative'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'ar' ? 'تعديل معلومات المندوب' : 'Update representative information'}
            </p>
          </div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="user_id">
                {language === 'ar' ? 'المستخدم' : 'User'} *
              </Label>
              <select
                id="user_id"
                value={formData.user_id}
                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="">{language === 'ar' ? '-- اختر --' : '-- Select --'}</option>
                {Array.isArray(users) && users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="territory">
                {language === 'ar' ? 'المنطقة' : 'Territory'} *
              </Label>
              <Input
                id="territory"
                value={formData.territory}
                onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
                required
                placeholder={language === 'ar' ? 'مثال: القاهرة، الجيزة' : 'e.g., Cairo, Giza'}
              />
            </div>

            <div>
              <Label htmlFor="status">
                {language === 'ar' ? 'الحالة' : 'Status'} *
              </Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</option>
                <option value="approved">{language === 'ar' ? 'موافق عليه' : 'Approved'}</option>
                <option value="suspended">{language === 'ar' ? 'معلق' : 'Suspended'}</option>
              </select>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/admin/representatives/${id}`)}
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

