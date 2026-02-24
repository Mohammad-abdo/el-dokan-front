import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAdmin } from "../../services/admin-service";
import { PermissionGuard } from "../../routes/PermissionGuard";

const AdminDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const adminId = id ?? "";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admins", adminId],
    queryFn: () => getAdmin(adminId),
    enabled: Boolean(adminId),
  });

  return (
    <PermissionGuard permission="admins">
      <section className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">
              Admin Details
            </h1>
            <p className="text-sm text-muted-foreground">
              Review the administrator profile.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/admins/${adminId}/edit`}
              className="rounded-xl border border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary/60"
            >
              Edit
            </Link>
            <button
              onClick={() => navigate("/admins")}
              className="rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-foreground transition hover:opacity-90"
            >
              Back to List
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-56 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : isError || !data ? (
          <div className="rounded-3xl border border-destructive/40 bg-destructive/10 p-6 text-destructive">
            Failed to load admin details.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">
                Personal Information
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium text-foreground">{data.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-medium text-foreground">{data.email}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd className="font-medium text-foreground">
                    {data.phone ?? "—"}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="rounded-3xl border border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">
                Account Status
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      {data.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Created At</dt>
                  <dd className="font-medium text-foreground">
                    {data.created_at
                      ? new Date(data.created_at).toLocaleString()
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Last Updated</dt>
                  <dd className="font-medium text-foreground">
                    {data.updated_at
                      ? new Date(data.updated_at).toLocaleString()
                      : "—"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </section>
    </PermissionGuard>
  );
};

export default AdminDetailPage;
