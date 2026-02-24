import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { getImageSrc } from '@/lib/imageUtils';
import showToast from '@/lib/toast';
import { showConfirm } from '@/components/ConfirmDialog';
import { Edit, Trash2, Eye, MoreHorizontal, AlertCircle, RefreshCw, Building2, Store } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminProducts() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [filters, setFilters] = useState({
    type: 'market',
    category: '',
    shop: '',
    status: '',
  });

  useEffect(() => {
    fetchProducts();
  }, [filters.type]);

  const fetchProducts = async () => {
    setFetchError(null);
    setLoading(true);
    try {
      const response = await api.get('/admin/products', {
        params: { type: filters.type || 'market' },
      });
      setProducts(extractDataFromResponse(response));
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setFetchError(error.response?.data?.message || (language === 'ar' ? 'فشل تحميل المنتجات.' : 'Failed to load products.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = useCallback((id) => {
    const msg = language === 'ar' ? 'هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع.' : 'Are you sure you want to delete this product? This action cannot be undone.';
    showConfirm(msg, () => {
      api.delete(`/admin/products/${id}`)
        .then(() => {
          showToast.success(language === 'ar' ? 'تم الحذف.' : 'Product deleted.');
          fetchProducts();
        })
        .catch((error) => {
          showToast.error(error.response?.data?.message || (language === 'ar' ? 'فشل الحذف.' : 'Failed to delete product'));
        });
    });
  }, [language]);

  const isCompanyProduct = (row) => row.original.product_source === 'company';

  const filterOptions = useMemo(() => [
    {
      key: 'type',
      label: language === 'ar' ? 'نوع المنتجات' : 'Product type',
      options: [
        { value: 'market', label: language === 'ar' ? 'منتجات المتاجر' : 'Shop products' },
        { value: 'company', label: language === 'ar' ? 'منتجات الشركات' : 'Company products' },
      ],
    },
    {
      key: 'status',
      label: language === 'ar' ? 'الحالة' : 'Status',
      options: [
        { value: 'active', label: language === 'ar' ? 'نشط' : 'Active' },
        { value: 'inactive', label: language === 'ar' ? 'غير نشط' : 'Inactive' },
        { value: 'out_of_stock', label: language === 'ar' ? 'نفد' : 'Out of Stock' },
      ],
    },
  ], [language]);

  const columns = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'ID',
    },
    {
      id: 'image',
      header: language === 'ar' ? 'الصورة' : 'Image',
      cell: ({ row }) => {
        const url = row.original.first_image_url || (Array.isArray(row.original.images) && row.original.images[0]) || null;
        const src = getImageSrc(url);
        if (!src) return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <img
            src={src}
            alt=""
            className="h-10 w-10 rounded object-cover border"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        );
      },
    },
    {
      accessorKey: 'name',
      header: language === 'ar' ? 'الاسم' : 'Name',
    },
    {
      accessorKey: 'price',
      header: language === 'ar' ? 'السعر' : 'Price',
      cell: ({ row }) => {
        const p = Number(row.original.unit_price ?? row.original.price ?? 0);
        return p > 0 ? `${p.toFixed(2)}` : '—';
      },
    },
    {
      accessorKey: 'stock',
      header: language === 'ar' ? 'المخزون' : 'Stock',
      cell: ({ row }) => row.original.stock_quantity ?? row.original.stock ?? '-',
    },
    {
      accessorKey: 'category',
      header: language === 'ar' ? 'الفئة' : 'Category',
      cell: ({ row }) => row.original.category?.name || '-',
    },
    {
      accessorKey: 'shop',
      header: language === 'ar' ? 'المتجر / الشركة' : 'Shop',
      cell: ({ row }) => row.original.shop?.name || '-',
    },
    {
      accessorKey: 'status',
      header: language === 'ar' ? 'الحالة' : 'Status',
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          row.original.status === 'active' ? 'bg-green-100 text-green-800' :
          row.original.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
          'bg-red-100 text-red-800'
        }`}>
          {row.original.status === 'active' ? (language === 'ar' ? 'نشط' : 'Active') :
           row.original.status === 'inactive' ? (language === 'ar' ? 'غير نشط' : 'Inactive') :
           (row.original.status || 'active')}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: language === 'ar' ? 'تاريخ الإنشاء' : 'Created At',
      cell: ({ row }) => {
        const date = row.original.created_at;
        return date ? format(new Date(date), 'MMM dd, yyyy') : '-';
      },
    },
    {
      id: 'actions',
      header: language === 'ar' ? 'إجراءات' : 'Actions',
      cell: ({ row }) => {
        const isCompany = isCompanyProduct(row);
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">{language === 'ar' ? 'فتح القائمة' : 'Open menu'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isCompany ? (
                <DropdownMenuItem onClick={() => navigate(`/admin/shops/${row.original.shop_id}`, { state: { tab: 'company-products' } })}>
                  <Eye className="mr-2 h-4 w-4" />
                  {language === 'ar' ? 'عرض في الشركة' : 'View in company'}
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => navigate(`/admin/products/${row.original.id}`)}>
                    <Eye className="mr-2 h-4 w-4" />
                    {language === 'ar' ? 'عرض' : 'View'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/admin/products/${row.original.id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    {language === 'ar' ? 'تعديل' : 'Edit'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDelete(row.original.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {language === 'ar' ? 'حذف' : 'Delete'}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [navigate, language, handleDelete]);

  const filteredData = useMemo(() => {
    return products.filter(product => {
      if (filters.status && product.status !== filters.status) return false;
      return true;
    });
  }, [products, filters]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {language === 'ar' ? 'المنتجات' : 'Products'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === 'ar' ? 'إدارة جميع المنتجات (متاجر وشركات)' : 'Manage all products (shops and companies)'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{language === 'ar' ? 'خطأ' : 'Error'}</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>{fetchError}</span>
            <Button variant="outline" size="sm" onClick={fetchProducts} className="gap-1">
              <RefreshCw className="h-3 w-3" />
              {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={filteredData}
        searchable
        searchPlaceholder={language === 'ar' ? 'البحث في المنتجات...' : 'Search products...'}
        filters={filterOptions}
        filterValues={filters}
        onFilterChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
        loading={loading}
        emptyTitle={language === 'ar' ? 'لا توجد منتجات.' : 'No products found.'}
        emptyDescription={language === 'ar' ? 'غيّر الفلتر أو البحث.' : 'Try changing filters or search.'}
      />
    </div>
  );
}
