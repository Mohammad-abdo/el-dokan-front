import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '@/lib/api';
import showToast from '@/lib/toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export default function AdminSupportTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [assignTo, setAssignTo] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchTicket();
    fetchAdmins();
  }, [id]);

  const fetchTicket = async () => {
    try {
      const response = await api.get(`/admin/support/tickets/${id}`);
      const data = response.data?.data || response.data;
      setTicket(data);
      setNewStatus(data?.status || 'open');
      setAssignTo(data?.assigned_to?.toString() || '');
    } catch (error) {
      console.error('Error fetching ticket:', error);
      showToast.error('Failed to load ticket');
      navigate('/admin/support');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/admin/users', { params: { role: 'admin', limit: 100 } });
      const list = res.data?.data?.data ?? res.data?.data ?? [];
      setAdmins(Array.isArray(list) ? list : []);
    } catch {
      setAdmins([]);
    }
  };

  const handleAssign = async () => {
    if (!assignTo) return;
    setAssigning(true);
    try {
      await api.post(`/admin/support/tickets/${id}/assign`, { assigned_to: parseInt(assignTo, 10) });
      showToast.success('Ticket assigned successfully');
      fetchTicket();
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to assign ticket');
    } finally {
      setAssigning(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    setUpdatingStatus(true);
    try {
      await api.put(`/admin/support/tickets/${id}/status`, { status: newStatus });
      showToast.success('Status updated successfully');
      setTicket(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!ticket) return null;

  const statusColor = {
    open: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
  }[ticket.status] || 'bg-gray-100 text-gray-800';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/support">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Ticket #{ticket.ticket_number || ticket.id}</h1>
          <p className="text-muted-foreground">{ticket.subject}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <Card className="p-4">
            <p className="text-muted-foreground whitespace-pre-wrap">{ticket.description || 'No description.'}</p>
            {ticket.created_at && (
              <p className="text-xs text-muted-foreground mt-2">
                Created {format(new Date(ticket.created_at), 'PPpp')}
              </p>
            )}
          </Card>

          {ticket.messages?.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4" /> Messages
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {ticket.messages.map((msg) => (
                  <div key={msg.id} className="flex gap-2 p-2 rounded bg-muted/50">
                    <User className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm font-medium">{msg.user?.name || 'User'}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {msg.created_at ? format(new Date(msg.created_at), 'PPp') : ''}
                      </span>
                      <p className="text-sm mt-1">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Status</h3>
            <span className={`inline-block px-2 py-1 rounded text-sm ${statusColor}`}>
              {ticket.status?.replace('_', ' ') || 'Open'}
            </span>
            <div className="mt-3 flex flex-wrap gap-2">
              <select
                className="border rounded px-2 py-1.5 text-sm w-full max-w-[180px]"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <Button size="sm" onClick={handleUpdateStatus} disabled={updatingStatus}>
                {updatingStatus ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Assign to</h3>
            {ticket.assigned_to && ticket.assignedTo && (
              <p className="text-sm text-muted-foreground mb-2">
                Current: {ticket.assignedTo.name || ticket.assignedTo.email}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <select
                className="border rounded px-2 py-1.5 text-sm flex-1 min-w-[120px]"
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
              >
                <option value="">Select admin</option>
                {admins.map((a) => (
                  <option key={a.id} value={a.id}>{a.name || a.email}</option>
                ))}
              </select>
              <Button size="sm" onClick={handleAssign} disabled={!assignTo || assigning}>
                {assigning ? 'Assigning...' : 'Assign'}
              </Button>
            </div>
          </Card>

          {ticket.user && (
            <Card className="p-4">
              <h3 className="font-semibold mb-2">User</h3>
              <p className="text-sm">{ticket.user.name || ticket.user.email}</p>
              {ticket.user.email && <p className="text-xs text-muted-foreground">{ticket.user.email}</p>}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
