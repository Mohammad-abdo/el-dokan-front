import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { showToast } from '@/lib/toast';
import { Eye, CheckCircle, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function DriverAvailableOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailOrder, setDetailOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [acceptingId, setAcceptingId] = useState(null);
  const navigate = useNavigate();
  const { language } = useLanguage();

  const fetchAvailableOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/driver/available-orders');
      const data = res.data?.data ?? res.data ?? [];
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setOrders([]);
      showToast.error(error.response?.data?.message || (language === 'ar' ? 'فشل تحميل الطلبات' : 'Failed to load orders'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableOrders();
  }, []);

  const openDetails = async (orderId) => {
    setDetailOrder(null);
    setDetailLoading(true);
    try {
      const res = await api.get(`/driver/orders/${orderId}/delivery-details`);
      setDetailOrder(res.data?.data ?? res.data);
    } catch (e) {
      showToast.error(e.response?.data?.message || (language === 'ar' ? 'فشل تحميل التفاصيل' : 'Failed to load details'));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOffer = async () => {
    if (!detailOrder?.order_id || !offerPrice) return;
    try {
      await api.post(`/driver/orders/${detailOrder.order_id}/offer`, {
        delivery_price: parseFloat(offerPrice),
      });
      showToast.success(language === 'ar' ? 'تم إرسال العرض' : 'Offer submitted');
      setDetailOrder(null);
      setOfferPrice('');
      fetchAvailableOrders();
    } catch (e) {
      showToast.error(e.response?.data?.message || (language === 'ar' ? 'فشل إرسال العرض' : 'Failed to submit offer'));
    }
  };

  const handleAccept = async (orderId) => {
    setAcceptingId(orderId);
    try {
      await api.post(`/driver/orders/${orderId}/accept`);
      showToast.success(language === 'ar' ? 'تم قبول الطلب' : 'Order accepted');
      setDetailOrder(null);
      fetchAvailableOrders();
      navigate('/driver/deliveries');
    } catch (e) {
      showToast.error(e.response?.data?.message || (language === 'ar' ? 'فشل قبول الطلب' : 'Failed to accept order'));
    } finally {
      setAcceptingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {language === 'ar' ? 'الطلبات المتاحة' : 'Available Orders'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === 'ar' ? 'طلبات جاهزة للتوصيل في منطقتك' : 'Orders ready for delivery in your area'}
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-8">
              {language === 'ar' ? 'لا توجد طلبات متاحة حالياً' : 'No available orders at the moment'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.order_id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  #{order.order_number || order.order_id}
                </CardTitle>
                <CardDescription>
                  {order.pickup_address || '-'} → {order.delivery_address || '-'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  {language === 'ar' ? 'مبلغ التوصيل:' : 'Delivery:'} {order.delivery_fee ?? 0} EGP
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openDetails(order.order_id)}>
                    <Eye className="w-4 h-4 mr-1" />
                    {language === 'ar' ? 'تفاصيل' : 'Details'}
                  </Button>
                  <Button size="sm" onClick={() => handleAccept(order.order_id)} disabled={!!acceptingId}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {language === 'ar' ? 'قبول' : 'Accept'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!detailOrder || detailLoading} onOpenChange={(open) => !open && setDetailOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}
            </DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
            </div>
          ) : detailOrder ? (
            <>
              <div className="space-y-2 text-sm">
                <p><strong>{language === 'ar' ? 'استلام:' : 'Pickup:'}</strong> {detailOrder.pickup_address}</p>
                <p><strong>{language === 'ar' ? 'تسليم:' : 'Delivery:'}</strong> {detailOrder.delivery_address}</p>
                <p><strong>{language === 'ar' ? 'مبلغ التوصيل:' : 'Delivery fee:'}</strong> {detailOrder.delivery_fee ?? 0} EGP</p>
                <p><strong>{language === 'ar' ? 'الإجمالي:' : 'Total:'}</strong> {detailOrder.grand_total ?? detailOrder.order_total} EGP</p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <label className="text-sm font-medium">
                  {language === 'ar' ? 'عرض سعر التوصيل (اختياري)' : 'Offer delivery price (optional)'}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailOrder(null)}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={() => handleOffer()} disabled={!offerPrice}>
                  <DollarSign className="w-4 h-4 mr-1" />
                  {language === 'ar' ? 'إرسال العرض' : 'Submit Offer'}
                </Button>
                <Button onClick={() => handleAccept(detailOrder.order_id)} disabled={!!acceptingId}>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {language === 'ar' ? 'قبول الطلب' : 'Accept Order'}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
