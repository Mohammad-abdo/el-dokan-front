import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/lib/api';
import showToast from '@/lib/toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Mail, Phone, Calendar, Shield, Save, Camera } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminProfile() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    name: '',
    avatar: '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        name: user.name || '',
        avatar: user.avatar || '',
      });
    }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data?.user || response.data?.data;
      setProfile(userData);
      if (userData) {
        setFormData(prev => ({
          ...prev,
          username: userData.username || prev.username,
          email: userData.email || prev.email,
          phone: userData.phone || prev.phone,
          name: userData.name || prev.name,
          avatar: userData.avatar || prev.avatar,
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/user/profile', {
        username: formData.username,
        email: formData.email,
        avatar_url: formData.avatar || undefined,
        language_preference: formData.language_preference,
      });
      showToast.success('Profile updated successfully');
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      showToast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      showToast.success('Password updated successfully');
      setPasswordData({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
    } catch (error) {
      console.error('Error updating password:', error);
      showToast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const displayUser = profile || user;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">{t('common.profile')}</h1>
        <p className="text-muted-foreground mt-2">Manage your profile information</p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-1"
        >
          <Card className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  {displayUser?.avatar ? (
                    <img
                      src={displayUser.avatar}
                      alt={displayUser.username}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-primary-foreground" />
                  )}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <h2 className="text-xl font-bold">{displayUser?.username || displayUser?.name || 'Admin'}</h2>
              <p className="text-sm text-muted-foreground mb-4">{displayUser?.email}</p>
              <div className="w-full space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="capitalize">{displayUser?.role || 'Admin'}</span>
                </div>
                {displayUser?.created_at && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {format(new Date(displayUser.created_at), 'MMM yyyy')}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Profile Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-2 space-y-6"
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Username
                  </label>
                  <Input
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone
                  </label>
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Phone"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full Name"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Avatar URL</label>
                  <Input
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleChange}
                    placeholder="https://example.com/avatar.jpg"
                    type="url"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Change Password</h2>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <Input
                  name="current_password"
                  type="password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  placeholder="Current Password"
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">New Password</label>
                  <Input
                    name="new_password"
                    type="password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    placeholder="New Password"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                  <Input
                    name="new_password_confirmation"
                    type="password"
                    value={passwordData.new_password_confirmation}
                    onChange={handlePasswordChange}
                    placeholder="Confirm New Password"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={loading} variant="outline">
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}




