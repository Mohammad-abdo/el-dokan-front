import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { DataTable } from '@/components/DataTable';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Key,
  Check,
  X
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import showToast from '@/lib/toast';
import { showConfirm } from '@/components/ConfirmDialog';
import { format } from 'date-fns';

export default function AdminRoles() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    permissions: [],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/admin/roles');
      setRoles(extractDataFromResponse(response));
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/admin/permissions');
      setPermissions(extractDataFromResponse(response));
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions([]);
    }
  };

  const groupedPermissions = useMemo(() => {
    const grouped = {};
    permissions.forEach(permission => {
      const group = permission.group || 'other';
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(permission);
    });
    return grouped;
  }, [permissions]);

  const handleOpenDialog = (role = null) => {
    if (role) {
      setSelectedRole(role);
      setFormData({
        name: role.name,
        display_name: role.display_name || '',
        description: role.description || '',
        permissions: role.permissions?.map(p => p.id) || [],
      });
    } else {
      setSelectedRole(null);
      setFormData({
        name: '',
        display_name: '',
        description: '',
        permissions: [],
      });
    }
    setErrors({});
    setShowDialog(true);
  };

  const handleOpenPermissionsDialog = (role) => {
    setSelectedRole(role);
    setFormData({
      permissions: role.permissions?.map(p => p.id) || [],
    });
    setShowPermissionsDialog(true);
  };

  const handleTogglePermission = (permissionId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const handleToggleGroup = (group) => {
    const groupPermissions = groupedPermissions[group] || [];
    const groupIds = groupPermissions.map(p => p.id);
    const allSelected = groupIds.every(id => formData.permissions.includes(id));
    
    setFormData(prev => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter(id => !groupIds.includes(id))
        : [...new Set([...prev.permissions, ...groupIds])]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name?.trim() || !formData.display_name?.trim()) {
      setErrors({
        name: !formData.name?.trim() ? (language === 'ar' ? 'الاسم مطلوب' : 'Name is required') : null,
        display_name: !formData.display_name?.trim() ? (language === 'ar' ? 'اسم العرض مطلوب' : 'Display name is required') : null,
      });
      return;
    }

    try {
      if (selectedRole) {
        await api.put(`/admin/roles/${selectedRole.id}`, formData);
      } else {
        await api.post('/admin/roles', formData);
      }
      setShowDialog(false);
      setShowPermissionsDialog(false);
      fetchRoles();
    } catch (error) {
      console.error('Error saving role:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        showToast.error(error.response?.data?.message || (language === 'ar' ? 'فشل حفظ الدور' : 'Failed to save role'));
      }
    }
  };

  const handleDelete = async (role) => {
    const message = language === 'ar'
      ? `هل أنت متأكد من حذف الدور "${role.display_name || role.name}"؟`
      : `Are you sure you want to delete role "${role.display_name || role.name}"?`;
    showConfirm(message, async () => {
      try {
        await api.delete(`/admin/roles/${role.id}`);
        fetchRoles();
      } catch (error) {
        console.error('Error deleting role:', error);
        showToast.error(error.response?.data?.message || (language === 'ar' ? 'فشل حذف الدور' : 'Failed to delete role'));
      }
    });
  };

  const columns = useMemo(() => [
    { 
      accessorKey: 'id', 
      header: 'ID',
      size: 80,
    },
    {
      accessorKey: 'name',
      header: language === 'ar' ? 'الاسم' : 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'display_name',
      header: language === 'ar' ? 'اسم العرض' : 'Display Name',
    },
    {
      accessorKey: 'permissions',
      header: language === 'ar' ? 'الصلاحيات' : 'Permissions',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.permissions?.length || 0} {language === 'ar' ? 'صلاحية' : 'permissions'}
        </span>
      ),
    },
    {
      accessorKey: 'users_count',
      header: language === 'ar' ? 'المستخدمون' : 'Users',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.users?.length || 0} {language === 'ar' ? 'مستخدم' : 'users'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: language === 'ar' ? 'الإجراءات' : 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenPermissionsDialog(row.original)}
            title={language === 'ar' ? 'إدارة الصلاحيات' : 'Manage Permissions'}
          >
            <Key className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenDialog(row.original)}
            title={language === 'ar' ? 'تعديل' : 'Edit'}
          >
            <Edit className="w-4 h-4" />
          </Button>
          {row.original.name !== 'admin' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(row.original)}
              className="text-destructive hover:text-destructive"
              title={language === 'ar' ? 'حذف' : 'Delete'}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ], [language]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-8 h-8" />
            {language === 'ar' ? 'الأدوار والصلاحيات' : 'Roles & Permissions'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === 'ar' ? 'إدارة الأدوار والصلاحيات في النظام' : 'Manage roles and permissions in the system'}
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          {language === 'ar' ? 'إضافة دور' : 'Add Role'}
        </Button>
      </div>

      <Card className="p-6">
        <DataTable
          data={roles}
          columns={columns}
          enablePagination
        />
      </Card>

      {/* Role Dialog */}
      <AnimatePresence>
        {showDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto backdrop-blur-sm border z-[101]"
            >
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold">
                  {selectedRole 
                    ? (language === 'ar' ? 'تعديل الدور' : 'Edit Role')
                    : (language === 'ar' ? 'إضافة دور جديد' : 'Add New Role')}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'الاسم' : 'Name'} <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={language === 'ar' ? 'اسم الدور' : 'Role name'}
                    disabled={!!selectedRole}
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'اسم العرض' : 'Display Name'} <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={formData.display_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                    placeholder={language === 'ar' ? 'اسم العرض' : 'Display name'}
                    className={errors.display_name ? 'border-destructive' : ''}
                  />
                  {errors.display_name && (
                    <p className="text-sm text-destructive mt-1">{errors.display_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'الوصف' : 'Description'}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={language === 'ar' ? 'وصف الدور' : 'Role description'}
                    className="w-full p-2 border rounded-lg min-h-[100px]"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDialog(false)}
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button type="submit">
                    {selectedRole 
                      ? (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes')
                      : (language === 'ar' ? 'إنشاء' : 'Create')}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permissions Dialog */}
      <AnimatePresence>
        {showPermissionsDialog && selectedRole && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowPermissionsDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto backdrop-blur-sm border z-[101]"
            >
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold">
                  {language === 'ar' ? 'إدارة الصلاحيات' : 'Manage Permissions'} - {selectedRole.display_name || selectedRole.name}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {Object.entries(groupedPermissions).map(([group, groupPermissions]) => {
                  const allSelected = groupPermissions.every(p => formData.permissions.includes(p.id));
                  const someSelected = groupPermissions.some(p => formData.permissions.includes(p.id));
                  
                  return (
                    <div key={group} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold capitalize">{group}</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleGroup(group)}
                        >
                          {allSelected 
                            ? (language === 'ar' ? 'إلغاء الكل' : 'Deselect All')
                            : (language === 'ar' ? 'تحديد الكل' : 'Select All')}
                        </Button>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {groupPermissions.map((permission) => {
                          const isSelected = formData.permissions.includes(permission.id);
                          return (
                            <label
                              key={permission.id}
                              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                isSelected ? 'bg-primary/10 border border-primary' : 'border hover:bg-muted'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleTogglePermission(permission.id)}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">{permission.display_name || permission.name}</span>
                              {isSelected && <Check className="w-4 h-4 text-primary ml-auto" />}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPermissionsDialog(false)}
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button type="submit">
                    {language === 'ar' ? 'حفظ الصلاحيات' : 'Save Permissions'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

