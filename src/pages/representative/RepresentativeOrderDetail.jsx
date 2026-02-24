import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { showToast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

export default function RepresentativeOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();

  useEffect(() => {
    api.get(`/representative/orders/${id}`)
      .then((res) => setOrder(res.data?.data ?? res.data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!confirm(language === 'ar' ? 'إلغاء الطلب؟' : 'Cancel this order?')) return;
    try {
      await api.put(`/representative/orders/${id}/cancel`);
      showToast.success(language === 'ar' ? 'تم إلغاء الطلب' : 'Order cancelled');
      navigate('/representative/orders');
    } catch (e) {
      showToast.error(e.response?.data?.message || (language === 'ar' ? 'فشل' : 'Failed'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }
  if (!order) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">{language === 'ar' ? 'الطلب غير موجود' : 'Order not found'}</p>
        <Button variant="outline" onClick={() => navigate('/representative/orders')}>
          {language === 'ar' ? 'رجوع' : 'Back'}
        </Button>
      </div>
    );
  }

  const canCancel = order.status && !['delivered', 'cancelled'].includes(order.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'} #{order.order_number || id}
          </h1>
          <p className="text-muted-foreground mt-1">{order.status}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/representative/orders')}>
          {language === 'ar' ? 'رجوع' : 'Back'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'معلومات الطلب' : 'Order Info'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>{language === 'ar' ? 'العميل:' : 'Customer:'}</strong> {order.user?.username || order.user?.name || '-'}</p>
          <p><strong>{language === 'ar' ? 'المتجر:' : 'Shop:'}</strong> {order.shop?.name || '-'}</p>
          <p><strong>{language === 'ar' ? 'المبلغ الإجمالي:' : 'Total:'}</strong> {order.total_amount ?? 0} EGP</p>
          <p><strong>{language === 'ar' ? 'التاريخ:' : 'Date:'}</strong> {order.created_at ? new Date(order.created_at).toLocaleString() : '-'}</p>
        </CardContent>
      </Card>

      {order.items && order.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'المنتجات' : 'Items'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {order.items.map((item, i) => (
                <li key={i}>
                  {item.product?.name ?? item.product_id} x {item.quantity} - {item.total_price ?? 0} EGP
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {canCancel && (
        <Button variant="destructive" onClick={handleCancel}>
          {language === 'ar' ? 'إلغاء الطلب' : 'Cancel Order'}
        </Button>
      )}
    </div>
  );
}
