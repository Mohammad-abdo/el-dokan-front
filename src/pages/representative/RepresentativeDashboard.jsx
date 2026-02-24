import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import StatCard from '@/components/StatCard';
import { Package, Calendar, MapPin, DollarSign, TrendingUp, UserCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function RepresentativeDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalVisits: 0,
    completedVisits: 0,
    pendingVisits: 0,
    totalEarnings: 0,
    todayVisits: 0,
    clientsCount: 0,
    ordersCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { language } = useLanguage();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, clientsRes, ordersRes] = await Promise.all([
        api.get('/representative/dashboard').catch(() => ({ data: {} })),
        api.get('/representative/clients').catch(() => ({ data: [] })),
        api.get('/representative/orders').catch(() => ({ data: [] })),
      ]);

      const d = dashboardRes.data?.data || dashboardRes.data || {};
      const clients = dashboardRes.data?.data?.clients ?? clientsRes.data?.data ?? clientsRes.data ?? [];
      const ordersList = ordersRes.data?.data ?? ordersRes.data ?? [];
      const clientsCount = Array.isArray(clients) ? clients.length : 0;
      const ordersCount = Array.isArray(ordersList) ? ordersList.length : (ordersRes.data?.meta?.total ?? 0);

      setStats({
        totalProducts: d.total_products ?? 0,
        totalVisits: d.total_visits ?? 0,
        completedVisits: d.completed_visits ?? 0,
        pendingVisits: d.pending_visits ?? 0,
        totalEarnings: d.total_earnings ?? 0,
        todayVisits: d.today_visits ?? 0,
        clientsCount,
        ordersCount,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: language === 'ar' ? 'العملاء' : 'Clients',
      value: stats.clientsCount,
      icon: UserCheck,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
      trend: null,
      subtitle: language === 'ar' ? 'متاجر من زياراتك' : 'Shops from visits',
      onClick: () => navigate('/representative/clients'),
    },
    {
      title: language === 'ar' ? 'الطلبات' : 'Orders',
      value: stats.ordersCount,
      icon: Package,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
      trend: null,
      subtitle: language === 'ar' ? 'طلبات المتاجر' : 'Shop orders',
      onClick: () => navigate('/representative/orders'),
    },
    {
      title: language === 'ar' ? 'المنتجات' : 'Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      trend: null,
      subtitle: language === 'ar' ? 'منتجات متاحة' : 'Available Products',
      onClick: () => navigate('/representative/products'),
    },
    {
      title: language === 'ar' ? 'إجمالي الزيارات' : 'Total Visits',
      value: stats.totalVisits,
      icon: Calendar,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      trend: '+8%',
      trendUp: true,
      subtitle: language === 'ar' ? 'جميع الزيارات' : 'All Visits',
      onClick: () => navigate('/representative/visits'),
    },
    {
      title: language === 'ar' ? 'زيارات اليوم' : 'Today\'s Visits',
      value: stats.todayVisits,
      icon: Calendar,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
      trend: null,
      subtitle: language === 'ar' ? 'اليوم' : 'Today',
      onClick: () => navigate('/representative/visits?filter=today'),
    },
    {
      title: language === 'ar' ? 'مكتملة' : 'Completed',
      value: stats.completedVisits,
      icon: TrendingUp,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      trend: null,
      subtitle: language === 'ar' ? 'تمت بنجاح' : 'Done',
      onClick: () => navigate('/representative/visits?status=completed'),
    },
    {
      title: language === 'ar' ? 'قيد الانتظار' : 'Pending',
      value: stats.pendingVisits,
      icon: MapPin,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      trend: null,
      subtitle: language === 'ar' ? 'مجدولة' : 'Scheduled',
      onClick: () => navigate('/representative/visits?status=pending'),
    },
    {
      title: language === 'ar' ? 'الأرباح' : 'Earnings',
      value: `$${stats.totalEarnings.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      trend: '+23%',
      trendUp: true,
      subtitle: language === 'ar' ? 'إجمالي الأرباح' : 'Total Earnings',
      onClick: () => navigate('/representative/wallet'),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {language === 'ar' ? 'لوحة تحكم المندوب' : 'Representative Dashboard'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === 'ar' ? 'نظرة عامة على زياراتك وإحصائياتك' : 'Overview of your visits and statistics'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <StatCard
            key={stat.title}
            {...stat}
            delay={index * 0.05}
          />
        ))}
      </div>
    </div>
  );
}

