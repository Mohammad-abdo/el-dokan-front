import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { showConfirm } from "@/components/ConfirmDialog";
import { deleteAdmin, listAdmins } from "../../services/admin-service";
import { AdminTable } from "../../components/admin/AdminTable";
import { PermissionGuard } from "../../routes/PermissionGuard";

const AdminListPage = () => {
  const queryClient = useQueryClient();
  const [statusMessage, setStatusMessage] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admins"],
    queryFn: () => listAdmins(),
  });

  const [deletingId, setDeletingId] = useState(null);

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      setStatusMessage("Admin deleted successfully.");
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete admin. Please try again.";
      setStatusMessage(message);
    },
    onSettled: () => setDeletingId(null),
  });

  const handleDelete = (id) => {
    showConfirm(
      "Are you sure you want to remove this admin? This action cannot be undone.",
      () => {
        setDeletingId(id);
        deleteMutation.mutate(id);
      }
    );
  };

  const admins = data?.data ?? [];

  return (
    <PermissionGuard permission="admins">
      <section className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">
              Admins Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Create, update, or remove administrator accounts.
            </p>
          </div>
          <Link
            to="/admins/create"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            + New Admin
          </Link>
        </div>

        {statusMessage ? (
          <div className="rounded-xl border border-white/10 bg-gradient-to-r from-[#173468]/20 via-white/10 to-[#C7A46A]/20 px-4 py-3 text-sm text-muted-foreground shadow backdrop-blur">
            {statusMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex h-56 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="space-y-3 rounded-3xl border border-destructive/40 bg-destructive/20 p-6 text-destructive-foreground backdrop-blur">
            <p>Failed to load admins. Please refresh the page.</p>
            <button
              onClick={() => refetch()}
              className="rounded-lg border border-destructive/40 bg-destructive/30 px-4 py-2 text-sm font-medium text-destructive-foreground transition hover:bg-destructive/40"
            >
              Retry
            </button>
          </div>
        ) : (
          <AdminTable
            data={admins}
            onDelete={handleDelete}
            isDeleting={deletingId}
          />
        )}
      </section>
    </PermissionGuard>
  );
};

export default AdminListPage;
