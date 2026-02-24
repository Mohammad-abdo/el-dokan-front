import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { showConfirm } from "@/components/ConfirmDialog";

const ActiveIngredients = () => {
  const [ingredients, setIngredients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      setIngredients([]);
    } catch (error) {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    showConfirm(
      "Are you sure you want to remove this active ingredient? This action cannot be undone.",
      () => {
        try {
          setDeletingId(id);
          setStatusMessage("Active ingredient deleted successfully.");
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to delete active ingredient. Please try again.";
          setStatusMessage(message);
        } finally {
          setDeletingId(null);
        }
      }
    );
  };

  return (
    <section className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">
              Active Ingredients Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage pharmaceutical active ingredients.
            </p>
          </div>
          <Link
            to="/dashboard/admin/active-ingredients/create"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            + New Ingredient
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
            <p>Failed to load active ingredients. Please refresh the page.</p>
            <button
              onClick={() => fetchIngredients()}
              className="rounded-lg border border-destructive/40 bg-destructive/30 px-4 py-2 text-sm font-medium text-destructive-foreground transition hover:bg-destructive/40"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur">
            <div className="p-6">
              <p className="text-muted-foreground">
                {ingredients.length === 0
                  ? "No active ingredients found. Create one to get started."
                  : `${ingredients.length} ingredient(s) found.`}
              </p>
            </div>
          </div>
        )}
      </section>
  );
};

export default ActiveIngredients;
