import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/lib/api";
import showToast from "@/lib/toast";
import { showConfirm } from "@/components/ConfirmDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Search, Eye, Edit, Trash2, AlertCircle } from "lucide-react";

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await api.get("/patients");
      const patientsData = response.data?.patients || response.data || [];
      setPatients(Array.isArray(patientsData) ? patientsData : []);
    } catch (error) {
      console.error("Error fetching patients:", error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    showConfirm(
      "Are you sure you want to delete this patient? This will also delete their user account.",
      async () => {
        try {
          await api.delete(`/patients/${id}`);
          await fetchPatients();
        } catch (error) {
          showToast.error(error.response?.data?.message || "Error deleting patient");
        }
      }
    );
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patientId.toLowerCase().includes(searchTerm.toLowerCase())
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
        <h1 className="text-3xl font-bold mb-2">Patients</h1>
        <p className="text-muted-foreground">
          Manage patient records and view complete profiles
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No patients found</p>
              </div>
            ) : (
              filteredPatients.map((patient, index) => (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-lg border border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {patient.user.firstName} {patient.user.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {patient.user.email}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>ID: {patient.patientId}</span>
                        {patient.bloodGroup && (
                          <span>Blood: {patient.bloodGroup}</span>
                        )}
                        {patient.height && (
                          <span>Height: {patient.height}cm</span>
                        )}
                        {patient.weight && (
                          <span>Weight: {patient.weight}kg</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        navigate(`/dashboard/patients/${patient.id}`)
                      }
                      className="p-2 rounded-lg hover:bg-accent transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(patient.id)}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
