import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendors } from '@/components/VendorProvider';
import {
  Store,
  Pill,
  Building2,
  Stethoscope,
  Truck,
  Eye,
  Edit,
  Layers,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminVendors() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { vendors, loading, refreshVendors } = useVendors();
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    refreshVendors();
  }, []);

  const vendorTypes = [
    {
      id: 'all',
      label: language === 'ar' ? 'الكل' : 'All',
      icon: Layers,
      count: vendors.shops.length + vendors.doctors.length + vendors.drivers.length,
      color: 'text-gray-500',
      bgColor: 'bg-gray-500/10',
    },
    {
      id: 'shops',
      label: language === 'ar' ? 'المتاجر' : 'Shops',
      icon: Store,
      count: vendors.shops.length,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
    {
      id: 'pharmacies',
      label: language === 'ar' ? 'الصيدليات' : 'Pharmacies',
      icon: Pill,
      count: vendors.pharmacies.length,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      id: 'companies',
      label: language === 'ar' ? 'الشركات' : 'Companies',
      icon: Building2,
      count: vendors.companies.length,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      id: 'doctors',
      label: language === 'ar' ? 'الأطباء' : 'Doctors',
      icon: Stethoscope,
      count: vendors.doctors.length,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
    {
      id: 'drivers',
      label: language === 'ar' ? 'السائقين' : 'Drivers',
      icon: Truck,
      count: vendors.drivers.length,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  const getVendorsForTab = () => {
    switch (activeTab) {
      case 'shops':
        return vendors.shops;
      case 'pharmacies':
        return vendors.pharmacies;
      case 'companies':
        return vendors.companies;
      case 'doctors':
        return vendors.doctors;
      case 'drivers':
        return vendors.drivers;
      default:
        return {
          shops: vendors.shops,
          pharmacies: vendors.pharmacies,
          companies: vendors.companies,
          doctors: vendors.doctors,
          drivers: vendors.drivers,
        };
    }
  };

  const handleView = (vendor, type) => {
    if (type === 'doctor') {
      navigate(`/admin/doctors/${vendor.id}`);
    } else if (type === 'driver') {
      navigate(`/admin/drivers/${vendor.id}`);
    } else {
      navigate(`/admin/shops/${vendor.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {language === 'ar' ? 'إدارة البائعين' : 'Vendors Management'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === 'ar' 
              ? 'إدارة جميع أنواع البائعين في النظام' 
              : 'Manage all types of vendors in the system'}
          </p>
        </div>
        <Button
          onClick={() => navigate('/admin/maps')}
          variant="outline"
          className="gap-2"
        >
          <Layers className="w-4 h-4" />
          {language === 'ar' ? 'عرض على الخريطة' : 'View on Map'}
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {vendorTypes.map((type) => {
          const Icon = type.icon;
          return (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: vendorTypes.indexOf(type) * 0.05 }}
            >
              <Card
                className={`p-4 cursor-pointer hover:shadow-lg transition-all ${
                  activeTab === type.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setActiveTab(type.id)}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${type.bgColor}`}>
                    <Icon className={`w-5 h-5 ${type.color}`} />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{type.count}</p>
                    <p className="text-xs text-muted-foreground">{type.label}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Vendors List */}
      <Card className="p-6">
        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 mb-6 border-b pb-4">
          {vendorTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Button
                key={type.id}
                variant={activeTab === type.id ? 'default' : 'outline'}
                onClick={() => setActiveTab(type.id)}
                className="gap-2"
              >
                <Icon className="w-4 h-4" />
                {type.label} ({type.count})
              </Button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'all' ? (
            <div className="space-y-6">
              {Object.entries(getVendorsForTab()).map(([key, vendorList]) => {
                if (!vendorList || vendorList.length === 0) return null;
                const vendorType = vendorTypes.find(v => v.id === key);
                if (!vendorType) return null;
                const VendorIcon = vendorType.icon;

                return (
                  <div key={key}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <VendorIcon className={`w-5 h-5 ${vendorType.color}`} />
                      {vendorType.label} ({vendorList.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {vendorList.map((vendor) => (
                        <Card
                          key={vendor.id}
                          className="p-4 hover:shadow-lg transition-all cursor-pointer"
                          onClick={() => handleView(vendor, key)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">{vendor.name}</h4>
                              {vendor.phone && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {vendor.phone}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleView(vendor, key);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getVendorsForTab().length > 0 ? (
                getVendorsForTab().map((vendor) => (
                  <Card
                    key={vendor.id}
                    className="p-4 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => handleView(vendor, activeTab)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{vendor.name}</h4>
                        {vendor.phone && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {vendor.phone}
                          </p>
                        )}
                        {vendor.location && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {vendor.location}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(vendor, activeTab);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  {language === 'ar' ? 'لا توجد بيانات' : 'No data available'}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
