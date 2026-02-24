import { useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';

export default function RepresentativeReports() {
  const [type, setType] = useState('visits');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const { language } = useLanguage();

  const generateReport = async (e) => {
    e.preventDefault();
    if (!fromDate || !toDate) return;
    setLoading(true);
    setReport(null);
    try {
      const res = await api.get('/representative/reports', {
        params: { type, from_date: fromDate, to_date: toDate },
      });
      setReport(res.data?.data ?? res.data);
    } catch (error) {
      console.error(error);
      setReport({ error: error.response?.data?.message || 'Failed to load report' });
    } finally {
      setLoading(false);
    }
  };

  const summary = report?.summary;
  const items = report?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {language === 'ar' ? 'التقارير' : 'Reports'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === 'ar' ? 'توليد تقارير الزيارات أو الطلبات أو المبيعات' : 'Generate visits, orders or sales reports'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'توليد التقرير' : 'Generate Report'}</CardTitle>
          <CardDescription>
            {language === 'ar' ? 'اختر النوع والفترة' : 'Select type and date range'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={generateReport} className="flex flex-col gap-4 max-w-md">
            <div>
              <Label>{language === 'ar' ? 'نوع التقرير' : 'Report Type'}</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visits">{language === 'ar' ? 'الزيارات' : 'Visits'}</SelectItem>
                  <SelectItem value="orders">{language === 'ar' ? 'الطلبات' : 'Orders'}</SelectItem>
                  <SelectItem value="sales">{language === 'ar' ? 'المبيعات' : 'Sales'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{language === 'ar' ? 'من تاريخ' : 'From Date'}</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>{language === 'ar' ? 'إلى تاريخ' : 'To Date'}</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading
                ? (language === 'ar' ? 'جاري التوليد...' : 'Generating...')
                : (language === 'ar' ? 'توليد التقرير' : 'Generate Report')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {report && !report.error && (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'النتائج' : 'Results'}</CardTitle>
            {summary && (
              <CardDescription>
                {type === 'visits' && (language === 'ar' ? `إجمالي الزيارات: ${summary.total_visits}` : `Total visits: ${summary.total_visits}`)}
                {type === 'orders' && (language === 'ar' ? `إجمالي الطلبات: ${summary.total_orders} - المبلغ: ${summary.total_amount}` : `Total orders: ${summary.total_orders} - Amount: ${summary.total_amount}`)}
                {type === 'sales' && (language === 'ar' ? `إجمالي المبيعات: ${summary.total_sales_amount} - عدد الطلبات: ${summary.total_orders_count}` : `Total sales: ${summary.total_sales_amount} - Orders: ${summary.total_orders_count}`)}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-muted-foreground text-sm">{language === 'ar' ? 'لا توجد بيانات' : 'No data'}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {type === 'visits' && (
                        <>
                          <th className="text-left py-2">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                          <th className="text-left py-2">{language === 'ar' ? 'المتجر' : 'Shop'}</th>
                          <th className="text-left py-2">{language === 'ar' ? 'الغرض' : 'Purpose'}</th>
                          <th className="text-left py-2">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                        </>
                      )}
                      {type === 'orders' && (
                        <>
                          <th className="text-left py-2">{language === 'ar' ? 'رقم الطلب' : 'Order #'}</th>
                          <th className="text-left py-2">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                          <th className="text-left py-2">{language === 'ar' ? 'المتجر' : 'Shop'}</th>
                          <th className="text-left py-2">{language === 'ar' ? 'العميل' : 'Customer'}</th>
                          <th className="text-left py-2">{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                        </>
                      )}
                      {type === 'sales' && (
                        <>
                          <th className="text-left py-2">{language === 'ar' ? 'رقم الطلب' : 'Order #'}</th>
                          <th className="text-left py-2">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                          <th className="text-left py-2">{language === 'ar' ? 'المتجر' : 'Shop'}</th>
                          <th className="text-left py-2">{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} className="border-b">
                        {type === 'visits' && (
                          <>
                            <td className="py-2">{item.visit_date} {item.visit_time}</td>
                            <td className="py-2">{item.shop_name}</td>
                            <td className="py-2">{item.purpose}</td>
                            <td className="py-2">{item.status}</td>
                          </>
                        )}
                        {type === 'orders' && (
                          <>
                            <td className="py-2">{item.order_number}</td>
                            <td className="py-2">{item.date}</td>
                            <td className="py-2">{item.shop_name}</td>
                            <td className="py-2">{item.customer_name}</td>
                            <td className="py-2">{item.total_amount}</td>
                          </>
                        )}
                        {type === 'sales' && (
                          <>
                            <td className="py-2">{item.order_number}</td>
                            <td className="py-2">{item.date}</td>
                            <td className="py-2">{item.shop_name}</td>
                            <td className="py-2">{item.amount}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {report?.error && (
        <p className="text-destructive text-sm">{report.error}</p>
      )}
    </div>
  );
}
