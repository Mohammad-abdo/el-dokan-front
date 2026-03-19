import { csvEscape } from "./exportFormatting";

function csvFromRows(columns, rows) {
  const header = columns.map(csvEscape).join(",");
  const body = rows.map((row) => columns.map((c) => csvEscape(row?.[c])).join(",")).join("\n");
  return `${header}\n${body}`;
}

export function buildFullExportCsv(payload) {
  const { meta, data } = payload || {};
  const companyName = meta?.company?.name || "Company";

  const blocks = [];
  blocks.push(`Full Data Export Report`);
  blocks.push(`Company: ${companyName}`);
  blocks.push(`Export date: ${meta?.exportDate ?? ""}`);
  blocks.push("");

  const tables = [
    {
      key: "company_orders",
      title: "Orders",
      columns: ["id", "order_number", "representative_id", "status", "total_amount", "customer_type", "customer_id", "ordered_at"],
      rows: data?.company_orders ?? [],
    },
    {
      key: "company_order_items",
      title: "Order Items",
      columns: ["company_order_id", "company_product_id", "quantity", "unit_price", "total_price"],
      rows: data?.company_order_items ?? [],
    },
    {
      key: "company_products",
      title: "Products",
      columns: ["id", "name", "sku", "unit_price", "stock_quantity", "is_active", "product_type"],
      rows: data?.company_products ?? [],
    },
    {
      key: "company_plans",
      title: "Plans",
      columns: ["id", "name", "name_ar", "max_products", "max_branches", "max_representatives", "price", "is_active", "sort_order"],
      rows: data?.company_plans ?? [],
    },
    {
      key: "representatives",
      title: "Representatives",
      columns: ["id", "user_id", "shop_id", "employee_id", "territory", "status", "created_at"],
      rows: data?.representatives?.map((r) => ({
        ...r,
        // Ensure consistent flat columns
        created_at: r?.created_at,
      })) ?? [],
    },
    {
      key: "visits",
      title: "Visits",
      columns: ["id", "representative_id", "shop_id", "doctor_id", "visit_date", "visit_time", "purpose", "status", "created_at"],
      rows: data?.visits ?? [],
    },
  ];

  for (const t of tables) {
    blocks.push(t.title);
    blocks.push("");
    blocks.push(csvFromRows(t.columns, t.rows));
    blocks.push("");
  }

  return blocks.join("\n");
}

