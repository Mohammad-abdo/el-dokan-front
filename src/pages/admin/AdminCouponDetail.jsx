import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import showToast from '@/lib/toast';
import { showConfirm } from '@/components/ConfirmDialog';
import { ArrowLeft, Edit, Trash2, Tag, Calendar, Percent, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminCouponDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoupon();
  }, [id]);

  const fetchCoupon = async () => {
    try {
      const response = await api.get(`/admin/coupons/${id}`);
      const couponData = response.data?.data || response.data;
      setCoupon(couponData);
    } catch (error) {
      console.error('Error fetching coupon:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    showConfirm('Are you sure you want to delete this coupon? This action cannot be undone.', () => {
      api.delete(`/admin/coupons/${id}`)
        .then(() => {
          showToast.success('Coupon deleted.');
          navigate('/admin/coupons');
        })
        .catch((error) => {
          showToast.error(error.response?.data?.message || 'Failed to delete coupon');
        });
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Coupon not found</p>
        <Link to="/admin/coupons" className="text-primary mt-4 inline-block">
          Back to Coupons
        </Link>
      </div>
    );
  }

  const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
  const isActive = coupon.is_active && !isExpired;

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
            onClick={() => navigate('/admin/coupons')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Tag className="w-8 h-8" />
              {coupon.code || 'Coupon'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Coupon Details
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate(`/admin/coupons/${id}/edit`)}
            variant="outline"
            className="gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          <Button
            onClick={handleDelete}
            variant="destructive"
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 space-y-6"
        >
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Coupon Information
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Code</p>
                <p className="font-mono font-bold text-lg">{coupon.code}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Discount</p>
                <p className="font-bold text-2xl text-primary">
                  {coupon.discount || coupon.discount_percentage}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Type</p>
                <p className="font-medium capitalize">{coupon.type || 'percentage'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  isActive ? 'bg-green-100 text-green-800' : 
                  isExpired ? 'bg-red-100 text-red-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {isActive ? 'Active' : isExpired ? 'Expired' : 'Inactive'}
                </span>
              </div>
              {coupon.minimum_amount && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Minimum Amount</p>
                  <p className="font-medium">${coupon.minimum_amount}</p>
                </div>
              )}
              {coupon.maximum_discount && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Maximum Discount</p>
                  <p className="font-medium">${coupon.maximum_discount}</p>
                </div>
              )}
              {coupon.usage_limit && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Usage Limit</p>
                  <p className="font-medium">{coupon.usage_limit} times</p>
                </div>
              )}
              {coupon.used_count !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Times Used</p>
                  <p className="font-medium">{coupon.used_count} times</p>
                </div>
              )}
              {coupon.description && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="font-medium">{coupon.description}</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Dates
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="font-medium">
                  {coupon.created_at ? format(new Date(coupon.created_at), 'PPp') : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expires At</p>
                <p className="font-medium">
                  {coupon.expires_at ? format(new Date(coupon.expires_at), 'PPp') : 'No expiry'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {coupon.updated_at ? format(new Date(coupon.updated_at), 'PPp') : '-'}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}




