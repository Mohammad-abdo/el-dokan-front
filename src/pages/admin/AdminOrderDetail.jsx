import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '@/lib/api';
import { getImageSrc } from '@/lib/imageUtils';
import { Card } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import showToast from '@/lib/toast';
import { showConfirm } from '@/components/ConfirmDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Package, User, MapPin, Clock, DollarSign, Truck } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const productsCount = order?.items?.length ?? 0;
  const productsCountLabel = language === 'ar'
    ? (productsCount === 1 ? '1 منتج' : `${productsCount} منتجات`)
    : (productsCount === 1 ? '1 product' : `${productsCount} products`);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/admin/orders/${id}`);
      const orderData = response.data?.data || response.data;
      setOrder(orderData);
      if (orderData?.status) {
        setNewStatus(orderData.status);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    setUpdating(true);
    try {
      await api.put(`/admin/orders/${id}/status`, { status: newStatus });
      await fetchOrder();
      setShowStatusModal(false);
      showToast.success('Order status updated successfully');
    } catch (error) {
      console.error('Error updating order status:', error);
      showToast.error(error.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = () => {
    showConfirm(t('orderDetail.deleteConfirm'), () => {
      api.delete(`/admin/orders/${id}`)
        .then(() => {
          showToast.success('Order deleted.');
          navigate('/admin/orders');
        })
        .catch((error) => {
          showToast.error(error.response?.data?.message || 'Failed to delete order');
        });
    });
  };

  const ORDER_STAGES = ['received', 'processing', 'on_the_way', 'delivered'];

  const getStatusColor = (status) => {
    const colors = {
      received: 'bg-blue-100 text-blue-800',
      processing: 'bg-yellow-100 text-yellow-800',
      on_the_way: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.received;
  };

  const getStageTimestamp = (stage) => {
    const history = order?.statusHistory || [];
    const entry = history.find((h) => h.status === stage);
    if (entry) return entry.timestamp || entry.created_at;
    if (stage === 'received' && order?.created_at) return order.created_at;
    return null;
  };

  const getStageLabel = (stage) => {
    const key = stage === 'on_the_way' ? 'orderDetail.on_the_way' : `orderDetail.${stage}`;
    return t(key) || stage;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-20" />
            <div>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="p-6">
              <Skeleton className="h-6 w-28 mb-4" />
              <Skeleton className="h-24 w-full" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('orderDetail.orderNotFound')}</p>
        <Link to="/admin/orders" className="text-primary mt-4 inline-block">
          {t('orderDetail.backToOrders')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/orders')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              #{order.order_number || order.id}
            </h1>
            <p className="text-muted-foreground mt-1">
              {productsCount > 0 && <span className="mr-2">{productsCountLabel}</span>}
              {order.created_at && format(new Date(order.created_at), 'PPP p')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowStatusModal(true)}
            variant="outline"
          >
            {t('orderDetail.updateStatus')}
          </Button>
          <Button
            onClick={handleDelete}
            variant="destructive"
          >
            {t('orderDetail.deleteOrder')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Order Information */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                {t('orderDetail.orderItems')} {order.items?.length > 0 && `(${productsCountLabel})`}
              </h2>
              <Separator className="mb-4" />
              <div className="space-y-4">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => {
                  const unitPrice = item.unit_price ?? item.product?.price ?? 0;
                  const qty = item.quantity ?? 1;
                  const lineTotal = item.total_price != null ? Number(item.total_price) : unitPrice * qty;
                  const imgUrl = item.product?.first_image_url || (item.product?.images && item.product.images[0]) || item.product?.image_url;
                  return (
                    <div
                      key={item.id ?? index}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {imgUrl ? (
                            <img
                              src={getImageSrc(imgUrl)}
                              alt={item.product?.name ?? ''}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : null}
                          {!imgUrl && <Package className="w-8 h-8 text-gray-400" />}
                        </div>
                        <div>
                          <h3 className="font-medium">
                            {item.product?.name || t('orderDetail.product')}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {t('orderDetail.quantity')}: {qty}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t('orderDetail.unitPrice')}: ${Number(unitPrice).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{t('orderDetail.lineTotal')}</p>
                        <p className="font-semibold">${Number(lineTotal).toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground">{t('orderDetail.noItems')}</p>
              )}
              </div>
              {order.items?.length > 0 && (order.total_amount != null || order.discount_amount != null || order.delivery_fee != null) && (
                <div className="mt-4 pt-4 border-t space-y-1 text-right">
                  {order.discount_amount != null && Number(order.discount_amount) !== 0 && (
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'الخصم' : 'Discount'}: -${Math.abs(Number(order.discount_amount)).toFixed(2)}
                    </p>
                  )}
                  {order.delivery_fee != null && Number(order.delivery_fee) !== 0 && (
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'التوصيل' : 'Delivery'}: ${Number(order.delivery_fee).toFixed(2)}
                    </p>
                  )}
                  <p className="font-semibold pt-2">
                    {t('orderDetail.totalAmount')}: ${Number(order.total_amount ?? 0).toFixed(2)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  {t('orderDetail.statusHistory')}
                </h2>
                <Separator className="mb-4" />
                <div className="space-y-3">
                {order.statusHistory.map((history, index) => {
                  const histTime = history.timestamp || history.created_at;
                  const histLabel = history.status === 'on_the_way' ? getStageLabel('on_the_way') : getStageLabel(history.status);
                  return (
                    <div
                      key={history.id ?? index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(history.status)}`}>
                          {histLabel}
                        </span>
                        {(history.notes || history.description) && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {history.notes || history.description}
                          </p>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {histTime ? format(new Date(histTime), language === 'ar' ? 'dd/MM/yyyy hh:mm a' : 'PPp') : '—'}
                      </span>
                    </div>
                  );
                })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Status & Stage Timestamps */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">{t('orderDetail.orderStatus')}</h2>
              <Separator className="mb-4" />
              <div className="space-y-4">
                <div>
                  <span className={`px-3 py-2 rounded-full text-sm font-medium inline-block ${getStatusColor(order.status)}`}>
                    {order.status === 'cancelled' ? getStageLabel('cancelled') : getStageLabel(order.status || 'received')}
                  </span>
                </div>
                {/* Timeline: one time per stage */}
                {order.status !== 'cancelled' && (
                  <div className="pt-2 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {language === 'ar' ? 'أوقات المراحل' : 'Stage timestamps'}
                    </p>
                    {ORDER_STAGES.map((stage) => {
                      const stageTime = getStageTimestamp(stage);
                      const isCurrent = order.status === stage;
                      const isPast = ORDER_STAGES.indexOf(order.status) > ORDER_STAGES.indexOf(stage);
                      return (
                        <div
                          key={stage}
                          className={`flex items-center justify-between gap-2 py-1.5 px-2 rounded ${isCurrent ? 'bg-primary/10' : ''}`}
                        >
                          <span className={`text-sm ${isCurrent ? 'font-semibold' : 'text-muted-foreground'}`}>
                            {getStageLabel(stage)}
                          </span>
                          <span className="text-sm tabular-nums text-muted-foreground">
                            {stageTime
                              ? format(new Date(stageTime), language === 'ar' ? 'hh:mm a' : 'hh:mm a')
                              : (isPast ? '—' : '')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              {order.delivery && (
                <div className="pt-4 border-t space-y-2">
                  <p className="text-sm text-muted-foreground">{t('orderDetail.delivery')}</p>
                  <p className="font-medium">{order.delivery.status || 'Pending'}</p>
                  {order.delivery.driver ? (
                    <p className="text-sm">
                      {order.delivery.driver.user?.name || order.delivery.driver.user?.username || 'Driver'} ({language === 'ar' ? 'معيّن' : 'assigned'})
                    </p>
                  ) : (
                    <p className="text-sm text-amber-600">{t('orderDetail.noDriverAssigned')}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/deliveries/${order.delivery.id}/tracking`)}
                      className="gap-1"
                    >
                      <Truck className="w-4 h-4" />
                      {t('orderDetail.track')}
                    </Button>
                    {!order.delivery.driver_id && !order.delivery.driver && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => navigate('/admin/deliveries')}
                        className="gap-1"
                      >
                        {t('orderDetail.assignDriver')}
                      </Button>
                    )}
                  </div>
                </div>
              )}
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                {t('orderDetail.customer')}
              </h2>
              <Separator className="mb-4" />
              <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">
                  {order.user?.username || order.user?.name || order.user?.email || '-'}
                </p>
              </div>
              {order.user?.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{order.user.email}</p>
                </div>
              )}
              {order.user?.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{order.user.phone}</p>
                </div>
              )}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          {order.deliveryAddress && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Delivery Address
                </h2>
                <Separator className="mb-4" />
                <p className="text-sm">
                {order.deliveryAddress.address || '-'}
                {order.deliveryAddress.city && `, ${order.deliveryAddress.city}`}
                {order.deliveryAddress.state && `, ${order.deliveryAddress.state}`}
              </p>
              </CardContent>
            </Card>
          )}

          {/* Shop Information */}
          {order.shop && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Shop
                </h2>
                <Separator className="mb-4" />
                <p className="font-medium">{order.shop.name || '-'}</p>
                {order.shop.phone && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {order.shop.phone}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Order Summary */}
          <Card className="bg-primary/5">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Order Summary
              </h2>
              <Separator className="mb-4" />
              <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${order.subtotal || order.total || 0}</span>
              </div>
              {order.delivery_fee && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span className="font-medium">${order.delivery_fee}</span>
                </div>
              )}
              {order.discount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium text-green-600">-${order.discount}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">${order.total || 0}</span>
              </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card p-6 rounded-lg max-w-md w-full mx-4 backdrop-blur-sm border shadow-xl z-[101]"
          >
            <h2 className="text-xl font-semibold mb-4">Update Order Status</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="received">Received</option>
                  <option value="processing">Processing</option>
                  <option value="on_the_way">On The Way</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowStatusModal(false)}
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateStatus}
                  disabled={updating || !newStatus}
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

