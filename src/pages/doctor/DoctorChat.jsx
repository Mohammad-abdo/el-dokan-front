import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import showToast from '@/lib/toast';
import { extractDataFromResponse } from '@/lib/apiHelper';
import { Send, MessageSquare, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function DoctorChat() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
      // Auto-scroll to bottom when messages change
      scrollToBottom();
    }
  }, [selectedConversation, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await api.get('/doctor/chat/conversations');
      const data = extractDataFromResponse(response);
      // Handle different response structures
      const conversationsList = Array.isArray(data) 
        ? data 
        : Object.values(data).flat();
      setConversations(conversationsList);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (patientId) => {
    try {
      const response = await api.get(`/doctor/chat/${patientId}/conversation`);
      const messagesData = extractDataFromResponse(response);
      // Handle paginated response
      const messagesList = Array.isArray(messagesData?.data) 
        ? messagesData.data 
        : Array.isArray(messagesData) 
          ? messagesData 
          : [];
      setMessages(messagesList.reverse()); // Reverse to show oldest first
      
      // Find patient info from conversations
      const conversation = conversations.find(
        conv => (conv.patient_id || conv.id || conv.sender?.id || conv.receiver?.id) === patientId
      );
      if (conversation) {
        setSelectedPatient(
          conversation.patient || 
          conversation.sender || 
          conversation.receiver ||
          { name: 'Patient' }
        );
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      await api.post(`/doctor/chat/${selectedConversation}/send`, { 
        message: newMessage.trim() 
      });
      setNewMessage('');
      // Refresh messages
      await fetchMessages(selectedConversation);
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      showToast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSelectConversation = (conv) => {
    const patientId = conv.patient_id || conv.id || conv.sender?.id || conv.receiver?.id;
    setSelectedConversation(patientId);
    setSelectedPatient(conv.patient || conv.sender || conv.receiver || { name: 'Patient' });
  };

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
        <h1 className="text-3xl font-bold tracking-tight">Chat</h1>
        <p className="text-muted-foreground mt-2">Communicate with your patients</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="border rounded-lg p-4 overflow-y-auto bg-card"
        >
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Conversations
          </h2>
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv, index) => {
                const patientId = conv.patient_id || conv.id || conv.sender?.id || conv.receiver?.id;
                const patient = conv.patient || conv.sender || conv.receiver;
                const isSelected = selectedConversation === patientId;
                
                return (
                  <motion.div
                    key={patientId || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSelectConversation(conv)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-primary text-primary-foreground shadow-lg' 
                        : 'bg-accent hover:bg-accent/80'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {patient?.name || patient?.username || 'Patient'}
                        </p>
                        {conv.last_message && (
                          <p className="text-xs opacity-75 truncate">
                            {conv.last_message}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Chat Area */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 border rounded-lg flex flex-col bg-card"
        >
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="border-b p-4 bg-accent/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {selectedPatient?.name || selectedPatient?.username || 'Patient'}
                    </p>
                    {selectedPatient?.email && (
                      <p className="text-xs text-muted-foreground">{selectedPatient.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isDoctorMessage = msg.sender_id !== selectedConversation;
                      const messageDate = msg.created_at ? new Date(msg.created_at) : new Date();
                      
                      return (
                        <motion.div
                          key={msg.id || index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: index * 0.02 }}
                          className={`flex ${isDoctorMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${
                            isDoctorMessage 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-accent'
                          }`}>
                            <p className="break-words">{msg.message || msg.content || ''}</p>
                            <p className={`text-xs mt-1 ${
                              isDoctorMessage ? 'opacity-75' : 'opacity-60'
                            }`}>
                              {format(messageDate, 'HH:mm')}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t p-4 bg-accent/30">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!newMessage.trim() || sending}
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
