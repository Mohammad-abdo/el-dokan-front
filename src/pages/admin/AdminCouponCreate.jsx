import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import showToast from '@/lib/toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Tag } from 'lucide-react';

export default function AdminCouponCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discount: '',
    discount_percentage: '',
    type: 'percentage',
    minimum_amount: '',
    maximum_discount: '',
    usage_limit: '',
    expires_at: '',
    description: '',
    is_active: true,
  });
  const [errors, setErrors] = useState({});

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.code?.trim()) {
      newErrors.code = 'Code is required';
    }
    
    if (!formData.discount && !formData.discount_percentage) {
      newErrors.discount = 'Discount is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        discount: formData.discount || formData.discount_percentage,
        discount_percentage: formData.type === 'percentage' ? parseFloat(formData.discount || formData.discount_percentage) : null,
        minimum_amount: formData.minimum_amount ? parseFloat(formData.minimum_amount) : null,
        maximum_discount: formData.maximum_discount ? parseFloat(formData.maximum_discount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        expires_at: formData.expires_at || null,
      };
      await api.post('/admin/coupons', payload);
      showToast.success('Coupon created successfully.');
      navigate('/admin/coupons');
    } catch (error) {
      console.error('Error creating coupon:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        showToast.error(error.response?.data?.message || 'Failed to create coupon');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
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
            Create New Coupon
          </h1>
          <p className="text-muted-foreground mt-1">Add a new discount coupon</p>
        </div>
      </motion.div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">
                Code <span className="text-destructive">*</span>
              </label>
              <div className="flex gap-2">
                <Input
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="COUPON123"
                  className={errors.code ? 'border-destructive' : ''}
                  required
                />
                <Button type="button" onClick={generateCode} variant="outline">
                  Generate
                </Button>
              </div>
              {errors.code && (
                <p className="text-sm text-destructive mt-1">{errors.code}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Discount {formData.type === 'percentage' ? '(%)' : '($)'} <span className="text-destructive">*</span>
              </label>
              <Input
                name="discount"
                type="number"
                step="0.01"
                value={formData.discount}
                onChange={handleChange}
                placeholder={formData.type === 'percentage' ? '10' : '50'}
                className={errors.discount ? 'border-destructive' : ''}
                required
              />
              {errors.discount && (
                <p className="text-sm text-destructive mt-1">{errors.discount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Minimum Amount</label>
              <Input
                name="minimum_amount"
                type="number"
                step="0.01"
                value={formData.minimum_amount}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Maximum Discount</label>
              <Input
                name="maximum_discount"
                type="number"
                step="0.01"
                value={formData.maximum_discount}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Usage Limit</label>
              <Input
                name="usage_limit"
                type="number"
                value={formData.usage_limit}
                onChange={handleChange}
                placeholder="Unlimited"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Expires At</label>
              <Input
                name="expires_at"
                type="datetime-local"
                value={formData.expires_at}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter coupon description"
                className="w-full p-2 border rounded-lg min-h-[100px]"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <label className="text-sm font-medium">Active</label>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/coupons')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Coupon'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}




