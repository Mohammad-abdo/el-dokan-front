import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';

export default function RepresentativeClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { language } = useLanguage();

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/representative/clients', {
        params: search ? { search } : {},
      });
      const data = res.data?.data ?? res.data ?? [];
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    fetchClients();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {language === 'ar' ? 'العملاء' : 'Clients'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === 'ar' ? 'متاجر وعملاء من زياراتك' : 'Shops and clients from your visits'}
        </p>
      </div>

      <form onSubmit={onSearch} className="flex gap-2 max-w-md">
        <Input
          placeholder={language === 'ar' ? 'بحث بالاسم أو الهاتف...' : 'Search by name or phone...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium">
          {language === 'ar' ? 'بحث' : 'Search'}
        </button>
      </form>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-8">
              {language === 'ar' ? 'لا يوجد عملاء. قم بزيارات لظهور المتاجر هنا.' : 'No clients. Add visits to see shops here.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{c.name}</CardTitle>
                <CardDescription>{c.phone || '-'}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>{c.address || '-'}</p>
                {c.last_visit_date && (
                  <p className="mt-2">
                    {language === 'ar' ? 'آخر زيارة:' : 'Last visit:'} {c.last_visit_date} {c.last_visit_time || ''}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
