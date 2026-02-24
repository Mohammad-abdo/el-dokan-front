import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import showToast from "@/lib/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchPrescriptions();
  }, [statusFilter]);

  const fetchPrescriptions = async () => {
    try {
      const params = statusFilter !== "all" ? { status: statusFilter } : {};
      const response = await api.get("/prescriptions", {
        params: { ...params, limit: 1000 },
      });
      setPrescriptions(response.data.prescriptions || []);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id, status) => {
    try {
      await api.put(`/prescriptions/${id}/verify`, { status });
      await fetchPrescriptions();
    } catch (error) {
      showToast.error(error.response?.data?.message || "Error verifying prescription");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "verified":
        return "bg-green-500/10 text-green-600";
      case "rejected":
        return "bg-red-500/10 text-red-600";
      case "fulfilled":
        return "bg-blue-500/10 text-blue-600";
      default:
        return "bg-yellow-500/10 text-yellow-600";
    }
  };

  const filteredPrescriptions = prescriptions.filter(
    (prescription) =>
      prescription.patient.user.firstName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      prescription.patient.user.lastName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      prescription.patient.user.email
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
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
        <h1 className="text-3xl font-bold mb-2">Prescriptions</h1>
        <p className="text-muted-foreground">Manage and verify prescriptions</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search prescriptions..."
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
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
              <option value="fulfilled">Fulfilled</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredPrescriptions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No prescriptions found</p>
              </div>
            ) : (
              filteredPrescriptions.map((prescription, index) => (
                <motion.div
                  key={prescription.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-lg border border hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">
                          {prescription.patient.user.firstName}{" "}
                          {prescription.patient.user.lastName}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            prescription.status
                          )}`}
                        >
                          {prescription.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Patient: {prescription.patient.user.email}
                      </p>
                      {prescription.items.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium mb-1">Medicines:</p>
                          <ul className="text-sm text-muted-foreground list-disc list-inside">
                            {prescription.items.map((item, idx) => (
                              <li key={idx}>
                                {item.medicine.name} - Qty: {item.quantity}
                                {item.dosage && ` (${item.dosage})`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {prescription.verifiedAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Verified:{" "}
                          {new Date(prescription.verifiedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {prescription.status === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              handleVerify(prescription.id, "verified")
                            }
                            className="p-2 rounded-lg hover:bg-green-500/10 text-green-600 transition-colors"
                            title="Verify"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleVerify(prescription.id, "rejected")
                            }
                            className="p-2 rounded-lg hover:bg-red-500/10 text-red-600 transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <a
                        href={prescription.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-accent transition-colors"
                        title="View Image"
                      >
                        <FileText className="w-4 h-4" />
                      </a>
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
