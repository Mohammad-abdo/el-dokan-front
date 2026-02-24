import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { AdminForm } from "../../components/admin/AdminForm";
import { getAdmin, updateAdmin } from "../../services/admin-service";
import { PermissionGuard } from "../../routes/PermissionGuard";

const AdminEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState(null);

  const adminId = id ?? "";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admins", adminId],
    queryFn: () => getAdmin(adminId),
    enabled: Boolean(adminId),
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => updateAdmin(adminId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      queryClient.invalidateQueries({
        queryKey: ["admins", adminId],
      });
      navigate(`/admins/${adminId}`, { replace: true });
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        const responseErrors = error.response?.data?.errors;
        if (responseErrors) {
          const firstKey = Object.keys(responseErrors)[0];
          const values = firstKey ? responseErrors[firstKey] : undefined;
          const normalized = Array.isArray(values) ? values[0] : values;
          if (normalized) {
            setErrorMessage(normalized);
            return;
          }
        }
        const backendMessage =
          error.response?.data?.message ??
          "Validation failed. Please review the form.";
        setErrorMessage(backendMessage);
        return;
      }
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to update admin. Please review the form."
      );
    },
  });

  const handleSubmit = async (values) => {
    setErrorMessage(null);
    await updateMutation.mutateAsync(values);
  };

  const initialValues = data
    ? {
        name: data.name,
        email: data.email,
        phone: data.phone ?? "",
        status: data.status,
      }
    : undefined;

  return (
    <PermissionGuard permission="admins">
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">
            Update Admin
          </h1>
          <p className="text-sm text-muted-foreground">
            Modify admin details. Password remains unchanged unless updated through a
            separate reset flow.
          </p>
        </div>

        {errorMessage ? (
          <div className="rounded-xl border border-destructive/50 bg-gradient-to-r from-rose-500/30 via-rose-500/20 to-amber-400/25 px-4 py-3 text-sm text-destructive-foreground shadow backdrop-blur">
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex h-56 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : isError || !initialValues ? (
          <div className="space-y-4 rounded-3xl border border-destructive/50 bg-gradient-to-br from-rose-500/30 via-rose-500/15 to-amber-400/20 p-6 text-destructive-foreground backdrop-blur">
            <p>Unable to load this admin record.</p>
            <button
              onClick={() => navigate("/admins")}
              className="rounded-lg border border-destructive/40 bg-destructive/30 px-4 py-2 text-sm font-medium transition hover:bg-destructive/40"
            >
              Back to Admins
            </button>
          </div>
        ) : (
          <AdminForm
            initialValues={initialValues}
            onSubmit={handleSubmit}
            isSubmitting={updateMutation.isPending}
            submitLabel="Update Admin"
            showPasswordFields={false}
          />
        )}
      </section>
    </PermissionGuard>
  );
};

export default AdminEditPage;
