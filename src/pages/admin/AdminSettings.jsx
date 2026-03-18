import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import api from "@/lib/api";
import showToast from "@/lib/toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Settings,
  Moon,
  Sun,
  Palette,
  Image as ImageIcon,
  Save,
  Upload,
  Eye,
  Type,
  Layout,
} from "lucide-react";

export default function AdminSettings() {
  const {
    theme,
    primaryColor,
    fontFamily,
    sidebarStyle,
    setTheme,
    setPrimaryColor,
    setFontFamily,
    setSidebarStyle,
    toggleTheme,
  } = useTheme();
  const { t, language } = useLanguage();
  const [settings, setSettings] = useState({
    site_name: "",
    site_logo: "",
    site_favicon: "",
    site_email: "",
    site_phone: "",
    site_address: "",
  });
  const [logoPreview, setLogoPreview] = useState("");
  const [faviconPreview, setFaviconPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const logoInputRef = useRef(null);
  const faviconInputRef = useRef(null);

  const colorOptions = [
    { name: "Blue", value: "blue", color: "hsl(221.2 83.2% 53.3%)" },
    { name: "Green", value: "green", color: "hsl(142.1 76.2% 36.3%)" },
    { name: "Purple", value: "purple", color: "hsl(262.1 83.3% 57.8%)" },
    { name: "Red", value: "red", color: "hsl(0 72.2% 50.6%)" },
    { name: "Orange", value: "orange", color: "hsl(24.6 95% 53.1%)" },
    { name: "Pink", value: "pink", color: "hsl(330.4 81.2% 60.4%)" },
  ];

  const fontOptions = [
    { name: "Alexandria", value: "alexandria", preview: "Alexandria - Arabic & Latin" },
    { name: "Inter", value: "inter", preview: "Inter - Modern & Clean" },
    { name: "Roboto", value: "roboto", preview: "Roboto - Versatile" },
    { name: "Poppins", value: "poppins", preview: "Poppins - Geometric" },
    { name: "Open Sans", value: "opensans", preview: "Open Sans - Readable" },
    { name: "Lato", value: "lato", preview: "Lato - Humanist" },
    {
      name: "Montserrat",
      value: "montserrat",
      preview: "Montserrat - Elegant",
    },
    { name: "Cairo", value: "cairo", preview: "Cairo - Arabic Support" },
    { name: "Tajawal", value: "tajawal", preview: "Tajawal - Arabic Support" },
  ];

  const sidebarStyles = [
    {
      name: language === "ar" ? "الافتراضي" : "Default",
      value: "default",
      description:
        language === "ar" ? "نمط Sidebar قياسي" : "Standard sidebar style",
    },
    {
      name: language === "ar" ? "بسيط" : "Minimal",
      value: "minimal",
      description:
        language === "ar" ? "نمط بسيط ونظيف" : "Clean and minimal style",
    },
    {
      name: language === "ar" ? "مضغوط" : "Compact",
      value: "compact",
      description:
        language === "ar" ? "أيقونات وأسماء أصغر" : "Smaller icons and labels",
    },
    {
      name: language === "ar" ? "متدرج" : "Gradient",
      value: "gradient",
      description: language === "ar" ? "خلفية متدرجة" : "Gradient background",
    },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get("/admin/settings");
      const settingsData = response.data?.data || response.data || {};
      const normalized = {};
      Object.keys(settingsData).forEach((k) => {
        const v = settingsData[k];
        normalized[k] = v === null || v === undefined ? "" : String(v);
      });
      setSettings((prev) => ({ ...prev, ...normalized }));
      if (settingsData.site_logo) {
        setLogoPreview(settingsData.site_logo);
      }
      if (settingsData.site_favicon) {
        setFaviconPreview(settingsData.site_favicon);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));

    if (name === "site_logo") {
      setLogoPreview(value);
    }
    if (name === "site_favicon") {
      setFaviconPreview(value);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "logo");
      const response = await api.post("/admin/settings/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = response.data?.data?.url || response.data?.url;
      if (url) {
        setSettings((prev) => ({ ...prev, site_logo: url }));
        setLogoPreview(url);
        localStorage.setItem("site_logo", url);
        window.dispatchEvent(new CustomEvent("site-settings-updated"));
        showToast.success(language === "ar" ? "تم رفع الشعار" : "Logo uploaded");
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || (language === "ar" ? "فشل رفع الشعار" : "Upload failed"));
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleFaviconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFavicon(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "favicon");
      const response = await api.post("/admin/settings/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = response.data?.data?.url || response.data?.url;
      if (url) {
        setSettings((prev) => ({ ...prev, site_favicon: url }));
        setFaviconPreview(url);
        showToast.success(language === "ar" ? "تم رفع الأيقونة" : "Favicon uploaded");
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || (language === "ar" ? "فشل رفع الأيقونة" : "Upload failed"));
    } finally {
      setUploadingFavicon(false);
      e.target.value = "";
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/admin/settings", settings);
      if (settings.site_logo) {
        localStorage.setItem("site_logo", settings.site_logo);
        window.dispatchEvent(new CustomEvent("site-settings-updated"));
      }
      showToast.success(
        language === "ar"
          ? "تم حفظ الإعدادات بنجاح"
          : "Settings saved successfully"
      );
    } catch (error) {
      console.error("Error saving settings:", error);
      showToast.error(
        language === "ar" ? "فشل حفظ الإعدادات" : "Failed to save settings"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="w-8 h-8" />
          {t("common.settings")}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === "ar"
            ? "إدارة إعدادات التطبيق"
            : "Manage your application settings"}
        </p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Theme Settings */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              {theme === "light" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
              {language === "ar" ? "إعدادات المظهر" : "Theme Settings"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === "ar" ? "نمط الألوان" : "Color Mode"}
                </label>
                <div className="flex gap-2">
                  <Button
                    onClick={toggleTheme}
                    variant={theme === "light" ? "default" : "outline"}
                    className="flex-1"
                  >
                    <Sun className="w-4 h-4 mr-2" />
                    {language === "ar" ? "فاتح" : "Light"}
                  </Button>
                  <Button
                    onClick={toggleTheme}
                    variant={theme === "dark" ? "default" : "outline"}
                    className="flex-1"
                  >
                    <Moon className="w-4 h-4 mr-2" />
                    {language === "ar" ? "داكن" : "Dark"}
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === "ar" ? "اللون الأساسي" : "Primary Color"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {colorOptions.map((color) => (
                    <motion.button
                      key={color.value}
                      onClick={() => setPrimaryColor(color.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        primaryColor === color.value
                          ? "border-primary ring-2 ring-primary/20"
                          : "border hover:border-primary/50"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div
                        className="w-full h-8 rounded"
                        style={{ backgroundColor: color.color }}
                      />
                      <p className="text-xs mt-1">{color.name}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Font Style Settings */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Type className="w-5 h-5" />
              {language === "ar" ? "نمط الخط" : "Font Style"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === "ar" ? "خط النص" : "Font Family"}
                </label>
                <select
                  value={fontFamily ?? ""}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-background"
                >
                  {fontOptions.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.preview}
                    </option>
                  ))}
                </select>
                <div className="mt-3 p-3 border rounded-lg bg-muted/50">
                  <p className="text-sm font-medium mb-1">
                    {language === "ar" ? "معاينة الخط:" : "Font Preview:"}
                  </p>
                  <p
                    style={{
                      fontFamily:
                        fontOptions.find((f) => f.value === fontFamily)
                          ?.name || "Inter",
                    }}
                    className="text-lg"
                  >
                    {language === "ar"
                      ? "هذا مثال على النص باستخدام هذا الخط"
                      : "The quick brown fox jumps over the lazy dog"}
                  </p>
                  <p
                    style={{
                      fontFamily:
                        fontOptions.find((f) => f.value === fontFamily)
                          ?.name || "Inter",
                    }}
                    className="text-2xl font-bold mt-2"
                  >
                    {language === "ar" ? "عنوان كبير" : "Large Heading"}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Sidebar Style Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Layout className="w-5 h-5" />
              {language === "ar" ? "نمط Sidebar" : "Sidebar Style"}
            </h2>
            <div className="space-y-3">
              {sidebarStyles.map((style) => (
                <motion.button
                  key={style.value}
                  onClick={() => setSidebarStyle(style.value)}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    sidebarStyle === style.value
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                      : "border hover:border-primary/50"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{style.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {style.description}
                      </p>
                    </div>
                    {sidebarStyle === style.value && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary-foreground"></div>
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Logo & Branding */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              {language === "ar"
                ? "الشعار والعلامة التجارية"
                : "Logo & Branding"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === "ar" ? "شعار الموقع" : "Site Logo"}
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    type="file"
                    ref={logoInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingLogo
                      ? (language === "ar" ? "جاري الرفع..." : "Uploading...")
                      : (language === "ar" ? "رفع شعار" : "Upload Logo")}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {language === "ar" ? "أو أدخل رابط:" : "Or paste URL:"}
                  </span>
                </div>
                <Input
                  name="site_logo"
                  value={settings.site_logo ?? ""}
                  onChange={handleChange}
                  placeholder="https://example.com/logo.png"
                  className="mt-2"
                />
                {logoPreview && (
                  <div className="mt-2 p-2 border rounded">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="max-h-20 object-contain"
                      onError={() => setLogoPreview("")}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === "ar" ? "أيقونة الموقع (Favicon)" : "Site Favicon"}
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    type="file"
                    ref={faviconInputRef}
                    accept="image/*,.ico"
                    className="hidden"
                    onChange={handleFaviconUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => faviconInputRef.current?.click()}
                    disabled={uploadingFavicon}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingFavicon
                      ? (language === "ar" ? "جاري الرفع..." : "Uploading...")
                      : (language === "ar" ? "رفع أيقونة" : "Upload Favicon")}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {language === "ar" ? "أو أدخل رابط:" : "Or paste URL:"}
                  </span>
                </div>
                <Input
                  name="site_favicon"
                  value={settings.site_favicon ?? ""}
                  onChange={handleChange}
                  placeholder="https://example.com/favicon.ico"
                  className="mt-2"
                />
                {faviconPreview && (
                  <div className="mt-2 p-2 border rounded inline-block">
                    <img
                      src={faviconPreview}
                      alt="Favicon preview"
                      className="w-16 h-16 object-contain"
                      onError={() => setFaviconPreview("")}
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* General Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="md:col-span-2"
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {language === "ar" ? "الإعدادات العامة" : "General Settings"}
            </h2>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === "ar" ? "اسم الموقع" : "Site Name"}
                  </label>
                  <Input
                    name="site_name"
                    value={settings.site_name ?? ""}
                    onChange={handleChange}
                    placeholder="El Dokan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === "ar" ? "بريد الموقع" : "Site Email"}
                  </label>
                  <Input
                    name="site_email"
                    type="email"
                    value={settings.site_email ?? ""}
                    onChange={handleChange}
                    placeholder="admin@eldokan.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === "ar" ? "هاتف الموقع" : "Site Phone"}
                  </label>
                  <Input
                    name="site_phone"
                    value={settings.site_phone ?? ""}
                    onChange={handleChange}
                    placeholder="+1234567890"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    {language === "ar" ? "عنوان الموقع" : "Site Address"}
                  </label>
                  <Input
                    name="site_address"
                    value={settings.site_address ?? ""}
                    onChange={handleChange}
                    placeholder="123 Main St, City, Country"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving
                    ? language === "ar"
                      ? "جاري الحفظ..."
                      : "Saving..."
                    : language === "ar"
                    ? "حفظ الإعدادات"
                    : "Save Settings"}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
