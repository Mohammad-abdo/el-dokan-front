export function formatMoney(value, currency = "USD") {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(num);
}

export function getStockStatus(stockQuantity, language = "en") {
  const q = Number(stockQuantity ?? 0);
  if (!Number.isFinite(q)) return { key: "out", label: "Out", className: "bg-red-100 text-red-800" };
  const labels = {
    out: language === "ar" ? "نفد" : "Out",
    low: language === "ar" ? "منخفض" : "Low",
    in: language === "ar" ? "متوفر" : "In Stock",
  };

  if (q <= 0) return { key: "out", label: labels.out, className: "bg-red-100 text-red-800" };
  if (q <= 10) return { key: "low", label: labels.low, className: "bg-amber-100 text-amber-800" };
  return { key: "in", label: labels.in, className: "bg-green-100 text-green-800" };
}

export function getOrderStatus(status, language = "en") {
  const s = String(status ?? "").toLowerCase();
  const labels = {
    completed: language === "ar" ? "مكتمل" : "Completed",
    cancelled: language === "ar" ? "ملغي" : "Cancelled",
    pending: language === "ar" ? "معلّق" : "Pending",
  };

  if (s === "delivered") return { label: labels.completed, className: "bg-green-100 text-green-800" };
  if (s === "cancelled") return { label: labels.cancelled, className: "bg-red-100 text-red-800" };
  // pending + confirmed treated as Pending for UI requirement
  return { label: labels.pending, className: "bg-amber-100 text-amber-800" };
}

export function csvEscape(value) {
  const v = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

