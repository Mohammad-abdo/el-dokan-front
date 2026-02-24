import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/lib/api";
import showToast from "@/lib/toast";
import { extractDataFromResponse } from "@/lib/apiHelper";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, X, Upload, Image as ImageIcon } from "lucide-react";

export default function AdminProductCreate() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [shops, setShops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [images, setImages] = useState([]);
  const [formData, setFormData] = useState({
    shop_id: "",
    name: "",
    name_ar: "",
    name_en: "",
    description: "",
    description_ar: "",
    description_en: "",
    short_description: "",
    short_description_ar: "",
    short_description_en: "",
    price: "",
    discount_percentage: "",
    stock_quantity: "",
    category_id: "",
    subcategory_id: "",
    slug: "",
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    is_active: true,
  });
  const [errors, setErrors] = useState({});
  const categoriesRef = useRef([]);
  categoriesRef.current = categories;

  useEffect(() => {
    Promise.all([fetchShops(), fetchCategories()]);
  }, []);

  useEffect(() => {
    if (formData.category_id) {
      fetchSubcategories(formData.category_id, categoriesRef.current);
    } else {
      setSubcategories([]);
      setFormData((prev) => ({ ...prev, subcategory_id: "" }));
    }
  }, [formData.category_id]);

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name && !formData.slug) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.name]);

  const fetchShops = async () => {
    try {
      const response = await api.get("/admin/shops");
      setShops(extractDataFromResponse(response));
    } catch (error) {
      console.error("Error fetching shops:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/admin/categories");
      setCategories(extractDataFromResponse(response));
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSubcategories = async (categoryId, categoriesList = []) => {
    try {
      const response = await api.get(
        `/admin/categories/${categoryId}/subcategories`
      );
      setSubcategories(extractDataFromResponse(response));
    } catch (error) {
      console.warn("Error fetching subcategories, using list fallback:", error?.message);
      // Fallback: subcategories are categories with parent_id = categoryId
      const fromList = Array.isArray(categoriesList)
        ? categoriesList.filter((c) => String(c.parent_id) === String(categoryId))
        : [];
      setSubcategories(fromList);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleAddImage = () => {
    setImages((prev) => [...prev, ""]);
  };

  const handleImageChange = (index, value) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast.error(language === 'ar' ? 'الملف يجب أن يكون صورة' : 'File must be an image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast.error(language === 'ar' ? 'حجم الصورة يجب أن يكون أقل من 5MB' : 'Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);
      formDataUpload.append('type', 'product');

      const response = await api.post('/admin/file-uploads', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data?.data ?? response.data;
      let imageUrl = typeof data?.url === 'string' ? data.url : data?.file_url;
      if (typeof imageUrl !== 'string') imageUrl = null;

      if (imageUrl) {
        if (imageUrl.startsWith('/')) {
          const baseURL = api.defaults.baseURL?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:8000';
          imageUrl = baseURL + imageUrl;
        }
        setImages((prev) => {
          const next = [...prev];
          next[index] = imageUrl;
          return next;
        });
        showToast.success(language === 'ar' ? 'تم رفع الصورة' : 'Image uploaded');
      } else {
        showToast.error(language === 'ar' ? 'لم يُرجع الخادم رابط الصورة' : 'Server did not return image URL');
      }
      e.target.value = '';
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast.error(error.response?.data?.message || (language === 'ar' ? 'فشل رفع الصورة' : 'Failed to upload image'));
    } finally {
      setUploading(false);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.shop_id) {
      newErrors.shop_id = "Shop is required";
    }

    if (!formData.name?.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!formData.price || parseFloat(formData.price) < 0) {
      newErrors.price = "Valid price is required";
    }

    if (!formData.slug?.trim()) {
      newErrors.slug = "Slug is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const imageUrls = images.filter((url) => url.trim());

      const payload = {
        ...formData,
        shop_id: parseInt(formData.shop_id),
        price: parseFloat(formData.price),
        discount_percentage: formData.discount_percentage
          ? parseFloat(formData.discount_percentage)
          : null,
        stock_quantity: formData.stock_quantity
          ? parseInt(formData.stock_quantity)
          : 0,
        category_id: formData.category_id
          ? parseInt(formData.category_id)
          : null,
        subcategory_id: formData.subcategory_id
          ? parseInt(formData.subcategory_id)
          : null,
        images: imageUrls.length > 0 ? imageUrls : [],
        slug:
          formData.slug ||
          formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      };

      await api.post("/admin/products", payload);
      navigate("/admin/products");
    } catch (error) {
      console.error("Error creating product:", error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        showToast.error(error.response?.data?.message || "Failed to create product");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/products")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === "ar" ? "رجوع" : "Back"}
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {language === "ar" ? "إنشاء منتج جديد" : "Create New Product"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === "ar"
              ? "أضف منتجاً جديداً إلى النظام"
              : "Add a new product to the system"}
          </p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">
              {language === "ar" ? "المعلومات الأساسية" : "Basic Information"}
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === "ar" ? "المتجر" : "Shop"}{" "}
                  <span className="text-destructive">*</span>
                </label>
                <select
                  name="shop_id"
                  value={formData.shop_id}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg"
                  required
                >
                  <option value="">
                    {language === "ar" ? "اختر المتجر" : "Select Shop"}
                  </option>
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name || shop.name_en || shop.name_ar}
                    </option>
                  ))}
                </select>
                {errors.shop_id && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.shop_id}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === "ar" ? "السعر" : "Price"}{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={errors.price ? "border-destructive" : ""}
                  required
                />
                {errors.price && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.price}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Product Names (Multi-language) */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">
              {language === "ar" ? "أسماء المنتج" : "Product Names"}
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === "ar" ? "الاسم (العام)" : "Name (Default)"}{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={
                    language === "ar" ? "اسم المنتج" : "Product name"
                  }
                  className={errors.name ? "border-destructive" : ""}
                  required
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}
                </label>
                <Input
                  name="name_ar"
                  value={formData.name_ar}
                  onChange={handleChange}
                  placeholder={
                    language === "ar"
                      ? "اسم المنتج بالعربية"
                      : "Product name in Arabic"
                  }
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === "ar" ? "الاسم (إنجليزي)" : "Name (English)"}
                </label>
                <Input
                  name="name_en"
                  value={formData.name_en}
                  onChange={handleChange}
                  placeholder={
                    language === "ar"
                      ? "اسم المنتج بالإنجليزية"
                      : "Product name in English"
                  }
                />
              </div>
            </div>
          </div>

          {/* Descriptions (Multi-language) */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">
              {language === "ar" ? "الوصف" : "Descriptions"}
            </h2>

            <div className="grid gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === "ar"
                    ? "الوصف (العام)"
                    : "Description (Default)"}
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder={
                    language === "ar" ? "وصف المنتج" : "Product description"
                  }
                  className="w-full p-2 border rounded-lg min-h-[100px]"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === "ar"
                      ? "الوصف (عربي)"
                      : "Description (Arabic)"}
                  </label>
                  <textarea
                    name="description_ar"
                    value={formData.description_ar}
                    onChange={handleChange}
                    placeholder={
                      language === "ar"
                        ? "وصف المنتج بالعربية"
                        : "Product description in Arabic"
                    }
                    className="w-full p-2 border rounded-lg min-h-[100px]"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === "ar"
                      ? "الوصف (إنجليزي)"
                      : "Description (English)"}
                  </label>
                  <textarea
                    name="description_en"
                    value={formData.description_en}
                    onChange={handleChange}
                    placeholder={
                      language === "ar"
                        ? "وصف المنتج بالإنجليزية"
                        : "Product description in English"
                    }
                    className="w-full p-2 border rounded-lg min-h-[100px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Short Descriptions */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">
              {language === "ar" ? "الوصف المختصر" : "Short Descriptions"}
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === "ar"
                    ? "وصف مختصر (العام)"
                    : "Short Description (Default)"}
                </label>
                <textarea
                  name="short_description"
                  value={formData.short_description}
                  onChange={handleChange}
                  placeholder={
                    language === "ar"
                      ? "وصف مختصر للمنتج"
                      : "Short product description"
                  }
                  className="w-full p-2 border rounded-lg min-h-[80px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === "ar"
                    ? "وصف مختصر (عربي)"
                    : "Short Description (Arabic)"}
                </label>
                <textarea
                  name="short_description_ar"
                  value={formData.short_description_ar}
                  onChange={handleChange}
                  placeholder={
                    language === "ar"
                      ? "وصف مختصر بالعربية"
                      : "Short description in Arabic"
                  }
                  className="w-full p-2 border rounded-lg min-h-[80px]"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === "ar"
                    ? "وصف مختصر (إنجليزي)"
                    : "Short Description (English)"}
                </label>
                <textarea
                  name="short_description_en"
                  value={formData.short_description_en}
                  onChange={handleChange}
                  placeholder={
                    language === "ar"
                      ? "وصف مختصر بالإنجليزية"
                      : "Short description in English"
                  }
                  className="w-full p-2 border rounded-lg min-h-[80px]"
                />
              </div>
            </div>
          </div>

          {/* Categories & Stock */}
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">
                {language === "ar" ? "الفئة" : "Category"}
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">
                  {language === "ar" ? "اختر الفئة" : "Select Category"}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name || cat.name_en || cat.name_ar}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {language === "ar" ? "الفئة الفرعية" : "Subcategory"}
              </label>
              <select
                name="subcategory_id"
                value={formData.subcategory_id}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg"
                disabled={!formData.category_id}
              >
                <option value="">
                  {language === "ar"
                    ? "اختر الفئة الفرعية"
                    : "Select Subcategory"}
                </option>
                {subcategories.map((subcat) => (
                  <option key={subcat.id} value={subcat.id}>
                    {subcat.name || subcat.name_en || subcat.name_ar}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {language === "ar" ? "الكمية المتاحة" : "Stock Quantity"}
              </label>
              <Input
                name="stock_quantity"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={handleChange}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {language === "ar" ? "نسبة الخصم (%)" : "Discount (%)"}
              </label>
              <Input
                name="discount_percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.discount_percentage}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
          </div>

          {/* Multiple Images */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold border-b pb-2 flex-1">
                {language === "ar" ? "صور المنتج" : "Product Images"}
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddImage}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                {language === "ar" ? "إضافة صورة" : "Add Image"}
              </Button>
            </div>

            <div className="space-y-3">
              {images.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    {language === "ar"
                      ? 'لا توجد صور. اضغط على "إضافة صورة"'
                      : 'No images. Click "Add Image"'}
                  </p>
                </div>
              ) : (
                images.map((imageUrl, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={imageUrl}
                          onChange={(e) =>
                            handleImageChange(index, e.target.value)
                          }
                          placeholder="https://example.com/image.jpg"
                          type="url"
                          className="flex-1"
                        />
                        <label className="cursor-pointer">
                          <input
                            key={`file-${index}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(index, e)}
                            className="hidden"
                            disabled={uploading}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploading}
                            className="gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            {uploading ? '...' : (language === 'ar' ? 'رفع' : 'Upload')}
                          </Button>
                        </label>
                      </div>
                      {imageUrl && (
                        <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveImage(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SEO Fields */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">
              SEO {language === "ar" ? "المعلومات" : "Information"}
            </h2>

            <div className="grid gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === "ar"
                    ? "رابط المنتج (Slug)"
                    : "Product URL (Slug)"}{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="product-name"
                  className={errors.slug ? "border-destructive" : ""}
                  required
                />
                {errors.slug && (
                  <p className="text-sm text-destructive mt-1">{errors.slug}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {language === "ar"
                    ? "رابط فريد للمنتج (مثال: product-name)"
                    : "Unique URL for the product (e.g., product-name)"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === "ar" ? "عنوان SEO" : "SEO Title"}
                </label>
                <Input
                  name="meta_title"
                  value={formData.meta_title}
                  onChange={handleChange}
                  placeholder={
                    language === "ar"
                      ? "عنوان SEO للمنتج"
                      : "SEO title for the product"
                  }
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.meta_title?.length || 0}/60{" "}
                  {language === "ar" ? "حرف" : "characters"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === "ar" ? "وصف SEO" : "SEO Description"}
                </label>
                <textarea
                  name="meta_description"
                  value={formData.meta_description}
                  onChange={handleChange}
                  placeholder={
                    language === "ar"
                      ? "وصف SEO للمنتج"
                      : "SEO description for the product"
                  }
                  className="w-full p-2 border rounded-lg min-h-[100px]"
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.meta_description?.length || 0}/160{" "}
                  {language === "ar" ? "حرف" : "characters"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === "ar" ? "كلمات مفتاحية SEO" : "SEO Keywords"}
                </label>
                <Input
                  name="meta_keywords"
                  value={formData.meta_keywords}
                  onChange={handleChange}
                  placeholder={
                    language === "ar"
                      ? "كلمات مفتاحية مفصولة بفواصل"
                      : "Keywords separated by commas"
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {language === "ar"
                    ? "مثال: منتج، دواء، صحة"
                    : "Example: product, medicine, health"}
                </p>
              </div>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-4 h-4"
              id="is_active"
            />
            <label htmlFor="is_active" className="text-sm font-medium">
              {language === "ar" ? "المنتج نشط" : "Product is active"}
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/products")}
              disabled={loading}
            >
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? language === "ar"
                  ? "جاري الإنشاء..."
                  : "Creating..."
                : language === "ar"
                ? "إنشاء المنتج"
                : "Create Product"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
