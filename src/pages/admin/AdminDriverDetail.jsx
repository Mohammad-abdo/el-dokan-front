import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/lib/api';
import {
  Truck,
  ArrowLeft,
  Edit,
  MapPin,
  Phone,
  Mail,
  Navigation,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  Package,
  DollarSign,
  Wallet,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function AdminDriverDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [driver, setDriver] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDriver();
    fetchDeliveries();
    fetchWallet();
  }, [id]);

  const fetchDriver = async () => {
    try {
      const response = await api.get(`/admin/drivers/${id}`);
      setDriver(response.data?.data || response.data);
    } catch (error) {
      console.error('Error fetching driver:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveries = async () => {
    try {
      const response = await api.get(`/admin/drivers/${id}/deliveries`);
      setDeliveries(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    }
  };

  const fetchWallet = async () => {
    try {
      const response = await api.get('/admin/financial/vendor-wallet', {
        params: { type: 'driver', id }
      });
      setWallet(response.data?.data);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      available: {
        label: language === 'ar' ? 'متاح' : 'Available',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        icon: CheckCircle2,
      },
      busy: {
        label: language === 'ar' ? 'مشغول' : 'Busy',
        className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
        icon: Clock,
      },
      offline: {
        label: language === 'ar' ? 'غير متصل' : 'Offline',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
        icon: XCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.offline;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="text-center py-12" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <p className="text-muted-foreground">{language === 'ar' ? 'السائق غير موجود' : 'Driver not found'}</p>
        <Button onClick={() => navigate('/admin/drivers')} className="mt-4">
          {language === 'ar' ? 'العودة' : 'Go Back'}
        </Button>
      </div>
    );
  }

  const isRTL = language === 'ar';

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}
      >
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/drivers')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === 'ar' ? 'العودة' : 'Back'}
          </Button>
          <div className={isRTL ? 'text-right' : ''}>
            <h1 className="text-3xl font-bold tracking-tight">{driver.name}</h1>
            <p className="text-muted-foreground mt-1">
              {language === 'ar' ? 'تفاصيل السائق' : 'Driver Details'}
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate(`/admin/drivers/${id}/edit`)}
          className="gap-2"
        >
          <Edit className="w-4 h-4" />
          {language === 'ar' ? 'تعديل' : 'Edit'}
        </Button>
      </motion.div>

      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${isRTL ? 'text-right' : ''}`}>
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Driver Info Card */}
          <Card className="p-6">
            <div className={`flex items-start gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Truck className="w-10 h-10 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">{driver.name}</h2>
                  {getStatusBadge(driver.status)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{driver.phone || '-'}</span>
                  </div>
                  {driver.rating && typeof driver.rating === 'number' && (
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{Number(driver.rating ?? 0).toFixed(1)}</span>
                    </div>
                  )}
                  {driver.current_location_lat && driver.current_location_lng && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'على الخريطة' : 'On Map'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Location Card */}
          {driver.current_location_lat && driver.current_location_lng && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                {language === 'ar' ? 'الموقع الحالي' : 'Current Location'}
              </h3>
              <div className="h-64 rounded-lg overflow-hidden border bg-muted">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(driver.current_location_lng) - 0.01},${parseFloat(driver.current_location_lat) - 0.01},${parseFloat(driver.current_location_lng) + 0.01},${parseFloat(driver.current_location_lat) + 0.01}&layer=mapnik&marker=${driver.current_location_lat},${driver.current_location_lng}`}
                  allowFullScreen
                />
              </div>
            </Card>
          )}

          {/* Deliveries */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              {language === 'ar' ? 'التسليمات' : 'Deliveries'}
            </h3>
            {deliveries.length > 0 ? (
              <div className="space-y-3">
                {deliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div>
                      <p className="font-medium">Order #{delivery.order_number || delivery.id}</p>
                      <p className="text-sm text-muted-foreground">{delivery.status}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/deliveries/${delivery.id}/tracking`)}
                    >
                      {language === 'ar' ? 'تتبع' : 'Track'}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                {language === 'ar' ? 'لا توجد تسليمات' : 'No deliveries'}
              </p>
            )}
          </Card>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              {language === 'ar' ? 'الإحصائيات' : 'Statistics'}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {language === 'ar' ? 'إجمالي التسليمات' : 'Total Deliveries'}
                </span>
                <span className="font-bold">{deliveries.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {language === 'ar' ? 'التقييم' : 'Rating'}
                </span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold">
                    {Number(driver.rating ?? 0).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              {language === 'ar' ? 'المحفظة' : 'Wallet'}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {language === 'ar' ? 'الرصيد' : 'Balance'}
                </span>
                <span className="font-bold text-lg text-green-600">
                  ${parseFloat(wallet?.balance || driver.user?.wallet_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {language === 'ar' ? 'إجمالي التسليمات' : 'Total Deliveries'}
                </span>
                <span className="font-bold">{wallet?.total_deliveries || deliveries.length}</span>
              </div>
              {wallet?.transactions && wallet.transactions.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-semibold mb-2">
                    {language === 'ar' ? 'آخر المعاملات' : 'Recent Transactions'}
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {wallet.transactions.slice(0, 5).map((transaction, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {transaction.type || transaction.description || '-'}
                        </span>
                        <span className={`font-medium ${
                          parseFloat(transaction.amount || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {parseFloat(transaction.amount || 0) >= 0 ? '+' : ''}
                          ${parseFloat(transaction.amount || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              {language === 'ar' ? 'معلومات إضافية' : 'Additional Info'}
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">
                  {language === 'ar' ? 'الحالة: ' : 'Status: '}
                </span>
                {getStatusBadge(driver.status)}
              </div>
              {driver.photo_url && (
                <div>
                  <img
                    src={driver.photo_url}
                    alt={driver.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
