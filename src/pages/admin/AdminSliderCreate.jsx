import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/lib/api";
import showToast from "@/lib/toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Save, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AdminSliderCreate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);
  const [vendors, setVendors] = useState({
    shops: [],
    doctors: [],
    drivers: [],
    representatives: [],
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    link_type: "",
    link_id: "",
    link_url: "",
    vendor_type: "general",
    vendor_id: "",
    order: 0,
    is_active: true,
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    if (isEdit) {
      fetchSlider();
    }
    fetchVendors();
  }, [id]);

  const fetchSlider = async () => {
    try {
      const response = await api.get(`/admin/sliders/${id}`);
      const slider = response.data?.data || response.data;
      setFormData({
        title: slider.title || "",
        description: slider.description || "",
        image_url: slider.image_url || "",
        link_type: slider.link_type || "",
        link_id: slider.link_id || "",
        link_url: slider.link_url || "",
        vendor_type: slider.vendor_type || "general",
        vendor_id: slider.vendor_id || "",
        order: slider.order || 0,
        is_active: slider.is_active !== false,
        start_date: slider.start_date || "",
        end_date: slider.end_date || "",
      });
      if (slider.image_url) {
        setImagePreview(slider.image_url);
      }
    } catch (error) {
      console.error("Error fetching slider:", error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast.error(language === "ar" ? "الملف يجب أن يكون صورة" : "File must be an image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast.error(language === "ar" ? "حجم الصورة يجب أن يكون أقل من 5MB" : "Image size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("image", file);
      formDataUpload.append("type", "slider");

      const response = await api.post("/admin/file-uploads", formDataUpload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const imageUrl =
        response.data?.data?.url ||
        response.data?.data?.file_url ||
        response.data?.url;
      if (imageUrl) {
        setFormData((prev) => ({ ...prev, image_url: imageUrl }));
        setImagePreview(imageUrl);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      showToast.error(language === "ar" ? "فشل رفع الصورة" : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const [shopsRes, doctorsRes, driversRes, repsRes] = await Promise.all([
        api.get("/admin/shops").catch(() => ({ data: { data: [] } })),
        api.get("/admin/doctors").catch(() => ({ data: { data: [] } })),
        api.get("/admin/drivers").catch(() => ({ data: { data: [] } })),
        api.get("/admin/representatives").catch(() => ({ data: { data: [] } })),
      ]);

      setVendors({
        shops: shopsRes.data?.data || shopsRes.data || [],
        doctors: doctorsRes.data?.data || doctorsRes.data || [],
        drivers: driversRes.data?.data || driversRes.data || [],
        representatives: repsRes.data?.data || repsRes.data || [],
      });
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        image_url: formData.image_url?.trim() || "",
        vendor_id: formData.vendor_id ? parseInt(formData.vendor_id) : null,
        link_id: formData.link_id ? parseInt(formData.link_id) : null,
        order: parseInt(formData.order) || 0,
      };

      if (isEdit) {
        await api.put(`/admin/sliders/${id}`, payload);
      } else {
        await api.post("/admin/sliders", payload);
      }

      navigate("/admin/sliders");
    } catch (error) {
      console.error("Error saving slider:", error);
      const msg = error.response?.data?.message || "Failed to save slider";
      const errors = error.response?.data?.errors;
      const details = errors && Object.values(errors).flat().filter(Boolean).join(" ");
      showToast.error(details ? `${msg}: ${details}` : msg);
    } finally {
      setLoading(false);
    }
  };

  const getVendorOptions = () => {
    switch (formData.vendor_type) {
      case "shop":
        return vendors.shops.map((v) => ({ value: v.id, label: v.name }));
      case "doctor":
        return vendors.doctors.map((v) => ({ value: v.id, label: v.name }));
      case "driver":
        return vendors.drivers.map((v) => ({ value: v.id, label: v.name }));
      case "representative":
        return vendors.representatives.map((v) => ({
          value: v.id,
          label: v.user?.username || v.name || "N/A",
        }));
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/sliders")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === "ar" ? "رجوع" : "Back"}
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEdit
                ? language === "ar"
                  ? "تعديل السلايدر"
                  : "Edit Slider"
                : language === "ar"
                ? "إنشاء سلايدر جديد"
                : "Create New Slider"}
            </h1>
          </div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6 md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">
              {language === "ar" ? "معلومات السلايدر" : "Slider Information"}
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">
                  {language === "ar" ? "العنوان" : "Title"} *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">
                  {language === "ar" ? "الوصف" : "Description"}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="image_url">
                  {language === "ar" ? "صورة السلايدر" : "Slider Image"} *
                </Label>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Input
                      id="image_url"
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => {
                        setFormData({ ...formData, image_url: e.target.value });
                        setImagePreview(e.target.value);
                      }}
                      required
                      placeholder="https://example.com/image.jpg"
                      className="flex-1"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="sr-only"
                      aria-hidden
                      tabIndex={-1}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading}
                      className="gap-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4" />
                      {uploading
                        ? language === "ar"
                          ? "جاري الرفع..."
                          : "Uploading..."
                        : language === "ar"
                        ? "رفع صورة"
                        : "Upload Image"}
                    </Button>
                  </div>
                  {(imagePreview || formData.image_url) && (
                    <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                      <img
                        src={imagePreview || formData.image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={() => setImagePreview("")}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview("");
                          setFormData((prev) => ({ ...prev, image_url: "" }));
                        }}
                        className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="vendor_type">
                    {language === "ar" ? "نوع البائع" : "Vendor Type"}
                  </Label>
                  <select
                    id="vendor_type"
                    value={formData.vendor_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vendor_type: e.target.value,
                        vendor_id: "",
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="general">
                      {language === "ar" ? "عام" : "General"}
                    </option>
                    <option value="shop">
                      {language === "ar" ? "متجر" : "Shop"}
                    </option>
                    <option value="doctor">
                      {language === "ar" ? "طبيب" : "Doctor"}
                    </option>
                    <option value="driver">
                      {language === "ar" ? "سائق" : "Driver"}
                    </option>
                    <option value="representative">
                      {language === "ar" ? "مندوب" : "Representative"}
                    </option>
                  </select>
                </div>

                {formData.vendor_type !== "general" && (
                  <div>
                    <Label htmlFor="vendor_id">
                      {language === "ar" ? "اختر البائع" : "Select Vendor"}
                    </Label>
                    <select
                      id="vendor_id"
                      value={formData.vendor_id}
                      onChange={(e) =>
                        setFormData({ ...formData, vendor_id: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">
                        {language === "ar" ? "-- اختر --" : "-- Select --"}
                      </option>
                      {getVendorOptions().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <Label htmlFor="link_type">
                    {language === "ar" ? "نوع الرابط" : "Link Type"}
                  </Label>
                  <select
                    id="link_type"
                    value={formData.link_type}
                    onChange={(e) =>
                      setFormData({ ...formData, link_type: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">
                      {language === "ar" ? "-- لا شيء --" : "-- None --"}
                    </option>
                    <option value="product">
                      {language === "ar" ? "منتج" : "Product"}
                    </option>
                    <option value="shop">
                      {language === "ar" ? "متجر" : "Shop"}
                    </option>
                    <option value="doctor">
                      {language === "ar" ? "طبيب" : "Doctor"}
                    </option>
                    <option value="driver">
                      {language === "ar" ? "سائق" : "Driver"}
                    </option>
                    <option value="representative">
                      {language === "ar" ? "مندوب" : "Representative"}
                    </option>
                    <option value="booking">
                      {language === "ar" ? "حجز" : "Booking"}
                    </option>
                  </select>
                </div>

                {formData.link_type && (
                  <div>
                    <Label htmlFor="link_id">
                      {language === "ar" ? "معرف الرابط" : "Link ID"}
                    </Label>
                    <Input
                      id="link_id"
                      type="number"
                      value={formData.link_id}
                      onChange={(e) =>
                        setFormData({ ...formData, link_id: e.target.value })
                      }
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="link_url">
                    {language === "ar" ? "رابط URL" : "Link URL"}
                  </Label>
                  <Input
                    id="link_url"
                    type="url"
                    value={formData.link_url}
                    onChange={(e) =>
                      setFormData({ ...formData, link_url: e.target.value })
                    }
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="order">
                    {language === "ar" ? "الترتيب" : "Order"}
                  </Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    {language === "ar" ? "نشط" : "Active"}
                  </Label>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="start_date">
                    {language === "ar" ? "تاريخ البدء" : "Start Date"}
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="end_date">
                    {language === "ar" ? "تاريخ الانتهاء" : "End Date"}
                  </Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/sliders")}
          >
            {language === "ar" ? "إلغاء" : "Cancel"}
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading
              ? language === "ar"
                ? "جاري الحفظ..."
                : "Saving..."
              : language === "ar"
              ? "حفظ"
              : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
