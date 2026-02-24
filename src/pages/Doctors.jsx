import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import showToast from "@/lib/toast";
import { showConfirm } from "@/components/ConfirmDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  UserCog,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [formData, setFormData] = useState({
    userId: "",
    specialization: "",
    licenseNumber: "",
    yearsOfExperience: "",
    consultationFee: "",
    bio: "",
  });

  useEffect(() => {
    fetchDoctors();
    fetchUsers();
  }, [statusFilter]);

  const fetchDoctors = async () => {
    try {
      const params = statusFilter !== "all" ? { status: statusFilter } : {};
      const response = await api.get("/doctors", { params });
      setDoctors(response.data.doctors || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/admin/users", {
        params: { role: "doctor", limit: 1000 },
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDoctor) {
        await api.put(`/doctors/${editingDoctor.id}`, {
          ...formData,
          yearsOfExperience: parseInt(formData.yearsOfExperience),
          consultationFee: parseFloat(formData.consultationFee),
        });
      } else {
        await api.post("/doctors", {
          ...formData,
          yearsOfExperience: parseInt(formData.yearsOfExperience),
          consultationFee: parseFloat(formData.consultationFee),
        });
      }
      await fetchDoctors();
      setShowForm(false);
      setEditingDoctor(null);
      setFormData({
        userId: "",
        specialization: "",
        licenseNumber: "",
        yearsOfExperience: "",
        consultationFee: "",
        bio: "",
      });
    } catch (error) {
      showToast.error(error.response?.data?.message || "Error saving doctor");
    }
  };

  const handleEdit = (doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      userId: doctor.user.id,
      specialization: doctor.specialization,
      licenseNumber: doctor.licenseNumber,
      yearsOfExperience: doctor.yearsOfExperience.toString(),
      consultationFee: doctor.consultationFee.toString(),
      bio: doctor.bio || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    showConfirm("Are you sure you want to delete this doctor?", async () => {
      try {
        await api.delete(`/doctors/${id}`);
        await fetchDoctors();
      } catch (error) {
        showToast.error(error.response?.data?.message || "Error deleting doctor");
      }
    });
  };

  const handleStatusUpdate = async (id, status, rejectionReason) => {
    try {
      await api.put(`/doctors/${id}/status`, { status, rejectionReason });
      await fetchDoctors();
    } catch (error) {
      showToast.error(error.response?.data?.message || "Error updating doctor status");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-500/10 text-green-600";
      case "rejected":
        return "bg-red-500/10 text-red-600";
      default:
        return "bg-yellow-500/10 text-yellow-600";
    }
  };

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Doctors</h1>
          <p className="text-muted-foreground">
            Manage doctors and their verification status
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingDoctor(null);
            setFormData({
              userId: "",
              specialization: "",
              licenseNumber: "",
              yearsOfExperience: "",
              consultationFee: "",
              bio: "",
            });
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Doctor
        </motion.button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>
                {editingDoctor ? "Edit Doctor" : "Add New Doctor"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingDoctor && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      User *
                    </label>
                    <select
                      value={formData.userId}
                      onChange={(e) =>
                        setFormData({ ...formData, userId: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select a doctor user</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Specialization *
                    </label>
                    <input
                      type="text"
                      value={formData.specialization}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specialization: e.target.value,
                        })
                      }
                      required
                      className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      License Number *
                    </label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          licenseNumber: e.target.value,
                        })
                      }
                      required
                      className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      value={formData.yearsOfExperience}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          yearsOfExperience: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Consultation Fee
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.consultationFee}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          consultationFee: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                  >
                    {editingDoctor ? "Update" : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingDoctor(null);
                      setFormData({
                        userId: "",
                        specialization: "",
                        licenseNumber: "",
                        yearsOfExperience: "",
                        consultationFee: "",
                        bio: "",
                      });
                    }}
                    className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search doctors..."
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
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredDoctors.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No doctors found</p>
              </div>
            ) : (
              filteredDoctors.map((doctor, index) => (
                <motion.div
                  key={doctor.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-lg border border hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">
                          Dr. {doctor.user.firstName} {doctor.user.lastName}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            doctor.status
                          )}`}
                        >
                          {doctor.status}
                        </span>
                        {doctor.isVerified && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600">
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          <p>
                            <strong>Email:</strong> {doctor.user.email}
                          </p>
                          <p>
                            <strong>Specialization:</strong>{" "}
                            {doctor.specialization}
                          </p>
                          <p>
                            <strong>License:</strong> {doctor.licenseNumber}
                          </p>
                        </div>
                        <div>
                          <p>
                            <strong>Experience:</strong>{" "}
                            {doctor.yearsOfExperience} years
                          </p>
                          <p>
                            <strong>Consultation Fee:</strong> $
                            {doctor.consultationFee.toFixed(2)}
                          </p>
                          <p>
                            <strong>Doctor ID:</strong> {doctor.doctorId}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doctor.status === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              handleStatusUpdate(doctor.id, "approved")
                            }
                            className="p-2 rounded-lg hover:bg-green-500/10 text-green-600 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt("Rejection reason:");
                              if (reason)
                                handleStatusUpdate(
                                  doctor.id,
                                  "rejected",
                                  reason
                                );
                            }}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-red-600 transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleEdit(doctor)}
                        className="p-2 rounded-lg hover:bg-accent transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doctor.id)}
                        className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
