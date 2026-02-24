import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import StatCard from '@/components/StatCard';
import { Package, MapPin, Clock, DollarSign, CheckCircle, Truck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function DriverDashboard() {
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    pendingDeliveries: 0,
    completedDeliveries: 0,
    totalEarnings: 0,
    todayDeliveries: 0,
    activeDeliveries: 0,
    availableOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { language } = useLanguage();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, availableRes] = await Promise.all([
        api.get('/driver/dashboard').catch(() => ({ data: {} })),
        api.get('/driver/available-orders').catch(() => ({ data: { data: [], meta: { total: 0 } } })),
      ]);

      const d = dashboardRes.data?.data || dashboardRes.data || {};
      const availableList = availableRes.data?.data ?? availableRes.data ?? [];
      const availableTotal = availableRes.data?.meta?.total ?? (Array.isArray(availableList) ? availableList.length : 0);

      setStats({
        totalDeliveries: d.total_deliveries ?? 0,
        pendingDeliveries: d.pending_deliveries ?? 0,
        completedDeliveries: d.completed_deliveries ?? 0,
        totalEarnings: d.total_earnings ?? 0,
        todayDeliveries: d.today_deliveries ?? 0,
        activeDeliveries: d.active_deliveries ?? 0,
        availableOrders: Array.isArray(availableList) ? availableList.length : availableTotal,
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
      title: language === 'ar' ? 'طلبات متاحة' : 'Available Orders',
      value: stats.availableOrders,
      icon: Package,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
      trend: null,
      subtitle: language === 'ar' ? 'جاهزة للتوصيل' : 'Ready for delivery',
      onClick: () => navigate('/driver/available-orders'),
    },
    {
      title: language === 'ar' ? 'إجمالي التوصيلات' : 'Total Deliveries',
      value: stats.totalDeliveries,
      icon: Package,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      trend: '+12%',
      trendUp: true,
      subtitle: language === 'ar' ? 'جميع التوصيلات' : 'All Deliveries',
      onClick: () => navigate('/driver/deliveries'),
    },
    {
      title: language === 'ar' ? 'توصيلات اليوم' : 'Today\'s Deliveries',
      value: stats.todayDeliveries,
      icon: Clock,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
      trend: null,
      subtitle: language === 'ar' ? 'اليوم' : 'Today',
      onClick: () => navigate('/driver/deliveries?filter=today'),
    },
    {
      title: language === 'ar' ? 'قيد التنفيذ' : 'Active Deliveries',
      value: stats.activeDeliveries,
      icon: Truck,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      trend: null,
      subtitle: language === 'ar' ? 'جاري التوصيل' : 'In Transit',
      onClick: () => navigate('/driver/deliveries?status=in_transit'),
    },
    {
      title: language === 'ar' ? 'مكتملة' : 'Completed',
      value: stats.completedDeliveries,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      trend: '+8%',
      trendUp: true,
      subtitle: language === 'ar' ? 'تم التسليم' : 'Delivered',
      onClick: () => navigate('/driver/deliveries?status=completed'),
    },
    {
      title: language === 'ar' ? 'قيد الانتظار' : 'Pending',
      value: stats.pendingDeliveries,
      icon: MapPin,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      trend: null,
      subtitle: language === 'ar' ? 'في الانتظار' : 'Awaiting',
      onClick: () => navigate('/driver/deliveries?status=pending'),
    },
    {
      title: language === 'ar' ? 'الأرباح' : 'Earnings',
      value: `$${stats.totalEarnings.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      trend: '+23%',
      trendUp: true,
      subtitle: language === 'ar' ? 'إجمالي الأرباح' : 'Total Earnings',
      onClick: () => navigate('/driver/wallet'),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {language === 'ar' ? 'لوحة تحكم السائق' : 'Driver Dashboard'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === 'ar' ? 'نظرة عامة على توصيلاتك وإحصائياتك' : 'Overview of your deliveries and statistics'}
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

