import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import showToast from '@/lib/toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Wallet,
  Plus,
  DollarSign,
  CalendarCheck,
  Percent,
  ArrowDownToLine,
  ArrowUpFromLine,
  Receipt,
  Ban,
  Filter,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const TRANSACTION_LABELS = {
  booking_payment: { label: 'دفعة حجز', labelEn: 'Booking payment', color: 'emerald', icon: CalendarCheck },
  commission: { label: 'عمولة', labelEn: 'Commission', color: 'blue', icon: Percent },
  transfer: { label: 'تحويل', labelEn: 'Transfer', color: 'violet', icon: ArrowDownToLine },
  withdrawal: { label: 'سحب', labelEn: 'Withdrawal', color: 'amber', icon: ArrowUpFromLine },
  refund: { label: 'استرداد', labelEn: 'Refund', color: 'rose', icon: Ban },
};

const STATUS_LABELS = {
  pending: { label: 'قيد الانتظار', class: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  completed: { label: 'مكتمل', class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  failed: { label: 'فاشل', class: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

function StatCard({ title, value, icon: Icon, variant = 'default', className = '' }) {
  const variants = {
    balance: 'bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 border-emerald-500/20',
    income: 'bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20',
    outcome: 'bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20',
    default: 'bg-card border-border',
  };
  return (
    <Card className={`p-4 border ${variants[variant] || variants.default} ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-xl font-bold mt-1 tabular-nums">
            {typeof value === 'number'
              ? value.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : value}
          </p>
        </div>
        {Icon && (
          <div className="p-2 rounded-lg bg-muted/50">
            <Icon className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>
    </Card>
  );
}

export default function AdminDoctorWallet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({ amount: '', description: '' });
  const [commissionForm, setCommissionForm] = useState({ commission_rate: '' });
  const [updatingCommission, setUpdatingCommission] = useState(false);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    Promise.all([fetchWallet(), fetchTransactions()]);
  }, [id]);

  const fetchWallet = async () => {
    try {
      const response = await api.get(`/admin/doctors/${id}/wallet`);
      const walletData = response.data?.data || response.data;
      setWallet(walletData);
      if (walletData) {
        const commissionRate = walletData.commission_rate;
        const commissionPercent = commissionRate < 1 ? commissionRate * 100 : commissionRate;
        setCommissionForm({ commission_rate: commissionPercent.toString() });
        if (walletData.transactions && Array.isArray(walletData.transactions)) {
          setTransactions(walletData.transactions);
        }
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
      showToast.error('فشل تحميل المحفظة');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await api.get(`/admin/doctors/${id}/wallet/transactions`).catch(() => null);
      if (response?.data) {
        const data = response.data?.data ?? response.data;
        setTransactions(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    const amount = parseFloat(transferForm.amount);
    if (!transferForm.amount || isNaN(amount) || amount <= 0) {
      showToast.error('أدخل مبلغاً صحيحاً');
      return;
    }
    setTransferring(true);
    try {
      await api.post(`/admin/doctors/${id}/wallet/transfer`, {
        amount,
        description: transferForm.description,
      });
      showToast.success('تم التحويل بنجاح');
      setShowTransferModal(false);
      setTransferForm({ amount: '', description: '' });
      await Promise.all([fetchWallet(), fetchTransactions()]);
    } catch (error) {
      showToast.error(error.response?.data?.message || 'فشل التحويل');
    } finally {
      setTransferring(false);
    }
  };

  const handleUpdateCommission = async (e) => {
    e.preventDefault();
    const rate = parseFloat(commissionForm.commission_rate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      showToast.error('أدخل نسبة عمولة بين 0 و 100');
      return;
    }
    setUpdatingCommission(true);
    try {
      await api.put(`/admin/doctors/${id}/wallet/commission`, { commission_rate: rate });
      showToast.success('تم تحديث نسبة العمولة');
      fetchWallet();
    } catch (error) {
      showToast.error(error.response?.data?.message || 'فشل التحديث');
    } finally {
      setUpdatingCommission(false);
    }
  };

  const summary = wallet?.summary || {};
  const balance = parseFloat(wallet?.balance ?? 0);
  const filteredTransactions = filterType
    ? transactions.filter((t) => t.type === filterType)
    : transactions;

  const isCredit = (type) => ['booking_payment', 'commission', 'transfer'].includes(type);
  const isDebit = (type) => ['withdrawal', 'refund'].includes(type);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/doctors')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            رجوع
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wallet className="w-7 h-7" />
              محفظة الطبيب
            </h1>
            <p className="text-muted-foreground mt-0.5">
              {wallet?.doctor?.name || wallet?.doctor?.fullName || 'الطبيب'}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowTransferModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          تحويل إلى المحفظة
        </Button>
      </motion.div>

      {/* Summary cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <StatCard
          title="الرصيد الحالي (الباقي)"
          value={balance}
          icon={DollarSign}
          variant="balance"
        />
        <StatCard
          title="إجمالي من الحجوزات"
          value={summary.total_from_bookings ?? 0}
          icon={CalendarCheck}
          variant="income"
        />
        <StatCard
          title="إجمالي العمولة"
          value={summary.total_commission ?? 0}
          icon={Percent}
          variant="income"
        />
        <StatCard
          title="التحويلات (إيداع)"
          value={summary.total_transfer ?? 0}
          icon={ArrowDownToLine}
          variant="income"
        />
        <StatCard
          title="المسحوب"
          value={summary.total_withdrawn ?? 0}
          icon={ArrowUpFromLine}
          variant="outcome"
        />
        <StatCard
          title="طلبات سحب معلقة"
          value={summary.pending_withdrawals ?? 0}
          icon={Receipt}
          variant="outcome"
        />
        <StatCard
          title="الاستردادات"
          value={summary.total_refund ?? 0}
          icon={Ban}
          variant="outcome"
        />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                حركات المحفظة
              </h2>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">كل الأنواع</option>
                  {Object.entries(TRANSACTION_LABELS).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2 max-h-[420px] overflow-y-auto">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => {
                  const meta = TRANSACTION_LABELS[tx.type] || {
                    label: tx.type,
                    icon: Receipt,
                  };
                  const Icon = meta.icon;
                  const credit = isCredit(tx.type);
                  const amount = parseFloat(tx.amount || 0);
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-background border shrink-0">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{meta.label}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {tx.description || '—'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {tx.created_at
                              ? format(new Date(tx.created_at), 'd MMM yyyy، HH:mm', { locale: ar })
                              : '—'}
                          </p>
                        </div>
                      </div>
                      <div className="text-left shrink-0">
                        <p
                          className={`font-bold tabular-nums ${
                            credit ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {credit ? '+' : '-'}
                          {amount.toLocaleString('ar-EG', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            STATUS_LABELS[tx.status]?.class ?? 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {STATUS_LABELS[tx.status]?.label ?? tx.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-10">لا توجد حركات</p>
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-6"
        >
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">نسبة العمولة</h2>
            <form onSubmit={handleUpdateCommission} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">النسبة (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={commissionForm.commission_rate}
                  onChange={(e) => setCommissionForm({ commission_rate: e.target.value })}
                  placeholder="15"
                />
              </div>
              <Button type="submit" disabled={updatingCommission} className="w-full gap-2">
                {updatingCommission ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {updatingCommission ? 'جاري التحديث...' : 'تحديث العمولة'}
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">معلومات المحفظة</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">الطبيب</p>
                <p className="font-medium">
                  {wallet?.doctor?.name || wallet?.doctor?.fullName || '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">نسبة العمولة الحالية</p>
                <p className="font-medium">
                  {(() => {
                    const rate = wallet?.commission_rate ?? 0;
                    const pct = rate < 1 ? rate * 100 : rate;
                    return `${Number(pct).toFixed(2)}%`;
                  })()}
                </p>
              </div>
              {wallet?.created_at && (
                <div>
                  <p className="text-muted-foreground">تاريخ الإنشاء</p>
                  <p className="font-medium">
                    {format(new Date(wallet.created_at), 'd MMM yyyy', { locale: ar })}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-xl p-6 max-w-md w-full border shadow-xl"
          >
            <h2 className="text-xl font-bold mb-4">تحويل إلى المحفظة</h2>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">المبلغ</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">وصف (اختياري)</label>
                <textarea
                  value={transferForm.description}
                  onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                  placeholder="وصف التحويل"
                  className="w-full p-3 border rounded-lg min-h-[80px] resize-none bg-background"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowTransferModal(false);
                    setTransferForm({ amount: '', description: '' });
                  }}
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={transferring} className="flex-1 gap-2">
                  {transferring ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {transferring ? 'جاري التحويل...' : 'تحويل'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
