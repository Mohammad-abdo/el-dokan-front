import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import StatCard from '@/components/StatCard';
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, Store, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ShopDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { language } = useLanguage();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [productsRes, ordersRes, customersRes, revenueRes] = await Promise.all([
        api.get('/shop/products').catch(() => ({ data: [] })),
        api.get('/shop/orders').catch(() => ({ data: [] })),
        api.get('/shop/customers').catch(() => ({ data: [] })),
        api.get('/shop/revenue').catch(() => ({ data: { total: 0 } })),
      ]);

      const products = extractDataFromResponse(productsRes);
      const orders = extractDataFromResponse(ordersRes);
      const customers = extractDataFromResponse(customersRes);
      const revenue = revenueRes.data?.data || revenueRes.data || { total: 0 };

      const pendingOrders = orders.filter(order => order.status === 'pending' || order.status === 'processing').length;
      const completedOrders = orders.filter(order => order.status === 'completed' || order.status === 'delivered').length;

      setStats({
        totalProducts: Array.isArray(products) ? products.length : 0,
        totalOrders: Array.isArray(orders) ? orders.length : 0,
        totalCustomers: Array.isArray(customers) ? customers.length : 0,
        totalRevenue: revenue.total || 0,
        pendingOrders,
        completedOrders,
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
      title: language === 'ar' ? 'المنتجات' : 'Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      trend: '+12%',
      trendUp: true,
      subtitle: language === 'ar' ? 'منتجات نشطة' : 'Active Products',
      onClick: () => navigate('/shop/products'),
    },
    {
      title: language === 'ar' ? 'الطلبات' : 'Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      trend: '+8%',
      trendUp: true,
      subtitle: language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders',
      onClick: () => navigate('/shop/orders'),
    },
    {
      title: language === 'ar' ? 'العملاء' : 'Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      trend: '+15%',
      trendUp: true,
      subtitle: language === 'ar' ? 'عملاء نشطون' : 'Active Customers',
      onClick: () => navigate('/shop/customers'),
    },
    {
      title: language === 'ar' ? 'الإيرادات' : 'Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      trend: '+23%',
      trendUp: true,
      subtitle: language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue',
      onClick: () => navigate('/shop/reports'),
    },
    {
      title: language === 'ar' ? 'طلبات قيد الانتظار' : 'Pending Orders',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
      trend: null,
      subtitle: language === 'ar' ? 'في الانتظار' : 'Awaiting',
      onClick: () => navigate('/shop/orders?status=pending'),
    },
    {
      title: language === 'ar' ? 'طلبات مكتملة' : 'Completed Orders',
      value: stats.completedOrders,
      icon: TrendingUp,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      trend: null,
      subtitle: language === 'ar' ? 'تم التسليم' : 'Delivered',
      onClick: () => navigate('/shop/orders?status=completed'),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {language === 'ar' ? 'لوحة تحكم المتجر' : 'Shop Dashboard'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === 'ar' ? 'نظرة عامة على إحصائيات متجرك' : 'Overview of your shop statistics'}
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

