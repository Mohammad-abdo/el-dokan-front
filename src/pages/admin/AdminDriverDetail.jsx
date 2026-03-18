import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  Target,
  User,
  Calendar,
  Store,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

const deliveryStatusLabels = {
  pending: { ar: 'قيد الانتظار', en: 'Pending', className: 'bg-gray-100 text-gray-800' },
  assigned: { ar: 'معيّن', en: 'Assigned', className: 'bg-blue-100 text-blue-800' },
  picked_up: { ar: 'تم الاستلام', en: 'Picked Up', className: 'bg-amber-100 text-amber-800' },
  in_transit: { ar: 'في الطريق', en: 'In Transit', className: 'bg-purple-100 text-purple-800' },
  delivered: { ar: 'تم التسليم', en: 'Delivered', className: 'bg-green-100 text-green-800' },
  failed: { ar: 'فاشل', en: 'Failed', className: 'bg-red-100 text-red-800' },
};

const DEFAULT_CENTER = [30.0444, 31.2357];
const DEFAULT_ZOOM = 12;

function useLeafletReady() {
  const [ready, setReady] = useState(() => typeof window !== 'undefined' && !!window.L);
  useEffect(() => {
    if (ready) return;
    let t = 0;
    const id = setInterval(() => {
      if (typeof window !== 'undefined' && window.L) {
        setReady(true);
        clearInterval(id);
      }
      t += 200;
      if (t > 5000) clearInterval(id);
    }, 200);
    return () => clearInterval(id);
  }, [ready]);
  return ready;
}

