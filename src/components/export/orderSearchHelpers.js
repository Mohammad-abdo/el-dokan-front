export function buildOrderSearchValue(row) {
  const repUser = row?.representative?.user || row?.representative?.user_data || {};
  const repName =
    repUser?.name ||
    repUser?.fullName ||
    repUser?.username ||
    repUser?.email;

  const orderedAt = row?.ordered_at ? String(row.ordered_at) : "";

  const orderNumber = row?.order_number || "";
  const status = row?.status || "";

  return [orderNumber, repName, status, orderedAt].filter(Boolean).join(" ");
}

