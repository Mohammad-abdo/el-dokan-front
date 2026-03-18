import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Mail, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DataTable } from '@/components/DataTable';
import { format } from 'date-fns';

export default function AdminMessages() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({});

  const fetchConversations = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/admin/messages', { params: { page, per_page: 20 } });
      const data = res.data?.data ?? [];
      setConversations(Array.isArray(data) ? data : []);
      setMeta(res.data?.meta ?? {});
    } catch (e) {
      console.error(e);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const columns = [
    {
      id: 'user1',
      header: language === 'ar' ? 'المستخدم 1' : 'User 1',
      cell: ({ row }) => {
        const u = row.original.user1;
        return u ? (
          <span title={u.phone || u.email}>
            {u.username || u.name || u.phone || u.email || '-'}
          </span>
        ) : '-';
      },
    },
    {
      id: 'user2',
      header: language === 'ar' ? 'المستخدم 2' : 'User 2',
      cell: ({ row }) => {
        const u = row.original.user2;
        return u ? (
          <span title={u.phone || u.email}>
            {u.username || u.name || u.phone || u.email || '-'}
          </span>
        ) : '-';
      },
    },
    {
      id: 'last_message',
      header: language === 'ar' ? 'آخر رسالة' : 'Last message',
      cell: ({ row }) => {
        const last = row.original.last_message;
        if (!last) return '-';
        const preview =
          last.message_type === 'voice'
            ? (language === 'ar' ? 'رسالة صوتية' : 'Voice message')
            : (last.content || '').slice(0, 50);
        return (
          <span className="text-muted-foreground truncate block max-w-[200px]" title={last.content || preview}>
            {preview}
            {(last.content && last.content.length > 50) ? '...' : ''}
          </span>
        );
      },
    },
    {
      id: 'messages_count',
      header: language === 'ar' ? 'عدد الرسائل' : 'Count',
      cell: ({ row }) => row.original.messages_count ?? 0,
    },
    {
      id: 'date',
      header: language === 'ar' ? 'التاريخ' : 'Date',
      cell: ({ row }) => {
        const last = row.original.last_message;
        return last?.created_at
          ? format(new Date(last.created_at), language === 'ar' ? 'dd/MM/yyyy HH:mm' : 'MMM dd, yyyy HH:mm')
          : '-';
      },
    },
    {
      id: 'actions',
      header: language === 'ar' ? 'إجراءات' : 'Actions',
      cell: ({ row }) => {
        const u1 = row.original.user1?.id;
        const u2 = row.original.user2?.id;
        if (!u1 || !u2) return null;
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/admin/messages/conversation/${u1}/${u2}`)}
            className="gap-1"
          >
            <Eye className="h-4 w-4" />
            {language === 'ar' ? 'عرض' : 'View'}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Mail className="h-8 w-8" />
                {language === 'ar' ? 'الرسائل (المحادثات)' : 'Messages (Conversations)'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === 'ar'
                  ? 'عرض محادثات المستخدمين بين بعضهم - للاطلاع فقط'
                  : 'View user-to-user conversations - read only'}
              </p>
            </div>
            <Button onClick={() => fetchConversations()} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              {language === 'ar' ? 'تحديث' : 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={conversations}
        loading={loading}
        searchable
        searchPlaceholder={language === 'ar' ? 'بحث...' : 'Search...'}
        emptyTitle={language === 'ar' ? 'لا توجد محادثات' : 'No conversations'}
        emptyDescription={
          language === 'ar'
            ? 'لم يتبادل المستخدمون أي رسائل بعد.'
            : 'No user messages have been exchanged yet.'
        }
      />
    </div>
  );
}
