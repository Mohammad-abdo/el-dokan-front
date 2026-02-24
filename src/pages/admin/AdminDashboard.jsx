import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { useLanguage } from '@/contexts/LanguageContext';
import StatCard from '@/components/StatCard';
import { 
  Users, 
  ShoppingCart, 
  Pill, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  Activity,
  Store,
  ArrowRight,
  Eye,
  Clock,
  Package,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Stethoscope,
  Truck,
  Building2,
  UserCog,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
    todayOrders: 0,
    pendingOrders: 0,
    totalDoctors: 0,
    totalShops: 0,
    totalDrivers: 0,
    totalRepresentatives: 0,
    totalCompanies: 0,
    totalDeliveries: 0,
    activeOrders: 0,
    completedOrders: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    lowStockProducts: 0,
    activeProducts: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [barChartData, setBarChartData] = useState([]);
  const [salesTrendData, setSalesTrendData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7days');

  useEffect(() => {
    fetchDashboardData();
  }, []); // Empty dependency array - only fetch once on mount

  // Memoize expensive calculations to prevent re-renders
  const memoizedChartData = useMemo(() => chartData, [chartData]);
  const memoizedBarChartData = useMemo(() => barChartData, [barChartData]);
  const memoizedSalesTrendData = useMemo(() => salesTrendData, [salesTrendData]);

  const fetchDashboardData = async () => {
    try {
      // Optimize: Fetch only necessary data with smaller limits
      const [
        reportsRes,
        ordersRes,
        usersRes,
        productsRes,
        doctorsRes,
        shopsRes,
        financialRes,
        driversRes,
        representativesRes,
        companiesRes,
        deliveriesRes,
      ] = await Promise.all([
        api.get('/admin/reports/dashboard').catch(() => ({ data: {} })),
        api.get('/admin/orders?per_page=20').catch(() => ({ data: [] })),
        api.get('/admin/users?per_page=10').catch(() => ({ data: [] })),
        api.get('/admin/products?per_page=20').catch(() => ({ data: [] })),
        api.get('/admin/doctors?per_page=10').catch(() => ({ data: [] })),
        api.get('/admin/shops?per_page=10').catch(() => ({ data: [] })),
        api.get('/admin/financial/dashboard').catch(() => ({ data: {} })),
        api.get('/admin/drivers?per_page=10').catch(() => ({ data: [] })),
        api.get('/admin/representatives?per_page=10').catch(() => ({ data: [] })),
        api.get('/admin/shops', { params: { type: 'company' } }).catch(() => ({ data: [] })),
        api.get('/admin/deliveries').catch(() => ({ data: [] })),
      ]);

      const orders = extractDataFromResponse(ordersRes);
      const users = extractDataFromResponse(usersRes);
      const products = extractDataFromResponse(productsRes);
      const doctors = extractDataFromResponse(doctorsRes);
      const shops = extractDataFromResponse(shopsRes);
      const drivers = extractDataFromResponse(driversRes);
      const representatives = extractDataFromResponse(representativesRes);
      const companiesList = extractDataFromResponse(companiesRes);
      const deliveriesList = extractDataFromResponse(deliveriesRes);
      const reports = reportsRes.data?.data || reportsRes.data || {};
      const financial = financialRes.data?.data || financialRes.data || {};

      // Filter pharmacies (shops with category 'pharmacy' or 'صيدليات')
      const pharmacies = shops.filter(shop => 
        shop.category?.toLowerCase().includes('pharmacy') || 
        shop.category?.toLowerCase().includes('صيدلية') ||
        shop.category?.toLowerCase().includes('صيدليات')
      );
      
      // Companies from API (type=company) or fallback filter by category
      const companies = Array.isArray(companiesList) ? companiesList : shops.filter(shop =>
        shop.category?.toLowerCase().includes('company') ||
        shop.category?.toLowerCase().includes('شركة')
      );

      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Filter orders by status
      const pendingOrders = orders.filter(o => 
        ['pending', 'processing', 'received'].includes(o.status)
      );
      const activeOrders = orders.filter(o => 
        ['on_the_way', 'processing', 'shipped'].includes(o.status)
      );
      const completedOrders = orders.filter(o => 
        ['delivered', 'completed'].includes(o.status)
      );
      
      // Today's orders
      const todayOrdersCount = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      }).length;

      // Calculate revenue
      const totalRevenue = orders.reduce((sum, o) => {
        return sum + (parseFloat(o.total_amount || o.total || 0));
      }, 0);

      const todayRevenue = orders
        .filter(o => {
          const orderDate = new Date(o.created_at);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate.getTime() === today.getTime();
        })
        .reduce((sum, o) => sum + (parseFloat(o.total_amount || o.total || 0)), 0);

      // Low stock products
      const lowStockProducts = products.filter(p => 
        parseInt(p.stock_quantity || 0) < 10
      ).length;

      // Active products
      const activeProducts = products.filter(p => p.is_active !== false).length;

      // Recent orders (last 5) - already limited from API
      const recent = [...orders]
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 5);

      // Top products (by price or orders, take first 5) - already limited from API
      const top = [...products]
        .sort((a, b) => (parseFloat(b.price || 0) - parseFloat(a.price || 0)))
        .slice(0, 5);

      // Generate sales trend data (last 7 days)
      const salesTrend = generateSalesTrendData(orders, 7);

      setStats({
        totalUsers: users.length || reports.total_users || 0,
        totalOrders: orders.length || reports.total_orders || 0,
        totalProducts: products.length || reports.total_products || 0,
        totalRevenue: reports.total_revenue || financial.total_revenue || totalRevenue || 0,
        todayOrders: reports.today_orders || todayOrdersCount,
        pendingOrders: pendingOrders.length,
        totalDoctors: doctors.length || 0,
        totalShops: shops.length || 0,
        totalDrivers: drivers.length || 0,
        totalRepresentatives: representatives.length || 0,
        totalPharmacies: pharmacies.length || 0,
        totalCompanies: companies.length || 0,
        totalDeliveries: Array.isArray(deliveriesList) ? deliveriesList.length : 0,
        activeOrders: activeOrders.length,
        completedOrders: completedOrders.length,
        todayRevenue: financial.today?.revenue || todayRevenue || 0,
        monthlyRevenue: financial.this_month?.revenue || 0,
        lowStockProducts,
        activeProducts,
      });

      setChartData([
        { 
          name: language === 'ar' ? 'مكتملة' : 'Completed', 
          value: completedOrders.length, 
          color: '#10b981' 
        },
        { 
          name: language === 'ar' ? 'نشطة' : 'Active', 
          value: activeOrders.length, 
          color: '#3b82f6' 
        },
        { 
          name: language === 'ar' ? 'معلقة' : 'Pending', 
          value: pendingOrders.length, 
          color: '#f59e0b' 
        },
      ]);

      setBarChartData([
        { name: language === 'ar' ? 'المستخدمون' : 'Users', value: users.length },
        { name: language === 'ar' ? 'الأطباء' : 'Doctors', value: doctors.length },
        { name: language === 'ar' ? 'المتاجر' : 'Shops', value: shops.length },
        { name: language === 'ar' ? 'السائقون' : 'Drivers', value: drivers.length },
        { name: language === 'ar' ? 'المندوبون' : 'Representatives', value: representatives.length },
        { name: language === 'ar' ? 'المنتجات' : 'Products', value: products.length },
      ]);

      setSalesTrendData(salesTrend);
      setRecentOrders(recent);
      setTopProducts(top);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSalesTrendData = (orders, days) => {
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === date.getTime();
      });

      const revenue = dayOrders.reduce((sum, o) => {
        return sum + (parseFloat(o.total_amount || o.total || 0));
      }, 0);

      data.push({
        date: format(new Date(date), language === 'ar' ? 'dd/MM' : 'MM/dd'),
        orders: dayOrders.length,
        revenue: parseFloat(revenue.toFixed(2)),
      });
    }

    return data;
  };

  const getStatusColor = (status) => {
    const statusColors = {
      completed: 'bg-green-100 text-green-800',
      delivered: 'bg-green-100 text-green-800',
      active: 'bg-blue-100 text-blue-800',
      on_the_way: 'bg-blue-100 text-blue-800',
      shipped: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-yellow-100 text-yellow-800',
      received: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    if (['completed', 'delivered'].includes(status)) return CheckCircle2;
    if (['active', 'on_the_way', 'shipped'].includes(status)) return Package;
    if (['pending', 'processing', 'received'].includes(status)) return Clock;
    return XCircle;
  };

  const statCards = [
    {
      title: t('dashboard.totalUsers'),
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      trend: '+12%',
      trendUp: true,
      subtitle: language === 'ar' ? 'المستخدمون النشطون' : 'Active Users',
    },
    {
      title: t('dashboard.totalOrders'),
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      trend: '+8%',
      trendUp: true,
      subtitle: language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders',
    },
    {
      title: t('dashboard.totalProducts'),
      value: stats.totalProducts,
      icon: Pill,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      trend: '+5%',
      trendUp: true,
      subtitle: `${stats.activeProducts} ${language === 'ar' ? 'نشط' : 'Active'}`,
    },
    {
      title: t('dashboard.totalRevenue'),
      value: `$${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
      trend: '+15%',
      trendUp: true,
      subtitle: language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue',
    },
    {
      title: t('dashboard.todayOrders'),
      value: stats.todayOrders,
      icon: Calendar,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
      trend: `$${stats.todayRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      trendUp: true,
      subtitle: language === 'ar' ? 'طلبات اليوم' : 'Today\'s Orders',
    },
    {
      title: t('dashboard.pendingOrders'),
      value: stats.pendingOrders,
      icon: FileText,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      trend: stats.pendingOrders > 0 ? `${stats.pendingOrders}` : '0',
      trendUp: false,
      subtitle: language === 'ar' ? 'الطلبات المعلقة' : 'Pending Orders',
    },
    {
      title: t('dashboard.totalDoctors'),
      value: stats.totalDoctors,
      icon: Activity,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
      trend: '+3%',
      trendUp: true,
      subtitle: language === 'ar' ? 'الأطباء المسجلون' : 'Registered Doctors',
    },
    {
      title: t('common_labels.totalShops') || 'Total Shops',
      value: stats.totalShops,
      icon: Store,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/20',
      trend: '+2%',
      trendUp: true,
      subtitle: language === 'ar' ? 'المتاجر النشطة' : 'Active Shops',
    },
    {
      title: language === 'ar' ? 'الشركات' : 'Companies',
      value: stats.totalCompanies ?? 0,
      icon: Building2,
      color: 'text-teal-500',
      bgColor: 'bg-teal-500/10',
      borderColor: 'border-teal-500/20',
      subtitle: language === 'ar' ? 'مقدمو الخدمة' : 'Service providers',
      onClick: () => navigate('/admin/companies'),
    },
    {
      title: language === 'ar' ? 'التوصيلات' : 'Deliveries',
      value: stats.totalDeliveries ?? 0,
      icon: Truck,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      subtitle: language === 'ar' ? 'إدارة التوصيل' : 'Delivery management',
      onClick: () => navigate('/admin/deliveries'),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-full max-w-2xl mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-12" />
            <Skeleton className="h-9 w-12" />
            <Skeleton className="h-9 w-12" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div>
          <Skeleton className="h-7 w-48 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </Card>
          <Card className="p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* فكرة المشروع - Platform Idea (Figma alignment) */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          {t('platform.ideaTitle')}
        </h2>
        <p className="text-muted-foreground text-sm mb-4 max-w-3xl">
          {t('platform.ideaDescription')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => navigate('/admin/users')}
            className="flex items-center justify-between p-4 rounded-lg border bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10 transition-colors cursor-pointer"
          >
            <div>
              <p className="font-medium text-blue-700 dark:text-blue-400">{t('platform.usersTitle')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('platform.usersDescription')}</p>
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
          </div>
          <div
            onClick={() => navigate('/admin/doctors')}
            className="flex items-center justify-between p-4 rounded-lg border bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10 transition-colors cursor-pointer"
          >
            <div>
              <p className="font-medium text-amber-700 dark:text-amber-400">{t('platform.serviceProvidersTitle')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('platform.serviceProvidersDescription')}</p>
            </div>
            <div className="text-2xl font-bold text-amber-600">
              {(stats.totalDoctors || 0) + (stats.totalShops || 0) + (stats.totalCompanies || 0) + (stats.totalDrivers || 0) + (stats.totalDeliveries || 0) + (stats.totalRepresentatives || 0)}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
          >
            {t('dashboard.welcome')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground mt-2 text-sm sm:text-base"
          >
            {t('dashboard.overview')}
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2"
        >
          {['7days', '30days', '90days'].map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period === '7days' ? '7D' : period === '30days' ? '30D' : '90D'}
            </Button>
          ))}
        </motion.div>
      </motion.div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <StatCard
            key={`${stat.title}-${index}`}
            {...stat}
            delay={index * 0.05}
            onClick={() => {
              if (stat.title.includes('Users')) navigate('/admin/users');
              if (stat.title.includes('Orders')) navigate('/admin/orders');
              if (stat.title.includes('Products')) navigate('/admin/products');
              if (stat.title.includes('Revenue')) navigate('/admin/financial');
              if (stat.title.includes('Doctors')) navigate('/admin/doctors');
              if (stat.title.includes('Shops')) navigate('/admin/shops');
            }}
          />
        ))}
      </div>

      {/* Vendor Cards - متاجر، شركات، أطباء، سائقين، صيدليات */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            {language === 'ar' ? 'إدارة البائعين' : 'Vendors Management'}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title={language === 'ar' ? 'المتاجر' : 'Shops'}
            value={stats.totalShops}
            icon={Store}
            color="text-pink-500"
            bgColor="bg-pink-500/10"
            borderColor="border-pink-500/20"
            trend="+2%"
            trendUp={true}
            subtitle={language === 'ar' ? 'متاجر نشطة' : 'Active Shops'}
            delay={0.35}
            onClick={() => navigate('/admin/shops')}
          />
          <StatCard
            title={language === 'ar' ? 'الصيدليات' : 'Pharmacies'}
            value={stats.totalPharmacies}
            icon={Pill}
            color="text-purple-500"
            bgColor="bg-purple-500/10"
            borderColor="border-purple-500/20"
            trend="+5%"
            trendUp={true}
            subtitle={language === 'ar' ? 'صيدليات مسجلة' : 'Registered Pharmacies'}
            delay={0.4}
            onClick={() => navigate('/admin/shops?category=pharmacy')}
          />
          <StatCard
            title={language === 'ar' ? 'الشركات' : 'Companies'}
            value={stats.totalCompanies}
            icon={Building2}
            color="text-blue-500"
            bgColor="bg-blue-500/10"
            borderColor="border-blue-500/20"
            trend="+3%"
            trendUp={true}
            subtitle={language === 'ar' ? 'شركات مسجلة' : 'Registered Companies'}
            delay={0.45}
            onClick={() => navigate('/admin/companies')}
          />
          <StatCard
            title={language === 'ar' ? 'الأطباء' : 'Doctors'}
            value={stats.totalDoctors}
            icon={Stethoscope}
            color="text-indigo-500"
            bgColor="bg-indigo-500/10"
            borderColor="border-indigo-500/20"
            trend="+4%"
            trendUp={true}
            subtitle={language === 'ar' ? 'أطباء نشطون' : 'Active Doctors'}
            delay={0.5}
            onClick={() => navigate('/admin/doctors')}
          />
          <StatCard
            title={language === 'ar' ? 'السائقين' : 'Drivers'}
            value={stats.totalDrivers}
            icon={Truck}
            color="text-orange-500"
            bgColor="bg-orange-500/10"
            borderColor="border-orange-500/20"
            trend="+1%"
            trendUp={true}
            subtitle={language === 'ar' ? 'سائقين متاحين' : 'Available Drivers'}
            delay={0.55}
            onClick={() => navigate('/admin/drivers')}
          />
          <StatCard
            title={language === 'ar' ? 'المندوبون' : 'Representatives'}
            value={stats.totalRepresentatives}
            icon={UserCog}
            color="text-teal-500"
            bgColor="bg-teal-500/10"
            borderColor="border-teal-500/20"
            trend="+2%"
            trendUp={true}
            subtitle={language === 'ar' ? 'مندوبون نشطون' : 'Active Representatives'}
            delay={0.6}
            onClick={() => navigate('/admin/representatives')}
          />
        </div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Order Status Pie Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, type: 'spring' }}
        >
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{t('dashboard.orderStatus')}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/orders')}
                className="gap-2"
              >
                {language === 'ar' ? 'عرض الكل' : 'View All'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="w-full h-64 sm:h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={memoizedChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {memoizedChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        style={{
                          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--card))'
                    }} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Platform Overview Bar Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-lg font-semibold mb-4">{t('dashboard.topProducts') || 'Platform Overview'}</h2>
            <div className="w-full h-64 sm:h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memoizedBarChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={language === 'ar' ? 0 : -45}
                    textAnchor={language === 'ar' ? 'middle' : 'end'}
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--card))'
                    }} 
                  />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))" 
                    radius={[8, 8, 0, 0]}
                    animationBegin={0}
                    animationDuration={800}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Sales Trend & Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('dashboard.salesTrend') || 'Sales Trend'}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>{language === 'ar' ? 'الطلبات' : 'Orders'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>{language === 'ar' ? 'الإيرادات' : 'Revenue'}</span>
              </div>
            </div>
          </div>
          <div className="w-full h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={memoizedSalesTrendData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    backgroundColor: 'hsl(var(--card))'
                  }}
                />
                <Legend />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  animationBegin={0}
                  animationDuration={800}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="orders"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorOrders)"
                  animationBegin={0}
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* Recent Orders & Top Products Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                {t('dashboard.recentOrders') || 'Recent Orders'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/orders')}
                className="gap-2"
              >
                {language === 'ar' ? 'عرض الكل' : 'View All'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <AnimatePresence>
                {recentOrders.length > 0 ? (
                  recentOrders.map((order, index) => {
                    const StatusIcon = getStatusIcon(order.status);
                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                        className="p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold">#{order.id}</p>
                              <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${getStatusColor(order.status)}`}>
                                <StatusIcon className="w-3 h-3" />
                                {order.status || 'pending'}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {order.user?.name || order.user?.username || 'Customer'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.created_at ? format(new Date(order.created_at), 'PPp') : '-'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              ${parseFloat(order.total_amount || order.total || 0).toFixed(2)}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/orders/${order.id}`);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 text-muted-foreground"
                  >
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{t('dashboard.noData') || 'No orders yet'}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Package className="w-5 h-5" />
                {language === 'ar' ? 'أفضل المنتجات' : 'Top Products'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/products')}
                className="gap-2"
              >
                {language === 'ar' ? 'عرض الكل' : 'View All'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <AnimatePresence>
                {topProducts.length > 0 ? (
                  topProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, x: -4 }}
                      className="p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/products/${product.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                            <Pill className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{product.name || 'Product'}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.shop?.name || product.category || '-'}
                          </p>
                          {product.stock_quantity !== undefined && (
                            <p className={`text-xs mt-1 ${
                              parseInt(product.stock_quantity) < 10 
                                ? 'text-red-600' 
                                : 'text-green-600'
                            }`}>
                              {parseInt(product.stock_quantity)} {language === 'ar' ? 'متوفر' : 'in stock'}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">
                            ${parseFloat(product.price || 0).toFixed(2)}
                          </p>
                          {product.discount_percentage && (
                            <p className="text-xs text-green-600">
                              -{product.discount_percentage}%
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 text-muted-foreground"
                  >
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{t('dashboard.noData') || 'No products yet'}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Quick Stats & Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-lg font-semibold mb-4">{language === 'ar' ? 'إحصائيات سريعة' : 'Quick Stats'}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-3 sm:p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-lg border border-green-500/20"
              >
                <p className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.totalAppointments') || 'Completed'}</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.completedOrders}</p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-3 sm:p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg border border-blue-500/20"
              >
                <p className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.totalPrescriptions') || 'Active'}</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.activeOrders}</p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-3 sm:p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-lg border border-orange-500/20"
              >
                <p className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.pendingOrders')}</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-600">{stats.pendingOrders}</p>
              </motion.div>
            </div>
          </Card>
        </motion.div>

        {/* Alerts & Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {language === 'ar' ? 'التنبيهات' : 'Alerts'}
            </h2>
            <div className="space-y-3">
              {stats.pendingOrders > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{stats.pendingOrders} {language === 'ar' ? 'طلبات معلقة تحتاج إلى المراجعة' : 'pending orders need review'}</p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => navigate('/admin/orders')}
                      className="p-0 h-auto mt-1"
                    >
                      {language === 'ar' ? 'عرض الطلبات' : 'View Orders'}
                    </Button>
                  </div>
                </motion.div>
              )}
              {stats.lowStockProducts > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{stats.lowStockProducts} {language === 'ar' ? 'منتجات قليلة المخزون' : 'products are low in stock'}</p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => navigate('/admin/products')}
                      className="p-0 h-auto mt-1"
                    >
                      {language === 'ar' ? 'عرض المنتجات' : 'View Products'}
                    </Button>
                  </div>
                </motion.div>
              )}
              {stats.pendingOrders === 0 && stats.lowStockProducts === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="font-medium text-sm text-green-600">
                    {language === 'ar' ? 'كل شيء على ما يرام!' : 'All good!'}
                  </p>
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
