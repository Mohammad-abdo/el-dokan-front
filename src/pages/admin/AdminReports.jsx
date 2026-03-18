import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import showToast from '@/lib/toast';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users,
  BarChart3,
  Calendar,
  Filter,
  Building2,
  Table2,
  ListChecks,
  FileSpreadsheet,
  FileDown,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { TABLE_REPORT_TYPES, getReportColumns, getColumnHeader } from '@/lib/reportConfig';
import { exportReportToExcel } from '@/lib/exportReportExcel';
import { exportReportToCsv } from '@/lib/reportExport';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

export default function AdminReports() {
  const { t, language } = useLanguage();
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  // Table report (استخراج تقارير الجداول)
  const [tableReportType, setTableReportType] = useState('doctors');
  const [tableScope, setTableScope] = useState('all');
  const [tableEntityId, setTableEntityId] = useState('');
  const [entityList, setEntityList] = useState([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState({});
  const [exportFormat, setExportFormat] = useState('excel');

  const tableReportColumns = useMemo(() => getReportColumns(tableReportType, language), [tableReportType, language]);
  const tableReportTypeConfig = TABLE_REPORT_TYPES.find((r) => r.key === tableReportType);

  useEffect(() => {
    if (tableScope !== 'one') {
      setEntityList([]);
      setTableEntityId('');
      return;
    }
    setLoadingEntities(true);
    const config = TABLE_REPORT_TYPES.find((r) => r.key === tableReportType);
    if (!config) {
      setLoadingEntities(false);
      return;
    }
    api
      .get(config.api, { params: config.apiParams || {} })
      .then((res) => {
        const data = extractDataFromResponse(res);
        setEntityList(Array.isArray(data) ? data : []);
        setTableEntityId('');
      })
      .catch(() => setEntityList([]))
      .finally(() => setLoadingEntities(false));
  }, [tableReportType, tableScope]);

  useEffect(() => {
    const defaultCols = {};
    tableReportColumns.forEach((c) => {
      defaultCols[c.accessorKey] = true;
    });
    setSelectedColumns((prev) => {
      const next = { ...defaultCols };
      tableReportColumns.forEach((c) => {
        if (prev[c.accessorKey] !== undefined) next[c.accessorKey] = prev[c.accessorKey];
      });
      return next;
    });
  }, [tableReportType]);

  const handleTableExport = async () => {
    setLoadingExport(true);
    try {
      const config = TABLE_REPORT_TYPES.find((r) => r.key === tableReportType);
      const cols = tableReportColumns.filter((c) => selectedColumns[c.accessorKey]);
      if (!config || cols.length === 0) {
        showToast.error(language === 'ar' ? 'اختر نوع التقرير وعموداً واحداً على الأقل' : 'Select report type and at least one column');
        return;
      }
      let data = [];
      if (tableScope === 'one' && tableEntityId) {
        data = entityList.filter((e) => String(e.id) === String(tableEntityId));
      } else {
        const res = await api.get(config.api, { params: config.apiParams || {} });
        data = extractDataFromResponse(res);
      }
      data = Array.isArray(data) ? data : [];
      const reportTitle = language === 'ar' ? tableReportTypeConfig?.labelAr : tableReportTypeConfig?.labelEn;
      const baseFilename = `${tableReportType}-report-${new Date().toISOString().slice(0, 10)}`;
      if (exportFormat === 'excel') {
        await exportReportToExcel({
          reportTitle,
          columns: cols,
          data,
          language,
          includeMetadata: true,
          filename: `${baseFilename}.xlsx`,
        });
      } else {
        exportReportToCsv({
          reportTitle,
          columns: cols,
          data,
          filtersApplied: tableScope === 'one' && tableEntityId ? { [language === 'ar' ? 'السجل' : 'Record']: tableEntityId } : {},
          language,
          includeMetadata: true,
          filename: `${baseFilename}.csv`,
        });
      }
      showToast.success(language === 'ar' ? 'تم استخراج التقرير' : 'Report exported');
    } catch (e) {
      console.error(e);
      showToast.error(e?.message || (language === 'ar' ? 'فشل استخراج التقرير' : 'Export failed'));
    } finally {
      setLoadingExport(false);
    }
  };

  const reportTypes = [
    { 
      key: 'dashboard', 
      label: language === 'ar' ? 'تقرير لوحة التحكم' : 'Dashboard Report', 
      icon: BarChart3,
      color: 'blue',
      description: language === 'ar' ? 'نظرة عامة على جميع الإحصائيات' : 'Overview of all statistics'
    },
    { 
      key: 'financial', 
      label: language === 'ar' ? 'تقرير مالي' : 'Financial Report', 
      icon: DollarSign,
      color: 'green',
      description: language === 'ar' ? 'الإيرادات والمصروفات' : 'Revenue and expenses'
    },
    { 
      key: 'orders', 
      label: language === 'ar' ? 'تقرير الطلبات' : 'Orders Report', 
      icon: ShoppingCart,
      color: 'purple',
      description: language === 'ar' ? 'تفاصيل الطلبات والمبيعات' : 'Orders and sales details'
    },
    { 
      key: 'products', 
      label: language === 'ar' ? 'تقرير المنتجات' : 'Products Report', 
      icon: Package,
      color: 'orange',
      description: language === 'ar' ? 'أداء المنتجات والمخزون' : 'Products performance and inventory'
    },
    { 
      key: 'users', 
      label: language === 'ar' ? 'تقرير المستخدمين' : 'Users Report', 
      icon: Users,
      color: 'pink',
      description: language === 'ar' ? 'إحصائيات المستخدمين' : 'Users statistics'
    },
    { 
      key: 'companies', 
      label: language === 'ar' ? 'تقرير الشركات' : 'Companies Report', 
      icon: Building2,
      color: 'indigo',
      description: language === 'ar' ? 'الشركات والخطط والإحصائيات' : 'Companies, plans and statistics'
    },
  ];

  const fetchReport = async (type) => {
    setLoading(true);
    setSelectedReport(type);
    try {
      const response = await api.get(`/admin/reports/${type}`, {
        params: type === 'companies' ? {} : { start_date: dateRange.start, end_date: dateRange.end },
      });
      setReportData(response.data?.data || response.data);
    } catch (error) {
      console.error(`Error fetching ${type} report:`, error);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type, format = 'csv') => {
    try {
      const response = await api.get(`/admin/reports/${type}/export`, {
        params: {
          format,
          start_date: dateRange.start,
          end_date: dateRange.end,
        },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-report-${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting report:', error);
      showToast.error(language === 'ar' ? 'فشل تصدير التقرير' : 'Failed to export report');
    }
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    switch (selectedReport) {
      case 'dashboard':
        return (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {reportData.stats?.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        );

      case 'financial':
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}</p>
                <p className="text-3xl font-bold mt-2 text-green-600">
                  ${reportData.total_revenue?.toFixed(2) || '0.00'}
                </p>
              </Card>
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses'}</p>
                <p className="text-3xl font-bold mt-2 text-red-600">
                  ${reportData.total_expenses?.toFixed(2) || '0.00'}
                </p>
              </Card>
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'صافي الربح' : 'Net Profit'}</p>
                <p className="text-3xl font-bold mt-2 text-primary">
                  ${((reportData.total_revenue || 0) - (reportData.total_expenses || 0)).toFixed(2)}
                </p>
              </Card>
            </div>
            {reportData.chart_data && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">{language === 'ar' ? 'الاتجاه المالي' : 'Financial Trend'}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={reportData.chart_data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="expenses" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>
        );

      case 'orders':
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-4">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}</p>
                <p className="text-2xl font-bold mt-2">{reportData.total_orders || 0}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'مكتملة' : 'Completed'}</p>
                <p className="text-2xl font-bold mt-2 text-green-600">{reportData.completed_orders || 0}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'معلقة' : 'Pending'}</p>
                <p className="text-2xl font-bold mt-2 text-yellow-600">{reportData.pending_orders || 0}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'ملغاة' : 'Cancelled'}</p>
                <p className="text-2xl font-bold mt-2 text-red-600">{reportData.cancelled_orders || 0}</p>
              </Card>
            </div>
            {reportData.chart_data && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">{language === 'ar' ? 'اتجاه الطلبات' : 'Orders Trend'}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.chart_data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="orders" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>
        );

      case 'products':
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي المنتجات' : 'Total Products'}</p>
                <p className="text-3xl font-bold mt-2">{reportData.total_products || 0}</p>
              </Card>
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'منتجات نشطة' : 'Active Products'}</p>
                <p className="text-3xl font-bold mt-2 text-green-600">{reportData.active_products || 0}</p>
              </Card>
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'منتجات منخفضة المخزون' : 'Low Stock'}</p>
                <p className="text-3xl font-bold mt-2 text-red-600">{reportData.low_stock || 0}</p>
              </Card>
            </div>
            {reportData.top_products && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">{language === 'ar' ? 'أفضل المنتجات مبيعاً' : 'Top Selling Products'}</h3>
                <div className="space-y-2">
                  {reportData.top_products.slice(0, 10).map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {language === 'ar' ? 'مبيعات:' : 'Sales:'} {product.sales_count || 0}
                        </p>
                      </div>
                      <p className="font-bold text-primary">${product.total_revenue?.toFixed(2) || '0.00'}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-4">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'}</p>
                <p className="text-2xl font-bold mt-2">{reportData.total_users || 0}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'مستخدمون جدد' : 'New Users'}</p>
                <p className="text-2xl font-bold mt-2 text-blue-600">{reportData.new_users || 0}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'نشطون' : 'Active'}</p>
                <p className="text-2xl font-bold mt-2 text-green-600">{reportData.active_users || 0}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'معطلون' : 'Inactive'}</p>
                <p className="text-2xl font-bold mt-2 text-red-600">{reportData.inactive_users || 0}</p>
              </Card>
            </div>
            {reportData.user_growth && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">{language === 'ar' ? 'نمو المستخدمين' : 'User Growth'}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.user_growth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="users" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>
        );

      case 'companies':
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي الشركات' : 'Total Companies'}</p>
                <p className="text-2xl font-bold mt-2">{reportData.total_companies || 0}</p>
              </Card>
              {reportData.by_status && Object.entries(reportData.by_status).map(([status, count]) => (
                <Card key={status} className="p-4">
                  <p className="text-sm text-muted-foreground capitalize">{status}</p>
                  <p className="text-2xl font-bold mt-2">{count}</p>
                </Card>
              ))}
            </div>
            <Card className="p-6 overflow-x-auto">
              <h3 className="text-lg font-semibold mb-4">{language === 'ar' ? 'قائمة الشركات' : 'Companies List'}</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">{language === 'ar' ? 'الشركة' : 'Company'}</th>
                    <th className="text-left py-2 px-2">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th className="text-left py-2 px-2">{language === 'ar' ? 'الخطة' : 'Plan'}</th>
                    <th className="text-right py-2 px-2">{language === 'ar' ? 'منتجات' : 'Products'}</th>
                    <th className="text-right py-2 px-2">{language === 'ar' ? 'مندوبون' : 'Reps'}</th>
                    <th className="text-right py-2 px-2">{language === 'ar' ? 'طلبات' : 'Orders'}</th>
                    <th className="text-right py-2 px-2">{language === 'ar' ? 'إيرادات' : 'Revenue'}</th>
                  </tr>
                </thead>
                <tbody>
                  {(reportData.companies || []).map((c) => (
                    <tr key={c.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2 font-medium">{c.name}</td>
                      <td className="py-2 px-2 capitalize">{c.vendor_status}</td>
                      <td className="py-2 px-2">{c.plan_name || (c.plan ? (language === 'ar' ? c.plan.name_ar : c.plan.name) : null) || '—'}</td>
                      <td className="py-2 px-2 text-right">{c.company_products_count ?? 0}</td>
                      <td className="py-2 px-2 text-right">{c.representatives_count ?? 0}</td>
                      <td className="py-2 px-2 text-right">{c.company_orders_count ?? 0}</td>
                      <td className="py-2 px-2 text-right">{Number(c.revenue || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!reportData.companies || reportData.companies.length === 0) && (
                <p className="text-muted-foreground py-4 text-center">{language === 'ar' ? 'لا توجد شركات' : 'No companies'}</p>
              )}
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="w-8 h-8" />
          {language === 'ar' ? 'التقارير' : 'Reports'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === 'ar' ? 'إنشاء وعرض التقارير التفصيلية' : 'Generate and view detailed reports'}
        </p>
      </motion.div>

      {/* استخراج تقارير الجداول — نوع التقرير، نطاق، أعمدة، تصدير Excel/CSV */}
      <Card className="overflow-hidden border-2 border-primary/20 bg-linear-to-br from-card to-primary/5">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <Table2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">
                {language === 'ar' ? 'استخراج تقرير شامل من الجداول' : 'Export detailed table report'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'اختر نوع التقرير (طبيب، متجر، شركة، مندوب، سائق) ونطاقه وما تريد تضمينه، ثم حمّل Excel أو CSV' : 'Choose report type, scope, and columns to include, then download as Excel or CSV'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'ar' ? 'نوع التقرير' : 'Report type'}
              </label>
              <select
                value={tableReportType}
                onChange={(e) => setTableReportType(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {TABLE_REPORT_TYPES.map((r) => (
                  <option key={r.key} value={r.key}>
                    {language === 'ar' ? r.labelAr : r.labelEn}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'ar' ? 'نطاق التقرير' : 'Scope'}
              </label>
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tableScope"
                    checked={tableScope === 'all'}
                    onChange={() => setTableScope('all')}
                    className="rounded-full"
                  />
                  <span className="text-sm">{language === 'ar' ? 'الكل' : 'All'}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tableScope"
                    checked={tableScope === 'one'}
                    onChange={() => setTableScope('one')}
                    className="rounded-full"
                  />
                  <span className="text-sm">{language === 'ar' ? 'سجل واحد' : 'One record'}</span>
                </label>
              </div>
            </div>
            {tableScope === 'one' && (
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">
                  {language === 'ar' ? 'اختر السجل' : 'Select record'}
                </label>
                <select
                  value={tableEntityId}
                  onChange={(e) => setTableEntityId(e.target.value)}
                  disabled={loadingEntities}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">
                    {loadingEntities
                      ? (language === 'ar' ? 'جاري التحميل...' : 'Loading...')
                      : (language === 'ar' ? '— اختر —' : '— Select —')}
                  </option>
                  {entityList.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name || item.user?.username || item.user?.email || `ID ${item.id}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-1.5">
              <ListChecks className="h-4 w-4" />
              {language === 'ar' ? 'ما الذي تريد تضمينه في التقرير؟' : 'What to include in the report?'}
            </p>
            <div className="flex flex-wrap gap-3 rounded-lg border bg-muted/30 p-4">
              {tableReportColumns.map((col) => (
                <label key={col.accessorKey} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedColumns[col.accessorKey] !== false}
                    onChange={(e) =>
                      setSelectedColumns((prev) => ({ ...prev, [col.accessorKey]: e.target.checked }))
                    }
                    className="rounded border-input"
                  />
                  <span className="text-sm">{getColumnHeader(col, language)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">
                {language === 'ar' ? 'تنسيق التحميل' : 'Download format'}
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="exportFormat"
                    checked={exportFormat === 'excel'}
                    onChange={() => setExportFormat('excel')}
                    className="rounded-full"
                  />
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{language === 'ar' ? 'Excel (منسق)' : 'Excel (formatted)'}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="exportFormat"
                    checked={exportFormat === 'csv'}
                    onChange={() => setExportFormat('csv')}
                    className="rounded-full"
                  />
                  <FileDown className="h-4 w-4" />
                  <span className="text-sm">CSV</span>
                </label>
              </div>
            </div>
            <Button
              onClick={handleTableExport}
              disabled={loadingExport || (tableScope === 'one' && !tableEntityId)}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {loadingExport
                ? (language === 'ar' ? 'جاري الاستخراج...' : 'Exporting...')
                : (language === 'ar' ? 'استخراج التقرير' : 'Export report')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold mt-8 mb-2">
        {language === 'ar' ? 'تقارير لوحة التحكم والإحصائيات' : 'Dashboard & statistics reports'}
      </h2>

      {/* Date Range Filter */}
      <Card className="p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">{language === 'ar' ? 'من:' : 'From:'}</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="p-2 border rounded-lg"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">{language === 'ar' ? 'إلى:' : 'To:'}</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="p-2 border rounded-lg"
            />
          </div>
        </div>
      </Card>

      {/* Report Types Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          const isSelected = selectedReport === report.key;
          return (
            <motion.div
              key={report.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className={`p-6 cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-lg'
                }`}
                onClick={() => fetchReport(report.key)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-${report.color}-100 dark:bg-${report.color}-900/20 flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${report.color}-600 dark:text-${report.color}-400`} />
                  </div>
                  {isSelected && loading && (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary"></div>
                  )}
                </div>
                <h3 className="font-semibold text-lg mb-2">{report.label}</h3>
                <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
                <div className="flex gap-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchReport(report.key);
                    }}
                    disabled={loading}
                    className="flex-1"
                    variant={isSelected ? 'default' : 'outline'}
                  >
                    {loading && isSelected 
                      ? (language === 'ar' ? 'جاري التحميل...' : 'Loading...') 
                      : (language === 'ar' ? 'عرض التقرير' : 'View Report')}
                  </Button>
                  {isSelected && reportData && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExport(report.key);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Report Content */}
      {selectedReport && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {loading ? (
            <Card className="p-12">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            </Card>
          ) : reportData ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  {reportTypes.find(r => r.key === selectedReport)?.label}
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleExport(selectedReport, 'pdf')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'تصدير PDF' : 'Export PDF'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExport(selectedReport, 'excel')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'تصدير Excel' : 'Export Excel'}
                  </Button>
                </div>
              </div>
              {renderReportContent()}
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center text-muted-foreground">
                {language === 'ar' ? 'لا توجد بيانات متاحة' : 'No data available'}
              </div>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}
