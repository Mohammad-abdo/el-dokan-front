import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { AdminForm } from "../../components/admin/AdminForm";
import { createAdmin } from "../../services/admin-service";
import { PermissionGuard } from "../../routes/PermissionGuard";
import { useAuth } from "../../hooks/useAuth";

const AdminCreatePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState(null);
  const { permissionDetails } = useAuth();

  const permissionOptions = permissionDetails
    .map((permission) => ({
      value: String(permission.id),
      label: permission.name
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^[a-z]/, (char) => char.toUpperCase()),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const createMutation = useMutation({
    mutationFn: (payload) => createAdmin(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      navigate("/admins", {
        replace: true,
      });
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
          : "Failed to create admin. Please double check the form data."
      );
    },
  });

  const handleSubmit = async (values) => {
    setErrorMessage(null);
    await createMutation.mutateAsync(values);
  };

  return (
    <PermissionGuard permission="admins">
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">
            Create Admin
          </h1>
          <p className="text-sm text-muted-foreground">
            Provide details for the new administrator account.
          </p>
        </div>
        {errorMessage ? (
          <div className="rounded-xl border border-destructive/50 bg-gradient-to-r from-rose-500/30 via-rose-500/20 to-amber-400/25 px-4 py-3 text-sm text-destructive-foreground shadow backdrop-blur">
            {errorMessage}
          </div>
        ) : null}
        <AdminForm
          availablePermissions={permissionOptions}
          requirePermissions={permissionOptions.length > 0}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
          submitLabel="Create Admin"
          showPasswordFields
        />
      </section>
    </PermissionGuard>
  );
};

export default AdminCreatePage;
