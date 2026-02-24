import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import {
  Truck,
  Store,
  Stethoscope,
  Building2,
  Filter,
  X,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Locate,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ENTITY_CONFIG = {
  shop: {
    color: '#2563eb',
    icon: Store,
    labelAr: 'متاجر',
    labelEn: 'Shops',
  },
  doctor: {
    color: '#7c3aed',
    icon: Stethoscope,
    labelAr: 'أطباء',
    labelEn: 'Doctors',
  },
  driver: {
    color: '#d97706',
    icon: Truck,
    labelAr: 'سائقون',
    labelEn: 'Drivers',
  },
  medical_center: {
    color: '#0d9488',
    icon: Building2,
    labelAr: 'مراكز طبية',
    labelEn: 'Medical Centers',
  },
};

const DEFAULT_FILTERS = { shop: true, doctor: true, driver: true, medical_center: true };

export default function AdminMaps() {
  const { language } = useLanguage();
  const [map, setMap] = useState(null);
  const [entities, setEntities] = useState({ shops: [], doctors: [], drivers: [], medical_centers: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [center, setCenter] = useState({ lat: 30.0444, lng: 31.2357 });
  const [zoom, setZoom] = useState(12);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const mapInitializedRef = useRef(false);

  const isRTL = language === 'ar';
  const t = (key) => (key === 'title' ? (language === 'ar' ? 'الخرائط التفاعلية' : 'Interactive Maps') : key === 'subtitle' ? (language === 'ar' ? 'عرض المتاجر والأطباء والسائقين والمراكز الطبية على الخريطة' : 'View shops, doctors, drivers and medical centers on the map') : key);

  useEffect(() => {
    fetchEntities();
    ensureLeafletLoaded();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInitializedRef.current) return;
    if (typeof window === 'undefined' || !window.L) return;
    if (mapRef.current._leaflet_id) return;
    mapInitializedRef.current = true;
    const L = window.L;
    const leafletMap = L.map(mapRef.current).setView([center.lat, center.lng], zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(leafletMap);
    setMap(leafletMap);
    return () => {
      markersRef.current.forEach((m) => m.remove?.());
      markersRef.current = [];
      leafletMap.remove?.();
      mapInitializedRef.current = false;
    };
  }, [center.lat, center.lng, zoom]);

  useEffect(() => {
    if (map) updateMarkers();
  }, [entities, filters, map]);

  function ensureLeafletLoaded() {
    if (typeof window === 'undefined') return;
    if (window.L) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.onload = () => {
      if (mapRef.current && !mapInitializedRef.current && !mapRef.current._leaflet_id) {
        mapInitializedRef.current = true;
        const L = window.L;
        const leafletMap = L.map(mapRef.current).setView([center.lat, center.lng], zoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(leafletMap);
        setMap(leafletMap);
      }
    };
    document.head.appendChild(script);
  }

  async function fetchEntities() {
    setLoading(true);
    try {
      const res = await api.get('/admin/maps/entities');
      const data = res.data?.data ?? extractDataFromResponse(res) ?? {};
      setEntities({
        shops: data.shops ?? [],
        doctors: data.doctors ?? [],
        drivers: data.drivers ?? [],
        medical_centers: data.medical_centers ?? [],
      });
    } catch (e) {
      console.error('Failed to fetch map entities', e);
    } finally {
      setLoading(false);
    }
  }

  function updateMarkers() {
    if (!map || !window.L) return;
    const L = window.L;
    markersRef.current.forEach((m) => m.remove?.());
    markersRef.current = [];

    const addMarker = (item, type) => {
      const cfg = ENTITY_CONFIG[type];
      if (!cfg || !filters[type]) return;
      const lat = item.lat ?? item.latitude;
      const lng = item.lng ?? item.longitude;
      if (lat == null || lng == null) return;
      const marker = L.marker([Number(lat), Number(lng)], {
        icon: L.divIcon({
          className: 'map-entity-marker',
          html: `<div style="background:${cfg.color};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"><svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
      }).addTo(map);
      marker.on('click', () => setSelectedMarker({ ...item, entityType: type }));
      markersRef.current.push(marker);
    };

    (entities.shops || []).forEach((s) => addMarker(s, 'shop'));
    (entities.doctors || []).forEach((d) => addMarker(d, 'doctor'));
    (entities.drivers || []).forEach((d) => addMarker(d, 'driver'));
    (entities.medical_centers || []).forEach((m) => addMarker(m, 'medical_center'));
  }

  function toggleFilter(key) {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const totalCount =
    (entities.shops?.length || 0) +
    (entities.doctors?.length || 0) +
    (entities.drivers?.length || 0) +
    (entities.medical_centers?.length || 0);

  return (
    <div className="h-full flex flex-col gap-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setFiltersOpen(!filtersOpen)} className="gap-2">
            <Filter className="w-4 h-4" />
            {language === 'ar' ? 'الفلاتر' : 'Filters'}
            {filtersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchEntities} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {language === 'ar' ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* Sidebar: Filters + Legend */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.aside
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
              className="lg:w-72 shrink-0 flex flex-col gap-4"
            >
              <Card className="p-4">
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4" />
                  {language === 'ar' ? 'عرض على الخريطة' : 'Show on map'}
                </h3>
                <div className="space-y-2">
                  {Object.entries(ENTITY_CONFIG).map(([key, cfg]) => {
                    const count =
                      key === 'shop' ? entities.shops?.length
                      : key === 'doctor' ? entities.doctors?.length
                      : key === 'driver' ? entities.drivers?.length
                      : entities.medical_centers?.length;
                    const label = language === 'ar' ? cfg.labelAr : cfg.labelEn;
                    return (
                      <label
                        key={key}
                        className="flex items-center gap-3 cursor-pointer rounded-lg p-2 hover:bg-muted/50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={!!filters[key]}
                          onChange={() => toggleFilter(key)}
                          className="rounded border-input"
                        />
                        <div
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{ backgroundColor: cfg.color }}
                        />
                        <span className="flex-1 text-sm">{label}</span>
                        <span className="text-muted-foreground text-xs tabular-nums">{(count ?? 0)}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                  {language === 'ar' ? 'الإجمالي: ' : 'Total: '}
                  <strong>{totalCount}</strong>
                </p>
              </Card>
              <Card className="p-4">
                <h4 className="font-semibold text-sm mb-2">{language === 'ar' ? 'المفتاح' : 'Legend'}</h4>
                <div className="space-y-2 text-xs">
                  {Object.entries(ENTITY_CONFIG).map(([key, cfg]) => {
                    const label = language === 'ar' ? cfg.labelAr : cfg.labelEn;
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Map */}
        <Card className="flex-1 overflow-hidden relative min-h-[480px] lg:min-h-0">
          <div ref={mapRef} className="w-full h-full min-h-[480px]" />
          <div className={`absolute top-3 z-[1000] flex flex-col gap-1 ${isRTL ? 'right-3' : 'left-3'}`}>
            <Button
              variant="secondary"
              size="icon"
              className="h-9 w-9 bg-background/95 shadow"
              onClick={() => map?.setZoom(map.getZoom() + 1)}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-9 w-9 bg-background/95 shadow"
              onClick={() => map?.setZoom(map.getZoom() - 1)}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-9 w-9 bg-background/95 shadow"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => map?.setView([pos.coords.latitude, pos.coords.longitude], 14),
                    () => {}
                  );
                }
              }}
            >
              <Locate className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Selected marker popup */}
      <AnimatePresence>
        {selectedMarker && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className={`fixed z-[1001] w-full max-w-sm bg-card border rounded-xl shadow-xl p-4 ${isRTL ? 'left-4' : 'right-4'} bottom-4`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: ENTITY_CONFIG[selectedMarker.entityType]?.color ?? '#666' }}
                  />
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    {ENTITY_CONFIG[selectedMarker.entityType]
                      ? language === 'ar'
                        ? ENTITY_CONFIG[selectedMarker.entityType].labelAr
                        : ENTITY_CONFIG[selectedMarker.entityType].labelEn
                      : selectedMarker.entityType}
                  </span>
                </div>
                <h3 className="font-semibold mt-1 truncate">{selectedMarker.name}</h3>
                {(selectedMarker.address || selectedMarker.specialty) && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {selectedMarker.specialty && <span className="text-primary">{selectedMarker.specialty}</span>}
                    {selectedMarker.specialty && selectedMarker.address && ' · '}
                    {selectedMarker.address}
                  </p>
                )}
                {selectedMarker.phone && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedMarker.phone}</p>
                )}
                {selectedMarker.entityType === 'driver' && selectedMarker.status && (
                  <p className="text-sm mt-1">
                    <span className={selectedMarker.status === 'available' ? 'text-green-600' : 'text-amber-600'}>
                      {selectedMarker.status}
                    </span>
                  </p>
                )}
              </div>
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setSelectedMarker(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
