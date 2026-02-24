import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '@/components/DataTable';
import { Card } from '@/components/ui/card';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { Wallet, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export default function DoctorWallet() {
  const [wallet, setWallet] = useState({ balance: 0, commission: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const [walletRes, transactionsRes] = await Promise.all([
        api.get('/doctor/wallet'),
        api.get('/doctor/wallet/transactions'),
      ]);

      const walletData = walletRes.data?.data || walletRes.data || {};
      setWallet({ 
        balance: walletData.balance || 0, 
        commission: walletData.commission_rate || 0 
      });
      setTransactions(extractDataFromResponse(transactionsRes));
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(() => [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'type', header: 'Type' },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => `$${row.original.amount || 0}` },
    { accessorKey: 'description', header: 'Description' },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => row.original.created_at ? format(new Date(row.original.created_at), 'MMM dd, yyyy HH:mm') : '-',
    },
  ], []);

  if (loading) {
    return <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
        <p className="text-muted-foreground mt-2">Manage your earnings and transactions</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Balance</p>
              <p className="text-2xl font-bold mt-2">${wallet.balance?.toLocaleString() || 0}</p>
            </div>
            <Wallet className="w-8 h-8 text-primary" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Commission Rate</p>
              <p className="text-2xl font-bold mt-2">{wallet.commission || 0}%</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Transactions</h2>
        <DataTable columns={columns} data={transactions} searchable searchPlaceholder="Search transactions..." />
      </div>
    </div>
  );
}


