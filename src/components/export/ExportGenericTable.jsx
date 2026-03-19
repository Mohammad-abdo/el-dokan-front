import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Search,
  X,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export function ExportGenericTable({
  title,
  subtitle,
  icon,
  data,
  loading,
  columns,
  rowKey = (row) => row?.id,
  getRowSearchValue,
  filters = [],
  searchPlaceholder = "Search...",
  emptyTitle = "No results found.",
  emptyDescription = "Try adjusting your search or filters.",
  heightClassName = "h-[420px]",
  defaultPageSize = 10,
  showPagination = true,
}) {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState(() => {
    const init = {};
    for (const f of filters) init[f.key] = "";
    return init;
  });
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: defaultPageSize });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return (data ?? []).filter((row) => {
      if (q) {
        const searchValue = String(getRowSearchValue?.(row) ?? "");
        if (!searchValue.toLowerCase().includes(q)) return false;
      }

      for (const f of filters) {
        const fv = filterValues[f.key];
        if (!fv) continue;
        const rowValue = String(f.getRowFilterValue?.(row) ?? "");
        if (rowValue !== String(fv)) return false;
      }

      return true;
    });
  }, [data, query, filters, filterValues, getRowSearchValue]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pagination.pageSize));
  const pageIndexSafe = Math.min(pagination.pageIndex, pageCount - 1);

  const pageRows = useMemo(() => {
    const start = pageIndexSafe * pagination.pageSize;
    return filtered.slice(start, start + pagination.pageSize);
  }, [filtered, pageIndexSafe, pagination.pageSize]);

  const columnsCount = columns.length;

  return (
    <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
      {(title || subtitle) && (
        <div className="flex items-start justify-between gap-4">
          <div>
            {icon ? (
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
                {icon}
              </div>
            ) : null}
            {title ? (
              <h2 className="text-xl font-bold tracking-tight">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className="text-muted-foreground mt-1">{subtitle}</p>
            ) : null}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <Card className="overflow-hidden">
        <CardContent className="pt-4">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
              isRTL ? "sm:flex-row-reverse" : ""
            )}
          >
            <div className={cn("relative flex-1 max-w-sm", isRTL ? "sm:text-right" : "")}>
              <Search
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4",
                  isRTL ? "right-3" : "left-3"
                )}
              />
              <Input
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => {
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                  setQuery(e.target.value);
                }}
                className={cn(isRTL ? "pr-10 text-right" : "pl-10")}
              />
            </div>

            {filters.length > 0 && (
              <div className={cn("flex flex-wrap gap-3", isRTL ? "justify-end" : "")}>
                {filters.map((f, idx) => {
                  const active = filterValues[f.key];
                  return (
                    <motion.div
                      key={f.key}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="relative"
                    >
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <Select
                          value={active}
                          onChange={(e) => {
                            setPagination((p) => ({ ...p, pageIndex: 0 }));
                            setFilterValues((prev) => ({ ...prev, [f.key]: e.target.value }));
                          }}
                          className="w-[170px]"
                        >
                          <option value="">{isRTL ? "الكل" : "All"} {f.label}</option>
                          {f.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </Select>
                      </div>

                      {active ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "absolute -right-2 -top-2 h-6 w-6 rounded-full p-0",
                            isRTL ? "left-0 right-auto" : ""
                          )}
                          onClick={() => {
                            setPagination((p) => ({ ...p, pageIndex: 0 }));
                            setFilterValues((prev) => ({ ...prev, [f.key]: "" }));
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      ) : null}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <ScrollArea className={cn("w-full rounded-md", heightClassName)}>
          <div className="min-w-0">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="border-b">
                  {columns.map((c) => (
                    <th
                      key={c.key ?? c.header}
                      className={cn(
                        "sticky top-0 z-20 bg-card/95 backdrop-blur-md border-b border-border",
                        "h-12 px-4 text-left font-semibold text-muted-foreground",
                        isRTL ? "text-right" : ""
                      )}
                    >
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  Array.from({ length: pagination.pageSize }).map((_, i) => (
                    <tr key={i} className="border-b">
                      {columns.map((c) => (
                        <td key={c.key ?? c.header} className={cn("p-4", isRTL ? "text-right" : "")}>
                          <Skeleton className="h-6 w-full bg-primary/10" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : pageRows.length > 0 ? (
                  pageRows.map((row, idx) => {
                    const key = rowKey(row);
                    const alt = idx % 2 === 0;
                    return (
                      <tr
                        key={key ?? idx}
                        className={cn(
                          "border-b transition-colors hover:bg-muted/40",
                          alt ? "bg-muted/20" : "bg-background"
                        )}
                      >
                        {columns.map((c) => {
                          const content = c.render ? c.render(row) : row?.[c.key];
                          return (
                            <td
                              key={c.key ?? c.header}
                              className={cn("p-4 align-middle", isRTL ? "text-right" : "")}
                            >
                              {content}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={columnsCount} className="p-0 align-top">
                      <EmptyState
                        title={emptyTitle}
                        description={emptyDescription}
                        icon="search"
                        variant="inline"
                        className="w-full py-10"
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </Card>

      {/* Pagination */}
      {showPagination ? (
        <Card>
          <CardContent className="py-4">
            <div
              className={cn(
                "flex flex-col sm:flex-row items-center justify-between gap-4",
                isRTL ? "sm:flex-row-reverse" : ""
              )}
            >
              <div className={cn("flex-1 text-sm text-muted-foreground", isRTL ? "text-right" : "")}>
                {isRTL
                  ? `عرض ${pageRows.length} من ${filtered.length} نتائج`
                  : `Showing ${pageRows.length} of ${filtered.length} results`}
              </div>
              <div className={cn("flex items-center gap-4", isRTL ? "flex-row-reverse" : "")}>
                <div className="flex items-center gap-2">
                  <Select
                    value={pagination.pageSize}
                    onChange={(e) => {
                      setPagination({ pageIndex: 0, pageSize: Number(e.target.value) });
                    }}
                  >
                    {DEFAULT_PAGE_SIZE_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => setPagination((p) => ({ ...p, pageIndex: 0 }))}
                    disabled={pageIndexSafe <= 0}
                  >
                    <span className="sr-only">First</span>
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => setPagination((p) => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))}
                    disabled={pageIndexSafe <= 0}
                  >
                    <span className="sr-only">Prev</span>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className={cn("w-[110px] text-center text-sm font-medium", isRTL ? "text-right" : "")}>
                    {isRTL ? `صفحة ${pageIndexSafe + 1} من ${pageCount}` : `Page ${pageIndexSafe + 1} of ${pageCount}`}
                  </div>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() =>
                      setPagination((p) => ({
                        ...p,
                        pageIndex: Math.min(pageCount - 1, p.pageIndex + 1),
                      }))
                    }
                    disabled={pageIndexSafe >= pageCount - 1}
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => setPagination((p) => ({ ...p, pageIndex: pageCount - 1 }))}
                    disabled={pageIndexSafe >= pageCount - 1}
                  >
                    <span className="sr-only">Last</span>
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

