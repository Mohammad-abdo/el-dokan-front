import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Pusher from 'pusher-js';
import api from '@/lib/api';
import {
  ArrowLeft,
  MapPin,
  Package,
  Truck,
  User,
  Phone,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Navigation,
  Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const DEFAULT_CENTER = [30.0444, 31.2357];
const DEFAULT_ZOOM = 11;
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';

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

function parseLatLng(val) {
  if (val == null) return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function parseCoordsFromString(str) {
  if (!str || typeof str !== 'string') return [null, null];
  const parts = str.split(',').map((p) => parseFloat(String(p).trim()));
  if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) return [parts[0], parts[1]];
  return [null, null];
}

export default function AdminDeliveryTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [driverLiveLocation, setDriverLiveLocation] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const leafletReady = useLeafletReady();

  const fetchDelivery = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/admin/deliveries/${id}`);
      const data = res.data?.data ?? res.data;
      setDelivery(data);
      setDriverLiveLocation(null);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || 'Failed to load delivery');
      setDelivery(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDelivery();
  }, [fetchDelivery]);

  // WebSocket (Pusher) للتتبع المباشر
  useEffect(() => {
    const key = import.meta.env.VITE_PUSHER_APP_KEY;
    const host = import.meta.env.VITE_PUSHER_HOST || '127.0.0.1';
    const port = import.meta.env.VITE_PUSHER_PORT || '8080';
    const scheme = import.meta.env.VITE_PUSHER_SCHEME || 'http';
    const useTLS = scheme === 'https';
    if (!key || !id) return;

    const pusher = new Pusher(key, {
      wsHost: host,
      wsPort: Number(port),
      wssPort: Number(port),
      forceTLS: useTLS,
      enabledTransports: ['ws', 'wss'],
      disableStats: true,
      cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
    });

    const channel = pusher.subscribe(`delivery.${id}`);
    channel.bind('DriverLocationUpdated', (data) => {
      if (data?.latitude != null && data?.longitude != null) {
        setDriverLiveLocation({ lat: data.latitude, lng: data.longitude });
        setDelivery((prev) =>
          prev && prev.driver
            ? {
                ...prev,
                driver: {
                  ...prev.driver,
                  current_location_lat: data.latitude,
                  current_location_lng: data.longitude,
                },
              }
            : prev
        );
        if (driverMarkerRef.current && window.L) {
          driverMarkerRef.current.setLatLng([data.latitude, data.longitude]);
        }
      }
    });
    channel.bind('DeliveryStatusUpdated', (data) => {
      if (data?.status) {
        setDelivery((prev) => (prev ? { ...prev, status: data.status } : null));
      }
    });

    pusher.connection.bind('connected', () => setWsConnected(true));
    pusher.connection.bind('disconnected', () => setWsConnected(false));

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`delivery.${id}`);
      pusher.disconnect();
    };
  }, [id]);

  useEffect(() => {
    if (!delivery || !leafletReady || !mapRef.current) return;

    const L = window.L;
    const [storeLat, storeLng] =
      delivery.store_latitude != null && delivery.store_longitude != null
        ? [parseLatLng(delivery.store_latitude), parseLatLng(delivery.store_longitude)]
        : parseCoordsFromString(delivery.store_address);
    const deliveryLat = parseLatLng(delivery.delivery_latitude) ?? parseLatLng(delivery.customer_address?.latitude);
    const deliveryLng = parseLatLng(delivery.delivery_longitude) ?? parseLatLng(delivery.customer_address?.longitude);
    const [deliveryLat2, deliveryLng2] = parseCoordsFromString(delivery.delivery_address);
    const endLat = deliveryLat ?? deliveryLat2;
    const endLng = deliveryLng ?? deliveryLng2;

    const hasStart = storeLat != null && storeLng != null;
    const hasEnd = endLat != null && endLng != null;
    // عند توفر عنوان التسليم فقط: نستخدم نقطة استلام تقديرية (~2 كم شمالاً) لرسم مسار على الخريطة
    const estimatedStart = hasEnd ? [endLat + 0.018, endLng] : null;
    const start = hasStart ? [storeLat, storeLng] : (estimatedStart || (hasEnd ? [endLat, endLng] : DEFAULT_CENTER));
    const end = hasEnd ? [endLat, endLng] : start;
    const useEstimatedStart = hasEnd && !hasStart && estimatedStart;

    const driver = delivery.driver;
    const live = driverLiveLocation || (driver && { lat: parseLatLng(driver.current_location_lat), lng: parseLatLng(driver.current_location_lng) });
    const driverLat = live?.lat != null ? live.lat : parseLatLng(driver?.current_location_lat);
    const driverLng = live?.lng != null ? live.lng : parseLatLng(driver?.current_location_lng);
    const hasDriver = driverLat != null && driverLng != null;

    let routeCoords = [];
    if (hasEnd && (hasStart || useEstimatedStart)) {
      routeCoords = [start, end];
    }

    const timer = setTimeout(() => {
      if (!mapRef.current) return;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (_) {}
        mapInstanceRef.current = null;
      }
      driverMarkerRef.current = null;

      const centerLat = (start[0] + end[0]) / 2;
      const centerLng = (start[1] + end[1]) / 2;
      const map = L.map(mapRef.current).setView([centerLat, centerLng], DEFAULT_ZOOM);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      const bounds = [];

      if (hasStart || useEstimatedStart) {
        const m = L.marker(start, {
          icon: L.divIcon({
            className: 'custom-marker',
            html: '<div style="background:#2563eb;color:#fff;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);">A</div>',
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          }),
        }).addTo(map);
        m.bindPopup(useEstimatedStart ? 'نقطة الاستلام (تقديرية - أضف إحداثيات المتجر للدقة)' : 'نقطة الاستلام (المتجر)');
        bounds.push(start);
      }

      if (hasEnd) {
        const m = L.marker(end, {
          icon: L.divIcon({
            className: 'custom-marker',
            html: '<div style="background:#059669;color:#fff;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);">B</div>',
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          }),
        }).addTo(map);
        m.bindPopup('عنوان التسليم (العميل)');
        bounds.push(end);
      }

      if (routeCoords.length >= 2) {
        const targetMap = map;
        if (!useEstimatedStart) {
          fetch(
            `${OSRM_URL}/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
          )
            .then((r) => r.json())
            .then((json) => {
              if (mapInstanceRef.current !== targetMap) return;
              if (json.code === 'Ok' && json.routes?.[0]?.geometry?.coordinates?.length) {
                const coords = json.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
                L.polyline(coords, { color: '#2563eb', weight: 5, opacity: 0.85 }).addTo(targetMap);
              } else {
                L.polyline(routeCoords, { color: '#2563eb', weight: 5, opacity: 0.85 }).addTo(targetMap);
              }
            })
            .catch(() => {
              if (mapInstanceRef.current === targetMap) L.polyline(routeCoords, { color: '#2563eb', weight: 5, opacity: 0.85 }).addTo(targetMap);
            });
        } else {
          L.polyline(routeCoords, { color: '#2563eb', weight: 5, opacity: 0.85, dashArray: '10, 10' }).addTo(map);
        }
      }

      if (hasDriver) {
        const m = L.marker([driverLat, driverLng], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: '<div style="background:#d97706;color:#fff;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🚗</div>',
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          }),
        }).addTo(map);
        m.bindPopup('موقع السائق الحالي');
        driverMarkerRef.current = m;
        bounds.push([driverLat, driverLng]);
      }

      if (bounds.length > 1) {
        try {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        } catch (_) {}
      }

      mapInstanceRef.current = map;
    }, 200);

    return () => {
      clearTimeout(timer);
      try {
        if (mapInstanceRef.current) mapInstanceRef.current.remove();
      } catch (_) {}
      mapInstanceRef.current = null;
      driverMarkerRef.current = null;
    };
  }, [delivery, leafletReady, driverLiveLocation]);

  const getStatusBadge = (status) => {
    const list = {
      pending: { label: 'قيد الانتظار', className: 'bg-amber-100 text-amber-800', Icon: Clock },
      assigned: { label: 'مُعين', className: 'bg-blue-100 text-blue-800', Icon: AlertCircle },
      picked_up: { label: 'تم الاستلام', className: 'bg-violet-100 text-violet-800', Icon: Package },
      in_transit: { label: 'قيد النقل', className: 'bg-orange-100 text-orange-800', Icon: Truck },
      delivered: { label: 'تم التسليم', className: 'bg-emerald-100 text-emerald-800', Icon: CheckCircle2 },
      failed: { label: 'فشل', className: 'bg-red-100 text-red-800', Icon: XCircle },
    };
    const c = list[status] || list.pending;
    const Icon = c.Icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${c.className}`}>
        <Icon className="w-4 h-4" />
        {c.label}
      </span>
    );
  };

  const formatCoord = (lat, lng) => {
    if (lat == null || lng == null) return '—';
    return `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`;
  };

  if (loading && !delivery) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent" />
        <p className="text-muted-foreground">جاري تحميل التتبع...</p>
      </div>
    );
  }

  if (error || !delivery) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-destructive">{error || 'التسليم غير موجود'}</p>
        <Button onClick={() => navigate('/admin/deliveries')} variant="outline" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          العودة للتوصيلات
        </Button>
      </div>
    );
  }

  const customer = delivery.customer || delivery.order?.user;
  const addr = delivery.customer_address || delivery.order?.delivery_address || delivery.order?.deliveryAddress;
  const driver = delivery.driver;
  const liveLoc = driverLiveLocation || (driver && { lat: driver.current_location_lat, lng: driver.current_location_lng });
  const deliveryAddressText =
    delivery.delivery_address_text ||
    addr?.address ||
    delivery.delivery_address ||
    (addr && [addr.detailed_address, addr.district, addr.city].filter(Boolean).join(', ')) ||
    '—';
  const storeAddressText = delivery.store_address_text || delivery.store_address || '—';

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/deliveries')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">تتبع التسليم</h1>
            <p className="text-muted-foreground text-sm">طلب #{delivery.order_number || delivery.order_id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {wsConnected && (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
              <Radio className="w-3.5 h-3.5" />
              تتبع مباشر
            </span>
          )}
          {getStatusBadge(delivery.status)}
          <Button variant="outline" size="sm" onClick={() => fetchDelivery(true)} disabled={refreshing} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/40 flex flex-wrap items-center gap-2">
          <Navigation className="w-5 h-5 text-primary shrink-0" />
          <span className="font-semibold">الخريطة — مسار التوصيل من الاستلام إلى عنوان العميل</span>
          {!(delivery.store_latitude != null && delivery.store_longitude != null) && (delivery.delivery_latitude != null || delivery.customer_address?.latitude) && (
            <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded">نقطة الاستلام تقديرية — أضف إحداثيات المتجر من إدارة المتاجر للدقة</span>
          )}
        </div>
        <div className="relative w-full h-[420px] bg-muted/30">
          <div ref={mapRef} className="absolute inset-0 w-full h-full" />
          {!leafletReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-10">
              <p className="text-muted-foreground">جاري تحميل الخريطة...</p>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold">العميل وعنوان التسليم</h3>
          </div>
          <div className="space-y-2 text-sm">
            {customer && (
              <>
                <p className="font-medium">{customer.name || customer.email || '—'}</p>
                {(customer.phone || customer.email) && (
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {customer.phone || customer.email}
                  </p>
                )}
              </>
            )}
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">عنوان التسليم</p>
              <p className="font-medium">{deliveryAddressText}</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                إحداثيات: {formatCoord(delivery.delivery_latitude ?? addr?.latitude, delivery.delivery_longitude ?? addr?.longitude)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold">نقطة الاستلام (المتجر)</h3>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">{storeAddressText}</p>
            <p className="text-xs text-muted-foreground font-mono">
              إحداثيات: {formatCoord(delivery.store_latitude, delivery.store_longitude)}
            </p>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Truck className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-semibold">السائق</h3>
          </div>
          {driver ? (
            <div className="space-y-2 text-sm">
              <p className="font-medium">{driver.name || '—'}</p>
              {driver.phone && (
                <p className="text-muted-foreground flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {driver.phone}
                </p>
              )}
              <p className="text-muted-foreground">التقييم: {Number(driver.rating ?? 0).toFixed(1)} ⭐</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                الموقع الحالي: {liveLoc?.lat != null && liveLoc?.lng != null ? formatCoord(liveLoc.lat, liveLoc.lng) : 'غير متوفر — سيظهر عند إرسال التطبيق موقع السائق'}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">لم يُعيَّن سائق بعد</p>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">معلومات التوصيل</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">الحالة</p>
              {getStatusBadge(delivery.status)}
            </div>
            {delivery.estimated_arrival_minutes != null && (
              <p className="text-muted-foreground">
                الوقت المتوقع: <span className="font-medium text-foreground">{delivery.estimated_arrival_minutes} دقيقة</span>
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
