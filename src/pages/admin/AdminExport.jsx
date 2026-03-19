import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Building2,
  ShieldCheck,
  Clock,
  Package,
  Users,
  CalendarDays,
  Moon,
  Sun,
  LoaderCircle,
} from "lucide-react";

import api from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import showToast from "@/lib/toast";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

import { ExportGenericTable } from "@/components/export/ExportGenericTable";
import { ExportOrdersTable } from "@/components/export/ExportOrdersTable";
import { downloadBlob, getStockStatus, formatMoney } from "@/lib/exportFormatting";
import { buildFullExportCsv } from "@/lib/exportCsv";
import { cn } from "@/lib/utils";

export default function AdminExport({ presetShopId } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { language } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const initialShopId = presetShopId ?? searchParams.get("shop_id");

  const [companies, setCompanies] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState(initialShopId ?? "");

  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [rawPayload, setRawPayload] = useState(null);

  const isRTL = language === "ar";

  useEffect(() => {
    // If shop id is pre-selected (company details page), we don't need the company picker list.
    if (presetShopId) return;

    // Load available company shops for the cover + data scope.
    const fetchCompanies = async () => {
      try {
        const res = await api.get("/admin/shops", { params: { type: "company" } });
        const list = res.data?.data ?? res.data ?? [];
        setCompanies(Array.isArray(list) ? list : []);

        const nextShopId = initialShopId || (Array.isArray(list) && list[0]?.id ? String(list[0].id) : "");
        if (!selectedShopId && nextShopId) {
          setSelectedShopId(nextShopId);
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set("shop_id", nextShopId);
            return next;
          });
        }
      } catch (e) {
        console.error(e);
        showToast.error(language === "ar" ? "فشل تحميل الشركات" : "Failed to load companies");
        setCompanies([]);
      }
    };

    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetShopId]);

  useEffect(() => {
    if (!presetShopId) return;
    const nextShopId = String(presetShopId);
    setSelectedShopId(nextShopId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("shop_id", nextShopId);
      return next;
    });
  }, [presetShopId, setSearchParams]);

  useEffect(() => {
    const fetchFullData = async () => {
      if (!selectedShopId) return;
      setLoading(true);
      try {
        const res = await api.get("/admin/export", {
          params: { shop_id: selectedShopId },
        });
        const payload = res.data?.data ?? res.data;
        setRawPayload(payload);
      } catch (e) {
        console.error(e);
        showToast.error(language === "ar" ? "فشل تحميل البيانات" : "Failed to load export data");
        setRawPayload(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFullData();
  }, [selectedShopId, language]);

  const companyName = rawPayload?.meta?.company?.name ?? "—";
  const companyLogo = rawPayload?.meta?.company?.logo_url ?? "";
  const exportDate = rawPayload?.meta?.exportDate ?? "";

  const counts = useMemo(() => {
    const d = rawPayload ?? {};
    return {
      company_orders: (d.company_orders ?? []).length,
      company_order_items: (d.company_order_items ?? []).length,
      company_products: (d.company_products ?? []).length,
      company_plans: (d.company_plans ?? []).length,
      representatives: (d.representatives ?? []).length,
      visits: (d.visits ?? []).length,
    };
  }, [rawPayload]);

  const handleExportPdf = async () => {
    if (!selectedShopId) return;
    setExportingPdf(true);
    try {
      const res = await api.get("/admin/export/pdf", {
        params: { shop_id: selectedShopId },
        responseType: "blob",
      });

      const blob = res.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const d = new Date();
      const fileName = `full-data-export-${selectedShopId}-${d.toISOString().slice(0, 10)}.pdf`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast.success(language === "ar" ? "تم إنشاء PDF" : "PDF generated");
    } catch (e) {
      console.error(e);
      showToast.error(language === "ar" ? "فشل إنشاء PDF" : "Failed to generate PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportCsv = () => {
    if (!rawPayload) return;
    try {
      const csvText = buildFullExportCsv({ meta: rawPayload.meta, data: rawPayload });
      const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
      const d = new Date();
      downloadBlob(blob, `full-data-export-${selectedShopId}-${d.toISOString().slice(0, 10)}.csv`);
      showToast.success(language === "ar" ? "تم استخراج CSV" : "CSV downloaded");
    } catch (e) {
      console.error(e);
      showToast.error(language === "ar" ? "فشل استخراج CSV" : "Failed to export CSV");
    }
  };

  const orderItemsFilters = useMemo(() => {
    return [
      {
        key: "order_status",
        label: language === "ar" ? "الحالة" : "Status",
        options: [
          { value: "pending", label: "Pending" },
          { value: "delivered", label: "Completed" },
          { value: "cancelled", label: "Cancelled" },
        ],
        getRowFilterValue: (row) => {
          const s = String(row?.order_status ?? "").toLowerCase();
          if (s === "delivered") return "delivered";
          if (s === "cancelled") return "cancelled";
          return "pending";
        },
      },
    ];
  }, [language]);

  const uniqueRepresentativeStatusOptions = useMemo(() => {
    const statuses = new Set((rawPayload?.representatives ?? []).map((r) => r.status).filter(Boolean));
    const base = Array.from(statuses);
    return base.length
      ? base
      : ["active", "pending_approval", "suspended"];
  }, [rawPayload]);

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <div className="absolute inset-0 opacity-70 pointer-events-none">
            <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-primary/10 blur-2xl" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-green-500/10 blur-2xl" />
          </div>

          <div className="relative p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                      {language === "ar" ? "تصدير البيانات الكاملة" : "Full Data Export Dashboard"}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      {language === "ar"
                        ? "واجهات SaaS نظيفة + PDF احترافي بصور وملخص."
                        : "Clean SaaS UI + professional PDF with images & sections."}
                    </p>
                  </div>
                </div>
              </div>

              <div className={cn("flex items-center gap-3 flex-wrap", isRTL ? "lg:flex-row-reverse" : "")}>
                <Button
                  variant="outline"
                  onClick={toggleTheme}
                  className="gap-2"
                  disabled={loading}
                >
                  {theme === "light" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {language === "ar" ? "تبديل المظهر" : "Toggle theme"}
                </Button>

                <Button onClick={handleExportCsv} variant="outline" className="gap-2" disabled={!rawPayload}>
                  <FileSpreadsheet className="w-4 h-4" />
                  {language === "ar" ? "CSV" : "CSV"}
                </Button>

                <Button
                  onClick={handleExportPdf}
                  className="gap-2"
                  disabled={!rawPayload || exportingPdf}
                >
                  {exportingPdf ? (
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {language === "ar" ? "Export as PDF" : "Export as PDF"}
                </Button>
              </div>
            </div>

            {/* Cover preview */}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <Card className="bg-card/70 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl border border-primary/20 bg-primary/10 overflow-hidden flex items-center justify-center">
                      {companyLogo ? (
                        <img src={companyLogo} alt={companyName} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">{language === "ar" ? "الشركة" : "Company"}</div>
                      <div className="font-semibold truncate">{companyName}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/70 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl border border-primary/20 bg-primary/10 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">{language === "ar" ? "تاريخ التصدير" : "Export date"}</div>
                      <div className="font-semibold">{exportDate ? new Date(exportDate).toLocaleString() : "—"}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/70 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl border border-primary/20 bg-primary/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">{language === "ar" ? "الحالة" : "Status"}</div>
                      <div className="font-semibold">{loading ? (language === "ar" ? "جاري التحميل..." : "Loading...") : (language === "ar" ? "جاهز" : "Ready")}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Company selector */}
      {!presetShopId ? (
        <Card>
        <CardContent className="p-4 md:p-6">
          <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", isRTL ? "sm:flex-row-reverse" : "")}>
            <div>
              <div className="text-sm font-semibold">{language === "ar" ? "اختيار الشركة" : "Select company"}</div>
              <div className="text-muted-foreground text-sm mt-1">
                {language === "ar" ? "البيانات و الـ PDF سيتم توليدهم حسب `shop_id`." : "Data & PDF are generated using `shop_id`."}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {loading ? (
                <Skeleton className="h-10 w-[360px]" />
              ) : (
                <Select
                  value={selectedShopId}
                  onChange={(e) => {
                    setSelectedShopId(e.target.value);
                    setSearchParams((prev) => {
                      const next = new URLSearchParams(prev);
                      next.set("shop_id", e.target.value);
                      return next;
                    });
                  }}
                  className="w-[360px]"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </div>
        </CardContent>
        </Card>
      ) : null}

      {/* Counts */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{language === "ar" ? "Orders" : "Company Orders"}</div>
              {loading ? <Skeleton className="h-7 w-24" /> : <div className="text-2xl font-bold">{counts.company_orders}</div>}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{language === "ar" ? "Order Items" : "Order Items"}</div>
              {loading ? <Skeleton className="h-7 w-24" /> : <div className="text-2xl font-bold">{counts.company_order_items}</div>}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{language === "ar" ? "Products" : "Products"}</div>
              {loading ? <Skeleton className="h-7 w-24" /> : <div className="text-2xl font-bold">{counts.company_products}</div>}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{language === "ar" ? "Plans" : "Plans"}</div>
              {loading ? <Skeleton className="h-7 w-24" /> : <div className="text-2xl font-bold">{counts.company_plans}</div>}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{language === "ar" ? "Representatives" : "Representatives"}</div>
              {loading ? <Skeleton className="h-7 w-24" /> : <div className="text-2xl font-bold">{counts.representatives}</div>}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{language === "ar" ? "Visits" : "Visits"}</div>
              {loading ? <Skeleton className="h-7 w-24" /> : <div className="text-2xl font-bold">{counts.visits}</div>}
            </div>
          </div>
        </Card>
      </div>

      {/* Tables */}
      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList className={cn("w-full justify-start overflow-x-auto", isRTL ? "flex-row-reverse" : "")}>
          <TabsTrigger value="orders" className="whitespace-nowrap">{language === "ar" ? "الطلبات" : "Orders"}</TabsTrigger>
          <TabsTrigger value="order_items" className="whitespace-nowrap">{language === "ar" ? "عناصر الطلبات" : "Order Items"}</TabsTrigger>
          <TabsTrigger value="products" className="whitespace-nowrap">{language === "ar" ? "المنتجات" : "Products"}</TabsTrigger>
          <TabsTrigger value="plans" className="whitespace-nowrap">{language === "ar" ? "الخطط" : "Plans"}</TabsTrigger>
          <TabsTrigger value="representatives" className="whitespace-nowrap">{language === "ar" ? "المندوبون" : "Representatives"}</TabsTrigger>
          <TabsTrigger value="visits" className="whitespace-nowrap">{language === "ar" ? "الزيارات" : "Visits"}</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-6">
          {loading ? (
            <Card className="p-6">
              <Skeleton className="h-10 w-56" />
              <div className="mt-4 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </Card>
          ) : (
            <ExportOrdersTable data={rawPayload?.company_orders ?? []} loading={false} />
          )}
        </TabsContent>

        <TabsContent value="order_items">
          <ExportGenericTable
            title={language === "ar" ? "عناصر طلبات الشركة" : "Company Order Items"}
            subtitle={language === "ar" ? "بيانات Raw من `company_order_items`" : "Raw data from `company_order_items`"}
            icon={<FileText className="w-5 h-5 text-primary" />}
            data={rawPayload?.company_order_items ?? []}
            loading={loading}
            searchPlaceholder={language === "ar" ? "بحث عن منتج/طلب..." : "Search product/order..."}
            rowKey={(row) => row?.company_order_item_id ?? row?.id ?? `${row?.company_order_id}-${row?.company_product_id}`}
            getRowSearchValue={(row) =>
              [row?.order_number, row?.company_product_name, row?.company_product_sku].filter(Boolean).join(" ")
            }
            filters={orderItemsFilters}
            columns={[
              {
                key: "order_number",
                header: language === "ar" ? "رقم الطلب" : "Order #",
                render: (row) => <span className="font-medium">{row?.order_number || "—"}</span>,
              },
              {
                key: "product",
                header: language === "ar" ? "المنتج" : "Product",
                render: (row) => (
                  <div className="flex items-center gap-3">
                    {row?.company_product_image_url ? (
                      <img src={row.company_product_image_url} alt={row.company_product_name} className="w-10 h-10 rounded-md object-cover border" />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-muted border" />
                    )}
                    <div className="min-w-0">
                      <div className="font-medium truncate">{row?.company_product_name || "—"}</div>
                      <div className="text-xs text-muted-foreground truncate">{row?.company_product_sku ? `SKU: ${row.company_product_sku}` : ""}</div>
                    </div>
                  </div>
                ),
              },
              {
                key: "quantity",
                header: language === "ar" ? "الكمية" : "Qty",
                render: (row) => <span className="font-medium">{row?.quantity ?? 0}</span>,
              },
              {
                key: "unit_price",
                header: language === "ar" ? "سعر الوحدة" : "Unit Price",
                render: (row) => <span className="font-medium">{formatMoney(row?.unit_price ?? 0)}</span>,
              },
              {
                key: "total_price",
                header: language === "ar" ? "الإجمالي" : "Total",
                render: (row) => <span className="font-semibold">{formatMoney(row?.total_price ?? 0)}</span>,
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="products">
          <ExportGenericTable
            title={language === "ar" ? "منتجات الشركة" : "Company Products"}
            subtitle={language === "ar" ? "منتجات الشركة + صور + حالة المخزون" : "Company products with images & stock status"}
            icon={<Package className="w-5 h-5 text-primary" />}
            data={rawPayload?.company_products ?? []}
            loading={loading}
            searchPlaceholder={language === "ar" ? "بحث بالاسم أو SKU..." : "Search by name or SKU..."}
            rowKey={(row) => row?.id}
            getRowSearchValue={(row) => [row?.name, row?.sku, row?.product_type].filter(Boolean).join(" ")}
            filters={[
              {
                key: "stock_status",
                label: language === "ar" ? "المخزون" : "Stock",
                options: [
                  { value: "in", label: language === "ar" ? "متوفر" : "In Stock" },
                  { value: "low", label: language === "ar" ? "منخفض" : "Low" },
                  { value: "out", label: language === "ar" ? "نفد" : "Out" },
                ],
                getRowFilterValue: (row) => getStockStatus(row?.stock_quantity).key,
              },
              {
                key: "is_active",
                label: language === "ar" ? "الحالة" : "Status",
                options: [
                  { value: "1", label: language === "ar" ? "Active" : "Active" },
                  { value: "0", label: language === "ar" ? "Inactive" : "Inactive" },
                ],
                getRowFilterValue: (row) => (row?.is_active === false || row?.is_active === 0 ? "0" : "1"),
              },
              {
                key: "product_type",
                label: language === "ar" ? "Type" : "Type",
                options: [
                  { value: "drug", label: "drug" },
                  { value: "compound", label: "compound" },
                  { value: "other", label: "other" },
                ],
                getRowFilterValue: (row) => row?.product_type ?? "other",
              },
            ]}
            columns={[
              {
                key: "image",
                header: language === "ar" ? "الصورة" : "Image",
                render: (row) => {
                  const src =
                    row?.first_image_url ||
                    (Array.isArray(row?.images) ? row?.images?.[0] : "") ||
                    "";

                  return src ? (
                    <img
                      src={src}
                      alt={row?.name || "Product"}
                      className="w-10 h-10 rounded-md object-cover border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-muted border" />
                  );
                },
              },
              {
                key: "name_sku",
                header: language === "ar" ? "المنتج" : "Product",
                render: (row) => (
                  <div className="min-w-0">
                    <div className="font-medium truncate">{row?.name || "—"}</div>
                    <div className="text-xs text-muted-foreground truncate">{row?.sku ? `SKU: ${row.sku}` : ""}</div>
                  </div>
                ),
              },
              {
                key: "unit_price",
                header: language === "ar" ? "السعر" : "Price",
                render: (row) => <span className="font-medium">{formatMoney(row?.unit_price ?? 0)}</span>,
              },
              {
                key: "stock",
                header: language === "ar" ? "الحالة" : "Stock",
                render: (row) => {
                  const b = getStockStatus(row?.stock_quantity, language);
                  return <span className={cn("px-2 py-1 rounded-full text-xs", b.className)}>{b.label}</span>;
                },
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="plans">
          <ExportGenericTable
            title={language === "ar" ? "خطط الشركة" : "Company Plans"}
            subtitle={language === "ar" ? "جميع company_plans" : "All company_plans"}
            icon={<ShieldCheck className="w-5 h-5 text-primary" />}
            data={rawPayload?.company_plans ?? []}
            loading={loading}
            searchPlaceholder={language === "ar" ? "بحث بالخطة..." : "Search plan..."}
            rowKey={(row) => row?.id}
            getRowSearchValue={(row) => [row?.name, row?.name_ar, row?.slug].filter(Boolean).join(" ")}
            filters={[
              {
                key: "is_active",
                label: language === "ar" ? "الحالة" : "Status",
                options: [
                  { value: "1", label: language === "ar" ? "Active" : "Active" },
                  { value: "0", label: language === "ar" ? "Inactive" : "Inactive" },
                ],
                getRowFilterValue: (row) => (row?.is_active === false || row?.is_active === 0 ? "0" : "1"),
              },
            ]}
            columns={[
              {
                key: "name",
                header: language === "ar" ? "الخطة" : "Plan",
                render: (row) => (
                  <div className="min-w-0">
                    <div className="font-medium truncate">{row?.name_ar || row?.name || "—"}</div>
                    <div className="text-xs text-muted-foreground truncate">{row?.slug ? `/${row.slug}` : ""}</div>
                  </div>
                ),
              },
              { key: "max_products", header: language === "ar" ? "حد المنتجات" : "Max Products", render: (row) => <span className="font-medium">{row?.max_products ?? 0}</span> },
              { key: "max_branches", header: language === "ar" ? "حد الفروع" : "Max Branches", render: (row) => <span className="font-medium">{row?.max_branches ?? 0}</span> },
              { key: "max_representatives", header: language === "ar" ? "حد المندوبين" : "Max Reps", render: (row) => <span className="font-medium">{row?.max_representatives ?? 0}</span> },
              {
                key: "price",
                header: language === "ar" ? "السعر" : "Price",
                render: (row) => <span className="font-semibold">{formatMoney(row?.price ?? 0)}</span>,
              },
              {
                key: "is_active",
                header: language === "ar" ? "الحالة" : "Status",
                render: (row) => (
                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-xs",
                      row?.is_active === false ? "bg-gray-100 text-gray-800" : "bg-green-100 text-green-800"
                    )}
                  >
                    {row?.is_active === false ? "Inactive" : "Active"}
                  </span>
                ),
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="representatives">
          <ExportGenericTable
            title={language === "ar" ? "المندوبون" : "Representatives"}
            subtitle={language === "ar" ? "company representatives للشركة" : "Sales representatives for this company"}
            icon={<Users className="w-5 h-5 text-primary" />}
            data={rawPayload?.representatives ?? []}
            loading={loading}
            searchPlaceholder={language === "ar" ? "بحث بالـ employee_id أو الاسم..." : "Search by employee_id or name..."}
            rowKey={(row) => row?.id}
            getRowSearchValue={(row) => [row?.employee_id, row?.territory, row?.user?.name, row?.user?.username, row?.user?.email].filter(Boolean).join(" ")}
            filters={[
              {
                key: "status",
                label: language === "ar" ? "الحالة" : "Status",
                options: uniqueRepresentativeStatusOptions.map((s) => ({ value: s, label: String(s) })),
                getRowFilterValue: (row) => row?.status ?? "",
              },
            ]}
            columns={[
              { key: "employee_id", header: language === "ar" ? "رقم الموظف" : "Employee ID", render: (row) => <span className="font-medium">{row?.employee_id || "—"}</span> },
              { key: "territory", header: language === "ar" ? "المنطقة" : "Territory", render: (row) => <span>{row?.territory || "—"}</span> },
              {
                key: "status",
                header: language === "ar" ? "الحالة" : "Status",
                render: (row) => (
                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-xs",
                      row?.status === "active"
                        ? "bg-green-100 text-green-800"
                        : row?.status === "suspended"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                    )}
                  >
                    {String(row?.status || "pending_approval")}
                  </span>
                ),
              },
              {
                key: "user",
                header: language === "ar" ? "المستخدم" : "User",
                render: (row) => (
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {row?.user?.name || row?.user?.username || row?.user?.email || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{row?.user?.email ? row.user.email : ""}</div>
                  </div>
                ),
              },
              { key: "created_at", header: language === "ar" ? "تاريخ الإنشاء" : "Created", render: (row) => <span>{row?.created_at ? new Date(row.created_at).toLocaleString() : "—"}</span> },
            ]}
          />
        </TabsContent>

        <TabsContent value="visits">
          <ExportGenericTable
            title={language === "ar" ? "الزيارات" : "Visits"}
            subtitle={language === "ar" ? "زيارات مندوبين الشركة" : "Visits created by this company's reps"}
            icon={<CalendarDays className="w-5 h-5 text-primary" />}
            data={rawPayload?.visits ?? []}
            loading={loading}
            searchPlaceholder={language === "ar" ? "بحث..." : "Search..."}
            rowKey={(row) => row?.id}
            getRowSearchValue={(row) => [row?.purpose, row?.status, row?.visit_date, row?.doctor?.name, row?.representative?.user?.username].filter(Boolean).join(" ")}
            filters={[
              {
                key: "status",
                label: language === "ar" ? "الحالة" : "Status",
                options: [
                  { value: "pending", label: language === "ar" ? "معلّق" : "pending" },
                  { value: "approved", label: language === "ar" ? "مقبول" : "approved" },
                  { value: "rejected", label: language === "ar" ? "مرفوض" : "rejected" },
                  { value: "completed", label: language === "ar" ? "مكتمل" : "completed" },
                ],
                getRowFilterValue: (row) => row?.status ?? "",
              },
            ]}
            columns={[
              { key: "visit_date", header: language === "ar" ? "التاريخ" : "Date", render: (row) => <span>{row?.visit_date ? new Date(row.visit_date).toLocaleDateString() : "—"}</span> },
              { key: "visit_time", header: language === "ar" ? "الوقت" : "Time", render: (row) => <span>{row?.visit_time || "—"}</span> },
              {
                key: "doctor",
                header: language === "ar" ? "الطبيب" : "Doctor",
                render: (row) => <span>{row?.doctor?.name || row?.doctor?.fullName || row?.doctor?.username || "—"}</span>,
              },
              { key: "purpose", header: language === "ar" ? "الهدف" : "Purpose", render: (row) => <span className="line-clamp-2">{row?.purpose || "—"}</span> },
              {
                key: "status",
                header: language === "ar" ? "Status" : "Status",
                render: (row) => (
                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-xs",
                      row?.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : row?.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : row?.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                    )}
                  >
                    {String(row?.status || "pending")}
                  </span>
                ),
              },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

