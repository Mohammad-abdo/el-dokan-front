import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/EmptyState";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  X,
  Download,
} from "lucide-react";

export function DataTable({
  columns,
  data,
  searchable = true,
  searchPlaceholder = "Search...",
  pageSize = 10,
  filters = [],
  filterValues = {},
  onFilterChange,
  enablePagination = true,
  exportable = false,
  onExport,
  loading = false,
  emptyTitle = "No results found.",
  emptyDescription = "Try adjusting your search or filters.",
  emptyIcon = "search",
}) {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: pageSize,
  });

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
  });

  const activeFiltersCount = useMemo(() => {
    return Object.values(filterValues).filter(v => v && v !== '').length;
  }, [filterValues]);

  const { language } = useLanguage();
  const isRTL = language === "ar";

  return (
    <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
      {/* Search and Filters - Card */}
      <Card>
        <CardContent className="pt-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between ${isRTL ? "sm:flex-row-reverse" : ""}`}
          >
        <div className={`flex flex-1 gap-3 items-center w-full sm:w-auto ${isRTL ? "flex-row-reverse" : ""}`}>
          {searchable && (
            <motion.div 
              className="relative flex-1 max-w-sm"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Search className={`absolute top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 ${isRTL ? "right-3" : "left-3"}`} />
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className={isRTL ? "pr-10 text-right" : "pl-10"}
              />
            </motion.div>
          )}

          {filters && filters.length > 0 && (
            <motion.div
              initial={false}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
            >
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="relative"
              >
                <Filter className="w-4 h-4 mr-2" />
                {isRTL ? 'الفلاتر' : 'Filters'}
                {activeFiltersCount > 0 && (
                  <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </motion.div>
          )}

          {/* زر استخراج التقرير معطّل — الاستخراج فقط من نظام التقارير الظاهر في الصفحة (بدون modal) */}
          {false && exportable && onExport && (
            <Button
              variant="outline"
              onClick={onExport}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {isRTL ? 'استخراج التقرير' : 'Export Report'}
            </Button>
          )}
        </div>

        <AnimatePresence>
          {showFilters && filters && filters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full sm:w-auto flex gap-2 flex-wrap mt-4 sm:mt-0"
            >
              {filters.map((filter, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <Select
                    value={filterValues[filter.key] || ""}
                    onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                    className="w-[150px]"
                  >
                    <option value="">All {filter.label}</option>
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                  {filterValues[filter.key] && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0"
                      onClick={() => onFilterChange?.(filter.key, "")}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
          </motion.div>
        </CardContent>
      </Card>

      {/* Table - Card + ScrollArea + Skeleton when loading */}
      <Card>
        <ScrollArea className="w-full whitespace-nowrap" dir={isRTL ? "rtl" : "ltr"}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-w-0"
          >
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-muted/50">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className={`font-semibold ${isRTL ? "text-right" : ""}`}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <TableRow key={i}>
                      {columns.map((_, j) => (
                        <TableCell key={j} className={isRTL ? "text-right" : ""}>
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className={isRTL ? "text-right" : ""}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="p-0 align-top"
                    >
                      <EmptyState
                        title={emptyTitle}
                        description={emptyDescription}
                        icon={emptyIcon}
                        variant="inline"
                        className="w-full"
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </motion.div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Card>

      {/* Pagination - Card */}
      <Card>
        <CardContent className="py-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${isRTL ? "sm:flex-row-reverse" : ""}`}
          >
            <div className={`flex-1 text-sm text-muted-foreground ${isRTL ? "text-right" : ""}`}>
              {isRTL
                ? `عرض ${table.getRowModel().rows.length} من ${table.getFilteredRowModel().rows.length} نتيجة`
                : `Showing ${table.getRowModel().rows.length} of ${table.getFilteredRowModel().rows.length} results`}
            </div>
            <div className={`flex items-center gap-4 lg:gap-6 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className="flex items-center gap-2">
                <Select
                  value={table.getState().pagination.pageSize}
                  onChange={(e) => {
                    table.setPageSize(Number(e.target.value));
                  }}
                >
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize}
                    </option>
                  ))}
                </Select>
              </div>
              <div className={`flex w-[100px] items-center justify-center text-sm font-medium ${isRTL ? "text-right" : ""}`}>
                {isRTL
                  ? `صفحة ${table.getState().pagination.pageIndex + 1} من ${table.getPageCount()}`
                  : `Page ${table.getState().pagination.pageIndex + 1} of ${table.getPageCount()}`}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">{isRTL ? "أول صفحة" : "Go to first page"}</span>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">{isRTL ? "السابق" : "Go to previous page"}</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">{isRTL ? "التالي" : "Go to next page"}</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">{isRTL ? "آخر صفحة" : "Go to last page"}</span>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}
