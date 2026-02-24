import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '@/components/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import StatCard from '@/components/StatCard';
import { Wallet, DollarSign, TrendingUp, ReceiptText, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';

export default function ShopWallet() {
  const [wallet, setWallet] = useState({ 
    balance: 0, 
    total_earnings: 0,
    pending_balance: 0,
    total_orders: 0 
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const [dashboardRes, financialRes] = await Promise.all([
        api.get('/shop/dashboard').catch(() => ({ data: { data: {} } })),
        api.get('/shop/financial').catch(() => ({ data: { data: {} } })),
      ]);

      const dashboard = dashboardRes.data?.data || dashboardRes.data || {};
      const financial = financialRes.data?.data || financialRes.data || {};

      setWallet({
        balance: financial.total_earnings || financial.balance || dashboard.total_revenue || 0,
        total_earnings: financial.total_earnings || dashboard.total_revenue || 0,
        pending_balance: financial.pending_balance || 0,
        total_orders: dashboard.total_orders || 0,
      });

      // Fetch transactions if endpoint exists
      try {
        const transactionsRes = await api.get('/shop/financial/transactions');
        setTransactions(extractDataFromResponse(transactionsRes));
      } catch (error) {
        console.error('Transactions endpoint not available');
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(() => [
    { accessorKey: 'id', header: language === 'ar' ? 'ID' : 'ID' },
    { 
      accessorKey: 'type', 
      header: language === 'ar' ? 'النوع' : 'Type',
      cell: ({ row }) => {
        const type = row.original.type || '';
        const typeLabels = {
          order: language === 'ar' ? 'طلب' : 'Order',
          withdrawal: language === 'ar' ? 'سحب' : 'Withdrawal',
          deposit: language === 'ar' ? 'إيداع' : 'Deposit',
          commission: language === 'ar' ? 'عمولة' : 'Commission',
        };
        return typeLabels[type] || type;
      }
    },
    { 
      accessorKey: 'amount', 
      header: language === 'ar' ? 'المبلغ' : 'Amount', 
      cell: ({ row }) => `$${parseFloat(row.original.amount || 0).toLocaleString()}` 
    },
    { 
      accessorKey: 'description', 
      header: language === 'ar' ? 'الوصف' : 'Description' 
    },
    {
      accessorKey: 'created_at',
      header: language === 'ar' ? 'التاريخ' : 'Date',
      cell: ({ row }) => row.original.created_at ? format(new Date(row.original.created_at), 'MMM dd, yyyy HH:mm') : '-',
    },
  ], [language]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: language === 'ar' ? 'الرصيد الحالي' : 'Current Balance',
      value: `$${wallet.balance.toLocaleString()}`,
      icon: Wallet,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      subtitle: language === 'ar' ? 'إجمالي الرصيد' : 'Total Balance',
      delay: 0,
    },
    {
      title: language === 'ar' ? 'إجمالي الأرباح' : 'Total Earnings',
      value: `$${wallet.total_earnings.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      subtitle: language === 'ar' ? 'جميع الأرباح' : 'All Earnings',
      delay: 0.1,
    },
    {
      title: language === 'ar' ? 'رصيد قيد الانتظار' : 'Pending Balance',
      value: `$${wallet.pending_balance.toLocaleString()}`,
      icon: ArrowDownCircle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
      subtitle: language === 'ar' ? 'في الانتظار' : 'Awaiting',
      delay: 0.2,
    },
    {
      title: language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders',
      value: wallet.total_orders.toLocaleString(),
      icon: ReceiptText,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      subtitle: language === 'ar' ? 'جميع الطلبات' : 'All Orders',
      delay: 0.3,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {language === 'ar' ? 'المحفظة' : 'Wallet'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === 'ar' ? 'إدارة أرباحك والمعاملات' : 'Manage your earnings and transactions'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'المعاملات' : 'Transactions'}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={transactions} 
            searchable 
            searchPlaceholder={language === 'ar' ? 'البحث في المعاملات...' : 'Search transactions...'} 
          />
        </CardContent>
      </Card>
    </div>
  );
}

