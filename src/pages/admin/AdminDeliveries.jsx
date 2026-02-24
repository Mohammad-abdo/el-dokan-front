import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RefreshCw, MapPin, UserPlus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DataTable } from '@/components/DataTable';
import { format } from 'date-fns';
import showToast from '@/lib/toast';

const statusLabels = {
  pending: { en: 'Pending', ar: 'قيد الانتظار' },
  assigned: { en: 'Assigned', ar: 'معين' },
  picked_up: { en: 'Picked Up', ar: 'تم الاستلام' },
  in_transit: { en: 'In Transit', ar: 'في الطريق' },
  delivered: { en: 'Delivered', ar: 'تم التسليم' },
  failed: { en: 'Failed', ar: 'فشل' },
};

export default function AdminDeliveries() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState({ open: false, delivery: null });
  const [drivers, setDrivers] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchDrivers = async () => {
    try {
      const res = await api.get('/admin/drivers');
      const list = extractDataFromResponse(res);
      setDrivers(Array.isArray(list) ? list : []);
    } catch (e) {
      setDrivers([]);
    }
  };

  const openAssignModal = (delivery) => {
    setAssignModal({ open: true, delivery });
    setSelectedDriverId('');
    fetchDrivers();
  };

  const closeAssignModal = () => {
    setAssignModal({ open: false, delivery: null });
    setSelectedDriverId('');
  };

  const handleAssignDriver = async () => {
    if (!assignModal.delivery || !selectedDriverId) return;
    setAssigning(true);
    try {
      await api.post(`/admin/deliveries/${assignModal.delivery.id}/assign-driver`, {
        driver_id: Number(selectedDriverId),
      });
      showToast.success(language === 'ar' ? 'تم تعيين السائق' : 'Driver assigned');
      closeAssignModal();
      fetchDeliveries();
    } catch (e) {
      showToast.error(e.response?.data?.message || (language === 'ar' ? 'فشل تعيين السائق' : 'Failed to assign driver'));
    } finally {
      setAssigning(false);
    }
  };

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/deliveries');
      const data = extractDataFromResponse(res);
      setDeliveries(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const updateStatus = async (deliveryId, newStatus) => {
    try {
      await api.put(`/admin/deliveries/${deliveryId}/status`, { status: newStatus });
      showToast.success(language === 'ar' ? 'تم تحديث الحالة' : 'Status updated');
      fetchDeliveries();
    } catch (e) {
      showToast.error(e.response?.data?.message || (language === 'ar' ? 'فشل التحديث' : 'Update failed'));
    }
  };

  const columns = [
    {
      accessorKey: 'id',
      header: 'ID',
    },
    {
      accessorKey: 'order',
      header: language === 'ar' ? 'الطلب' : 'Order',
      cell: ({ row }) => {
        const o = row.original.order;
        return o?.order_number || o?.id || '-';
      },
    },
    {
      accessorKey: 'driver',
      header: language === 'ar' ? 'السائق' : 'Driver',
      cell: ({ row }) => {
        const d = row.original.driver;
        return d?.user?.name || d?.user?.username || (language === 'ar' ? 'غير معين' : 'Unassigned');
      },
    },
    {
      accessorKey: 'status',
      header: language === 'ar' ? 'الحالة' : 'Status',
      cell: ({ row }) => {
        const s = row.original.status || 'pending';
        const label = statusLabels[s] ? statusLabels[s][language === 'ar' ? 'ar' : 'en'] : s;
        const colors = {
          pending: 'bg-gray-100 text-gray-800',
          assigned: 'bg-blue-100 text-blue-800',
          picked_up: 'bg-amber-100 text-amber-800',
          in_transit: 'bg-purple-100 text-purple-800',
          delivered: 'bg-green-100 text-green-800',
          failed: 'bg-red-100 text-red-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${colors[s] || colors.pending}`}>
            {label}
          </span>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: language === 'ar' ? 'التاريخ' : 'Date',
      cell: ({ row }) => {
        const d = row.original.created_at;
        return d ? format(new Date(d), 'MMM dd, yyyy HH:mm') : '-';
      },
    },
    {
      id: 'actions',
      header: language === 'ar' ? 'إجراءات' : 'Actions',
      cell: ({ row }) => {
        const d = row.original;
        const status = d.status || 'pending';
        const hasNoDriver = !d.driver_id && !d.driver;
        return (
          <div className="flex items-center gap-2 flex-wrap">
            {hasNoDriver && (
              <Button
                variant="default"
                size="sm"
                onClick={() => openAssignModal(d)}
                className="gap-1"
              >
                <UserPlus className="h-4 w-4" />
                {language === 'ar' ? 'تعيين سائق' : 'Assign'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/admin/deliveries/${d.id}/tracking`)}
              className="gap-1"
            >
              <MapPin className="h-4 w-4" />
              {language === 'ar' ? 'تتبع' : 'Track'}
            </Button>
            {status === 'assigned' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStatus(d.id, 'picked_up')}
              >
                {language === 'ar' ? 'تم الاستلام' : 'Pickup'}
              </Button>
            )}
            {(status === 'picked_up' || status === 'in_transit') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStatus(d.id, 'delivered')}
              >
                {language === 'ar' ? 'تأكيد التسليم' : 'Confirm delivery'}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {language === 'ar' ? 'التوصيلات' : 'Deliveries'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === 'ar' ? 'إدارة التوصيلات وتحديث الحالة' : 'Manage deliveries and update status'}
              </p>
            </div>
            <Button onClick={fetchDeliveries} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              {language === 'ar' ? 'تحديث' : 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={deliveries}
        loading={loading}
        searchable
        searchPlaceholder={language === 'ar' ? 'بحث...' : 'Search...'}
        emptyTitle={language === 'ar' ? 'لا توجد توصيلات' : 'No deliveries'}
        emptyDescription={language === 'ar' ? 'التوصيلات ستظهر هنا.' : 'Deliveries will appear here.'}
      />

      <Dialog open={assignModal.open} onOpenChange={(open) => !open && closeAssignModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تعيين سائق للتوصيل' : 'Assign Driver to Delivery'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'اختر السائق' : 'Select driver'}</Label>
              <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'اختر سائقاً...' : 'Select a driver...'} />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((dr) => (
                    <SelectItem key={dr.id} value={String(dr.id)}>
                      {dr.user?.name || dr.user?.username || dr.user?.email || `Driver #${dr.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAssignModal} disabled={assigning}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleAssignDriver} disabled={!selectedDriverId || assigning}>
              {assigning ? (language === 'ar' ? 'جاري...' : 'Assigning...') : (language === 'ar' ? 'تعيين' : 'Assign')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
