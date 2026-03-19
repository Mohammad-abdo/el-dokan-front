import { useMemo, useState, Fragment } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Search,
  Filter,
} from "lucide-react";

import { formatMoney, getOrderStatus } from "@/lib/exportFormatting";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";

import { buildOrderSearchValue } from "@/components/export/orderSearchHelpers";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "delivered", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function normalizeOrderStatus(status) {
  const s = String(status ?? "").toLowerCase();
  if (s === "delivered") return "delivered";
  if (s === "cancelled") return "cancelled";
  return "pending"; // pending + confirmed
}

export function ExportOrdersTable({
  data,
  loading,
  heightClassName = "h-[420px]",
  defaultPageSize = 10,
}) {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: defaultPageSize });
  const [expanded, setExpanded] = useState(() => new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter((row) => {
      if (q) {
        const searchValue = buildOrderSearchValue(row);
        if (!searchValue.toLowerCase().includes(q)) return false;
      }

      if (status) {
        const rowStatus = normalizeOrderStatus(row.status);
        if (rowStatus !== status) return false;
      }
      return true;
    });
  }, [data, query, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pagination.pageSize));
  const pageIndexSafe = Math.min(pagination.pageIndex, pageCount - 1);

  const pageRows = useMemo(() => {
    const start = pageIndexSafe * pagination.pageSize;
    return filtered.slice(start, start + pagination.pageSize);
  }, [filtered, pageIndexSafe, pagination.pageSize]);

  const toggleExpanded = (orderId) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  return (
    <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
      {/* Toolbar */}
      <Card className="overflow-hidden">
        <CardContent className="pt-4">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", isRTL ? "sm:flex-row-reverse" : "")}
          >
            <div className="relative flex-1 max-w-sm">
              <Search
                className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4", isRTL ? "right-3" : "left-3")}
              />
              <Input
                placeholder={language === "ar" ? "بحث عن رقم الطلب..." : "Search order..."}
                value={query}
                onChange={(e) => {
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                  setQuery(e.target.value);
                }}
                className={cn(isRTL ? "pr-10 text-right" : "pl-10")}
              />
            </div>

            <div className={cn("flex items-center gap-3 flex-wrap", isRTL ? "justify-end" : "")}>
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select
                value={status}
                onChange={(e) => {
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                  setStatus(e.target.value);
                }}
                className="w-[220px]"
              >
                <option value="">{isRTL ? "الكل" : "All"} Status</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setStatus("");
                  setPagination({ pageIndex: 0, pageSize: defaultPageSize });
                }}
              >
                {isRTL ? "إعادة ضبط" : "Reset"}
              </Button>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <ScrollArea className={cn("w-full rounded-md", heightClassName)}>
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="border-b">
                <th
                  className={cn(
                    "sticky top-0 z-20 bg-card/95 backdrop-blur-md border-b border-border h-12 px-4",
                    isRTL ? "text-right" : ""
                  )}
                >
                  {isRTL ? "عرض" : "Expand"}
                </th>
                <th className={cn("sticky top-0 z-20 bg-card/95 backdrop-blur-md border-b border-border h-12 px-4", isRTL ? "text-right" : "")}>
                  {isRTL ? "رقم الطلب" : "Order"}
                </th>
                <th className={cn("sticky top-0 z-20 bg-card/95 backdrop-blur-md border-b border-border h-12 px-4", isRTL ? "text-right" : "")}>
                  {isRTL ? "الحالة" : "Status"}
                </th>
                <th className={cn("sticky top-0 z-20 bg-card/95 backdrop-blur-md border-b border-border h-12 px-4", "text-right", isRTL ? "text-right" : "text-right")}>
                  {isRTL ? "الإجمالي" : "Total"}
                </th>
                <th className={cn("sticky top-0 z-20 bg-card/95 backdrop-blur-md border-b border-border h-12 px-4", isRTL ? "text-right" : "")}>
                  {isRTL ? "التاريخ" : "Date"}
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: pagination.pageSize }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={`${i}-${j}`} className={cn("p-4", isRTL ? "text-right" : "")}>
                        <Skeleton className="h-6 w-full bg-primary/10" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : pageRows.length > 0 ? (
                pageRows.map((row, idx) => {
                  const key = row?.id ?? row?.order_number ?? idx;
                  const alt = idx % 2 === 0;
                  const isOpen = expanded.has(key);
                  const items = Array.isArray(row?.items) ? row.items : [];
                  const statusBadge = getOrderStatus(row.status, language);

                  return (
                    <Fragment key={key}>
                      <tr
                        className={cn(
                          "border-b transition-colors hover:bg-muted/40",
                          alt ? "bg-muted/20" : "bg-background"
                        )}
                      >
                        <td className="p-4 align-middle">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleExpanded(key)}
                            disabled={!items.length}
                            title={isRTL ? "عرض العناصر" : "Show items"}
                          >
                            <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : "")} />
                            <span className="sr-only">{isRTL ? "عرض" : "Expand"}</span>
                          </Button>
                        </td>
                        <td className={cn("p-4", isRTL ? "text-right" : "")}>
                          <div className="font-medium">{row?.order_number || row?.id}</div>
                        </td>
                        <td className="p-4 align-middle">
                          <span className={cn("px-2 py-1 rounded-full text-xs", statusBadge.className)}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="p-4 text-right align-middle">
                          <div className="font-semibold">{formatMoney(row?.total_amount ?? row?.total ?? 0)}</div>
                        </td>
                        <td className={cn("p-4 align-middle", isRTL ? "text-right" : "")}>
                          {row?.ordered_at ? new Date(row.ordered_at).toLocaleString() : "—"}
                        </td>
                      </tr>

                      {isOpen ? (
                        <tr className={cn(alt ? "bg-muted/10" : "bg-background")}>
                          <td colSpan={5} className="p-4 border-b">
                            <div className="flex items-center justify-between gap-4 mb-3">
                              <div className="font-semibold">
                                {isRTL ? "عناصر الطلب" : "Order Items"}
                              </div>
                              <div className="text-muted-foreground text-sm">
                                {items.length} {isRTL ? "عنصر" : "items"}
                              </div>
                            </div>

                            <div className="space-y-2">
                              {items.length ? (
                                items.map((it, i) => {
                                  const p = it?.companyProduct || {};
                                  const img = Array.isArray(p?.images) ? p.images[0] : p?.first_image_url;
                                  const imgUrl = img && (String(img).startsWith("http") ? img : img);
                                  return (
                                    <div key={`${key}-${i}`} className="grid grid-cols-12 gap-3 items-center border rounded-lg p-3">
                                      <div className="col-span-2 flex items-center gap-3">
                                        {imgUrl ? (
                                          <img
                                            src={imgUrl}
                                            alt={p?.name || "Product"}
                                            className="w-10 h-10 rounded-md object-cover border"
                                          />
                                        ) : (
                                          <div className="w-10 h-10 rounded-md bg-muted border" />
                                        )}
                                      </div>
                                      <div className="col-span-4 min-w-0">
                                        <div className="font-medium truncate">{p?.name || "—"}</div>
                                        <div className="text-xs text-muted-foreground truncate">{p?.sku ? `SKU: ${p.sku}` : ""}</div>
                                      </div>
                                      <div className="col-span-2 text-sm">
                                        {isRTL ? "الكمية" : "Qty"}: <span className="font-medium">{it?.quantity ?? 0}</span>
                                      </div>
                                      <div className="col-span-2 text-sm text-right">
                                        {isRTL ? "السعر" : "Unit"}: <span className="font-medium">{formatMoney(it?.unit_price ?? 0)}</span>
                                      </div>
                                      <div className="col-span-2 text-sm text-right">
                                        {isRTL ? "الإجمالي" : "Total"}: <span className="font-semibold">{formatMoney(it?.total_price ?? 0)}</span>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-muted-foreground text-sm">{isRTL ? "لا توجد عناصر" : "No items"}</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-0">
                    <EmptyState
                      title={language === "ar" ? "لا توجد نتائج" : "No orders found"}
                      description={language === "ar" ? "جرّب تعديل البحث أو الفلاتر." : "Try adjusting your filters."}
                      icon="search"
                      variant="inline"
                      className="w-full py-10"
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </ScrollArea>
      </Card>

      {/* Pagination */}
      <Card>
        <CardContent className="py-4">
          <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4", isRTL ? "sm:flex-row-reverse" : "")}>
            <div className={cn("flex-1 text-sm text-muted-foreground", isRTL ? "text-right" : "")}>
              {isRTL
                ? `عرض ${pageRows.length} من ${filtered.length} نتائج`
                : `Showing ${pageRows.length} of ${filtered.length} results`}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Select
                  value={pagination.pageSize}
                  onChange={(e) => setPagination({ pageIndex: 0, pageSize: Number(e.target.value) })}
                >
                  {[10, 20, 30, 50].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>

              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => setPagination((p) => ({ ...p, pageIndex: 0 }))}
                disabled={pageIndexSafe <= 0}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => setPagination((p) => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))}
                disabled={pageIndexSafe <= 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="w-[110px] text-center text-sm font-medium">
                {isRTL ? `صفحة ${pageIndexSafe + 1} من ${pageCount}` : `Page ${pageIndexSafe + 1} of ${pageCount}`}
              </div>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => setPagination((p) => ({ ...p, pageIndex: Math.min(pageCount - 1, p.pageIndex + 1) }))}
                disabled={pageIndexSafe >= pageCount - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => setPagination((p) => ({ ...p, pageIndex: pageCount - 1 }))}
                disabled={pageIndexSafe >= pageCount - 1}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