export default function AdminDriverDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [driver, setDriver] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const leafletReady = useLeafletReady();

  useEffect(() => {
    if (!id) return;
    fetchDriver();
    fetchWallet();
  }, [id]);

  // رسم الخريطة ومسار التتبع (يجب أن يكون الـ hook قبل أي return شرطي)
  useEffect(() => {
    if (activeTab !== 'map' || !leafletReady || !driver) return;
    const L = window.L;
    if (!L) return;

    const hasLocation = driver.current_location_lat && driver.current_location_lng;
    const lat = parseFloat(driver.current_location_lat);
    const lng = parseFloat(driver.current_location_lng);
    const routeForMap = driver.route_for_map || null;

    const initMap = () => {
      if (!mapRef.current) return;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (_) {}
        mapInstanceRef.current = null;
      }

      const driverLat = hasLocation ? lat : null;
      const driverLng = hasLocation ? lng : null;
      const storeLat = routeForMap?.store_lat;
      const storeLng = routeForMap?.store_lng;
      const delLat = routeForMap?.delivery_lat;
      const delLng = routeForMap?.delivery_lng;

      const points = [];
      if (driverLat != null && driverLng != null) points.push([driverLat, driverLng]);
      if (storeLat != null && storeLng != null) points.push([storeLat, storeLng]);
      if (delLat != null && delLng != null) points.push([delLat, delLng]);

      const center = points.length
        ? [points.reduce((s, p) => s + p[0], 0) / points.length, points.reduce((s, p) => s + p[1], 0) / points.length]
        : DEFAULT_CENTER;

      const map = L.map(mapRef.current).setView(center, DEFAULT_ZOOM);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);
      mapInstanceRef.current = map;

      if (storeLat != null && storeLng != null) {
        L.marker([storeLat, storeLng], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: '<div style="background:#2563eb;color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;border:2px solid #fff;">A</div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          }),
        }).addTo(map).bindPopup(language === 'ar' ? 'المتجر' : 'Store');
      }
      if (delLat != null && delLng != null) {
        L.marker([delLat, delLng], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: '<div style="background:#059669;color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;border:2px solid #fff;">B</div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          }),
        }).addTo(map).bindPopup(language === 'ar' ? 'عنوان التسليم' : 'Delivery address');
      }
      if (driverLat != null && driverLng != null) {
        L.marker([driverLat, driverLng], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: '<div style="background:#d97706;color:#fff;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 18.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-6a.5.5 0 0 1 .5-.5H12v-2H6.5a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5v12z"/></svg></div>',
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          }),
        }).addTo(map).bindPopup(language === 'ar' ? 'السائق' : 'Driver');
      }
      if (storeLat != null && storeLng != null && delLat != null && delLng != null) {
        L.polyline([[storeLat, storeLng], [delLat, delLng]], { color: '#2563eb', weight: 5, opacity: 0.85 }).addTo(map);
      }
    };

    // تأخير بسيط لضمان أن عنصر الخريطة مُصّرح في الـ DOM (مهم عند فتح التبويب)
    const t = setTimeout(initMap, 50);

    return () => {
      clearTimeout(t);
      try {
        if (mapInstanceRef.current) mapInstanceRef.current.remove();
      } catch (_) {}
      mapInstanceRef.current = null;
    };
  }, [activeTab, leafletReady, driver, language]);

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

  const fetchWallet = async () => {
    try {
      const response = await api.get('/admin/financial/vendor-wallet', {
        params: { type: 'driver', id },
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-12 w-48" />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
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

  const stats = driver.stats || {};
  const deliveries = driver.deliveries || [];
  const deliveredList = deliveries.filter((d) => d.status === 'delivered');
  const isRTL = language === 'ar';
  const balance = wallet?.balance ?? stats.wallet_balance ?? driver.user?.wallet_balance ?? 0;

  const summaryCards = [
    {
      title: language === 'ar' ? 'إجمالي التسليمات' : 'Total Deliveries',
      value: stats.total_deliveries ?? deliveries.length,
      icon: Package,
      className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      title: language === 'ar' ? 'تم تسليمها' : 'Delivered',
      value: stats.delivered_count ?? deliveredList.length,
      icon: CheckCircle2,
      className: 'bg-green-500/10 text-green-600 dark:text-green-400',
    },
    {
      title: language === 'ar' ? 'قيد التنفيذ' : 'In Progress',
      value: stats.in_progress_count ?? deliveries.filter((d) => ['assigned', 'picked_up', 'in_transit'].includes(d.status)).length,
      icon: Clock,
      className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    {
      title: language === 'ar' ? 'الباقي (المحفظة)' : 'Balance (Wallet)',
      value: parseFloat(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      suffix: language === 'ar' ? ' ج.م' : ' EGP',
      icon: Wallet,
      className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
  ];

  const hasLocation = driver.current_location_lat && driver.current_location_lng;
  const lat = parseFloat(driver.current_location_lat);
  const lng = parseFloat(driver.current_location_lng);
  const routeForMap = driver.route_for_map || null;
  const relatedShops = driver.related_shops || [];

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}
      >
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/drivers')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            {language === 'ar' ? 'العودة' : 'Back'}
          </Button>
          <div className={isRTL ? 'text-right' : ''}>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{driver.name}</h1>
            <p className="text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
              {driver.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {driver.phone}
                </span>
              )}
              {hasLocation && (
                <span className="flex items-center gap-1 text-green-600">
                  <MapPin className="w-3.5 h-3.5" />
                  {language === 'ar' ? 'على الخريطة' : 'On map'}
                </span>
              )}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate(`/admin/drivers/${id}/edit`)} variant="outline" size="sm" className="gap-2">
          <Edit className="w-4 h-4" />
          {language === 'ar' ? 'تعديل' : 'Edit'}
        </Button>
      </motion.div>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card, i) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="overflow-hidden">
              <CardContent className="p-4 flex items-center justify-between">
                <div className={isRTL ? 'text-right' : ''}>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">
                    {card.value}
                    {card.suffix && <span className="text-base font-normal text-muted-foreground">{card.suffix}</span>}
                  </p>
                </div>
                <div className={`rounded-full p-3 ${card.className}`}>
                  <card.icon className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="gap-2 rounded-lg">
            <TrendingUp className="w-4 h-4" />
            {language === 'ar' ? 'نظرة عامة' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger value="info" className="gap-2 rounded-lg">
            <User className="w-4 h-4" />
            {language === 'ar' ? 'معلومات السائق' : 'Driver Info'}
          </TabsTrigger>
          <TabsTrigger value="map" className="gap-2 rounded-lg">
            <Navigation className="w-4 h-4" />
            {language === 'ar' ? 'تتبع على الخريطة' : 'Map Tracking'}
          </TabsTrigger>
          <TabsTrigger value="deliveries" className="gap-2 rounded-lg">
            <Package className="w-4 h-4" />
            {language === 'ar' ? 'الطلبات المُسلّمة' : 'Deliveries'}
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">{deliveries.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="gap-2 rounded-lg">
            <Target className="w-4 h-4" />
            {language === 'ar' ? 'ما حققه' : 'Achievements'}
          </TabsTrigger>
          <TabsTrigger value="wallet" className="gap-2 rounded-lg">
            <Wallet className="w-4 h-4" />
            {language === 'ar' ? 'المحفظة' : 'Wallet'}
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{language === 'ar' ? 'معلومات سريعة' : 'Quick Info'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{language === 'ar' ? 'الحالة' : 'Status'}</span>
                  {getStatusBadge(driver.status)}
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{language === 'ar' ? 'التقييم' : 'Rating'}</span>
                  <span className="flex items-center gap-1 font-medium">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    {Number(driver.rating ?? 0).toFixed(1)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{language === 'ar' ? 'آخر تسليم' : 'Last Delivery'}</span>
                  <span className="font-medium">
                    {deliveredList.length && deliveredList[0].updated_at
                      ? format(new Date(deliveredList[0].updated_at), 'yyyy-MM-dd HH:mm')
                      : '—'}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{language === 'ar' ? 'آخر المعاملات' : 'Recent Wallet Transactions'}</CardTitle>
              </CardHeader>
              <CardContent>
                {wallet?.transactions?.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {wallet.transactions.slice(0, 5).map((tx, idx) => (
                      <div key={idx} className={`flex justify-between items-center text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className="text-muted-foreground truncate max-w-[60%]">{tx.type || tx.description || '—'}</span>
                        <span className={Number(tx.amount || 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {Number(tx.amount || 0) >= 0 ? '+' : ''}
                          {Number(tx.amount || 0).toFixed(2)} {language === 'ar' ? 'ج.م' : 'EGP'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">{language === 'ar' ? 'لا توجد معاملات' : 'No transactions'}</p>
                )}
              </CardContent>
            </Card>
          </div>
          {relatedShops.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {language === 'ar' ? 'مقدمو الخدمة المرتبطون' : 'Related Service Providers'}
                </CardTitle>
                <CardDescription>
                  {language === 'ar' ? 'متاجر/شركات قام السائق بتوصيل طلباتها' : 'Shops/companies this driver has delivered for'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {relatedShops.map((shop) => (
                    <Button
                      key={shop.id}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => navigate(`/admin/shops/${shop.id}`)}
                    >
                      <Store className="w-4 h-4" />
                      {language === 'ar' ? (shop.name_ar || shop.name) : (shop.name_en || shop.name)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Info */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'معلومات السائق' : 'Driver Information'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'جميع البيانات المسجلة للسائق' : 'All registered data for this driver'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {language === 'ar' ? 'الاسم' : 'Name'}
                  </p>
                  <p className="font-medium">{driver.name || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {language === 'ar' ? 'الهاتف' : 'Phone'}
                  </p>
                  <p className="font-medium">{driver.phone || driver.user?.phone || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {language === 'ar' ? 'البريد' : 'Email'}
                  </p>
                  <p className="font-medium">{driver.user?.email || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    {language === 'ar' ? 'التقييم' : 'Rating'}
                  </p>
                  <p className="font-medium">{Number(driver.rating ?? 0).toFixed(1)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الحالة' : 'Status'}</p>
                  {getStatusBadge(driver.status)}
                </div>
                {driver.photo_url && (
                  <div className="sm:col-span-2">
                    <p className="text-sm text-muted-foreground mb-2">{language === 'ar' ? 'الصورة' : 'Photo'}</p>
                    <img src={driver.photo_url} alt={driver.name} className="w-32 h-32 object-cover rounded-lg border" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Map + مسار التتبع */}
        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                {language === 'ar' ? 'تتبع السائق ومسار التوصيل على الخريطة' : 'Driver Tracking & Route on Map'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'الموقع الحالي للسائق ومسار التسليم (المتجر → عنوان التسليم)' : 'Driver location and delivery route (store → delivery address)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasLocation && (
                <p className="text-sm text-muted-foreground mb-2">
                  {language === 'ar' ? 'موقع السائق' : 'Driver'}: {lat.toFixed(5)}, {lng.toFixed(5)}
                </p>
              )}
              {!leafletReady && (
                <p className="text-sm text-muted-foreground py-4">{language === 'ar' ? 'جاري تحميل الخريطة...' : 'Loading map...'}</p>
              )}
              <div ref={mapRef} className="h-96 rounded-lg overflow-hidden border bg-muted" style={{ minHeight: 384 }} />
              {!(hasLocation || routeForMap) && (
                <p className="text-muted-foreground text-sm mt-2 text-center">
                  {language === 'ar' ? 'لا يتوفر موقع للسائق أو مسار تسليم لعرضه بعد.' : 'No driver location or delivery route to display yet.'}
                </p>
              )}
              <div className="flex gap-2 mt-2 flex-wrap">
                {routeForMap?.delivery_id && (
                  <Button variant="outline" size="sm" onClick={() => navigate(`/admin/deliveries/${routeForMap.delivery_id}/tracking`)}>
                    {language === 'ar' ? 'تتبع التفصيلي للتسليم' : 'Full delivery tracking'}
                  </Button>
                )}
                {hasLocation && (
                  <a
                    href={`https://www.google.com/maps?q=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 h-9 rounded-md px-3 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                  >
                    {language === 'ar' ? 'فتح في Google Maps' : 'Open in Google Maps'}
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          {/* مقدمو الخدمة المرتبطون بالسائق */}
          {relatedShops.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {language === 'ar' ? 'مقدمو الخدمة المرتبطون (متاجر/شركات تم توصيل طلباتها)' : 'Related Service Providers (shops/companies delivered)'}
                </CardTitle>
                <CardDescription>
                  {language === 'ar' ? 'الأطباء، الشركات، المتاجر، مندوبين التوصيل مرتبطين بالسائق عبر الطلبات المُسلّمة' : 'Doctors, companies, shops linked to this driver through deliveries'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {relatedShops.map((shop) => (
                    <div
                      key={shop.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border bg-card ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                      <div className="rounded-full p-2 bg-primary/10">
                        <Store className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{language === 'ar' ? (shop.name_ar || shop.name) : (shop.name_en || shop.name)}</p>
                        {shop.address && <p className="text-sm text-muted-foreground truncate">{shop.address}</p>}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/shops/${shop.id}`)}>
                        {language === 'ar' ? 'عرض' : 'View'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Deliveries */}
        <TabsContent value="deliveries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'الطلبات التي تم إيصالها / التسليمات' : 'Deliveries & Orders'}</CardTitle>
              <CardDescription>
                {language === 'ar' ? 'آخر الطلبات المُسلّمة والتسليمات المرتبطة بهذا السائق' : 'Latest deliveries and orders linked to this driver'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deliveries.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  {language === 'ar' ? 'لا توجد تسليمات مسجلة' : 'No deliveries recorded'}
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === 'ar' ? 'رقم الطلب' : 'Order #'}</TableHead>
                        <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                        <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                        <TableHead>{language === 'ar' ? 'المبلغ / العرض' : 'Amount / Offer'}</TableHead>
                        <TableHead>{language === 'ar' ? 'إجراء' : 'Action'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deliveries.map((d) => {
                        const order = d.order || {};
                        const statusInfo = deliveryStatusLabels[d.status] || deliveryStatusLabels.pending;
                        return (
                          <TableRow key={d.id}>
                            <TableCell className="font-mono">{order.order_number || `#${d.order_id}`}</TableCell>
                            <TableCell>{d.created_at ? format(new Date(d.created_at), 'yyyy-MM-dd HH:mm') : '—'}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={statusInfo.className}>
                                {language === 'ar' ? statusInfo.ar : statusInfo.en}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {d.driver_offer != null && Number(d.driver_offer) > 0
                                ? `${Number(d.driver_offer).toFixed(2)} ${language === 'ar' ? 'ج.م' : 'EGP'}`
                                : order.total_amount != null
                                  ? `${Number(order.total_amount).toFixed(2)} ${language === 'ar' ? 'ج.م' : 'EGP'}`
                                  : '—'}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/admin/deliveries/${d.id}/tracking`)}
                              >
                                {language === 'ar' ? 'تتبع' : 'Track'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements */}
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                {language === 'ar' ? 'ما حققه السائق' : 'Driver Achievements'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'إحصائيات الأداء والأرباح' : 'Performance and earnings summary'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">{language === 'ar' ? 'إجمالي التسليمات المكتملة' : 'Total Completed Deliveries'}</span>
                  <span className="text-2xl font-bold">{stats.delivered_count ?? deliveredList.length}</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">{language === 'ar' ? 'إجمالي الأرباح من التسليم' : 'Total Earnings from Deliveries'}</span>
                  <span className="text-2xl font-bold text-green-600">
                    {(stats.total_earnings ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} {language === 'ar' ? 'ج.م' : 'EGP'}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{language === 'ar' ? 'التقييم' : 'Rating'}</span>
                <span className="flex items-center gap-1 text-xl font-bold">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  {Number(driver.rating ?? 0).toFixed(1)}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wallet */}
        <TabsContent value="wallet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                {language === 'ar' ? 'المحفظة (الباقي)' : 'Wallet (Balance)'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'الرصيد الحالي ومعاملات المحفظة' : 'Current balance and wallet transactions'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-muted-foreground font-medium">{language === 'ar' ? 'الرصيد الحالي (الباقي)' : 'Current Balance (Remaining)'}</span>
                <span className="text-2xl font-bold text-emerald-600">
                  {parseFloat(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {language === 'ar' ? 'ج.م' : 'EGP'}
                </span>
              </div>
              <div>
                <p className="font-medium mb-2">{language === 'ar' ? 'آخر المعاملات' : 'Recent Transactions'}</p>
                {wallet?.transactions?.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {wallet.transactions.map((tx, idx) => (
                      <div
                        key={idx}
                        className={`flex justify-between items-center py-2 border-b last:border-0 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}
                      >
                        <span className="text-muted-foreground">{tx.type || tx.description || '—'}</span>
                        <span className={Number(tx.amount || 0) >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {Number(tx.amount || 0) >= 0 ? '+' : ''}
                          {Number(tx.amount || 0).toFixed(2)} {language === 'ar' ? 'ج.م' : 'EGP'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm py-4">{language === 'ar' ? 'لا توجد معاملات' : 'No transactions'}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
