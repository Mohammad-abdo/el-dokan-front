import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import showToast from "@/lib/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Search, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      const params = { limit: 1000 };
      if (roleFilter !== "all") params.role = roleFilter;
      if (statusFilter !== "all") params.isActive = statusFilter === "active";

      const response = await api.get("/admin/users", { params });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    try {
      await api.put(`/admin/users/${id}/status`, { isActive: !currentStatus });
      await fetchUsers();
    } catch (error) {
      showToast.error(error.response?.data?.message || "Error updating user status");
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-purple-500/10 text-purple-600";
      case "doctor":
        return "bg-blue-500/10 text-blue-600";
      case "patient":
        return "bg-green-500/10 text-green-600";
      default:
        return "bg-gray-500/10 text-gray-600";
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
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
        <h1 className="text-3xl font-bold mb-2">Users Management</h1>
        <p className="text-muted-foreground">Manage all system users</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-input bg-background"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="doctor">Doctor</option>
              <option value="patient">Patient</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-input bg-background"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No users found</p>
              </div>
            ) : (
              filteredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
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
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">
                          {user.firstName} {user.lastName}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                        {user.isActive ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-600">
                            Inactive
                          </span>
                        )}
                        {user.isEmailVerified && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                      {user.phone && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Phone: {user.phone}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStatusToggle(user.id, user.isActive)}
                      className={`p-2 rounded-lg transition-colors ${
                        user.isActive
                          ? "hover:bg-red-500/10 text-red-600"
                          : "hover:bg-green-500/10 text-green-600"
                      }`}
                      title={user.isActive ? "Deactivate" : "Activate"}
                    >
                      {user.isActive ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
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
