import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import showToast from '@/lib/toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign,
  Calendar, BarChart3, Download, Package, Star
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminProductAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [id]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get(`/admin/products/${id}/analytics`);
      const data = response.data?.data || response.data;
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
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
      a.download = `product-${id}-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting analytics:', error);
      showToast.error('Failed to export analytics data');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Analytics data not found</p>
        <Link to={`/admin/products/${id}`} className="text-primary mt-4 inline-block">
          Back to Product
        </Link>
      </div>
    );
  }

  const { sales_over_time, top_customers, monthly_comparison } = analyticsData;

  const renderGrowthIndicator = (value, isPositive = true) => {
    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        <span className="font-medium">{Math.abs(value).toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/admin/products/${id}`)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Product
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Product Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Detailed performance insights and trends
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExport}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Monthly Comparison */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Monthly Comparison
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-semibold text-green-600">This Month</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Quantity Sold</span>
                <span className="font-bold">{monthly_comparison?.this_month?.quantity || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Revenue</span>
                <span className="font-bold text-green-600">${monthly_comparison?.this_month?.revenue || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Orders</span>
                <span className="font-bold">{monthly_comparison?.this_month?.orders || 0}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-600">Last Month</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Quantity Sold</span>
                <span className="font-bold">{monthly_comparison?.last_month?.quantity || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Revenue</span>
                <span className="font-bold">${monthly_comparison?.last_month?.revenue || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Orders</span>
                <span className="font-bold">{monthly_comparison?.last_month?.orders || 0}</span>
              </div>
            </div>
          </div>
        </div>
        
        {monthly_comparison?.growth && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold mb-4">Growth Metrics</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Quantity Growth</span>
                {renderGrowthIndicator(
                  monthly_comparison.growth.quantity_growth,
                  monthly_comparison.growth.quantity_growth >= 0
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Revenue Growth</span>
                {renderGrowthIndicator(
                  monthly_comparison.growth.revenue_growth,
                  monthly_comparison.growth.revenue_growth >= 0
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Top Customers */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Top Customers
        </h2>
        {top_customers && top_customers.length > 0 ? (
          <div className="space-y-4">
            {top_customers.map((customer, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{customer.customer}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {customer.order_count} orders
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${customer.total_spent}</p>
                    <p className="text-sm text-muted-foreground">
                      {customer.total_quantity} items
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No customer data available</p>
        )}
      </Card>

      {/* Sales Over Time */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Sales Trend (Last 30 Days)
        </h2>
        {sales_over_time && Object.keys(sales_over_time).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(sales_over_time)
              .sort(([a], [b]) => new Date(a) - new Date(b))
              .map(([date, data]) => (
                <div key={date} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{format(new Date(date), 'MMM dd, yyyy')}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {data.orders} orders
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">${data.revenue}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.quantity} items
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No sales data available for the last 30 days</p>
        )}
      </Card>
    </div>
  );
}
