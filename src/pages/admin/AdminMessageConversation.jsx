import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';

export default function AdminMessageConversation() {
  const { user1, user2 } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user1 || !user2) return;
    const fetchConversation = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/admin/messages/conversation/${user1}/${user2}`);
        setData(res.data?.data ?? null);
      } catch (e) {
        console.error(e);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchConversation();
  }, [user1, user2]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/admin/messages')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {language === 'ar' ? 'رجوع' : 'Back'}
        </Button>
        <p className="text-muted-foreground">{language === 'ar' ? 'المحادثة غير متوفرة' : 'Conversation not found'}</p>
      </div>
    );
  }

  const { user1: u1, user2: u2, messages } = data;
  const list = Array.isArray(messages) ? [...messages].reverse() : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin/messages')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {language === 'ar' ? 'رجوع للرسائل' : 'Back to messages'}
        </Button>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {u1 && (
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {u1.username || u1.phone} {u1.id === Number(user1) ? '' : `(ID: ${u1.id})`}
            </span>
          )}
          <span>{language === 'ar' ? '↔' : '↔'}</span>
          {u2 && (
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {u2.username || u2.phone} {u2.id === Number(user2) ? '' : `(ID: ${u2.id})`}
            </span>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4">
            {language === 'ar' ? 'سجل المحادثة' : 'Conversation thread'}
          </h2>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {list.length === 0 ? (
              <p className="text-muted-foreground">{language === 'ar' ? 'لا توجد رسائل' : 'No messages'}</p>
            ) : (
              list.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1 p-3 rounded-lg ${
                    msg.sender_id === Number(user1) ? 'bg-muted/60 ml-0 mr-auto max-w-[85%]' : 'bg-primary/10 ml-auto mr-0 max-w-[85%]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{msg.sender?.username || msg.sender_id}</span>
                    <span>{msg.created_at ? format(new Date(msg.created_at), 'dd/MM/yyyy HH:mm') : ''}</span>
                  </div>
                  {msg.message_type === 'voice' ? (
                    <span className="text-sm">
                      {language === 'ar' ? 'رسالة صوتية' : 'Voice message'}
                      {msg.voice_url && (
                        <a href={msg.voice_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-xs underline">Play</a>
                      )}
                    </span>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content || '-'}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
