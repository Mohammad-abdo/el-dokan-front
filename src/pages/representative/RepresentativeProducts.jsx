import { useState, useEffect } from 'react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export default function RepresentativeProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { language } = useLanguage();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/representative/products');
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
    { accessorKey: 'category', header: language === 'ar' ? 'الفئة' : 'Category' },
    {
      id: 'actions',
      header: language === 'ar' ? 'الإجراءات' : 'Actions',
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => navigate(`/representative/products/${row.original.id}`)}>
          <Eye className="w-4 h-4" />
        </Button>
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {language === 'ar' ? 'المنتجات' : 'Products'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === 'ar' ? 'عرض المنتجات المتاحة للزيارات' : 'View products available for visits'}
        </p>
      </div>

      <DataTable data={products} columns={columns} />
    </div>
  );
}

