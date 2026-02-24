import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import showToast from "@/lib/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShoppingCart,
  Search,
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const params = statusFilter !== "all" ? { status: statusFilter } : {};
      const response = await api.get("/orders", {
        params: { ...params, limit: 1000 },
      });
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      await fetchOrders();
    } catch (error) {
      showToast.error(error.response?.data?.message || "Error updating order");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/10 text-green-600";
      case "processing":
        return "bg-blue-500/10 text-blue-600";
      case "shipped":
        return "bg-purple-500/10 text-purple-600";
      case "delivered":
        return "bg-teal-500/10 text-teal-600";
      case "cancelled":
        return "bg-red-500/10 text-red-600";
      default:
        return "bg-yellow-500/10 text-yellow-600";
    }
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.patient.user.firstName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      order.patient.user.lastName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      order.patient.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Orders</h1>
        <p className="text-muted-foreground">Manage patient orders</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-input bg-background"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No orders found</p>
              </div>
            ) : (
              filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-lg border border hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">
                          Order #{order.orderNumber}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.paymentStatus === "paid"
                              ? "bg-green-500/10 text-green-600"
                              : "bg-yellow-500/10 text-yellow-600"
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Patient: {order.patient.user.firstName}{" "}
                        {order.patient.user.lastName} (
                        {order.patient.user.email})
                      </p>
                      {order.items.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium mb-1">Items:</p>
                          <ul className="text-sm text-muted-foreground list-disc list-inside">
                            {order.items.map((item, idx) => (
                              <li key={idx}>
                                {item.medicine.name} - Qty: {item.quantity} ($
                                {item.subtotal.toFixed(2)})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-sm font-medium">
                          Total: ${order.totalAmount.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Date: {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {order.status === "pending" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(order.id, "confirmed")
                          }
                          className="p-2 rounded-lg hover:bg-green-500/10 text-green-600 transition-colors"
                          title="Confirm"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {order.status === "confirmed" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(order.id, "processing")
                          }
                          className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-600 transition-colors"
                          title="Start Processing"
                        >
                          <Package className="w-4 h-4" />
                        </button>
                      )}
                      {order.status === "processing" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(order.id, "shipped")
                          }
                          className="p-2 rounded-lg hover:bg-purple-500/10 text-purple-600 transition-colors"
                          title="Mark as Shipped"
                        >
                          <Truck className="w-4 h-4" />
                        </button>
                      )}
                      {order.status === "shipped" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(order.id, "delivered")
                          }
                          className="p-2 rounded-lg hover:bg-teal-500/10 text-teal-600 transition-colors"
                          title="Mark as Delivered"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
