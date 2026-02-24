import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, MapPin, User, DollarSign, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';

export default function ShopOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/shop/orders/${id}`);
      setOrder(response.data?.data || response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        label: language === 'ar' ? 'قيد الانتظار' : 'Pending',
        className: 'bg-yellow-100 text-yellow-800',
      },
      processing: {
        label: language === 'ar' ? 'قيد المعالجة' : 'Processing',
        className: 'bg-blue-100 text-blue-800',
      },
      completed: {
        label: language === 'ar' ? 'مكتمل' : 'Completed',
        className: 'bg-green-100 text-green-800',
      },
      delivered: {
        label: language === 'ar' ? 'تم التسليم' : 'Delivered',
        className: 'bg-emerald-100 text-emerald-800',
      },
      cancelled: {
        label: language === 'ar' ? 'ملغي' : 'Cancelled',
        className: 'bg-red-100 text-red-800',
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`px-2 py-1 rounded-full text-xs ${config.className}`}>
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

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{language === 'ar' ? 'الطلب غير موجود' : 'Order not found'}</p>
        <Link to="/shop/orders" className="text-primary mt-4 inline-block">
          {language === 'ar' ? 'رجوع إلى الطلبات' : 'Back to Orders'}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/shop/orders')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === 'ar' ? 'رجوع' : 'Back'}
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {language === 'ar' ? 'طلب' : 'Order'} #{order.order_number || order.id}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}
            </p>
          </div>
        </div>
        {getStatusBadge(order.status)}
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 space-y-6"
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              {language === 'ar' ? 'عناصر الطلب' : 'Order Items'}
            </h2>
            {order.items && order.items.length > 0 ? (
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.product?.name || item.name || '-'}</p>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'الكمية' : 'Quantity'}: {item.quantity} × ${parseFloat(item.price || 0).toLocaleString()}
                      </p>
                    </div>
                    <p className="font-bold">${parseFloat((item.price || 0) * (item.quantity || 1)).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">{language === 'ar' ? 'لا توجد عناصر' : 'No items'}</p>
            )}
          </Card>

          {order.delivery_address && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {language === 'ar' ? 'عنوان التوصيل' : 'Delivery Address'}
              </h2>
              <p className="text-muted-foreground">{order.delivery_address}</p>
            </Card>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {language === 'ar' ? 'معلومات الطلب' : 'Order Information'}
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'رقم الطلب' : 'Order Number'}</p>
                <p className="font-medium">#{order.order_number || order.id}</p>
              </div>
              {order.user && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {language === 'ar' ? 'العميل' : 'Customer'}
                  </p>
                  <p className="font-medium">{order.user.username || order.user.email || '-'}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  {language === 'ar' ? 'الإجمالي' : 'Total'}
                </p>
                <p className="font-bold text-lg">${parseFloat(order.total || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {language === 'ar' ? 'التاريخ' : 'Date'}
                </p>
                <p className="font-medium">
                  {order.created_at ? format(new Date(order.created_at), 'MMM dd, yyyy HH:mm') : '-'}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

