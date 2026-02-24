import { useState, useEffect } from 'react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ShopProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { language } = useLanguage();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/shop/products');
      setProducts(extractDataFromResponse(response));
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { accessorKey: 'id', header: language === 'ar' ? 'ID' : 'ID' },
    { accessorKey: 'name', header: language === 'ar' ? 'الاسم' : 'Name' },
    { accessorKey: 'price', header: language === 'ar' ? 'السعر' : 'Price', cell: ({ row }) => `$${row.original.price}` },
    { accessorKey: 'stock', header: language === 'ar' ? 'المخزون' : 'Stock' },
    { accessorKey: 'status', header: language === 'ar' ? 'الحالة' : 'Status' },
    {
      id: 'actions',
      header: language === 'ar' ? 'الإجراءات' : 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/shop/products/${row.original.id}`)}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/shop/products/${row.original.id}/edit`)}>
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {language === 'ar' ? 'المنتجات' : 'Products'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === 'ar' ? 'إدارة منتجاتك' : 'Manage your products'}
          </p>
        </div>
        <Button onClick={() => navigate('/shop/products/new')}>
          <Plus className="w-4 h-4 mr-2" />
          {language === 'ar' ? 'إضافة منتج' : 'Add Product'}
        </Button>
      </div>

      <DataTable data={products} columns={columns} />
    </div>
  );
}

