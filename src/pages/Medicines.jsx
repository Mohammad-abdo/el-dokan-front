import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import showToast from "@/lib/toast";
import { showConfirm } from "@/components/ConfirmDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pill,
  Search,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Eye,
  X,
} from "lucide-react";

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [viewingMedicine, setViewingMedicine] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    genericName: "",
    description: "",
    categoryId: "",
    manufacturer: "",
    sku: "",
    prescriptionText: "",
    prescriptionImage: "",
    prescriptionType: "none",
  });

  useEffect(() => {
    fetchMedicines();
    fetchCategories();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await api.get("/medicines?limit=1000");
      const medicinesData = response.data?.medicines || response.data || [];
      setMedicines(Array.isArray(medicinesData) ? medicinesData : []);
    } catch (error) {
      console.error("Error fetching medicines:", error);
      if (error.response?.status !== 401) {
        setMedicines([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/medicine-categories");
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        prescriptionText:
          formData.prescriptionType === "text"
            ? formData.prescriptionText
            : null,
        prescriptionImage:
          formData.prescriptionType === "image"
            ? formData.prescriptionImage
            : null,
      };
      delete submitData.prescriptionType;

      if (editingMedicine) {
        await api.put(`/medicines/${editingMedicine.id}`, submitData);
      } else {
        await api.post("/medicines", submitData);
      }
      await fetchMedicines();
      setShowForm(false);
      setEditingMedicine(null);
      setFormData({
        name: "",
        genericName: "",
        description: "",
        categoryId: "",
        manufacturer: "",
        sku: "",
        prescriptionText: "",
        prescriptionImage: "",
        prescriptionType: "none",
      });
    } catch (error) {
      showToast.error(error.response?.data?.message || "Error saving medicine");
    }
  };

  const handleEdit = (medicine) => {
    setEditingMedicine(medicine);
    const prescriptionType = medicine.prescriptionImage
      ? "image"
      : medicine.prescriptionText
      ? "text"
      : "none";
    setFormData({
      name: medicine.name,
      genericName: medicine.genericName || "",
      description: medicine.description || "",
      categoryId: medicine.categoryId,
      manufacturer: medicine.manufacturer || "",
      sku: medicine.sku,
      prescriptionText: medicine.prescriptionText || "",
      prescriptionImage: medicine.prescriptionImage || "",
      prescriptionType,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    showConfirm("Are you sure you want to delete this medicine?", async () => {
      try {
        await api.delete(`/medicines/${id}`);
        await fetchMedicines();
      } catch (error) {
        showToast.error(error.response?.data?.message || "Error deleting medicine");
      }
    });
  };

  const filteredMedicines = medicines.filter(
    (medicine) =>
      medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Medicines</h1>
          <p className="text-muted-foreground">
            Manage medicine catalog and inventory
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingMedicine(null);
            setFormData({
              name: "",
              genericName: "",
              description: "",
              categoryId: "",
              manufacturer: "",
              sku: "",
              prescriptionText: "",
              prescriptionImage: "",
              prescriptionType: "none",
            });
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Medicine
        </motion.button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>
                {editingMedicine ? "Edit Medicine" : "Add New Medicine"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Generic Name
                    </label>
                    <input
                      type="text"
                      value={formData.genericName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          genericName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      SKU *
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) =>
                        setFormData({ ...formData, sku: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Manufacturer
                    </label>
                    <input
                      type="text"
                      value={formData.manufacturer}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          manufacturer: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Prescription Type
                  </label>
                  <select
                    value={formData.prescriptionType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        prescriptionType: e.target.value,
                        prescriptionText: "",
                        prescriptionImage: "",
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="none">No Prescription</option>
                    <option value="text">Text Prescription</option>
                    <option value="image">Image Prescription</option>
                  </select>
                </div>
                {formData.prescriptionType === "text" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Prescription Instructions (Text)
                    </label>
                    <textarea
                      value={formData.prescriptionText}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          prescriptionText: e.target.value,
                        })
                      }
                      rows={4}
                      placeholder="Enter prescription instructions here..."
                      className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
                {formData.prescriptionType === "image" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Prescription Image URL
                    </label>
                    <input
                      type="text"
                      value={formData.prescriptionImage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          prescriptionImage: e.target.value,
                        })
                      }
                      placeholder="https://example.com/prescription-image.jpg"
                      className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {formData.prescriptionImage && (
                      <div className="mt-2">
                        <img
                          src={formData.prescriptionImage}
                          alt="Prescription preview"
                          className="max-w-full h-auto rounded-lg border border"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                  >
                    {editingMedicine ? "Update" : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingMedicine(null);
                      setFormData({
                        name: "",
                        genericName: "",
                        description: "",
                        categoryId: "",
                        manufacturer: "",
                        sku: "",
                        prescriptionText: "",
                        prescriptionImage: "",
                        prescriptionType: "none",
                      });
                    }}
                    className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredMedicines.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No medicines found</p>
              </div>
            ) : (
              filteredMedicines.map((medicine, index) => (
                <motion.div
                  key={medicine.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-lg border border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Pill className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{medicine.name}</h3>
                      {medicine.genericName && (
                        <p className="text-xs text-muted-foreground italic">
                          {medicine.genericName}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        {medicine.category?.name || "Uncategorized"} • SKU:{" "}
                        {medicine.sku}
                      </p>
                      {medicine.manufacturer && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Manufacturer: {medicine.manufacturer}
                        </p>
                      )}
                      {(medicine.prescriptionText ||
                        medicine.prescriptionImage) && (
                        <div className="flex items-center gap-2 mt-2">
                          {medicine.prescriptionText && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-500/10 text-blue-600">
                              <FileText className="w-3 h-3" />
                              Text Prescription
                            </span>
                          )}
                          {medicine.prescriptionImage && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-purple-500/10 text-purple-600">
                              <ImageIcon className="w-3 h-3" />
                              Image Prescription
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(medicine.prescriptionText ||
                      medicine.prescriptionImage) && (
                      <button
                        onClick={() => setViewingMedicine(medicine)}
                        className="p-2 rounded-lg hover:bg-accent transition-colors"
                        title="View Prescription"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(medicine)}
                      className="p-2 rounded-lg hover:bg-accent transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(medicine.id)}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {viewingMedicine && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
          onClick={() => setViewingMedicine(null)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto backdrop-blur-sm border shadow-xl z-[101]"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{viewingMedicine.name}</h2>
              <button
                onClick={() => setViewingMedicine(null)}
                className="p-2 rounded-lg hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {viewingMedicine.prescriptionText && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Text Prescription:</h3>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="whitespace-pre-wrap">
                    {viewingMedicine.prescriptionText}
                  </p>
                </div>
              </div>
            )}
            {viewingMedicine.prescriptionImage && (
              <div>
                <h3 className="font-semibold mb-2">Image Prescription:</h3>
                <img
                  src={viewingMedicine.prescriptionImage}
                  alt="Prescription"
                  className="max-w-full h-auto rounded-lg border border"
                />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
