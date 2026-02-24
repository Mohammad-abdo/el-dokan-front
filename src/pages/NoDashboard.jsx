import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NoDashboard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isRTL = language === 'ar';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">
            {language === 'ar' ? 'لوحة التحكم للأدمن فقط' : 'Admin Dashboard Only'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            {language === 'ar'
              ? 'لا يسمح لأحد باستخدام هذه اللوحة سوى الأدمن. السائقون والمندوبون والمتاجر والأطباء والشركات لهم تطبيقات هاتف خاصة بهم. إدارة النظام بالكامل تتم من لوحة تحكم الأدمن فقط.'
              : 'Only administrators can use this dashboard. Drivers, representatives, shops, doctors and companies have their own mobile apps. All system management is done from the admin dashboard only.'}
          </p>
          <Button onClick={handleLogout} variant="outline" className="w-full gap-2">
            <LogOut className="w-4 h-4" />
            {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
