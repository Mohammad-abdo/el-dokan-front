import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import showToast from "@/lib/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  const fetchAppointments = async () => {
    try {
      const params = statusFilter !== "all" ? { status: statusFilter } : {};
      const response = await api.get("/appointments", { params });
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/appointments/${id}/status`, { status });
      await fetchAppointments();
    } catch (error) {
      showToast.error(error.response?.data?.message || "Error updating appointment");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/10 text-green-600";
      case "completed":
        return "bg-blue-500/10 text-blue-600";
      case "cancelled":
        return "bg-red-500/10 text-red-600";
      case "no_show":
        return "bg-orange-500/10 text-orange-600";
      default:
        return "bg-yellow-500/10 text-yellow-600";
    }
  };

  const filteredAppointments = appointments.filter(
    (apt) =>
      apt.patient.user.firstName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      apt.patient.user.lastName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      apt.patient.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.doctor.user.firstName.toLowerCase().includes(searchTerm.toLowerCase())
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
        <h1 className="text-3xl font-bold mb-2">Appointments</h1>
        <p className="text-muted-foreground">Manage patient appointments</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search appointments..."
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
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No appointments found</p>
              </div>
            ) : (
              filteredAppointments.map((appointment, index) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-lg border border hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">
                          {appointment.patient.user.firstName}{" "}
                          {appointment.patient.user.lastName}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            appointment.status
                          )}`}
                        >
                          {appointment.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          <p>
                            <strong>Doctor:</strong> Dr.{" "}
                            {appointment.doctor.user.firstName}{" "}
                            {appointment.doctor.user.lastName}
                          </p>
                          <p>
                            <strong>Specialization:</strong>{" "}
                            {appointment.doctor.specialization}
                          </p>
                        </div>
                        <div>
                          <p>
                            <strong>Date:</strong>{" "}
                            {new Date(
                              appointment.appointmentDate
                            ).toLocaleDateString()}
                          </p>
                          <p>
                            <strong>Time:</strong> {appointment.appointmentTime}
                          </p>
                        </div>
                      </div>
                      {appointment.reason && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <strong>Reason:</strong> {appointment.reason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {appointment.status === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              handleStatusUpdate(appointment.id, "confirmed")
                            }
                            className="p-2 rounded-lg hover:bg-green-500/10 text-green-600 transition-colors"
                            title="Confirm"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleStatusUpdate(appointment.id, "cancelled")
                            }
                            className="p-2 rounded-lg hover:bg-red-500/10 text-red-600 transition-colors"
                            title="Cancel"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {appointment.status === "confirmed" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(appointment.id, "completed")
                          }
                          className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-600 transition-colors"
                          title="Mark Complete"
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
