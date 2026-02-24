import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { getImageSrc } from '@/lib/imageUtils';
import showToast from '@/lib/toast';
import { showConfirm } from '@/components/ConfirmDialog';
import { Card } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  ArrowLeft, Package, Edit, Trash2, Store, DollarSign, ShoppingCart, 
  Star, Users, TrendingUp, Eye, Download, BarChart3, ToggleLeft, ToggleRight,
  Heart, Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/admin/products/${id}`);
      const data = response.data?.data || response.data;
      setProductData(data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    showConfirm(t('productDetail.deleteConfirm') || 'Are you sure you want to delete this product?', () => {
      api.delete(`/admin/products/${id}`)
        .then(() => {
          showToast.success('Product deleted.');
          navigate('/admin/products');
        })
        .catch((error) => {
          showToast.error(error.response?.data?.message || t('productDetail.deleteFailed'));
        });
    });
  };

  const handleToggleStatus = async () => {
    try {
      await api.post(`/admin/products/${id}/toggle-status`);
      showToast.success('Status updated.');
      fetchProduct();
    } catch (error) {
      console.error('Error toggling status:', error);
      showToast.error(error.response?.data?.message || t('productDetail.toggleFailed'));
    }
  };

  const handleViewAnalytics = () => {
    navigate(`/admin/products/${id}/analytics`);
  };

  const handleExport = async () => {
    try {
      const response = await api.get(`/admin/products/${id}/export`);
      const data = response.data?.data || response.data;
      
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product-${id}-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting product:', error);
      showToast.error(error.response?.data?.message || t('productDetail.exportFailed'));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-20" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card className="p-6">
              <Skeleton className="h-64 w-full rounded-lg mb-4" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="p-6">
              <Skeleton className="h-8 w-32 mb-4" />
              <Skeleton className="h-24 w-full" />
            </Card>
            <Card className="p-6">
              <Skeleton className="h-8 w-28 mb-4" />
              <Skeleton className="h-16 w-full" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('productDetail.productNotFound')}</p>
        <Link to="/admin/products" className="text-primary mt-4 inline-block">
          {t('common.backToProducts')}
        </Link>
      </div>
    );
  }

  const { product, images, purchase_stats, recent_orders, ratings, rating_stats, cart_stats, favorites_count, available_actions, metadata } = productData;

  const finalPrice = product.discount_percentage 
    ? product.price * (1 - product.discount_percentage / 100)
    : product.price;

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle, key: 'productDetail.delivered' },
      processing: { color: 'bg-blue-100 text-blue-800', icon: Clock, key: 'productDetail.processing' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, key: 'common.pending' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, key: 'productDetail.cancelled' },
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {t(config.key)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/products')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {product.name || t('productDetail.product')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('productDetail.completeDetails')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {available_actions?.edit && (
            <Button
              onClick={() => navigate(`/admin/products/${id}/edit`)}
              variant="outline"
              className="gap-2"
            >
              <Edit className="w-4 h-4" />
              {t('productDetail.edit')}
            </Button>
          )}
          {available_actions?.toggle_status && (
            <Button
              onClick={handleToggleStatus}
              variant="outline"
              className="gap-2"
            >
              {product.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {product.is_active ? t('common.active') : t('common.inactive')}
            </Button>
          )}
          {available_actions?.view_analytics && (
            <Button
              onClick={handleViewAnalytics}
              variant="outline"
              className="gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              {t('productDetail.analytics')}
            </Button>
          )}
          {available_actions?.export_data && (
            <Button
              onClick={handleExport}
              variant="outline"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {t('common_labels.export')}
            </Button>
          )}
          {available_actions?.delete && (
            <Button
              onClick={handleDelete}
              variant="destructive"
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {t('productDetail.delete')}
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">{t('productDetail.overview')}</TabsTrigger>
          <TabsTrigger value="orders">{t('productDetail.orders')}</TabsTrigger>
          <TabsTrigger value="ratings">{t('productDetail.ratings')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('productDetail.analytics')}</TabsTrigger>
          <TabsTrigger value="images">{t('productDetail.images')}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              {/* Product Information */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {t('productDetail.productInfo')}
                </h2>
                <div className="space-y-4">
                  {product.description && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t('productDetail.description')}</p>
                      <p className="font-medium">{product.description}</p>
                    </div>
                  )}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t('productDetail.category')}</p>
                      <p className="font-medium">{product.category?.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t('productDetail.subcategory')}</p>
                      <p className="font-medium">{product.subcategory?.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t('productDetail.stockQuantity')}</p>
                      <p className="font-medium">{product.stock_quantity || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t('productDetail.status')}</p>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.is_active ? t('common.active') : t('common.inactive')}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Shop Information */}
              {product.shop && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Store className="w-5 h-5" />
                    {t('productDetail.shopInfo')}
                  </h2>
                  <div>
                    <Link
                      to={`/admin/shops/${product.shop.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {product.shop.name || '-'}
                    </Link>
                    {product.shop.phone && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {product.shop.phone}
                      </p>
                    )}
                    {product.shop.address && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {product.shop.address}
                      </p>
                    )}
                  </div>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              {/* Pricing */}
              <Card className="p-6 bg-primary/5">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  {t('productDetail.pricing')}
                </h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('productDetail.originalPrice')}</span>
                    <span className="font-medium">${product.price || 0}</span>
                  </div>
                  {product.discount_percentage && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('productDetail.discount')}</span>
                        <span className="font-medium text-green-600">
                          -{product.discount_percentage}%
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-semibold">{t('productDetail.finalPrice')}</span>
                        <span className="font-bold text-lg">${finalPrice.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* Purchase Statistics */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  {t('productDetail.purchaseStats')}
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('productDetail.totalOrders')}</span>
                    <span className="font-bold text-lg">{purchase_stats?.total_orders || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('productDetail.quantitySold')}</span>
                    <span className="font-bold text-lg">{purchase_stats?.total_quantity_sold || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('productDetail.totalRevenue')}</span>
                    <span className="font-bold text-lg text-green-600">${purchase_stats?.total_revenue || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('productDetail.avgOrderValue')}</span>
                    <span className="font-bold">${purchase_stats?.average_order_value || 0}</span>
                  </div>
                </div>
              </Card>

              {/* Engagement Metrics */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {t('productDetail.engagementMetrics')}
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Heart className="w-4 h-4" /> {t('productDetail.favorites')}
                    </span>
                    <span className="font-bold">{favorites_count || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <ShoppingCart className="w-4 h-4" /> {t('productDetail.inCarts')}
                    </span>
                    <span className="font-bold">{cart_stats?.current_in_carts || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('productDetail.avgRating')}</span>
                    <div className="flex items-center gap-1">
                      <span className="font-bold">{Number(rating_stats?.average_rating ?? 0).toFixed(1)}</span>
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              {t('productDetail.recentOrders')}
            </h2>
            {recent_orders && recent_orders.length > 0 ? (
              <div className="space-y-4">
                {recent_orders.map((order, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link
                          to={`/admin/orders/${order.order_id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {order.order_number}
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t('common.customer')}: {order.customer}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(order.order_date), 'PPp')}
                        </p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(order.status)}
                        <p className="font-medium mt-2">${order.total_price}</p>
                        <p className="text-sm text-muted-foreground">{t('common.qty')}: {order.quantity}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">{t('productDetail.noOrders')}</p>
            )}
          </Card>
        </TabsContent>

        {/* Ratings Tab */}
        <TabsContent value="ratings" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  {t('productDetail.customerReviews')}
                </h2>
                {ratings && ratings.length > 0 ? (
                  <div className="space-y-4">
                    {ratings.map((rating, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{rating.user}</p>
                            <div className="flex items-center gap-1 mt-1">
                              {renderStars(rating.rating)}
                              <span className="text-sm text-muted-foreground ml-1">
                                {Number(rating.rating ?? 0).toFixed(1)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            {rating.is_approved ? (
                              <Badge className="bg-green-100 text-green-800">{t('common.approved')}</Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800">{t('common.pending')}</Badge>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(rating.created_at), 'PPp')}
                            </p>
                          </div>
                        </div>
                        {rating.comment && (
                          <p className="text-sm mt-2">{rating.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">{t('productDetail.noRatings')}</p>
                )}
              </Card>
            </div>

            <div className="space-y-6">
              {/* Rating Statistics */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">{t('productDetail.ratingStats')}</h2>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{Number(rating_stats?.average_rating ?? 0).toFixed(1)}</div>
                    <div className="flex justify-center items-center gap-1 mt-1">
                      {renderStars(rating_stats?.average_rating || 0)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {rating_stats?.total_ratings || 0} {t('productDetail.totalRatings')}
                    </p>
                  </div>
                  
                  {rating_stats?.rating_distribution && (
                    <div className="space-y-2">
                      {Object.entries(rating_stats.rating_distribution).reverse().map(([stars, count]) => (
                        <div key={stars} className="flex items-center gap-2">
                          <span className="text-sm w-8">{stars.replace('_', ' ')}</span>
                          <Progress 
                            value={rating_stats.total_ratings > 0 ? (count / rating_stats.total_ratings) * 100 : 0} 
                            className="flex-1" 
                          />
                          <span className="text-sm w-8 text-right">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {t('productDetail.performanceAnalytics')}
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="font-semibold">{t('productDetail.salesPerformance')}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('productDetail.totalRevenue')}</span>
                    <span className="font-medium">${purchase_stats?.total_revenue || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('productDetail.totalOrders')}</span>
                    <span className="font-medium">{purchase_stats?.total_orders || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('productDetail.conversionRate')}</span>
                    <span className="font-medium">
                      {cart_stats?.current_in_carts > 0 
                        ? ((purchase_stats?.total_orders / (cart_stats.current_in_carts + purchase_stats.total_orders)) * 100).toFixed(1)
                        : '0'}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold">{t('productDetail.customerEngagement')}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('productDetail.favorites')}</span>
                    <span className="font-medium">{favorites_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('productDetail.activeCarts')}</span>
                    <span className="font-medium">{cart_stats?.current_in_carts || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('productDetail.ratingCount')}</span>
                    <span className="font-medium">{rating_stats?.total_ratings || 0}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <div className="grid gap-4 md:grid-cols-3 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">${purchase_stats?.total_revenue || 0}</p>
                  <p className="text-sm text-muted-foreground">{t('productDetail.totalRevenue')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{purchase_stats?.total_quantity_sold || 0}</p>
                  <p className="text-sm text-muted-foreground">{t('productDetail.unitsSold')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{Number(rating_stats?.average_rating ?? 0).toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">{t('productDetail.averageRating')}</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {t('productDetail.productImages')}
            </h2>
            {images && images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={getImageSrc(image?.url)}
                      alt={`${product.name} - ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {image.is_primary && (
                      <Badge className="absolute top-2 left-2 bg-primary">
                        {t('common.primary')}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">{t('productDetail.noImages')}</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}




