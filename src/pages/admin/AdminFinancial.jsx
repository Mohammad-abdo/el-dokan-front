import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import StatCard from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import { Card } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Store, UserCog, Truck, UserCheck, Eye, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

export default function AdminFinancial() {
  const [financial, setFinancial] = useState({
    totalRevenue: 0,
    totalCommission: 0,
    totalTransactions: 0,
    todayRevenue: 0,
    todayOrders: 0,
    monthRevenue: 0,
    monthOrders: 0,
    monthCommission: 0,
  });
  const [vendors, setVendors] = useState({
    shops: [],
    doctors: [],
    drivers: [],
    representatives: [],
    totalVendors: 0,
    totalBalance: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { language } = useLanguage();

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      const [dashboardRes, vendorsRes, transactionsRes] = await Promise.all([
        api.get('/admin/financial/dashboard').catch(() => ({ data: { data: {} } })),
        api.get('/admin/financial/vendors').catch(() => ({ data: { data: {} } })),
        api.get('/admin/financial/transactions').catch(() => ({ data: { data: [] } })),
      ]);

      const dashboard = dashboardRes.data?.data || dashboardRes.data || {};
      const vendorsData = vendorsRes.data?.data || vendorsRes.data || {};
      const transactionsData = extractDataFromResponse(transactionsRes);

      setFinancial({
        totalRevenue: dashboard.total?.revenue || 0,
        totalCommission: dashboard.total?.commission || 0,
        todayRevenue: dashboard.today?.revenue || 0,
        todayOrders: dashboard.today?.orders || 0,
        monthRevenue: dashboard.this_month?.revenue || 0,
        monthOrders: dashboard.this_month?.orders || 0,
        monthCommission: dashboard.this_month?.commission || 0,
        totalTransactions: Array.isArray(transactionsData) ? transactionsData.length : 0,
      });

      setVendors({
        shops: vendorsData.shops || [],
        doctors: vendorsData.doctors || [],
        drivers: vendorsData.drivers || [],
        representatives: vendorsData.representatives || [],
        totalVendors: vendorsData.total_vendors || 0,
        totalBalance: vendorsData.total_balance || 0,
      });

      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewVendor = async (type, id) => {
    try {
      const response = await api.get('/admin/financial/vendor-wallet', {
        params: { type, id }
      });
      // You can show this in a modal or navigate to a detail page
      console.log('Vendor wallet:', response.data);
      // For now, navigate to the vendor detail page
      if (type === 'shop') navigate(`/admin/shops/${id}`);
      if (type === 'doctor') navigate(`/admin/doctors/${id}`);
      if (type === 'driver') navigate(`/admin/drivers/${id}`);
      if (type === 'representative') navigate(`/admin/representatives`);
    } catch (error) {
      console.error('Error fetching vendor wallet:', error);
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
      title: language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue',
      value: `$${financial.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      trend: '+12%',
      trendUp: true,
      subtitle: language === 'ar' ? 'جميع الإيرادات' : 'All Revenue',
    },
    {
      title: language === 'ar' ? 'إجمالي العمولات' : 'Total Commission',
      value: `$${financial.totalCommission.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      trend: '+8%',
      trendUp: true,
      subtitle: language === 'ar' ? 'عمولات المنصة' : 'Platform Commission',
    },
    {
      title: language === 'ar' ? 'إيرادات اليوم' : 'Today Revenue',
      value: `$${financial.todayRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
      subtitle: language === 'ar' ? 'اليوم' : 'Today',
    },
    {
      title: language === 'ar' ? 'إيرادات الشهر' : 'Month Revenue',
      value: `$${financial.monthRevenue.toLocaleString()}`,
      icon: BarChart3,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      trend: '+23%',
      trendUp: true,
      subtitle: language === 'ar' ? 'هذا الشهر' : 'This Month',
    },
    {
      title: language === 'ar' ? 'إجمالي البائعين' : 'Total Vendors',
      value: vendors.totalVendors,
      icon: Store,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
      subtitle: language === 'ar' ? 'جميع البائعين' : 'All Vendors',
    },
    {
      title: language === 'ar' ? 'إجمالي الأرصدة' : 'Total Balances',
      value: `$${vendors.totalBalance.toLocaleString()}`,
      icon: Wallet,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      subtitle: language === 'ar' ? 'أرصدة البائعين' : 'Vendors Balances',
    },
  ];

  // Combine all vendors for table
  const allVendors = [
    ...vendors.shops.map(v => ({ ...v, icon: Store })),
    ...vendors.doctors.map(v => ({ ...v, icon: UserCog })),
    ...vendors.drivers.map(v => ({ ...v, icon: Truck })),
    ...vendors.representatives.map(v => ({ ...v, icon: UserCheck })),
  ];

  const vendorColumns = [
    { accessorKey: 'name', header: language === 'ar' ? 'الاسم' : 'Name' },
    {
      accessorKey: 'type',
      header: language === 'ar' ? 'النوع' : 'Type',
      cell: ({ row }) => {
        const type = row.original.type;
        const typeLabels = {
          shop: language === 'ar' ? 'متجر' : 'Shop',
          doctor: language === 'ar' ? 'طبيب' : 'Doctor',
          driver: language === 'ar' ? 'سائق' : 'Driver',
          representative: language === 'ar' ? 'مندوب' : 'Representative',
        };
        return typeLabels[type] || type;
      },
    },
    {
      accessorKey: 'balance',
      header: language === 'ar' ? 'الرصيد' : 'Balance',
      cell: ({ row }) => `$${parseFloat(row.original.balance || 0).toLocaleString()}`,
    },
    {
      accessorKey: 'total_orders',
      header: language === 'ar' ? 'الطلبات' : 'Orders',
    },
    {
      accessorKey: 'total_transactions',
      header: language === 'ar' ? 'المعاملات' : 'Transactions',
    },
    {
      id: 'actions',
      header: language === 'ar' ? 'الإجراءات' : 'Actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewVendor(row.original.type, row.original.id)}
        >
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  const transactionColumns = [
    { accessorKey: 'id', header: 'ID' },
    {
      accessorKey: 'type',
      header: language === 'ar' ? 'النوع' : 'Type',
    },
    {
      accessorKey: 'amount',
      header: language === 'ar' ? 'المبلغ' : 'Amount',
      cell: ({ row }) => `$${parseFloat(row.original.amount || 0).toLocaleString()}`,
    },
    {
      accessorKey: 'commission',
      header: language === 'ar' ? 'العمولة' : 'Commission',
      cell: ({ row }) => `$${parseFloat(row.original.commission || 0).toLocaleString()}`,
    },
    {
      accessorKey: 'status',
      header: language === 'ar' ? 'الحالة' : 'Status',
    },
    {
      accessorKey: 'created_at',
      header: language === 'ar' ? 'التاريخ' : 'Date',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {language === 'ar' ? 'لوحة التحكم المالية' : 'Financial Dashboard'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === 'ar' ? 'نظرة شاملة على الوضع المالي والنظام' : 'Complete overview of financial status and system'}
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <StatCard
            key={stat.title}
            {...stat}
            delay={index * 0.05}
          />
        ))}
      </div>

      {/* Vendors Financial Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">
              {language === 'ar' ? 'أرصدة البائعين' : 'Vendors Balances'}
            </h2>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 text-pink-500 text-sm">
                <Store className="w-4 h-4" />
                <span>{vendors.shops.length} {language === 'ar' ? 'متاجر' : 'Shops'}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-sm">
                <UserCog className="w-4 h-4" />
                <span>{vendors.doctors.length} {language === 'ar' ? 'أطباء' : 'Doctors'}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-sm">
                <Truck className="w-4 h-4" />
                <span>{vendors.drivers.length} {language === 'ar' ? 'سائقين' : 'Drivers'}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 text-sm">
                <UserCheck className="w-4 h-4" />
                <span>{vendors.representatives.length} {language === 'ar' ? 'مندوبين' : 'Reps'}</span>
              </div>
            </div>
          </div>
          <DataTable data={allVendors} columns={vendorColumns} />
        </Card>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            {language === 'ar' ? 'المعاملات الأخيرة' : 'Recent Transactions'}
          </h2>
          <DataTable data={transactions} columns={transactionColumns} />
        </Card>
      </motion.div>
    </div>
  );
}
