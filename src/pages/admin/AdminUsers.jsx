import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";
import { extractDataFromResponse } from "@/lib/apiHelper";
import showToast from "@/lib/toast";
import { showConfirm } from "@/components/ConfirmDialog";
import { Plus, Edit, Trash2, Eye, UserCheck, UserX, MoreHorizontal, AlertCircle, RefreshCw } from "lucide-react";
import { format } from "date-fns";

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    role: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setFetchError(null);
    try {
      const response = await api.get("/admin/users");
      setUsers(extractDataFromResponse(response));
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
      setFetchError(error.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id) => {
    try {
      await api.post(`/admin/users/${id}/activate`);
      showToast.success("User activated.");
      fetchUsers();
    } catch (error) {
      console.error("Error activating user:", error);
      showToast.error(error.response?.data?.message || "Failed to activate user");
    }
  };

  const handleSuspend = async (id) => {
    try {
      await api.post(`/admin/users/${id}/suspend`);
      showToast.success("User suspended.");
      fetchUsers();
    } catch (error) {
      console.error("Error suspending user:", error);
      showToast.error(error.response?.data?.message || "Failed to suspend user");
    }
  };

  const handleDelete = (id) => {
    showConfirm(
      "Are you sure you want to delete this user? This action cannot be undone.",
      () => {
        api
          .delete(`/admin/users/${id}`)
          .then(() => {
            showToast.success("User deleted.");
            fetchUsers();
          })
          .catch((error) => {
            showToast.error(error.response?.data?.message || "Failed to delete user");
          });
      }
    );
  };

  const filterOptions = [
    {
      key: "status",
      label: "Status",
      options: [
        { value: "active", label: "Active" },
        { value: "suspended", label: "Suspended" },
        { value: "inactive", label: "Inactive" },
      ],
    },
    {
      key: "role",
      label: "Role",
      options: [
        { value: "user", label: "User" },
        { value: "doctor", label: "Doctor" },
        { value: "shop", label: "Shop" },
        { value: "driver", label: "Driver" },
        { value: "representative", label: "Representative" },
        { value: "admin", label: "Admin" },
      ],
    },
  ];

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "ID",
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => row.original.name || row.original.fullName || "-",
      },
      {
        accessorKey: "email",
        header: "Email",
      },
      {
        accessorKey: "phone",
        header: "Phone",
      },
      {
        accessorKey: "user_type",
        header: "Type",
        cell: ({ row }) => {
          const type = row.original.user_type ?? (['doctor', 'shop', 'driver', 'representative'].includes(row.original.role) ? 'service_provider' : row.original.role === 'admin' ? 'admin' : 'user');
          const label = type === 'service_provider' ? 'Service Provider' : type === 'admin' ? 'Admin' : 'User';
          const color = type === 'service_provider' ? 'bg-amber-100 text-amber-800' : type === 'admin' ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-800';
          return (
            <span className={`px-2 py-1 rounded-full text-xs ${color}`}>
              {label}
            </span>
          );
        },
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary capitalize">
            {row.original.role || row.original.service_provider_type || "user"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status || "active";
          const colors = {
            active: "bg-green-100 text-green-800",
            suspended: "bg-red-100 text-red-800",
            inactive: "bg-gray-100 text-gray-800",
          };
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                colors[status] || colors.active
              }`}
            >
              {status}
            </span>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: "Created At",
        cell: ({ row }) => {
          const date = row.original.created_at;
          return date ? format(new Date(date), "MMM dd, yyyy") : "-";
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/admin/users/${row.original.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              {row.original.status !== "active" ? (
                <DropdownMenuItem onClick={() => handleActivate(row.original.id)}>
                  <UserCheck className="mr-2 h-4 w-4 text-green-600" />
                  Activate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handleSuspend(row.original.id)}>
                  <UserX className="mr-2 h-4 w-4 text-red-600" />
                  Suspend
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(row.original.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [navigate, handleActivate, handleSuspend, handleDelete]
  );

  const filteredData = useMemo(() => {
    return users.filter((user) => {
      if (filters.status && user.status !== filters.status) return false;
      if (filters.role && user.role !== filters.role) return false;
      return true;
    });
  }, [users, filters]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Users</h1>
              <p className="text-muted-foreground mt-1">Manage all users</p>
            </div>
            <Button onClick={() => navigate("/admin/users/new")}>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </CardContent>
      </Card>

      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>{fetchError}</span>
            <Button variant="outline" size="sm" onClick={fetchUsers} className="gap-1">
              <RefreshCw className="h-3 w-3" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={filteredData}
        searchable
        searchPlaceholder="Search users..."
        filters={filterOptions}
        filterValues={filters}
        onFilterChange={(key, value) =>
          setFilters((prev) => ({ ...prev, [key]: value }))
        }
        loading={loading}
        emptyTitle="No users found."
        emptyDescription="Try changing filters or search."
      />
    </div>
  );
}
